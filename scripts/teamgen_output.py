import json
import os
from datetime import datetime, timezone
from typing import Dict, List

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


def player_sort_key(player: Dict) -> tuple:
    rating_rank = player.get("rating_rank")
    overall_rank = player.get("overall_rank")
    total_rating = player.get("total_rating", 0.0)
    return (
        rating_rank if rating_rank is not None else float("inf"),
        overall_rank if overall_rank is not None else float("inf"),
        -total_rating,
        player.get("username", "").lower(),
    )


def print_teams(teams: List[List[Dict]]) -> None:
    print("\n--- Final Teams ---")
    for team_index, team in enumerate(teams, start=1):
        total = sum(player["rating_total"] for player in team)
        print(f"\nTeam {team_index} (Total Rating: {total:.2f})")
        for player in team:
            print(
                f"  - {player['username']:<16}"
                f" | EHP rank {player['ehp_rank']:>5.1f}"
                f" | EHB rank {player['ehb_rank']:>5.1f}"
                f" | Overall {player['overall_rank']:>5d}"
                f" | EHB bonus {player['ehb_lifetime_bonus']:.2f}"
                f" | EHP bonus {player['ehp_lifetime_bonus']:.2f}"
                f" | EHB gained {player['ehb_gained']:>7.2f}"
                f" | Rating {player['rating_total']:>7.2f}"
            )


def write_markdown_output(output_path: str, teams: List[List[Dict]]) -> None:
    resolved_output = resolve_repo_path(output_path)
    os.makedirs(os.path.dirname(resolved_output), exist_ok=True)

    with open(resolved_output, "w", encoding="utf-8") as file:
        file.write("# OSRS Bingo Teams\n\n")
        file.write("## Rating\n")
        file.write(
            f"- Rating = (EHB gained last {SCORE_WINDOW_MONTHS} months + lifetime EHB / {LIFETIME_DIVISOR:g}) + ((EHP gained last {SCORE_WINDOW_MONTHS} months + lifetime EHP / {LIFETIME_DIVISOR:g}) / {SKILLING_DIVISOR:g})\n"
        )
        file.write(
            f"- Lifetime contribution uses one shared divisor: / {LIFETIME_DIVISOR:g}\n"
        )
        file.write(
            f"- Skilling contribution is then divided by {SKILLING_DIVISOR:g}, so combat counts more directly\n"
        )
        file.write("- Rank = combined EHP rank + EHB rank among all participants\n\n")

        file.write('<div style="display: flex; flex-wrap: wrap; gap: 20px;">\n')
        for team_index, team in enumerate(teams, start=1):
            team_rating = sum(player["rating_total"] for player in team)
            file.write(
                '<div style="flex: 1 1 45%; min-width: 400px; margin-bottom: 20px;">\n'
            )
            file.write(
                f"  <h3>Team {team_index} (Total Rating: {team_rating:.2f})</h3>\n"
            )
            file.write('  <table style="width:100%;border-collapse:collapse;">\n')
            file.write("    <thead><tr>\n")
            for column in [
                "Player",
                "EHP Rank",
                "EHB Rank",
                "Overall",
                "EHB Rating",
                "EHP Rating",
                "Rating",
            ]:
                align = "left" if column == "Player" else "right"
                file.write(
                    f'      <th style="text-align:{align};padding:4px;border-bottom:1px solid #ccc">{column}</th>\n'
                )
            file.write("    </tr></thead>\n    <tbody>\n")
            for player in team:
                file.write("      <tr>\n")
                file.write(
                    f'        <td style="padding:4px;border-bottom:1px solid #eee">{player["username"]}</td>\n'
                )
                file.write(
                    f'        <td style="text-align:right;padding:4px;border-bottom:1px solid #eee">{player["ehp_rank"]:.1f}</td>\n'
                )
                file.write(
                    f'        <td style="text-align:right;padding:4px;border-bottom:1px solid #eee">{player["ehb_rank"]:.1f}</td>\n'
                )
                file.write(
                    f'        <td style="text-align:right;padding:4px;border-bottom:1px solid #eee">{player["overall_rank"]}</td>\n'
                )
                file.write(
                    f'        <td style="text-align:right;padding:4px;border-bottom:1px solid #eee">{player["ehb_gained"] + player["ehb_lifetime_bonus"]:.2f}</td>\n'
                )
                file.write(
                    f'        <td style="text-align:right;padding:4px;border-bottom:1px solid #eee">{(player["ehp_gained"] + player["ehp_lifetime_bonus"]) / SKILLING_DIVISOR:.2f}</td>\n'
                )
                file.write(
                    f'        <td style="text-align:right;padding:4px;border-bottom:1px solid #eee;font-weight:bold">{player["rating_total"]:.2f}</td>\n'
                )
                file.write("      </tr>\n")
            file.write("    </tbody>\n  </table>\n</div>\n")
        file.write("</div>\n")


