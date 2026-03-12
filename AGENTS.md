# AGENTS.md

## Purpose

This repository powers Forgeborne Bingo, an Old School RuneScape clan webapp used to organize a clan bingo event.

The product vision has 3 main tabs:

- `Board`: the primary feature; a shared bingo board of challenge tiles for the event
- `Teams`: generated team overview, team totals, and members
- `Participants`: detailed participant analysis and the exact weighting math used for team balancing

Current implementation status:

- `Teams`: implemented
- `Participants`: implemented
- `Board`: not implemented yet

For v1, the app should remain static and GitHub Pages-friendly. Board completion should be stored per browser only, not shared across users or teams.

## Product Vision

### Board

The Board tab is the main reason the app exists.

It should eventually display a bingo board where every tile:

- represents an OSRS challenge
- has a title, points value, and visual icon or item
- can expose a longer description on click or hover
- can link to relevant OSRS Wiki pages

Board behavior for v1:

- one global board definition for the whole competition
- all teams can complete all tiles independently in reality, but v1 does not track shared server state
- completion is a personal per-browser checklist only
- completion state should persist in browser local storage

Board v1 non-goals:

- no backend
- no database
- no shared progress sync
- no per-team saved board state
- no live standings or completion feed

### Teams

The Teams tab is currently a simple overview of generated teams.

Near-term expectations:

- keep it readable and visually strong
- preserve team rating visibility
- preserve roster visibility

Possible later additions:

- custom team names
- team captain
- team logo
- standings and points during the competition

### Participants

The Participants tab exists to explain and justify the seeding score for every player.

This tab should continue to emphasize:

- transparency of the weighting formula
- detailed breakdown of player strengths
- useful visual comparison across the roster
- room for future personalization, such as event-earned titles

## Current Architecture

This repo is a lightweight static-site project with a Python data-generation step.

End-to-end flow:

1. `participants.txt` provides the participant usernames
2. `scripts/generate_teams.py` fetches Wise Old Man and OSRS hiscores data
3. the generator computes ranks, scores, ratings, and team assignments
4. it writes `public/data/teams.json` and can optionally export Markdown
5. the frontend in `public/` fetches `public/data/teams.json` and renders the UI

The CLI entrypoint stays in `scripts/generate_teams.py`, but the generator internals are split across supporting `scripts/teamgen_*.py` modules.

There is no frontend framework, no JS build step, and no application server.

## Important Files

Core project files:

- `README.md`: setup and usage docs, but parts are currently stale
- `pyproject.toml`: Python dependencies managed with `uv`
- `participants.txt`: participant source list
- `player_overrides.json`: manual metadata overrides
- `cache.json`: cached external API responses

Scripts:

- `scripts/generate_teams.py`: CLI entrypoint and orchestration
- `scripts/teamgen_*.py`: generator internals split by config, storage, fetch, scoring, balancing, and output
- `scripts/swap_players.py`: manual post-generation swap tool for `public/data/teams.json`
- `scripts/preview_site.py`: local dev preview server
- `scripts/dev`: convenience wrapper for previewing locally

Static site:

- `public/index.html`: site shell, templates, and tab markup
- `public/app.js`: data loading, rendering, tab state, countdown, card interactions
- `public/styles.css`: handcrafted OSRS/forge visual system
- `public/data/teams.json`: generated site data
- `public/assets/`: local art and icons

Deployment:

- `.github/workflows/static.yml`: GitHub Pages deployment workflow
- `public/404.html`: redirect within the public site

## Frontend Notes

The frontend is plain HTML, CSS, and vanilla JavaScript.

Existing navigation:

- `Teams` tab
- `Participants` tab

Current deep links:

- `?tab=teams`
- `?tab=participants`

Tab state is managed in `public/app.js` with query params and `history.replaceState`.

Styling direction:

- OSRS-inspired, fantasy/forge mood
- custom CSS variables in `public/styles.css`
- typography uses `Cinzel`, `EB Garamond`, and `IBM Plex Mono`
- avoid flattening this into generic dashboard styling

Important design instruction for future work:

- preserve the established visual language unless there is a deliberate redesign
- keep mobile behavior functional
- prefer stylized, game-adjacent UI over generic admin panels

## Current Feature Status

### Teams Tab

Implemented in:

- `public/index.html`
- `public/app.js`
- `public/styles.css`

Current behavior:

- renders team cards
- shows total team rating
- shows roster rows with player type, rank, rating, and share of team total

Current limits:

- team names are generic (`Team 1`, `Team 2`, etc.)
- no captain support
- no team editing UI
- no standings or score tracking

### Participants Tab

Implemented in:

- `public/index.html`
- `public/app.js`
- `public/styles.css`

Current behavior:

- renders participant cards
- shows overall rank and total rating
- exposes separate combat and skilling score breakdowns
- displays lifetime and recent gains side by side

Current strengths:

- best transparency surface in the app
- communicates the math behind weighting well
- already feels like a strong analytical roster browser

Current limits:

- no search/filter/sort UI
- no compare mode
- no participant management flow

### Board Tab

Not implemented.

There is currently:

- no board tab in `public/index.html`
- no board routing in `public/app.js`
- no board data model
- no tile UI
- no persistence logic for board progress

## Domain Logic

### Weighting Philosophy

Team balancing is based on both lifetime account progression and recent activity.

The idea is:

- lifetime EHP/EHB approximates account maturity, unlocks, gear, and content capability
- recent gained EHP/EHB approximates current activity level
- lifetime progression still matters, but without per-player scalar curves

