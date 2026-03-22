import os
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

# Infrastructure config
CACHE_FILE = os.path.join(REPO_ROOT, "cache.json")
OVERRIDES_FILE = os.path.join(REPO_ROOT, "player_overrides.json")
CACHE_EXPIRY = 3600
WOM_API_BASE = "https://api.wiseoldman.net/v2"
OSRS_HISCORES_BASE = "https://secure.runescape.com/m=hiscore_oldschool"
REQUEST_TIMEOUT = 30

# Event config
BINGO_EVENT_START = datetime(2026, 3, 18, 11, 30, tzinfo=timezone.utc)
BINGO_EVENT_END = datetime(2026, 4, 1, 11, 30, tzinfo=timezone.utc)
OSRS_SKILLS = (
    "attack",
    "defence",
    "strength",
    "hitpoints",
    "ranged",
    "prayer",
    "magic",
    "cooking",
    "woodcutting",
    "fletching",
    "fishing",
    "firemaking",
    "crafting",
    "smithing",
    "mining",
    "herblore",
    "agility",
    "thieving",
    "slayer",
    "farming",
    "runecrafting",
    "hunter",
    "sailing",
    "construction",
)
NON_COMBAT_XP_TILE_ID = "twelve-million-non-combat-xp"
NON_COMBAT_XP_TILE_TARGET = 12_000_000
NON_COMBAT_XP_EXCLUDED_SKILLS = (
    "attack",
    "strength",
    "defence",
    "hitpoints",
    "prayer",
    "magic",
    "ranged",
)
NON_COMBAT_XP_INCLUDED_SKILLS = tuple(
    skill for skill in OSRS_SKILLS if skill not in NON_COMBAT_XP_EXCLUDED_SKILLS
)

# Scoring config
SCORE_WINDOW_MONTHS = 3
LIFETIME_DIVISOR = 10.0
SKILLING_DIVISOR = 3.0
SCORING_METHOD = "shared_lifetime_divisor_with_skilling_divisor"

# Retry config
RETRY_ATTEMPTS = 4
RETRY_BASE_DELAY = 5.0


def resolve_repo_path(path: str) -> str:
    if os.path.isabs(path):
        return path
    return os.path.join(REPO_ROOT, path)


def resolve_participants_file(explicit_path: str | None) -> str | None:
    if explicit_path:
        resolved = resolve_repo_path(explicit_path)
        return resolved if os.path.exists(resolved) else None

    for name in ("@participants.txt", "participants.txt"):
        resolved = resolve_repo_path(name)
        if os.path.exists(resolved):
            return resolved

    return None
