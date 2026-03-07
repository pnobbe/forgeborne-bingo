import argparse
import requests
import json
import os
import time
from datetime import datetime, timezone
from urllib.parse import quote
from dateutil.parser import isoparse
from dateutil.relativedelta import relativedelta
from typing import List, Dict

# Configuration
CACHE_FILE = 'cache.json'
CACHE_EXPIRY = 3600  # 1 hour in seconds
WOM_API_BASE = 'https://api.wiseoldman.net/v2'
REQUEST_TIMEOUT = 30

# Weighting Configuration
# Players gain weight points based on their Effective Hours Played (EHP) and Bossed (EHB).
EHP_MULTIPLIER = 1.0
EHB_MULTIPLIER = 5.0

# Time Decay Bonus Config
# We measure 6 months, index 0 is the most recent month (0-1 month ago), index 5 is 5-6 months ago.
# These multipliers are applied directly from most recent to oldest month.
DECAY_MULTIPLIERS = [10.0, 8.2, 6.4, 4.6, 2.8, 1.0]


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments for the team generator."""
    parser = argparse.ArgumentParser(description="Generate balanced OSRS bingo teams.")
    parser.add_argument(
        "--participants",
        default=None,
        help="Path to the participants text file. Defaults to @participants.txt, then participants.txt.",
    )
    parser.add_argument(
        "--team-size",
        type=int,
        default=4,
        help="Maximum number of players per team.",
    )
    parser.add_argument(
        "--output",
        default="teams_output.md",
        help="Path to the Markdown output file.",
    )
    parser.add_argument(
        "--json-output",
        default="docs/data/teams.json",
        help="Path to the JSON output file used by the static site.",
    )
    return parser.parse_args()


def resolve_participants_file(explicit_path: str | None) -> str | None:
    """Resolves the participants file path from CLI input or default filenames."""
    if explicit_path:
        return explicit_path if os.path.exists(explicit_path) else None

    for path in ('@participants.txt', 'participants.txt'):
        if os.path.exists(path):
            return path

    return None

def load_cache() -> Dict:
    """Loads the JSON cache from disk if it exists."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def save_cache(cache: Dict):
    """Saves the JSON cache to disk."""
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, indent=4)

def get_timeline_gains(username: str, metric: str) -> List[Dict]:
    """Fetches a 10-month timeline for a valid WOM metric."""
    encoded_username = quote(username, safe='')
    url = f"{WOM_API_BASE}/players/{encoded_username}/snapshots/timeline?metric={metric}&period=year"
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"[{username}] Error fetching timeline for {metric}: {e}")
    return []

def calculate_time_decay_bonus(timeline: List[Dict]) -> float:
    """
    Given a list of snapshots (ascending date order naturally from the API),
    calculate the value gained in each of the last 6 months, and apply
    the decay multipliers. Returns the total bonus points to add.
    """
    if not timeline or len(timeline) < 2:
        return 0.0

    timeline_points = []
    for point in timeline:
        try:
            timeline_points.append((isoparse(point['date']), float(point['value'])))
        except (KeyError, TypeError, ValueError):
            continue

    if len(timeline_points) < 2:
        return 0.0

    timeline_points.sort(key=lambda x: x[0])

    # We want to break the dataset into 6 1-month intervals, looking backwards from now.
    now = datetime.now(timezone.utc)
    total_bonus = 0.0
    
    for i in range(6):
        # Time window for this month
        start_date = now - relativedelta(months=i + 1)
        end_date = now - relativedelta(months=i)
        multiplier = DECAY_MULTIPLIERS[i]

        # Find points within this window
        window_points = [value for point_date, value in timeline_points if start_date <= point_date < end_date]
        
        # If we have at least 2 points in this window (or we can just take the min and max in the window)
        if window_points:
            # gain in this window
            start_val = window_points[0]
            end_val = window_points[-1]
            gain = max(0, end_val - start_val)
            
            # Apply multiplier (Note: since we are giving this as a *bonus*, we apply multiplier - 1.0)
            # A 1.5 multiplier means we award the base value plus an extra 50% bonus.
            # We only return the bonus portion.
            bonus = gain * (multiplier - 1.0)
            total_bonus += bonus

    return total_bonus


