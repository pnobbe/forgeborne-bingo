# Forgeborne Bingo Team Generator

Generate balanced OSRS bingo teams from a plain text participant list using Wise Old Man stats.

## Setup

Install `uv`, create the virtual environment, and sync dependencies:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
~/.local/bin/uv sync
```

## Participants File

Create either `@participants.txt` or `participants.txt` in the project root.
Put one player name on each line.

## Usage

Run with defaults:

```bash
~/.local/bin/uv run python generate_teams.py
```

Common options:

```bash
~/.local/bin/uv run python generate_teams.py --team-size 5
~/.local/bin/uv run python generate_teams.py --participants participants.txt --output custom_teams.md
~/.local/bin/uv run python generate_teams.py --output teams_output.md --json-output docs/data/teams.json
```

## Command Options

- `--team-size`: maximum number of players per team, default `4`
- `--participants`: path to a participant text file; defaults to `@participants.txt`, then `participants.txt`
- `--output`: path to the generated Markdown file, default `teams_output.md`
- `--json-output`: path to the generated JSON file for the static site, default `docs/data/teams.json`

## Output

The script prints teams to the terminal, writes a Markdown report, and can also write JSON for the static site.

## GitHub Pages Site

The repository includes a static site in `docs/index.html` that reads team data from `docs/data/teams.json`.
GitHub Pages can serve the `docs/` directory directly.

Refresh the site data with:

```bash
~/.local/bin/uv run python generate_teams.py --output teams_output.md --json-output docs/data/teams.json
```

Then enable GitHub Pages in the repository settings using the `main` branch and the `/docs` folder.

## Notes

- API responses are cached in `cache.json` for 1 hour
- Usernames with spaces are supported
- Recent gains receive extra bonus weight based on the configured decay multipliers in `generate_teams.py`
