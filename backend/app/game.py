"""Connect-4 Game Engine.

Board representation:
- 6 rows (0=top, 5=bottom), 7 columns (0..6).
- Flat list of 42 cells internally for speed: index = row * 7 + col.
- Values: 0 = empty, 1 = Player 1, 2 = Player 2.
"""

from typing import List, Optional, Tuple

ROWS = 6
COLS = 7
CELLS = ROWS * COLS
CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6]


def _build_windows() -> Tuple[Tuple[int, int, int, int], ...]:
    """Precompute all 69 windows of 4 cells as flat indices."""
    windows = []

    # 1. Horizontal windows (6 rows * 4 cols = 24 windows)
    for r in range(ROWS):
        for c in range(COLS - 3):
            windows.append((
                r * COLS + c,
                r * COLS + (c + 1),
                r * COLS + (c + 2),
                r * COLS + (c + 3)
            ))

    # 2. Vertical windows (3 rows * 7 cols = 21 windows)
    for r in range(ROWS - 3):
        for c in range(COLS):
            windows.append((
                r * COLS + c,
                (r + 1) * COLS + c,
                (r + 2) * COLS + c,
                (r + 3) * COLS + c
            ))

    # 3. Diagonal down-right (3 rows * 4 cols = 12 windows)
    for r in range(ROWS - 3):
        for c in range(COLS - 3):
            windows.append((
                r * COLS + c,
                (r + 1) * COLS + (c + 1),
                (r + 2) * COLS + (c + 2),
                (r + 3) * COLS + (c + 3)
            ))

    # 4. Diagonal up-right (3 rows * 4 cols = 12 windows)
    for r in range(3, ROWS):
        for c in range(COLS - 3):
            windows.append((
                r * COLS + c,
                (r - 1) * COLS + (c + 1),
                (r - 2) * COLS + (c + 2),
                (r - 3) * COLS + (c + 3)
            ))

    return tuple(windows)


# 69 windows precomputed once at import time
ALL_WINDOWS = _build_windows()
assert len(ALL_WINDOWS) == 69, f"Expected 69 windows, got {len(ALL_WINDOWS)}"


