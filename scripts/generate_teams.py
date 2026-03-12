import argparse

from teamgen_config import resolve_participants_file
from teamgen_fetch import fetch_raw_player
from teamgen_output import print_teams, write_json_output, write_markdown_output
from teamgen_scoring import assign_ranks, extract_player_stats
from teamgen_storage import (
    apply_overrides,
    get_participants,
    load_cache,
    load_overrides,
)
from teamgen_teams import generate_teams


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate balanced OSRS bingo teams.")
    parser.add_argument(
        "--participants",
        default=None,
        help="Path to the participants file. Defaults to @participants.txt then participants.txt.",
    )
    parser.add_argument(
        "--team-size", type=int, default=8, help="Target players per team."
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional path for a Markdown export. Disabled by default.",
    )
    parser.add_argument(
        "--json-output",
        default="public/data/teams.json",
        help="Path to the JSON output file used by the static site.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    participants_file = resolve_participants_file(args.participants)
    if participants_file is None:
        print("Error: Could not find participants file.")
        return

    print("Reading participants...")
    participants = get_participants(participants_file)
    print(f"Found {len(participants)} participants.")
    if not participants:
        print("No participants found. Nothing to do.")
        return

    cache = load_cache()
    overrides = load_overrides()

    player_stats = []
    print("\nFetching player data...")
    for idx, username in enumerate(participants, start=1):
        print(f"Progress: {idx}/{len(participants)}")
        entry = fetch_raw_player(username, cache)
        if entry is None:
            print(f"  [{username}] Skipping - could not fetch data.")
            continue
        stats = extract_player_stats(entry, username)
        stats = apply_overrides(stats, overrides)
        player_stats.append(stats)

    print("\nAssigning ranks...")
    player_stats = assign_ranks(player_stats)

    for player in player_stats:
        print(
            f"  {player['username']:<16}"
            f"  EHP {player['ehp']:>7.1f} (rank {player['ehp_rank']:>5.1f})"
            f"  EHB {player['ehb']:>6.1f} (rank {player['ehb_rank']:>5.1f})"
            f"  -> overall {player['overall_rank']:>5d}"
            f"  ehb_bonus {player['ehb_lifetime_bonus']:.2f}"
            f"  ehp_bonus {player['ehp_lifetime_bonus']:.2f}"
        )

    print("\nGenerating teams...")
    teams = generate_teams(player_stats, team_size=args.team_size)

    print_teams(teams)
    if args.output:
        write_markdown_output(args.output, teams)
        print(f"\nTeams exported to {args.output}")
    write_json_output(args.json_output, teams, args.team_size, participants_file)
    print(f"Site data exported to {args.json_output}")


if __name__ == "__main__":
    main()