def fetch_player_data(username: str, cache: Dict) -> Dict:
    """
    Fetches player data from the Wise Old Man API.
    Checks cache first to avoid rate limiting or spamming the API.
    """
    current_time = time.time()
    
    # Check cache
    if username in cache:
        cached_data = cache[username]
        if current_time - cached_data.get('timestamp', 0) < CACHE_EXPIRY:
            print(f"[{username}] Loaded from cache.")
            return cached_data['data']

    # Fetch from API
    print(f"[{username}] Fetching from API...")
    encoded_username = quote(username, safe='')
    url = f"{WOM_API_BASE}/players/{encoded_username}"
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            
            # Extract EHP and EHB directly from the top-level player data
            ehp = data.get('ehp', 0.0)
            ehb = data.get('ehb', 0.0)
            
            # Fetch timelines for the recent gains bonus
            time.sleep(0.5)
            ehp_timeline = get_timeline_gains(username, "ehp")
            time.sleep(0.5)
            ehb_timeline = get_timeline_gains(username, "ehb")
            
            ehp_bonus = calculate_time_decay_bonus(ehp_timeline)
            ehb_bonus = calculate_time_decay_bonus(ehb_timeline)
            
            extracted_data = {
                'username': username,
                'ehp': ehp,
                'ehb': ehb,
                'ehp_bonus': ehp_bonus,
                'ehb_bonus': ehb_bonus
            }
            
            # Update cache
            cache[username] = {
                'timestamp': current_time,
                'data': extracted_data
            }
            save_cache(cache)
            time.sleep(0.5) # Be kind to the API
            return extracted_data
        elif response.status_code == 404:
            print(f"[{username}] Player not found on WOM.")
        else:
            print(f"[{username}] API Error: {response.status_code}")
    except Exception as e:
        print(f"[{username}] Exception during fetch: {e}")
        
    return {
        'username': username,
        'ehp': 0.0,
        'ehb': 0.0,
        'ehp_bonus': 0.0,
        'ehb_bonus': 0.0
    }

def get_participants(participants_path: str) -> List[str]:
    """Reads line-separated usernames from a text file."""
    try:
        with open(participants_path, 'r', encoding='utf-8') as participants_file:
            participants = [line.strip() for line in participants_file if line.strip()]
        return participants
    except Exception as e:
        print(f"Error reading participants file: {e}")
        return []

def calculate_weight(player_data: Dict) -> Dict[str, float]:
    """
    Calculates weight metrics for a player based on EHP, EHB, and recent time-decayed gains.
    using the multipliers configured at the top of the file.
    Returns a dictionary with the breakdown.
    """
    ehp_base = player_data['ehp'] * EHP_MULTIPLIER
    ehb_base = player_data['ehb'] * EHB_MULTIPLIER
    
    ehp_bonus_weighted = player_data.get('ehp_bonus', 0.0) * EHP_MULTIPLIER
    ehb_bonus_weighted = player_data.get('ehb_bonus', 0.0) * EHB_MULTIPLIER
    
    total_bonus = ehp_bonus_weighted + ehb_bonus_weighted
    total_weight = ehp_base + ehb_base + total_bonus
    
    return {
        'total': total_weight,
        'ehp_points': ehp_base,
        'ehb_points': ehb_base,
        'bonus_points': total_bonus
    }


def prepare_players_with_weights(players: List[Dict]) -> List[Dict]:
    """Returns a weighted copy of the player list sorted by total weight descending."""
    weighted_players = []

    for player in players:
        weighted_player = dict(player)
        weights = calculate_weight(weighted_player)
        weighted_player['weight_total'] = weights['total']
        weighted_player['weight_ehp'] = weights['ehp_points']
        weighted_player['weight_ehb'] = weights['ehb_points']
        weighted_player['weight_bonus'] = weights['bonus_points']
        weighted_players.append(weighted_player)

    weighted_players.sort(key=lambda player: player['weight_total'], reverse=True)
    return weighted_players


