"""Benchmark Engine for AI Game Arena.

Performs:
1. Speed benchmark: Minimax vs Alpha-Beta at depths 1..5 (proving pruning correctness
   via score identity and computing node savings) + MCTS scaling (100, 300, 1000).
2. Tournament benchmark: Round-robin between Random, Minimax(d3), Alpha-Beta(d4), MCTS(300).
"""

import random
import time
from typing import Any, Dict, List

from app.ai import alphabeta_search, mcts_search, minimax_search, random_search
from app.db import save_benchmark
from app.game import Connect4


def run_speed_benchmark() -> Dict[str, Any]:
    """Execute Minimax vs Alpha-Beta speed benchmark and MCTS scaling test."""
    # Create fixed mid-game test board positions (standardized benchmark suite)
    test_positions = [
        [3, 3, 2, 4],            # Opening development
        [3, 2, 4, 3, 2, 1, 4],   # Midgame tactical cluster
    ]

    depth_results = []
    for d in range(1, 6):
        total_mini_nodes = 0
        total_mini_time = 0.0
        total_ab_nodes = 0
        total_ab_time = 0.0
        total_ab_pruned = 0
        scores_match = True

        for moves in test_positions:
            b1 = Connect4()
            player = 1
            for m in moves:
                b1.play(m, player)
                player = 2 if player == 1 else 1

            b2 = b1.copy()

            # Minimax run
            mini_res = minimax_search(b1, depth=d, me=player)
            total_mini_nodes += mini_res["stats"]["nodes"]
            total_mini_time += mini_res["stats"]["time_ms"]

            # Alpha-Beta run
            ab_res = alphabeta_search(b2, depth=d, me=player)
            total_ab_nodes += ab_res["stats"]["nodes"]
            total_ab_time += ab_res["stats"]["time_ms"]
            total_ab_pruned += ab_res["stats"]["pruned"]

            if mini_res["stats"]["best_score"] != ab_res["stats"]["best_score"]:
                scores_match = False

        avg_mini_time = round(total_mini_time / len(test_positions), 2)
        avg_ab_time = round(total_ab_time / len(test_positions), 2)
        savings_pct = (
            round((1.0 - (total_ab_nodes / total_mini_nodes)) * 100.0, 1)
            if total_mini_nodes > 0
            else 0.0
        )

        depth_results.append({
            "depth": d,
            "minimax": {
                "nodes": total_mini_nodes,
                "time_ms": avg_mini_time,
            },
            "alphabeta": {
                "nodes": total_ab_nodes,
                "pruned": total_ab_pruned,
                "time_ms": avg_ab_time,
            },
            "same_score": scores_match,
            "pruning_savings_pct": max(0.0, savings_pct),
        })

    # MCTS scaling test
    mcts_sim_levels = [100, 300, 1000]
    mcts_results = []
    test_board = Connect4()
    for m in [3, 3, 2, 4]:
        test_board.play(m, 1)

    for sims in mcts_sim_levels:
        res = mcts_search(test_board.copy(), simulations=sims, me=2)
        mcts_results.append({
            "simulations": sims,
            "time_ms": res["stats"]["time_ms"],
            "best_move": res["move"],
            "best_score": res["stats"]["best_score"],
        })

    result = {
        "depth_comparison": depth_results,
        "mcts_comparison": mcts_results,
    }

    save_benchmark("speed", result)
    return result


def _play_agent_move(
    board: Connect4,
    player: int,
    agent_id: str,
) -> Dict[str, Any]:
    """Helper to dispatch move for a tournament agent."""
    if agent_id == "Random":
        return random_search(board, me=player)
    elif agent_id == "Minimax(d3)":
        return minimax_search(board, depth=3, me=player)
    elif agent_id == "Alpha-Beta(d4)":
        return alphabeta_search(board, depth=4, me=player)
    elif agent_id == "MCTS(300)":
        return mcts_search(board, simulations=300, me=player)
    else:
        return random_search(board, me=player)


