import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from teamgen_config import (
    BINGO_EVENT_END,
    BINGO_EVENT_START,
    LIFETIME_DIVISOR,
    NON_COMBAT_XP_EXCLUDED_SKILLS,
    NON_COMBAT_XP_INCLUDED_SKILLS,
    NON_COMBAT_XP_TILE_ID,
    NON_COMBAT_XP_TILE_TARGET,
    REPO_ROOT,
    SCORE_WINDOW_MONTHS,
    SCORING_METHOD,
    SKILLING_DIVISOR,
    resolve_repo_path,
)
from teamgen_fetch import fetch_raw_player
from teamgen_output import player_sort_key
from teamgen_scoring import assign_ranks, extract_player_stats
from teamgen_storage import apply_overrides, load_cache, load_overrides


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Refresh participant and team scores without changing team assignments."
    )
    parser.add_argument(
        "--input",
        default="public/data/teams.json",
        help="Input JSON path. Defaults to public/data/teams.json.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path. Defaults to updating the input file.",
    )
    return parser.parse_args()


def load_data(path: str) -> Dict[str, Any]:
    resolved = Path(resolve_repo_path(path))
    with resolved.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_data(path: str, data: Dict[str, Any]) -> None:
    resolved = Path(resolve_repo_path(path))
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def player_row(player: Dict[str, Any], team_name: str) -> Dict[str, Any]:
    ehb_lifetime_bonus = round(player["ehb_lifetime_bonus"], 2)
    ehp_lifetime_bonus = round(player["ehp_lifetime_bonus"], 2)
    ehb_score = round(player["ehb_gained"] + player["ehb_lifetime_bonus"], 2)
    ehp_score = round(
        (player["ehp_gained"] + player["ehp_lifetime_bonus"]) / SKILLING_DIVISOR,
        2,
    )
    event_ehb_gained = round(player.get("event_ehb_gained", 0.0), 2)
    event_ehp_gained = round(player.get("event_ehp_gained", 0.0), 2)
    event_ehb_score = event_ehb_gained
    event_ehp_score = round(event_ehp_gained / SKILLING_DIVISOR, 2)
    event_rating = round(event_ehb_score + event_ehp_score, 2)
    return {
        "username": player["username"],
        "player_type": player.get("player_type", "unknown"),
        "team": team_name,
        "ehp": round(player["ehp"], 2),
        "ehb": round(player["ehb"], 2),
        "total_level": player["total_level"],
        "ehb_gained": round(player["ehb_gained"], 2),
        "ehp_gained": round(player["ehp_gained"], 2),
        "ehp_rank": round(player["ehp_rank"], 1),
        "ehb_rank": round(player["ehb_rank"], 1),
        "overall_rank": player["overall_rank"],
        "rating_rank": None,
        "event_rating_rank": None,
        "ehb_lifetime_bonus": ehb_lifetime_bonus,
        "ehp_lifetime_bonus": ehp_lifetime_bonus,
        "ehb_score": ehb_score,
        "ehp_score": ehp_score,
        "total_rating": round(player["rating_total"], 2),
        "event_ehb_gained": event_ehb_gained,
        "event_ehp_gained": event_ehp_gained,
        "event_ehb_score": event_ehb_score,
        "event_ehp_score": event_ehp_score,
        "event_rating": event_rating,
        "bosses": player.get("bosses", []),
        "skills": player.get("skills", []),
        "lifetime_bosses": player.get("lifetime_bosses", []),
        "lifetime_skills": player.get("lifetime_skills", []),
        "non_combat_xp_progress": player.get("non_combat_xp_progress", {}),
        "event_bosses": player.get("event_bosses", []),
        "event_skills": player.get("event_skills", []),
    }


def build_non_combat_xp_tracking(teams: List[Dict[str, Any]]) -> Dict[str, Any]:
    team_rows = []

    for team in teams:
        player_rows = []
        total_xp = 0

        for player in team.get("players", []):
            progress = player.get("non_combat_xp_progress") or {}
            player_total_xp = int(progress.get("total_xp", 0) or 0)
            total_xp += player_total_xp
            player_rows.append(
                {
                    "username": player["username"],
                    "total_xp": player_total_xp,
                    "skills": progress.get("skills", []),
                }
            )

        player_rows.sort(key=lambda row: (-row["total_xp"], row["username"].lower()))
        team_rows.append(
            {
                "team": team["name"],
                "total_xp": total_xp,
                "target_xp": NON_COMBAT_XP_TILE_TARGET,
                "remaining_xp": max(0, NON_COMBAT_XP_TILE_TARGET - total_xp),
                "is_complete": total_xp >= NON_COMBAT_XP_TILE_TARGET,
                "players": player_rows,
            }
        )

    team_rows.sort(key=lambda row: (-row["total_xp"], row["team"].lower()))

    return {
        "tile_id": NON_COMBAT_XP_TILE_ID,
        "metric": "event_non_combat_xp",
        "target_xp": NON_COMBAT_XP_TILE_TARGET,
        "event_start": BINGO_EVENT_START.isoformat(),
        "event_end": BINGO_EVENT_END.isoformat(),
        "included_skills": list(NON_COMBAT_XP_INCLUDED_SKILLS),
        "excluded_skills": list(NON_COMBAT_XP_EXCLUDED_SKILLS),
        "teams": team_rows,
    }


