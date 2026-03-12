import time
from datetime import datetime, timezone
from typing import Dict, List
from urllib.parse import quote

import requests
from dateutil.relativedelta import relativedelta

from teamgen_config import (
    OSRS_HISCORES_BASE,
    REQUEST_TIMEOUT,
    RETRY_ATTEMPTS,
    RETRY_BASE_DELAY,
    SCORE_WINDOW_MONTHS,
    WOM_API_BASE,
)
from teamgen_storage import is_cache_valid, save_cache


def wom_get(url: str, label: str) -> requests.Response | None:
    delay = RETRY_BASE_DELAY
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            response = requests.get(url, timeout=REQUEST_TIMEOUT)

            if response.status_code == 200:
                return response

            if response.status_code == 404:
                print(f"  [{label}] 404 Not Found - skipping.")
                return None

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                wait = float(retry_after) if retry_after else delay
                print(
                    f"  [{label}] 429 Too Many Requests "
                    f"(attempt {attempt}/{RETRY_ATTEMPTS}) - waiting {wait:.0f}s..."
                )
            else:
                wait = delay
                print(
                    f"  [{label}] HTTP {response.status_code} "
                    f"(attempt {attempt}/{RETRY_ATTEMPTS}) - waiting {wait:.0f}s..."
                )

        except Exception as error:
            wait = delay
            print(
                f"  [{label}] Network error (attempt {attempt}/{RETRY_ATTEMPTS}): {error}"
                f" - waiting {wait:.0f}s..."
            )

        if attempt < RETRY_ATTEMPTS:
            time.sleep(wait)
            delay *= 2
        else:
            print(f"  [{label}] All {RETRY_ATTEMPTS} attempts exhausted - giving up.")

    return None


def fetch_player_details(username: str) -> Dict | None:
    encoded = quote(username, safe="")
    response = wom_get(f"{WOM_API_BASE}/players/{encoded}", username)
    return response.json() if response is not None else None


def fetch_timeline(username: str, metric: str) -> List[Dict]:
    encoded = quote(username, safe="")
    url = (
        f"{WOM_API_BASE}/players/{encoded}/snapshots/timeline"
        f"?metric={metric}&period=year"
    )
    response = wom_get(url, f"{username}/{metric} timeline")
    return response.json() if response is not None else []


def fetch_gains(username: str, start_date: datetime, end_date: datetime) -> Dict | None:
    encoded = quote(username, safe="")
    start_str = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_str = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")
    url = (
        f"{WOM_API_BASE}/players/{encoded}/gained"
        f"?startDate={start_str}&endDate={end_str}"
    )
    response = wom_get(url, f"{username}/gained")
    return response.json() if response is not None else None


def detect_gim_via_hiscores(username: str) -> bool:
    encoded = quote(username, safe="")
    url = f"{OSRS_HISCORES_BASE}/index_lite.json?player={encoded}"
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            return False
        data = response.json()
        skills = data.get("skills", [])
        overall = next(
            (skill for skill in skills if skill.get("name") == "Overall"), None
        )
        if overall is None or overall.get("rank") != -1:
            return False
        return any(
            skill.get("rank", -1) != -1
            for skill in skills
            if skill.get("name") != "Overall"
        )
    except Exception:
        return False


def _osrs_total_level(board: str, username: str) -> int | None:
    encoded = quote(username, safe="")
    url = f"https://secure.runescape.com/m={board}/index_lite.json?player={encoded}"
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=False)
        if response.status_code != 200:
            return None
        data = response.json()
        overall = next(
            (
                skill
                for skill in data.get("skills", [])
                if skill.get("name") == "Overall"
            ),
            None,
        )
        return overall["level"] if overall else None
    except Exception:
        return None


def detect_hcim_via_hiscores(username: str) -> bool:
    hardcore_level = _osrs_total_level("hiscore_oldschool_hardcore_ironman", username)
    if hardcore_level is None:
        return False

    ironman_level = _osrs_total_level("hiscore_oldschool_ironman", username)
    if ironman_level is not None and ironman_level > hardcore_level:
        return False

    return True


def detect_uim_via_hiscores(username: str) -> bool:
    ultimate_level = _osrs_total_level("hiscore_oldschool_ultimate", username)
    if ultimate_level is None:
        return False

    ironman_level = _osrs_total_level("hiscore_oldschool_ironman", username)
    if ironman_level is not None and ironman_level > ultimate_level:
        return False

    return True


def fetch_raw_player(username: str, cache: Dict) -> Dict | None:
    key = username.lower()
    if key in cache and is_cache_valid(cache[key]):
        if "player_details" in cache[key] and "gains_3mo" in cache[key]:
            entry = cache[key]
            wom_type = entry["player_details"].get("type")
            dirty = False

            if wom_type == "regular" and "is_gim" not in entry:
                print(
                    f"  [{username}] Running GIM detection (cache hit, not yet checked)..."
                )
                is_gim = detect_gim_via_hiscores(username)
                entry["is_gim"] = is_gim
                dirty = True
                if is_gim:
                    print(
                        f"  [{username}] Detected as Group Ironman via OSRS hiscores."
                    )
            elif wom_type == "ultimate" and "is_uim" not in entry:
                print(
                    f"  [{username}] Running UIM verification (cache hit, not yet checked)..."
                )
                is_uim = detect_uim_via_hiscores(username)
                entry["is_uim"] = is_uim
                dirty = True
                if not is_uim:
                    print(
                        f"  [{username}] WOM type 'ultimate' overridden: ironman board level is higher -> treating as ironman."
                    )
            else:
                print(f"  [{username}] Loaded from cache.")

            if dirty:
                cache[key] = entry
                save_cache(cache)
            return entry

        print(f"  [{username}] Incomplete cache entry - refetching.")

    print(f"  [{username}] Fetching from WOM API...")

    player_details = fetch_player_details(username)
    if player_details is None:
        return None

    time.sleep(0.4)
    ehp_timeline = fetch_timeline(username, "ehp")
    time.sleep(0.4)
    ehb_timeline = fetch_timeline(username, "ehb")
    time.sleep(0.4)

    now = datetime.now(timezone.utc)
    start_date = now - relativedelta(months=SCORE_WINDOW_MONTHS)
    gains_3mo = fetch_gains(username, start_date, now)
    time.sleep(0.4)

    is_gim = False
    if player_details.get("type") == "regular":
        is_gim = detect_gim_via_hiscores(username)
        if is_gim:
            print(f"  [{username}] Detected as Group Ironman via OSRS hiscores.")

    is_hcim = False
    is_uim = False
    if player_details.get("type") == "ultimate":
        is_uim = detect_uim_via_hiscores(username)
        if not is_uim:
            print(
                f"  [{username}] WOM type 'ultimate' overridden: ironman board level is higher -> treating as ironman."
            )

    entry = {
        "timestamp": time.time(),
        "player_details": player_details,
        "ehp_timeline": ehp_timeline,
        "ehb_timeline": ehb_timeline,
        "gains_3mo": gains_3mo,
        "is_gim": is_gim,
        "is_hcim": is_hcim,
        "is_uim": is_uim,
    }
    cache[key] = entry
    save_cache(cache)
    return entry