def run_tournament() -> Dict[str, Any]:
    """Execute round-robin tournament between 4 algorithms.

    Competitors:
    - Random
    - Minimax (depth 3)
    - Alpha-Beta (depth 4)
    - MCTS (300 simulations)

    Rules:
    - 2 games per pair, swapping starter (P1 vs P2, then P2 vs P1).
    - Seeded random opening (2 moves) so every game has variety.
    """
    agents = ["Random", "Minimax(d3)", "Alpha-Beta(d4)", "MCTS(300)"]

    stats = {
        name: {
            "name": name,
            "wins": 0,
            "losses": 0,
            "draws": 0,
            "total_games": 0,
            "total_nodes": 0,
            "total_time_ms": 0.0,
            "total_moves": 0,
        }
        for name in agents
    }

    match_history = []
    game_counter = 0

    # Generate pairs
    pairs = []
    for i in range(len(agents)):
        for j in range(i + 1, len(agents)):
            pairs.append((agents[i], agents[j]))

    for a1, a2 in pairs:
        # 2 games: Game A (a1 is P1, a2 is P2), Game B (a2 is P1, a1 is P2)
        matchups = [(a1, a2), (a2, a1)]

        for p1_name, p2_name in matchups:
            game_counter += 1
            board = Connect4()

            # Seeded 2-ply random opening
            rng = random.Random(game_counter * 101)
            op1 = rng.choice([2, 3, 4])
            op2 = rng.choice([2, 3, 4])
            board.play(op1, 1)
            board.play(op2, 2)
            moves_history = [op1, op2]

            current_player = 1
            winner = 0

            while not board.is_full() and winner == 0:
                agent_name = p1_name if current_player == 1 else p2_name
                move_res = _play_agent_move(board, current_player, agent_name)
                col = move_res["move"]

                if col not in board.legal_moves():
                    col = board.legal_moves()[0]

                r = board.play(col, current_player)
                moves_history.append(col)

                # Track metrics
                stats[agent_name]["total_nodes"] += move_res["stats"]["nodes"]
                stats[agent_name]["total_time_ms"] += move_res["stats"]["time_ms"]
                stats[agent_name]["total_moves"] += 1

                if board.wins_at(r, col, current_player):
                    winner = current_player
                    break

                current_player = 2 if current_player == 1 else 1

            # Update outcomes
            stats[p1_name]["total_games"] += 1
            stats[p2_name]["total_games"] += 1

            if winner == 1:
                stats[p1_name]["wins"] += 1
                stats[p2_name]["losses"] += 1
                winning_agent = p1_name
            elif winner == 2:
                stats[p2_name]["wins"] += 1
                stats[p1_name]["losses"] += 1
                winning_agent = p2_name
            else:
                stats[p1_name]["draws"] += 1
                stats[p2_name]["draws"] += 1
                winning_agent = "Draw"

            match_history.append({
                "game_num": game_counter,
                "player1": p1_name,
                "player2": p2_name,
                "winner": winning_agent,
                "moves_count": len(moves_history),
            })

    # Prepare leaderboard summary
    table = []
    for name in agents:
        st = stats[name]
        g = st["total_games"]
        m = st["total_moves"]
        win_rate = round((st["wins"] / g) * 100.0, 1) if g > 0 else 0.0
        avg_nodes = round(st["total_nodes"] / m, 1) if m > 0 else 0.0
        avg_time = round(st["total_time_ms"] / m, 2) if m > 0 else 0.0

        table.append({
            "agent": name,
            "wins": st["wins"],
            "losses": st["losses"],
            "draws": st["draws"],
            "total_games": g,
            "win_rate": win_rate,
            "avg_nodes_per_move": avg_nodes,
            "avg_time_ms_per_move": avg_time,
        })

    # Sort by wins descending, then win_rate descending
    table.sort(key=lambda x: (x["wins"], x["win_rate"]), reverse=True)

    result = {
        "leaderboard": table,
        "matches": match_history,
        "total_matches": len(match_history),
    }

    save_benchmark("tournament", result)
    return result
