/**
 * Client-side Connect-4 validation and win detection helpers.
 */

export const ROWS = 6;
export const COLS = 7;
export const CELLS = ROWS * COLS;

export function findLowestEmptyRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r * COLS + col] === 0) {
      return r;
    }
  }
  return -1;
}

export function isBoardFull(board) {
  for (let c = 0; c < COLS; c++) {
    if (board[c] === 0) return false;
  }
  return true;
}

export function getLegalMoves(board) {
  const legal = [];
  for (let c = 0; c < COLS; c++) {
    if (board[c] === 0) legal.push(c);
  }
  return legal;
}

export function checkWinAt(board, row, col, player) {
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [-1, 1],  // Diagonal /
  ];

  for (const [dr, dc] of directions) {
    const cells = [{ row, col }];

    // Forward
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === player) {
      cells.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // Backward
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === player) {
      cells.push({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (cells.length >= 4) {
      return { won: true, winningCells: cells };
    }
  }

  return { won: false, winningCells: [] };
}

export function checkEntireBoardWinner(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r * COLS + c];
      if (p !== 0) {
        const res = checkWinAt(board, r, c, p);
        if (res.won) {
          return { winner: p, winningCells: res.winningCells };
        }
      }
    }
  }
  return { winner: 0, winningCells: [] };
}