class Connect4:
    """Fast Connect-4 board using a flat list of 42 cells."""

    def __init__(self, board: Optional[List[int]] = None):
        if board is not None:
            if len(board) != CELLS:
                raise ValueError(f"Board must contain {CELLS} cells, got {len(board)}")
            self.board = list(board)
        else:
            self.board = [0] * CELLS

    def copy(self) -> "Connect4":
        """Return a deep copy of the board."""
        return Connect4(self.board)

    def legal_moves(self) -> List[int]:
        """Return available columns in center-first order: [3, 2, 4, 1, 5, 0, 6]."""
        return [c for c in CENTER_ORDER if self.board[c] == 0]

    def play(self, col: int, player: int) -> int:
        """Drop disc into column `col` for `player` (1 or 2).

        Returns row index (0..5) where disc landed.
        Raises ValueError if column is invalid or full.
        """
        if col < 0 or col >= COLS:
            raise ValueError(f"Column {col} out of bounds (0..6)")
        if self.board[col] != 0:
            raise ValueError(f"Column {col} is full")

        # Fall from bottom (row 5) up to row 0
        for r in range(ROWS - 1, -1, -1):
            idx = r * COLS + col
            if self.board[idx] == 0:
                self.board[idx] = player
                return r

        raise ValueError(f"Column {col} is full")

    def undo(self, col: int) -> int:
        """Remove topmost disc from column `col`.

        Returns row index of removed disc.
        Raises ValueError if column is already empty.
        """
        if col < 0 or col >= COLS:
            raise ValueError(f"Column {col} out of bounds (0..6)")

        for r in range(ROWS):
            idx = r * COLS + col
            if self.board[idx] != 0:
                self.board[idx] = 0
                return r

        raise ValueError(f"Column {col} is empty, cannot undo")

    def wins_at(self, row: int, col: int, player: int) -> bool:
        """Check if placing a disc at (row, col) for `player` results in a win."""
        b = self.board
        idx = row * COLS + col
        if b[idx] != player:
            return False

        # Directions: (d_row, d_col)
        directions = (
            (0, 1),   # Horizontal
            (1, 0),   # Vertical
            (1, 1),   # Diagonal down-right (\)
            (-1, 1),  # Diagonal up-right (/)
        )

        for dr, dc in directions:
            count = 1  # includes (row, col)

            # Positive direction
            r, c = row + dr, col + dc
            while 0 <= r < ROWS and 0 <= c < COLS and b[r * COLS + c] == player:
                count += 1
                r += dr
                c += dc

            # Negative direction
            r, c = row - dr, col - dc
            while 0 <= r < ROWS and 0 <= c < COLS and b[r * COLS + c] == player:
                count += 1
                r -= dr
                c -= dc

            if count >= 4:
                return True

        return False

    def is_full(self) -> bool:
        """Check if board is completely full (draw if no winner)."""
        return all(self.board[c] != 0 for c in range(COLS))

    def winner(self) -> int:
        """Check if there is a winner across the entire board.

        Returns 1 or 2 if a player has 4 in a row, or 0 if no winner.
        """
        b = self.board
        for w in ALL_WINDOWS:
            v0 = b[w[0]]
            if v0 != 0 and v0 == b[w[1]] == b[w[2]] == b[w[3]]:
                return v0
        return 0

    def get_winning_cells(self) -> Optional[Tuple[int, List[Tuple[int, int]]]]:
        """Return (winner, [(row, col), ...]) for winning 4-cell window, or None."""
        b = self.board
        for w in ALL_WINDOWS:
            v0 = b[w[0]]
            if v0 != 0 and v0 == b[w[1]] == b[w[2]] == b[w[3]]:
                coords = [(idx // COLS, idx % COLS) for idx in w]
                return (v0, coords)
        return None

    def validate_gravity_and_counts(self) -> None:
        """Validate board physics (no floating discs) and move counts.

        Raises ValueError with details if invalid.
        """
        validate_board(self.board)


def validate_board(board: List[int]) -> None:
    """Validate a Connect-4 board list.

    Checks:
    1. Exactly 42 elements.
    2. All elements are 0, 1, or 2.
    3. Gravity rule: no floating discs (no empty cell below a disc).
    4. Move count parity: |count(1) - count(2)| <= 1.
    """
    if len(board) != CELLS:
        raise ValueError(f"Invalid board size: expected {CELLS} cells, got {len(board)}")

    p1_count = 0
    p2_count = 0

    for r in range(ROWS):
        for c in range(COLS):
            val = board[r * COLS + c]
            if val not in (0, 1, 2):
                raise ValueError(f"Invalid cell value {val} at row {r}, col {c}. Expected 0, 1, or 2.")
            if val == 1:
                p1_count += 1
            elif val == 2:
                p2_count += 1

            # Gravity check: if this cell has a disc, all cells below it must also have discs
            if val != 0:
                for r_below in range(r + 1, ROWS):
                    if board[r_below * COLS + c] == 0:
                        raise ValueError(
                            f"Gravity violation at row {r}, col {c}: floating disc above empty cell at row {r_below}, col {c}"
                        )

    if abs(p1_count - p2_count) > 1:
        raise ValueError(
            f"Invalid piece count balance: Player 1 has {p1_count} discs, Player 2 has {p2_count} discs."
        )


def evaluate(board: List[int], me: int) -> int:
    """Heuristic evaluation function for non-terminal Connect-4 states.

    Syllabus Unit II Heuristic:
    - Scans all 69 windows of 4 cells.
    - Skips windows containing discs of both players.
    - Scoring rules:
        3 of mine + 1 empty = +5
        2 of mine + 2 empty = +2
        3 of opponent + 1 empty = -4
        plus +3 per disc in the centre column for me (and -3 for opponent discs in center).
    """
    opp = 2 if me == 1 else 1
    score = 0

    for idx0, idx1, idx2, idx3 in ALL_WINDOWS:
        v0 = board[idx0]
        v1 = board[idx1]
        v2 = board[idx2]
        v3 = board[idx3]

        # Fast counting
        me_count = (v0 == me) + (v1 == me) + (v2 == me) + (v3 == me)
        opp_count = (v0 == opp) + (v1 == opp) + (v2 == opp) + (v3 == opp)

        # Skip windows containing both players (cannot be completed by either)
        if me_count > 0 and opp_count > 0:
            continue

        empty_count = 4 - me_count - opp_count

        if me_count == 3 and empty_count == 1:
            score += 5
        elif me_count == 2 and empty_count == 2:
            score += 2
        elif opp_count == 3 and empty_count == 1:
            score -= 4

    # Center column evaluation (+3 per disc for me, -3 per disc for opponent)
    center_col = 3
    center_me = 0
    center_opp = 0
    for r in range(ROWS):
        val = board[r * COLS + center_col]
        if val == me:
            center_me += 1
        elif val == opp:
            center_opp += 1

    score += 3 * center_me - 3 * center_opp
    return score
