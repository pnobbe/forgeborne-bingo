import argparse
import json
from pathlib import Path
from typing import Any, Dict, Tuple

from teamgen_config import resolve_repo_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Preview or apply a manual player swap in teams.json."
    )
    parser.add_argument("player_a", help="First player username to swap.")
    parser.add_argument("player_b", help="Second player username to swap.")
    parser.add_argument(
        "--input",
        default="public/data/teams.json",
        help="Input JSON path. Defaults to public/data/teams.json.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path for the updated JSON.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write the swap back to disk. Without this flag, only preview the result.",
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


def locate_team_player(
    data: Dict[str, Any], username: str
) -> Tuple[int, int, Dict[str, Any]]:
    username_key = username.lower()
    for team_index, team in enumerate(data.get("teams", [])):
        for player_index, player in enumerate(team.get("players", [])):
            if player.get("username", "").lower() == username_key:
                return team_index, player_index, player
    raise ValueError(f"Could not find player '{username}' in team assignments.")


def locate_participant(data: Dict[str, Any], username: str) -> Dict[str, Any]:
    username_key = username.lower()
    for participant in data.get("participants", []):
        if participant.get("username", "").lower() == username_key:
            return participant
    raise ValueError(f"Could not find player '{username}' in participant list.")


def player_sort_key(player: Dict[str, Any]) -> tuple:
    rating_rank = player.get("rating_rank")
    overall_rank = player.get("overall_rank")
    total_rating = player.get("total_rating", 0.0)
    return (
        rating_rank if rating_rank is not None else float("inf"),
        overall_rank if overall_rank is not None else float("inf"),
        -total_rating,
        player.get("username", "").lower(),
    )


def sort_team_players(data: Dict[str, Any]) -> None:
    for team in data.get("teams", []):
        team["players"].sort(key=player_sort_key)


def recalculate_totals(data: Dict[str, Any]) -> None:
    sort_team_players(data)

    for team in data.get("teams", []):
        team["total_rating"] = round(
            sum(player.get("total_rating", 0.0) for player in team.get("players", [])),
            2,
        )
        team["player_count"] = len(team.get("players", []))

    totals = [team.get("total_rating", 0.0) for team in data.get("teams", [])]
    summary = data.setdefault("summary", {})
    summary["team_count"] = len(data.get("teams", []))
    summary["participant_count"] = len(data.get("participants", []))
    summary["rating_min"] = min(totals, default=0.0)
    summary["rating_max"] = max(totals, default=0.0)


def swap_players(
    data: Dict[str, Any], player_a_name: str, player_b_name: str
) -> Dict[str, Any]:
    team_a_idx, player_a_idx, player_a = locate_team_player(data, player_a_name)
    team_b_idx, player_b_idx, player_b = locate_team_player(data, player_b_name)

    if team_a_idx == team_b_idx:
        raise ValueError(
            f"{player_a['username']} and {player_b['username']} are already on {data['teams'][team_a_idx]['name']}."
        )

    team_a = data["teams"][team_a_idx]
    team_b = data["teams"][team_b_idx]
    team_a_name = team_a["name"]
    team_b_name = team_b["name"]

    before = {
        "team_a_name": team_a_name,
        "team_b_name": team_b_name,
        "team_a_total": team_a.get("total_rating", 0.0),
        "team_b_total": team_b.get("total_rating", 0.0),
        "spread": data.get("summary", {}).get("rating_max", 0.0)
        - data.get("summary", {}).get("rating_min", 0.0),
        "player_a": dict(player_a),
        "player_b": dict(player_b),
    }

    swapped_a = dict(player_b)
    swapped_b = dict(player_a)
    swapped_a["team"] = team_a_name
    swapped_b["team"] = team_b_name

    team_a["players"][player_a_idx] = swapped_a
    team_b["players"][player_b_idx] = swapped_b

    participant_a = locate_participant(data, player_a["username"])
    participant_b = locate_participant(data, player_b["username"])
    participant_a["team"] = team_b_name
    participant_b["team"] = team_a_name

    recalculate_totals(data)

    after = {
        "team_a_total": team_a.get("total_rating", 0.0),
        "team_b_total": team_b.get("total_rating", 0.0),
        "spread": data.get("summary", {}).get("rating_max", 0.0)
        - data.get("summary", {}).get("rating_min", 0.0),
        "player_a": locate_participant(data, player_a["username"]),
        "player_b": locate_participant(data, player_b["username"]),
    }

    return {"before": before, "after": after}


def describe_player(player: Dict[str, Any]) -> str:
    return (
        f"{player['username']} | {player['team']} | rating {player['total_rating']:.2f} | "
        f"combat {player['ehb_score']:.2f} | skilling {player['ehp_score']:.2f} | "
        f"rank #{player['rating_rank']}"
    )


def print_report(report: Dict[str, Any]) -> None:
    before = report["before"]
    after = report["after"]

    print("Manual swap preview\n")
    print(f"- Before: {describe_player(before['player_a'])}")
    print(f"- Before: {describe_player(before['player_b'])}")
    print(f"- After:  {describe_player(after['player_a'])}")
    print(f"- After:  {describe_player(after['player_b'])}")
    print()
    print(
        f"- {before['team_a_name']}: {before['team_a_total']:.2f} -> {after['team_a_total']:.2f}"
    )
    print(
        f"- {before['team_b_name']}: {before['team_b_total']:.2f} -> {after['team_b_total']:.2f}"
    )
    print(f"- Rating spread: {before['spread']:.2f} -> {after['spread']:.2f}")


def main() -> None:
    args = parse_args()
    data = load_data(args.input)
    report = swap_players(data, args.player_a, args.player_b)
    print_report(report)

    output_path = args.output or args.input
    if args.apply or args.output:
        save_data(output_path, data)
        print(f"\nUpdated team data written to {output_path}")
    else:
        print(
            "\nPreview only. Re-run with --apply to update the input file, or --output to write a copy."
        )


if __name__ == "__main__":
    main()
