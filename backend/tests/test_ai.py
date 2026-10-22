import pytest
from app.game import Connect4
from app.ai import (
    minimax_search,
    alphabeta_search,
    mcts_search,
    random_search,
    get_ai_move,
    WIN_SCORE,
)


def test_ai_takes_immediate_win():
    """Verify AI takes an immediate win when available."""
    game = Connect4()
    # Player 1 has discs at cols 0, 1, 2 on row 5. Playing col 3 wins.
    game.play(0, 1)
    game.play(0, 2)
    game.play(1, 1)
    game.play(1, 2)
    game.play(2, 1)
    game.play(2, 2)
    # Player 1's turn to win: col 3
    res_ab = alphabeta_search(game, depth=2, me=1)
    assert res_ab["move"] == 3
    assert res_ab["stats"]["best_score"] >= WIN_SCORE

    res_mini = minimax_search(game, depth=2, me=1)
    assert res_mini["move"] == 3

    res_mcts = mcts_search(game, simulations=100, me=1)
    assert res_mcts["move"] == 3


def test_ai_blocks_immediate_loss():
    """Verify AI blocks opponent's immediate winning move."""
    game = Connect4()
    # Opponent (Player 2) has discs at cols 0, 1, 2 on row 5.
    # Player 1 must play col 3 to block!
    # Let's set up the board:
    # Row 5: P2 at col 0, 1, 2. P1 at col 4, 5, 6
    game.play(0, 2)
    game.play(4, 1)
    game.play(1, 2)
    game.play(5, 1)
    game.play(2, 2)
    # Player 1's turn now: if P1 doesn't play col 3, P2 will win next turn.
    res_ab = alphabeta_search(game, depth=3, me=1)
    assert res_ab["move"] == 3

    res_mini = minimax_search(game, depth=3, me=1)
    assert res_mini["move"] == 3


def test_minimax_and_alphabeta_same_best_score_and_fewer_nodes():
    """Verify Minimax and Alpha-Beta produce the same score while Alpha-Beta searches fewer nodes."""
    game = Connect4()
    # Play a few moves to create an interesting midgame position
    moves = [3, 3, 2, 4, 2, 1]
    p = 1
    for m in moves:
        game.play(m, p)
        p = 2 if p == 1 else 1

    depth = 3
    res_mini = minimax_search(game, depth=depth, me=p)
    res_ab = alphabeta_search(game, depth=depth, me=p)

    # Both must find the exact same minimax best score
    assert res_mini["stats"]["best_score"] == res_ab["stats"]["best_score"], (
        f"Minimax score {res_mini['stats']['best_score']} != AlphaBeta score {res_ab['stats']['best_score']}"
    )

    # Alpha-Beta must visit fewer or equal nodes and record pruned branches
    assert res_ab["stats"]["nodes"] < res_mini["stats"]["nodes"], (
        f"Expected AlphaBeta nodes ({res_ab['stats']['nodes']}) < Minimax nodes ({res_mini['stats']['nodes']})"
    )
    assert res_ab["stats"]["pruned"] > 0


def test_hard_alphabeta_speed():
    """Verify Hard Alpha-Beta (depth 6) runs quickly (under 3 seconds)."""
    import time
    game = Connect4()
    # Mid-game state
    for col in [3, 3, 2, 4, 1, 5]:
        game.play(col, 1)
    
    start = time.perf_counter()
    res = alphabeta_search(game, depth=6, me=2)
    duration = time.perf_counter() - start

    assert duration < 3.0, f"Hard Alpha-Beta took {duration:.2f}s, exceeding 3s limit!"
    assert res["move"] in game.legal_moves()


def test_mcts_returns_valid_structure():
    """Verify MCTS returns valid move, visit metrics, and 2-ply tree."""
    game = Connect4()
    res = mcts_search(game, simulations=50, me=1)
    assert res["algorithm"] == "mcts"
    assert res["move"] in [0, 1, 2, 3, 4, 5, 6]
    assert len(res["columns"]) == 7
    assert res["tree"]["children"] is not None
    assert res["stats"]["simulations"] == 50


def test_unified_dispatcher():
    """Verify get_ai_move dispatcher works for all algorithms and difficulties."""
    game = Connect4()
    for algo in ["minimax", "alphabeta", "mcts", "random"]:
        for diff in ["beginner", "easy"]:
            res = get_ai_move(game, player=1, algorithm=algo, difficulty=diff)
            assert res["move"] in range(7)
            assert res["algorithm"] == algo
            assert len(res["columns"]) == 7
            assert "stats" in res
            assert "tree" in res