def write_json_output(
    output_path: str,
    teams: List[List[Dict]],
    team_size: int,
    participants_file: str,
) -> None:
    resolved_output = resolve_repo_path(output_path)
    os.makedirs(os.path.dirname(resolved_output), exist_ok=True)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "participants_file": os.path.relpath(participants_file, REPO_ROOT),
        "team_size": team_size,
        "scoring": {
            "method": SCORING_METHOD,
            "window_months": SCORE_WINDOW_MONTHS,
            "lifetime_divisor": LIFETIME_DIVISOR,
            "skilling_divisor": SKILLING_DIVISOR,
            "description": (
                f"rating = (EHB_gained + lifetime_EHB/{LIFETIME_DIVISOR:g}) + "
                f"((EHP_gained + lifetime_EHP/{LIFETIME_DIVISOR:g}) / {SKILLING_DIVISOR:g})."
            ),
        },
        "summary": {
            "team_count": len(teams),
            "participant_count": sum(len(team) for team in teams),
            "rating_min": min(
                (sum(player["rating_total"] for player in team) for team in teams),
                default=0.0,
            ),
            "rating_max": max(
                (sum(player["rating_total"] for player in team) for team in teams),
                default=0.0,
            ),
        },
        "participants": [],
        "teams": [],
    }

    def player_row(player: Dict, team_name: str) -> Dict:
        ehb_lifetime_bonus = round(player["ehb_lifetime_bonus"], 2)
        ehp_lifetime_bonus = round(player["ehp_lifetime_bonus"], 2)
        ehb_score = round(player["ehb_gained"] + player["ehb_lifetime_bonus"], 2)
        ehp_score = round(
            (player["ehp_gained"] + player["ehp_lifetime_bonus"]) / SKILLING_DIVISOR,
            2,
        )
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
            "ehb_lifetime_bonus": ehb_lifetime_bonus,
            "ehp_lifetime_bonus": ehp_lifetime_bonus,
            "ehb_score": ehb_score,
            "ehp_score": ehp_score,
            "total_rating": round(player["rating_total"], 2),
            "bosses": player.get("bosses", []),
            "skills": player.get("skills", []),
            "lifetime_bosses": player.get("lifetime_bosses", []),
            "lifetime_skills": player.get("lifetime_skills", []),
            "non_combat_xp_progress": player.get("non_combat_xp_progress", {}),
        }

    def build_non_combat_xp_tracking(team_groups: List[List[Dict]]) -> Dict:
        team_rows = []

        for team_index, team in enumerate(team_groups, start=1):
            player_rows = []
            total_xp = 0

            for player in team:
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

            player_rows.sort(
                key=lambda row: (-row["total_xp"], row["username"].lower())
            )

            team_rows.append(
                {
                    "team": f"Team {team_index}",
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

    participant_rows = []
    for team_index, team in enumerate(teams, start=1):
        for player in team:
            participant_rows.append(player_row(player, f"Team {team_index}"))

    payload["participants"] = sorted(
        participant_rows, key=lambda row: row["total_rating"], reverse=True
    )

    for rank, row in enumerate(payload["participants"], start=1):
        row["rating_rank"] = rank

    rating_rank_by_username = {
        row["username"]: row["rating_rank"] for row in payload["participants"]
    }

    for team_index, team in enumerate(teams, start=1):
        team_players = [player_row(player, f"Team {team_index}") for player in team]
        for row in team_players:
            row["rating_rank"] = rating_rank_by_username[row["username"]]
        team_players.sort(key=player_sort_key)

        payload["teams"].append(
            {
                "name": f"Team {team_index}",
                "total_rating": round(
                    sum(player["rating_total"] for player in team), 2
                ),
                "player_count": len(team),
                "players": team_players,
            }
        )

    payload["board_tracking"] = {
        "generated_at": payload["generated_at"],
        "tiles": {NON_COMBAT_XP_TILE_ID: build_non_combat_xp_tracking(teams)},
    }

    with open(resolved_output, "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)
