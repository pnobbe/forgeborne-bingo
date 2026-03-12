import argparse
import os
import subprocess
import sys

from livereload import Server

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
GENERATE_SCRIPT = os.path.join(SCRIPT_DIR, "generate_teams.py")
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
TEAMS_JSON = os.path.join(PUBLIC_DIR, "data", "teams.json")


def resolve_repo_path(path: str) -> str:
    if os.path.isabs(path):
        return path
    return os.path.join(REPO_ROOT, path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Preview the GitHub Pages site locally."
    )
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on.")
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Force regeneration of team data even if teams.json already exists.",
    )
    return parser.parse_args()


def run_generator() -> None:
    command = [
        sys.executable,
        GENERATE_SCRIPT,
        "--json-output",
        "public/data/teams.json",
    ]
    subprocess.run(command, cwd=REPO_ROOT, check=True)


def main() -> None:
    args = parse_args()
    os.chdir(REPO_ROOT)

    if args.regenerate:
        print("Regenerating team data (--regenerate flag set)...")
        run_generator()
    elif not os.path.exists(TEAMS_JSON):
        print("No teams.json found — generating team data...")
        run_generator()
    else:
        print(
            "teams.json already exists — skipping generation. Use --regenerate to force."
        )

    server = Server()
    server.watch("public/*.html")
    server.watch("public/*.css")
    server.watch("public/*.js")
    server.watch("public/data/*.json")

    print(f"Serving site at http://127.0.0.1:{args.port}/")
    print(f"Participants tab: http://127.0.0.1:{args.port}/?tab=participants")
    print("Hot reload is enabled for public assets and team data changes.")

    server.serve(root=PUBLIC_DIR, host="127.0.0.1", port=args.port, open_url=False)


if __name__ == "__main__":
    main()
