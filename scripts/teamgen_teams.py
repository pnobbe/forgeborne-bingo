from typing import Dict, List, Tuple

from teamgen_config import SKILLING_DIVISOR


def calculate_rating(player: Dict) -> float:
    ehb_score = player["ehb_gained"] + player["ehb_lifetime_bonus"]
    ehp_score = (player["ehp_gained"] + player["ehp_lifetime_bonus"]) / SKILLING_DIVISOR
    return ehb_score + ehp_score


def prepare_players_with_ratings(players: List[Dict]) -> List[Dict]:
    for player in players:
        player["rating_total"] = calculate_rating(player)
    players.sort(key=lambda player: player["rating_total"], reverse=True)
    return players


def team_total(team: List[Dict]) -> float:
    return sum(player["rating_total"] for player in team)


def team_balance_objective(team_totals: List[float]) -> Tuple[float, float, float]:
    if not team_totals:
        return (0.0, 0.0, 0.0)

    average_total = sum(team_totals) / len(team_totals)
    spread = max(team_totals) - min(team_totals)
    variance = sum((total - average_total) ** 2 for total in team_totals)
    max_total = max(team_totals)
    return (spread, variance, max_total)


def objective_is_better(
    candidate: Tuple[float, float, float],
    current: Tuple[float, float, float],
    epsilon: float = 1e-9,
) -> bool:
    for candidate_value, current_value in zip(candidate, current):
        if candidate_value < current_value - epsilon:
            return True
        if candidate_value > current_value + epsilon:
            return False
    return False


def optimize_team_swaps(teams: List[List[Dict]]) -> List[List[Dict]]:
    if len(teams) < 2:
        return teams

    team_totals = [team_total(team) for team in teams]
    epsilon = 1e-9

    while True:
        best_swap = None
        best_objective = team_balance_objective(team_totals)

        for team_a_idx in range(len(teams)):
            team_a_total = team_totals[team_a_idx]
            for team_b_idx in range(team_a_idx + 1, len(teams)):
                team_b_total = team_totals[team_b_idx]

                for player_a_idx, player_a in enumerate(teams[team_a_idx]):
                    player_a_rating = player_a["rating_total"]
                    for player_b_idx, player_b in enumerate(teams[team_b_idx]):
                        player_b_rating = player_b["rating_total"]

                        candidate_totals = list(team_totals)
                        candidate_totals[team_a_idx] = (
                            team_a_total - player_a_rating + player_b_rating
                        )
                        candidate_totals[team_b_idx] = (
                            team_b_total - player_b_rating + player_a_rating
                        )
                        candidate_objective = team_balance_objective(candidate_totals)

                        if objective_is_better(
                            candidate_objective, best_objective, epsilon=epsilon
                        ):
                            best_objective = candidate_objective
                            best_swap = (
                                team_a_idx,
                                player_a_idx,
                                team_b_idx,
                                player_b_idx,
                                candidate_totals,
                            )

        if best_swap is None:
            return teams

        team_a_idx, player_a_idx, team_b_idx, player_b_idx, candidate_totals = best_swap
        teams[team_a_idx][player_a_idx], teams[team_b_idx][player_b_idx] = (
            teams[team_b_idx][player_b_idx],
            teams[team_a_idx][player_a_idx],
        )
        team_totals = candidate_totals


def generate_teams(players: List[Dict], team_size: int = 8) -> List[List[Dict]]:
    if not players:
        return []
    if team_size < 1:
        raise ValueError("team_size must be at least 1")

    rated_players = prepare_players_with_ratings(list(players))
    player_count = len(rated_players)
    team_count = max(1, player_count // team_size)
    base_size = player_count // team_count

    teams: List[List[Dict]] = [[] for _ in range(team_count)]

    main_pool = rated_players[: team_count * base_size]
    forward = list(range(team_count))
    backward = list(reversed(forward))
    snake: List[int] = []
    round_idx = 0
    while len(snake) < len(main_pool):
        snake.extend(forward if round_idx % 2 == 0 else backward)
        round_idx += 1
    snake = snake[: len(main_pool)]

    for player, team_idx in zip(main_pool, snake):
        teams[team_idx].append(player)

    extra_pool = rated_players[team_count * base_size :]
    for player in extra_pool:
        lightest_idx = min(range(team_count), key=lambda idx: team_total(teams[idx]))
        teams[lightest_idx].append(player)

    return optimize_team_swaps(teams)
