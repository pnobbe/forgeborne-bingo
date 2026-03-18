# Forgeborne Bingo

Generate balanced OSRS bingo teams from a plain text participant list and publish the static event site.

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
~/.local/bin/uv run python scripts/generate_teams.py
```

Common options:

```bash
~/.local/bin/uv run python scripts/generate_teams.py --team-size 5
~/.local/bin/uv run python scripts/generate_teams.py --participants participants.txt --output custom_teams.md
~/.local/bin/uv run python scripts/generate_teams.py --json-output public/data/teams.json
```

## Command Options

- `--team-size`: target players per team, default `8`
- `--participants`: path to a participant text file; defaults to `@participants.txt`, then `participants.txt`
- `--output`: optional path to a generated Markdown report
- `--json-output`: path to the generated JSON file for the static site, default `public/data/teams.json`

## Output

The script prints teams to the terminal and writes JSON for the static site. Markdown export is optional.

The CLI entrypoint remains `scripts/generate_teams.py`, while the generator internals live in supporting `scripts/teamgen_*.py` modules.

## GitHub Pages Site

The repository includes a static site in `public/index.html` that reads team data from `public/data/teams.json`.
GitHub Pages deploys the `public/` directory as the published site artifact.

Refresh the site data with:

```bash
~/.local/bin/uv run python scripts/generate_teams.py --json-output public/data/teams.json
```

The included GitHub Actions workflow handles Pages deployment automatically.

The site supports direct tab links:

- `?tab=teams`
- `?tab=participants`

Example:

```text
https://<user>.github.io/<repo>/?tab=participants
```

## Local Preview

Because the site loads `public/data/teams.json` with `fetch`, preview it through a local web server instead of opening the HTML file directly.

From the repository root:

```bash
./scripts/dev
```

Equivalent long form:

```bash
~/.local/bin/uv run python scripts/preview_site.py
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/?tab=participants
```

You can choose a different port with:

```bash
./scripts/dev --port 9000
```

This preview server includes hot reload for changes in `public/`.
It does not automatically rerun the Python generator when `participants.txt`, `scripts/generate_teams.py`, or the supporting `scripts/teamgen_*.py` modules change; rerun the generator manually or start preview with `--regenerate` when needed.

## Manual Team Swaps

If you want to manually swap two players after generation, use:

```bash
~/.local/bin/uv run python scripts/swap_players.py "Behre" "Ya Stal"
```

That shows a preview with:

- each player's current and new team
- their rating, combat score, skilling score, and rating rank
- both affected team totals before and after the swap
- the overall rating spread before and after

To write the swap back into the live site data:

```bash
~/.local/bin/uv run python scripts/swap_players.py "Behre" "Ya Stal" --apply
```

Or write a separate copy:

```bash
~/.local/bin/uv run python scripts/swap_players.py "Behre" "Ya Stal" --output public/data/teams.manual.json
```

Important: manual swaps only modify the generated JSON. If you rerun `scripts/generate_teams.py`, the generator will rebuild teams and overwrite those manual changes.

## Manual Board Claims

If you want to add a verified board claim without hand-editing JSON, use:

```bash
~/.local/bin/uv run python scripts/add_board_claim.py vorkath-any-unique "Team 2" "Patri"
```

Useful options:

- `--status verified` to control the claim status
- `--completed-at 2026-03-19T21:14:00Z` to set an exact UTC timestamp
- `--proof-url https://example.com/proof.png` to attach proof
- `--note "Draconic visage drop"` to save an extra note
- `--output public/data/board.manual.json` to write a separate copy instead of updating the live board file

Example with metadata:

```bash
~/.local/bin/uv run python scripts/add_board_claim.py vorkath-any-unique "Team 2" "Patri" \
  --completed-at "2026-03-19T21:14:00Z" \
  --proof-url "https://example.com/proof.png" \
  --note "Draconic visage drop"
```

Notes:

- the script updates `public/data/board.json` by default
- team names must match the tracked names in the board data exactly, such as `Team 1`
- duplicate claims for the same team on the same tile are blocked unless you pass `--allow-duplicate-team`
- the frog-blessed free tile is automatic and does not need claims

## Notes

- API responses are cached in `cache.json` for 1 hour
- Usernames with spaces are supported
- Team balancing uses `rating = (ehb_gained + lifetime_ehb / 10) + ((ehp_gained + lifetime_ehp / 10) / 3)`
- Rating uses one shared lifetime divisor and one clear skilling divisor so the math stays easier to explain
- `--team-size` behaves like a target/base size; resulting teams stay within one player of each other, then a swap pass tightens rating spread without changing team counts
- `cache.json` is local cache state and should not be treated as a canonical project artifact
