from datetime import datetime, timezone
from typing import Dict, List, Tuple

from dateutil.parser import isoparse
from dateutil.relativedelta import relativedelta

from teamgen_config import (
    LIFETIME_DIVISOR,
    NON_COMBAT_XP_INCLUDED_SKILLS,
    SCORE_WINDOW_MONTHS,
)


def gain_over_months(timeline: List[Dict], months: int) -> float:
    if not timeline:
        return 0.0

    points: List[Tuple[datetime, float]] = []
    for point in timeline:
        try:
            points.append((isoparse(point["date"]), float(point["value"])))
        except (KeyError, TypeError, ValueError):
            continue

    if len(points) < 2:
        return 0.0

    points.sort(key=lambda entry: entry[0])
    cutoff = datetime.now(timezone.utc) - relativedelta(months=months)
    window = [(date, value) for date, value in points if date >= cutoff]

    if len(window) < 2:
        return 0.0

    return max(0.0, window[-1][1] - window[0][1])


def calculate_lifetime_bonus(lifetime_value: float, divisor: float) -> float:
    return lifetime_value / divisor


def extract_non_combat_xp_progress(entry: Dict) -> Dict:
    gains = entry.get("gains_event") or {}
    gains_data = gains.get("data") or {}
    skills_data = gains_data.get("skills") or {}

    tracked_skills = []
    total_xp = 0
    included_skills = set(NON_COMBAT_XP_INCLUDED_SKILLS)

    for skill_key in NON_COMBAT_XP_INCLUDED_SKILLS:
        skill = skills_data.get(skill_key) or {}
        xp_gained = int((skill.get("experience") or {}).get("gained", 0) or 0)
        tracked_skills.append(
            {
                "name": skill_key.replace("_", " ").title(),
                "key": skill_key,
                "xp": xp_gained,
            }
        )
        total_xp += xp_gained

    tracked_skills.sort(key=lambda skill: (-skill["xp"], skill["name"]))

    return {
        "total_xp": total_xp,
        "included_skill_count": len(included_skills),
        "skills": tracked_skills,
    }