def main() -> None:
    args = parse_args()
    data = load_data(args.input)
    output_path = args.output or args.input

    team_by_username = {
        participant["username"]: participant["team"]
        for participant in data.get("participants", [])
    }
    usernames = list(team_by_username.keys())
    if not usernames:
        raise ValueError("No participants found in the input JSON.")

    cache = load_cache()
    overrides = load_overrides()
    player_stats: List[Dict[str, Any]] = []

    print("Refreshing participant scores...")
    for idx, username in enumerate(usernames, start=1):
        print(f"Progress: {idx}/{len(usernames)}")
        entry = fetch_raw_player(username, cache)
        if entry is None:
            raise ValueError(f"Could not fetch data for '{username}'. Aborting.")
        stats = extract_player_stats(entry, username)
        stats = apply_overrides(stats, overrides)
        stats["team"] = team_by_username[username]
        player_stats.append(stats)

    player_stats = assign_ranks(player_stats)
    for player in player_stats:
        ehb_score = player["ehb_gained"] + player["ehb_lifetime_bonus"]
        ehp_score = (
            player["ehp_gained"] + player["ehp_lifetime_bonus"]
        ) / SKILLING_DIVISOR
        player["rating_total"] = ehb_score + ehp_score

    participant_rows = [player_row(player, player["team"]) for player in player_stats]
    participant_rows.sort(key=lambda row: row["total_rating"], reverse=True)
    for rank, row in enumerate(participant_rows, start=1):
        row["rating_rank"] = rank

    # Assign event_rating_rank separately (sorted by event_rating descending)
    event_sorted = sorted(
        participant_rows, key=lambda row: row["event_rating"], reverse=True
    )
    for rank, row in enumerate(event_sorted, start=1):
        row["event_rating_rank"] = rank

    rating_rank_by_username = {
        row["username"]: row["rating_rank"] for row in participant_rows
    }
    event_rating_rank_by_username = {
        row["username"]: row["event_rating_rank"] for row in participant_rows
    }

    players_by_username = {player["username"]: player for player in player_stats}
    teams: List[Dict[str, Any]] = []
    team_totals: List[float] = []
    for existing_team in data.get("teams", []):
        team_name = existing_team["name"]
        team_players = []
        for existing_player in existing_team.get("players", []):
            username = existing_player["username"]
            player = players_by_username[username]
            row = player_row(player, team_name)
            row["rating_rank"] = rating_rank_by_username[username]
            row["event_rating_rank"] = event_rating_rank_by_username[username]
            team_players.append(row)
        team_players.sort(key=player_sort_key)
        total_rating = round(sum(player["total_rating"] for player in team_players), 2)
        event_total_rating = round(
            sum(player["event_rating"] for player in team_players), 2
        )
        team_totals.append(total_rating)
        teams.append(
            {
                "name": team_name,
                "total_rating": total_rating,
                "event_total_rating": event_total_rating,
                "player_count": len(team_players),
                "players": team_players,
            }
        )

    data["generated_at"] = datetime.now(timezone.utc).isoformat()
    data["participants_file"] = data.get("participants_file") or "participants.txt"
    data["scoring"] = {
        "method": SCORING_METHOD,
        "window_months": SCORE_WINDOW_MONTHS,
        "lifetime_divisor": LIFETIME_DIVISOR,
        "skilling_divisor": SKILLING_DIVISOR,
        "description": (
            f"rating = (EHB_gained + lifetime_EHB/{LIFETIME_DIVISOR:g}) + "
            f"((EHP_gained + lifetime_EHP/{LIFETIME_DIVISOR:g}) / {SKILLING_DIVISOR:g})."
        ),
        "event_description": (
            f"event_rating = event_EHB_gained + (event_EHP_gained / {SKILLING_DIVISOR:g}). "
            "No lifetime component."
        ),
    }
    data["summary"] = {
        "team_count": len(teams),
        "participant_count": len(participant_rows),
        "rating_min": min(team_totals, default=0.0),
        "rating_max": max(team_totals, default=0.0),
    }
    data["participants"] = participant_rows
    data["teams"] = teams
    data["board_tracking"] = {
        "generated_at": data["generated_at"],
        "tiles": {NON_COMBAT_XP_TILE_ID: build_non_combat_xp_tracking(teams)},
    }

    save_data(output_path, data)
    print(f"Updated score data written to {output_path}")


if __name__ == "__main__":
    main()
