import json
import os
import time
from typing import Dict, List

from teamgen_config import CACHE_EXPIRY, CACHE_FILE, OVERRIDES_FILE


def load_cache() -> Dict:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as file:
                return json.load(file)
        except json.JSONDecodeError:
            return {}
    return {}


def save_cache(cache: Dict) -> None:
    with open(CACHE_FILE, "w", encoding="utf-8") as file:
        json.dump(cache, file, indent=4)


def is_cache_valid(entry: Dict) -> bool:
    return time.time() - entry.get("timestamp", 0) < CACHE_EXPIRY


def load_overrides() -> Dict:
    if os.path.exists(OVERRIDES_FILE):
        try:
            with open(OVERRIDES_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
                return data.get("players", {})
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def apply_overrides(stats: Dict, overrides: Dict) -> Dict:
    key = stats["username"].lower()
    player_overrides = overrides.get(key, {})
    if not player_overrides:
        return stats

    if "player_type" in player_overrides:
        original = stats.get("player_type")
        stats["player_type"] = player_overrides["player_type"]
        if original != stats["player_type"]:
            print(
                f"  [{stats['username']}] Override: player_type {original!r} -> {stats['player_type']!r}"
            )

    return stats


def get_participants(participants_path: str) -> List[str]:
    try:
        with open(participants_path, "r", encoding="utf-8") as file:
            return [line.strip() for line in file if line.strip()]
    except Exception as error:
        print(f"Error reading participants file: {error}")
        return []