def extract_player_stats(entry: Dict, username: str) -> Dict:
    details = entry["player_details"]
    username = username.strip()

    ehp = float(details.get("ehp", 0.0))
    ehb = float(details.get("ehb", 0.0))
    player_type = details.get("type", "unknown") or "unknown"

    if player_type == "regular":
        player_type = "group_ironman"
        if not entry.get("is_gim"):
            print(
                f"  [{username}] Force-upgraded: WOM type 'regular' -> 'group_ironman' (ironman-only clan)."
            )

    if player_type == "hardcore":
        player_type = "hardcore_ironman"

    if player_type == "ultimate":
        if entry.get("is_uim") is False:
            player_type = "ironman"
        else:
            player_type = "ultimate_ironman"

    snapshot = details.get("latestSnapshot") or {}
    snapshot_data = snapshot.get("data") or {}
    total_level = int(
        (snapshot_data.get("skills", {}).get("overall") or {}).get("level", 0)
    )

    gains = entry.get("gains_3mo") or {}
    gains_data = gains.get("data") or {}
    computed_ehb = (
        (gains_data.get("computed") or {}).get("ehb", {}).get("value", {}).get("gained")
    )
    if computed_ehb is not None:
        ehb_gained = max(0.0, float(computed_ehb))
    else:
        ehb_gained = gain_over_months(
            entry.get("ehb_timeline", []), SCORE_WINDOW_MONTHS
        )

    ehp_gained = gain_over_months(entry.get("ehp_timeline", []), SCORE_WINDOW_MONTHS)

    bosses = []
    for boss_key, boss in (gains_data.get("bosses") or {}).items():
        kills_gained = (boss.get("kills") or {}).get("gained", 0) or 0
        ehb_gained_boss = float((boss.get("ehb") or {}).get("gained", 0) or 0)
        if kills_gained > 0 and ehb_gained_boss > 0.0:
            bosses.append(
                {
                    "name": boss_key.replace("_", " ").title(),
                    "key": boss_key,
                    "kills": kills_gained,
                    "ehb": round(ehb_gained_boss, 4),
                }
            )
    bosses.sort(key=lambda boss: boss["ehb"], reverse=True)

    skills = []
    for skill_key, skill in (gains_data.get("skills") or {}).items():
        if skill_key == "overall":
            continue
        ehp_gained_skill = float((skill.get("ehp") or {}).get("gained", 0) or 0)
        xp_gained = int((skill.get("experience") or {}).get("gained", 0) or 0)
        if ehp_gained_skill > 0.0:
            skills.append(
                {
                    "name": skill_key.replace("_", " ").title(),
                    "key": skill_key,
                    "xp": xp_gained,
                    "ehp": round(ehp_gained_skill, 4),
                }
            )
    skills.sort(key=lambda skill: skill["ehp"], reverse=True)

    lifetime_bosses = []
    for boss_key, boss in (snapshot_data.get("bosses") or {}).items():
        kills_all = int(boss.get("kills", 0) or 0)
        ehb_all = float(boss.get("ehb", 0) or 0)
        if kills_all > 0 and ehb_all > 0.0:
            lifetime_bosses.append(
                {
                    "name": boss_key.replace("_", " ").title(),
                    "key": boss_key,
                    "kills": kills_all,
                    "ehb": round(ehb_all, 4),
                }
            )
    lifetime_bosses.sort(key=lambda boss: boss["ehb"], reverse=True)

    lifetime_skills = []
    for skill_key, skill in (snapshot_data.get("skills") or {}).items():
        if skill_key == "overall":
            continue
        ehp_all = float(skill.get("ehp", 0) or 0)
        xp_all = int(skill.get("experience", 0) or 0)
        if ehp_all > 0.0:
            lifetime_skills.append(
                {
                    "name": skill_key.replace("_", " ").title(),
                    "key": skill_key,
                    "xp": xp_all,
                    "ehp": round(ehp_all, 4),
                }
            )
    lifetime_skills.sort(key=lambda skill: skill["ehp"], reverse=True)

    non_combat_xp_progress = extract_non_combat_xp_progress(entry)

    return {
        "username": username,
        "player_type": player_type,
        "ehp": ehp,
        "ehb": ehb,
        "total_level": total_level,
        "ehb_gained": ehb_gained,
        "ehp_gained": ehp_gained,
        "bosses": bosses,
        "skills": skills,
        "lifetime_bosses": lifetime_bosses,
        "lifetime_skills": lifetime_skills,
        "non_combat_xp_progress": non_combat_xp_progress,
    }


def average_rank(values: List[float]) -> List[float]:
    count = len(values)
    if count == 0:
        return []

    indexed = sorted(enumerate(values), key=lambda item: item[1], reverse=True)
    ranks = [0.0] * count
    index = 0
    while index < count:
        tied = index
        while tied < count - 1 and indexed[tied + 1][1] == indexed[index][1]:
            tied += 1
        average = (index + 1 + tied + 1) / 2.0
        for tied_index in range(index, tied + 1):
            ranks[indexed[tied_index][0]] = average
        index = tied + 1
    return ranks


def assign_ranks(players: List[Dict]) -> List[Dict]:
    count = len(players)
    if count == 0:
        return players

    ehp_ranks = average_rank([player["ehp"] for player in players])
    ehb_ranks = average_rank([player["ehb"] for player in players])

    for player, ehp_rank, ehb_rank in zip(players, ehp_ranks, ehb_ranks):
        player["ehp_rank"] = ehp_rank
        player["ehb_rank"] = ehb_rank

    for player in players:
        player["ehb_lifetime_bonus"] = calculate_lifetime_bonus(
            player["ehb"], LIFETIME_DIVISOR
        )
        player["ehp_lifetime_bonus"] = calculate_lifetime_bonus(
            player["ehp"], LIFETIME_DIVISOR
        )

    combined = [player["ehp_rank"] + player["ehb_rank"] for player in players]
    order = sorted(
        range(count), key=lambda idx: (combined[idx], -players[idx]["total_level"])
    )
    overall_ranks = [0] * count
    for rank, idx in enumerate(order, start=1):
        overall_ranks[idx] = rank

    for player, overall_rank in zip(players, overall_ranks):
        player["overall_rank"] = overall_rank

    return players
