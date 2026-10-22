import pytest
from app.game import Connect4, validate_board, evaluate, ALL_WINDOWS


def test_window_count():
    """Verify there are exactly 69 windows of length 4."""
    assert len(ALL_WINDOWS) == 69


def test_horizontal_win():
    """Verify win detection horizontally."""
    game = Connect4()
    # Row 5 (bottom row), cols 0, 1, 2, 3
    for c in range(3):
        r = game.play(c, 1)
        assert not game.wins_at(r, c, 1)
    r = game.play(3, 1)
    assert game.wins_at(r, 3, 1)
    assert game.winner() == 1


def test_vertical_win():
    """Verify win detection vertically."""
    game = Connect4()
    # Column 2, rows 5, 4, 3, 2
    for _ in range(3):
        r = game.play(2, 2)
        assert not game.wins_at(r, 2, 2)
    r = game.play(2, 2)
    assert game.wins_at(r, 2, 2)
    assert game.winner() == 2


def test_diagonal_down_right_win():
    """Verify win detection diagonal down-right."""
    game = Connect4()
    # Build diagonal: (2,0), (3,1), (4,2), (5,3)
    # Bottom row is 5:
    # col 0 needs 4 discs to reach row 2 (5,4,3,2)
    # col 1 needs 3 discs to reach row 3 (5,4,3)
    # col 2 needs 2 discs to reach row 4 (5,4)
    # col 3 needs 1 disc to reach row 5 (5)
    moves = [
        (0, 2), (0, 2), (0, 2), (0, 1), # col 0: rows 5,4,3 (P2), row 2 (P1)
        (1, 2), (1, 2), (1, 1),         # col 1: rows 5,4 (P2), row 3 (P1)
        (2, 2), (2, 1),                 # col 2: row 5 (P2), row 4 (P1)
        (3, 1),                         # col 3: row 5 (P1)
    ]
    for col, player in moves:
        r = game.play(col, player)

    assert game.wins_at(r, 3, 1)
    assert game.winner() == 1


def test_diagonal_up_right_win():
    """Verify win detection diagonal up-right."""
    game = Connect4()
    # Diagonal: (5,0), (4,1), (3,2), (2,3)
    # col 0: row 5 (P1)
    # col 1: row 5 (P2), row 4 (P1)
    # col 2: row 5,4 (P2), row 3 (P1)
    # col 3: row 5,4,3 (P2), row 2 (P1)
    moves = [
        (0, 1),
        (1, 2), (1, 1),
        (2, 2), (2, 2), (2, 1),
        (3, 2), (3, 2), (3, 2), (3, 1)
    ]
    for col, player in moves:
        r = game.play(col, player)

    assert game.wins_at(r, 3, 1)
    assert game.winner() == 1


def test_gravity_validation():
    """Verify gravity validation catches floating discs."""
    # Valid empty board
    validate_board([0] * 42)

    # Valid board with 1 disc at bottom
    b = [0] * 42
    b[5 * 7 + 3] = 1
    validate_board(b)

    # Floating disc at row 4, col 3 with row 5 empty
    b_floating = [0] * 42
    b_floating[4 * 7 + 3] = 1
    with pytest.raises(ValueError, match="floating disc"):
        validate_board(b_floating)


def test_play_and_undo():
    """Verify play and undo cleanly restores state."""
    game = Connect4()
    r = game.play(3, 1)
    assert r == 5
    assert game.board[5 * 7 + 3] == 1

    r2 = game.play(3, 2)
    assert r2 == 4
    assert game.board[4 * 7 + 3] == 2

    undone_r2 = game.undo(3)
    assert undone_r2 == 4
    assert game.board[4 * 7 + 3] == 0

    undone_r = game.undo(3)
    assert undone_r == 5
    assert game.board[5 * 7 + 3] == 0
    assert game.board == [0] * 42


def test_heuristic_evaluate():
    """Verify heuristic evaluation rules."""
    game = Connect4()
    # Center column gives +3 for me
    game.play(3, 1)
    score = evaluate(game.board, me=1)
    assert score >= 3  # center col bonus + possible 2-empty windows
