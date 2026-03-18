import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from teamgen_config import resolve_repo_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Add a board claim to public/data/board.json."
    )
    parser.add_argument("tile_id", help="Board tile id to update.")
    parser.add_argument("team", help="Team name, for example 'Team 1'.")
    parser.add_argument("player", help="Player who completed the claim.")
    parser.add_argument(
        "--input",
        default="public/data/board.json",
        help="Input JSON path. Defaults to public/data/board.json.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path. Defaults to updating the input file.",
    )
    parser.add_argument(
        "--status",
        default="verified",
        help="Claim status label. Defaults to verified.",
    )
    parser.add_argument(
        "--completed-at",
        default=None,
        help="UTC timestamp in ISO format. Defaults to now.",
    )
    parser.add_argument(
        "--proof-url",
        default="",
        help="Optional proof URL.",
    )
    parser.add_argument(
        "--note",
        default="",
        help="Optional note saved with the claim.",
    )
    parser.add_argument(
        "--claim-id",
        default=None,
        help="Optional explicit claim id. Defaults to an auto-generated id.",
    )
    parser.add_argument(
        "--allow-duplicate-team",
        action="store_true",
        help="Allow adding another claim for a team that already has one on this tile.",
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
        file.write("\n")


def parse_completed_at(value: str | None) -> str:
    if not value:
        return (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return (
        parsed.astimezone(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def locate_tile(data: Dict[str, Any], tile_id: str) -> Dict[str, Any]:
    for tile in data.get("tiles", []):
        if tile.get("id") == tile_id:
            return tile
    raise ValueError(f"Could not find tile '{tile_id}'.")


def validate_team(data: Dict[str, Any], team_name: str) -> None:
    tracked_teams = data.get("teams_tracked") or []
    if tracked_teams and team_name not in tracked_teams:
        available = ", ".join(tracked_teams)
        raise ValueError(f"Unknown team '{team_name}'. Expected one of: {available}")


def normalize_slug(value: str) -> str:
    chars = []
    previous_dash = False
    for char in value.lower():
        if char.isalnum():
            chars.append(char)
            previous_dash = False
        elif not previous_dash:
            chars.append("-")
            previous_dash = True
    slug = "".join(chars).strip("-")
    return slug or "claim"


def next_claim_id(completions: List[Dict[str, Any]], team: str, player: str) -> str:
    base = f"{normalize_slug(team)}-{normalize_slug(player)}"
    existing_ids = {str(entry.get("id", "")) for entry in completions}
    if base not in existing_ids:
        return base
    suffix = 2
    while f"{base}-{suffix}" in existing_ids:
        suffix += 1
    return f"{base}-{suffix}"


def add_claim(data: Dict[str, Any], args: argparse.Namespace) -> Dict[str, Any]:
    validate_team(data, args.team)
    tile = locate_tile(data, args.tile_id)
    competition = tile.setdefault("competition", {})
    completions = competition.setdefault("completions", [])

    if tile.get("id") == "free-tile-tbd":
        raise ValueError(
            "The frog-blessed free tile is automatic and does not need claims."
        )

    existing_team_claims = [
        entry for entry in completions if entry.get("team") == args.team
    ]
    if existing_team_claims and not args.allow_duplicate_team:
        raise ValueError(
            f"{args.team} already has {len(existing_team_claims)} claim(s) on '{args.tile_id}'. "
            "Use --allow-duplicate-team if you really want to append another one."
        )

    claim = {
        "id": args.claim_id or next_claim_id(completions, args.team, args.player),
        "team": args.team,
        "player": args.player,
        "status": args.status,
        "completed_at": parse_completed_at(args.completed_at),
        "proof_url": args.proof_url,
        "note": args.note,
    }
    completions.append(claim)
    data["updated_at"] = (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    return claim


def main() -> None:
    args = parse_args()
    data = load_data(args.input)
    claim = add_claim(data, args)
    output_path = args.output or args.input
    save_data(output_path, data)

    print("Board claim added\n")
    print(f"- Tile: {args.tile_id}")
    print(f"- Team: {claim['team']}")
    print(f"- Player: {claim['player']}")
    print(f"- Status: {claim['status']}")
    print(f"- Completed at: {claim['completed_at']}")
    if claim["proof_url"]:
        print(f"- Proof: {claim['proof_url']}")
    if claim["note"]:
        print(f"- Note: {claim['note']}")
    print(f"\nUpdated board data written to {output_path}")


if __name__ == "__main__":
    main()