### Current Formula

In `scripts/generate_teams.py`, the current formula is:

- `ehb_score = ehb_gained + (ehb / 10)`
- `ehp_score = (ehp_gained + (ehp / 10)) / 3`
- `rating = ehb_score + ehp_score`

Lifetime contribution is blended in with fixed divisors per metric:

- `lifetime_bonus = lifetime_metric / 10`

Interpretation:

- recent activity stays direct and readable
- lifetime progression still matters, but now uses one shared divisor
- combat contribution remains full strength while skilling is simply divided by 3
- no player-specific scalar curve is applied

### Ranking

The generator computes:

- `ehp_rank`
- `ehb_rank`
- `overall_rank`

Important detail:

- `overall_rank` is descriptive only
- team generation is driven by computed rating, not by `overall_rank`

### Team Assignment

Current team generation is deterministic:

1. compute all player weights
2. sort descending by rating
3. snake-draft the main pool across teams
4. assign overflow players to the currently lightest teams
5. run deterministic one-for-one swaps that reduce team rating spread while preserving team counts

Manual override note:

- `scripts/swap_players.py` can apply an explicit swap after generation, but those changes live only in the generated JSON and will be overwritten by the next generator run

Important caveat:

- `team_size` behaves more like a target/base size than a strict hard maximum
- final team sizes should stay within one player of each other

## Data Sources

External APIs:

- Wise Old Man API
- OSRS hiscores JSON endpoints

Current Wise Old Man usage includes:

- player details
- EHP timeline
- EHB timeline
- gained window data

OSRS hiscores are used mainly for account-type checks and verification.

## Account Type Handling

This repo assumes an ironman-only clan roster.

Current normalization behavior in `scripts/generate_teams.py`:

- WOM `hardcore` becomes `hardcore_ironman`
- WOM `ultimate` is verified and becomes `ultimate_ironman` or falls back to `ironman`
- WOM `regular` is force-upgraded to `group_ironman`

This is intentional for the current clan assumption, but it is a project-specific rule and should not be generalized blindly.

## Caching And Overrides

### Cache

- raw API responses are cached in `cache.json`
- cache TTL is currently 1 hour

This lets the generator recompute derived data without refetching everything every run.

### Overrides

- manual corrections live in `player_overrides.json`
- current supported override is `player_type`

Use overrides when external APIs misclassify accounts.

## Local Development Workflow

Setup:

- install `uv`
- run `uv sync`

Generate data:

- `uv run python scripts/generate_teams.py`

Preview locally:

- `./scripts/dev`
- or `uv run python scripts/preview_site.py`

Typical local URL:

- `http://127.0.0.1:8000/`

## GitHub Pages Notes

The app is intended to be hosted on GitHub Pages.

Current deployment uses a GitHub Actions workflow in `.github/workflows/static.yml`.

Important warning:

- the current workflow uploads only `public/` as the Pages artifact

This matches the intended static-site deployment model.

## Known Issues And Drift

Future agents should be aware of the following inconsistencies before changing logic:

1. `public/data/teams.json` may be out of sync with generator output if it was not freshly regenerated

2. participant input and generated output may differ
   - if player fetches fail, the generator skips them silently apart from terminal output
   - the UI currently does not surface which players were omitted

3. `detect_hcim_via_hiscores()` exists but is not currently wired into player normalization

## Strengths Worth Preserving

Future agents should try to preserve these strong parts of the current implementation:

- lightweight static architecture
- zero-backend deployment model for v1
- strong OSRS/forge visual identity
- transparent participant weighting breakdowns
- straightforward deterministic team generation

## Recommended Near-Term Priorities

Suggested implementation order:

1. define a board data schema for tiles and metadata
2. add a real `Board` tab to the existing site shell
3. implement board rendering and local browser persistence
4. improve Teams and Participants with search/filter/sort as needed
5. add tests around weighting and team generation logic

## Board V1 Implementation Guidance

When implementing Board v1, prefer the following approach:

- add a third tab to the existing UI instead of replatforming the whole app
- keep board definitions in a committed JSON file inside the static site
- represent each tile with stable IDs, title, points, icon/image, description, and optional wiki links
- persist completion state in `localStorage`
- key saved state by board version and tile ID
- make completion personal to the browser only
- support both desktop and mobile interactions

Avoid for v1:

- backend APIs
- auth
- shared/team-synced claims
- server persistence

## Guidance For Future Agents

- Read the generator and frontend before changing domain rules.
- If you change the JSON shape, update both the generator and the frontend together.
- If you change weighting math, update code, UI copy, and documentation together.
- Prefer incremental changes over large rewrites.
- Preserve static hosting compatibility.
- Do not introduce a frontend framework unless there is a strong reason.
- Preserve the established aesthetic; do not turn the app into a generic modern dashboard.

## Quick Verification Checklist

After meaningful changes, verify at minimum:

- generator runs successfully
- `public/data/teams.json` loads in the browser
- tab navigation works
- Teams tab renders
- Participants tab renders
- Board tab renders if implemented
- mobile layout remains usable
- any new local persistence survives refresh

## Current High-Confidence Truths

If in doubt, treat these as the current source of truth:

- live generator entrypoint: `scripts/generate_teams.py`
- live generator internals: `scripts/teamgen_*.py`
- live frontend behavior: `public/app.js`
- live frontend structure: `public/index.html`
- live styling system: `public/styles.css`

Documentation files are helpful, but some of them are currently stale relative to the code.