def generate_teams(players: List[Dict], team_size: int = 4) -> List[List[Dict]]:
    """
    Distributes players into teams with a greedy balancing algorithm.

    Players are sorted by total weight descending, then each player is placed on
    the currently lightest team that still has room.
    """
    if not players:
        return []

    if team_size < 1:
        raise ValueError("team_size must be at least 1")

    weighted_players = prepare_players_with_weights(players)
    
    num_teams = max(1, (len(weighted_players) + team_size - 1) // team_size)

    # Initialize empty teams
    teams = [[] for _ in range(num_teams)]
    team_weights = [0.0] * num_teams

    # Assign players greedy-style, but enforce team size
    for player in weighted_players:
        # Find the team with the lowest current weight that IS NOT FULL
        eligible_teams = [(idx, weight) for idx, weight in enumerate(team_weights) if len(teams[idx]) < team_size]
        
        # If no eligible teams, all teams are full and the team count is too low.
        if not eligible_teams:
            raise RuntimeError("Not enough teams were created to place every player.")
        else:
            # Find the index of the eligible team with the minimum weight
            min_weight_team_idx = min(eligible_teams, key=lambda x: x[1])[0]
        
        # Assign player to that team
        teams[min_weight_team_idx].append(player)
        team_weights[min_weight_team_idx] += player['weight_total']

    return teams


def print_teams(teams: List[List[Dict]]):
    """Prints the generated teams to stdout."""
    print("\n--- Final Teams ---")
    for index, team in enumerate(teams, start=1):
        team_weight = sum(player['weight_total'] for player in team)
        print(f"\nTeam {index} (Total Weight: {team_weight:.2f})")
        for player in team:
            print(
                f"  - {player['username']:<15} | EHP: {player['ehp']:>8.2f} | "
                f"EHB: {player['ehb']:>8.2f} | Bonus Pts: {player['weight_bonus']:>6.2f} | "
                f"Total Weight: {player['weight_total']:>6.2f}"
            )


def write_markdown_output(output_path: str, teams: List[List[Dict]]):
    """Writes the generated teams and weighting rules to a Markdown file."""
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as md_file:
        md_file.write("# OSRS Bingo Teams\n\n")
        md_file.write("## Base Weighting Rules\n")
        md_file.write(f"- 1 base point per **{EHP_MULTIPLIER} EHP**\n")
        md_file.write(f"- {EHB_MULTIPLIER} base points per **1 EHB**\n\n")
        md_file.write("## Time-Decay Bonus Rules\n")
        md_file.write(
            "Recent EHP and EHB gains receive extra bonus weight. "
            "More recent gains receive higher multipliers.\n"
        )
        for month_index, multiplier in enumerate(DECAY_MULTIPLIERS):
            md_file.write(f"- {month_index}-{month_index + 1} months ago: **{multiplier:.1f}x multiplier**\n")
        md_file.write("\n")

        md_file.write('<div style="display: flex; flex-wrap: wrap; gap: 20px;">\n')

        for index, team in enumerate(teams, start=1):
            team_weight = sum(player['weight_total'] for player in team)

            md_file.write('<div style="flex: 1 1 45%; min-width: 400px; margin-bottom: 20px;">\n')
            md_file.write(f"  <h3>Team {index} (Total Weight: {team_weight:.2f})</h3>\n")
            md_file.write('  <table style="width: 100%; border-collapse: collapse;">\n')
            md_file.write('    <thead>\n')
            md_file.write('      <tr>\n')
            md_file.write('        <th style="text-align: left; padding: 4px; border-bottom: 1px solid #ccc;">Player</th>\n')
            md_file.write('        <th style="text-align: right; padding: 4px; border-bottom: 1px solid #ccc;">Base Pts</th>\n')
            md_file.write('        <th style="text-align: right; padding: 4px; border-bottom: 1px solid #ccc;">Bonus Pts</th>\n')
            md_file.write('        <th style="text-align: right; padding: 4px; border-bottom: 1px solid #ccc;">Total Weight</th>\n')
            md_file.write('      </tr>\n')
            md_file.write('    </thead>\n')
            md_file.write('    <tbody>\n')

            for player in team:
                base_points = player['weight_ehp'] + player['weight_ehb']
                md_file.write('      <tr>\n')
                md_file.write(f'        <td style="padding: 4px; border-bottom: 1px solid #eee;">{player["username"]}</td>\n')
                md_file.write(f'        <td style="text-align: right; padding: 4px; border-bottom: 1px solid #eee;">{base_points:.2f}</td>\n')
                md_file.write(f'        <td style="text-align: right; padding: 4px; border-bottom: 1px solid #eee;">{player["weight_bonus"]:.2f}</td>\n')
                md_file.write(f'        <td style="text-align: right; padding: 4px; border-bottom: 1px solid #eee; font-weight: bold;">{player["weight_total"]:.2f}</td>\n')
                md_file.write('      </tr>\n')

            md_file.write('    </tbody>\n')
            md_file.write('  </table>\n')
            md_file.write('</div>\n')

        md_file.write('</div>\n')


def write_json_output(output_path: str, teams: List[List[Dict]], team_size: int, participants_file: str):
    """Writes a JSON payload for the static site."""
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    payload = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'participants_file': participants_file,
        'team_size': team_size,
        'weighting': {
            'ehp_multiplier': EHP_MULTIPLIER,
            'ehb_multiplier': EHB_MULTIPLIER,
            'decay_multipliers': DECAY_MULTIPLIERS,
        },
        'summary': {
            'team_count': len(teams),
            'participant_count': sum(len(team) for team in teams),
            'weight_min': min((sum(player['weight_total'] for player in team) for team in teams), default=0.0),
            'weight_max': max((sum(player['weight_total'] for player in team) for team in teams), default=0.0),
        },
        'teams': [],
    }

    for index, team in enumerate(teams, start=1):
        team_weight = sum(player['weight_total'] for player in team)
        payload['teams'].append({
            'name': f'Team {index}',
            'total_weight': round(team_weight, 2),
            'player_count': len(team),
            'players': [
                {
                    'username': player['username'],
                    'ehp': round(player['ehp'], 2),
                    'ehb': round(player['ehb'], 2),
                    'base_points': round(player['weight_ehp'] + player['weight_ehb'], 2),
                    'bonus_points': round(player['weight_bonus'], 2),
                    'total_weight': round(player['weight_total'], 2),
                }
                for player in team
            ],
        })

    with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump(payload, json_file, indent=2)

def main():
    args = parse_args()

    participants_file = resolve_participants_file(args.participants)
    if participants_file is None:
        if args.participants:
            print(f"Error: Could not find participants file: {args.participants}")
        else:
            print("Error: Could not find @participants.txt or participants.txt in the current directory.")
        return

    print("Reading participants...")
    participants = get_participants(participants_file)
    print(f"Found {len(participants)} participants.")

    if not participants:
        print("No participants found. Nothing to do.")
        return

    cache = load_cache()
    
    player_stats = []
    print("\nFetching player data...")
    for idx, participant in enumerate(participants, start=1):
        print(f"Progress: {idx}/{len(participants)}")
        stats = fetch_player_data(participant, cache)
        player_stats.append(stats)

    print("\nGenerating teams...")
    teams = generate_teams(player_stats, team_size=args.team_size)

    print_teams(teams)
    write_markdown_output(args.output, teams)
    write_json_output(args.json_output, teams, args.team_size, participants_file)
    print(f"\nTeams exported to {args.output}")
    print(f"Site data exported to {args.json_output}")

if __name__ == '__main__':
    main()
