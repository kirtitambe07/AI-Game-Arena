import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';
import { COLS, ROWS, findLowestEmptyRow } from '../utils/gameLogic';

export default function Board({
  board,
  onColumnClick,
  disabled,
  winningCells = [],
  lastMove = null,
  showScoresOverlay = false,
  columnScores = [],
  activePlayer = 1,
  player1Name = 'Player 1',
  player2Name = 'AI Agent',
}) {
  const [hoveredCol, setHoveredCol] = useState(null);

  // Check if a cell is part of winning four
  const isWinningCell = (r, c) => {
    return winningCells.some((cell) => cell.row === r && cell.col === c);
  };

  // Launch confetti when winning cells appear
  useEffect(() => {
    if (winningCells && winningCells.length >= 4) {
      sound.playWin();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#00f0ff', '#ff7043', '#fbbf24', '#10b981', '#a855f7'],
      });
    }
  }, [winningCells]);

  const handleColClick = (col) => {
    if (disabled) return;
    const lowestRow = findLowestEmptyRow(board, col);
    if (lowestRow === -1) return;

    sound.playDrop(1.0 + (5 - lowestRow) * 0.08);
    onColumnClick(col);
  };

  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">
      {/* Column Score Overlay Floating Above Board */}
      {showScoresOverlay && columnScores.length === 7 && (
        <div className="grid grid-cols-7 gap-1 mb-2 px-3">
          {columnScores.map((colData, c) => {
            const isChosen = lastMove === c;
            const isLegal = colData.legal;
            return (
              <div
                key={`score-pill-${c}`}
                className={`py-1 px-0.5 rounded text-center text-[11px] font-mono font-bold transition-all shadow-sm ${
                  isChosen
                    ? 'bg-amber-500 text-black shadow-neon-amber ring-2 ring-amber-300'
                    : isLegal
                    ? colData.bound
                      ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 bg-hatched-pattern'
                      : 'bg-slate-800/90 border border-slate-700 text-cyan-300'
                    : 'bg-slate-900/60 text-slate-600 border border-slate-800'
                }`}
                title={`Column ${c + 1}: ${colData.label} ${colData.bound ? '(Alpha-Beta Bound)' : ''}`}
              >
                {colData.label}
              </div>
            );
          })}
        </div>
      )}

      {/* SVG Board Container */}
      <div className="relative rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-slate-900 via-indigo-950/80 to-[#070b1a] border border-cyan-500/30 shadow-2xl shadow-cyan-950/50">
        <svg
          viewBox="0 0 700 600"
          className="w-full h-auto drop-shadow-xl"
          style={{ maxHeight: '72vh' }}
        >
          <defs>
            {/* Front Panel Cutout Mask: White base with black circular holes */}
            <mask id="c4-front-holes">
              <rect x="0" y="0" width="700" height="600" fill="white" />
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((_, c) => (
                  <circle
                    key={`hole-${r}-${c}`}
                    cx={c * 100 + 50}
                    cy={r * 100 + 50}
                    r="38"
                    fill="black"
                  />
                ))
              )}
            </mask>

            {/* Gradients for Player 1 (Human: Amber/Coral) */}
            <radialGradient id="disc-p1" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ff8a65" />
              <stop offset="60%" stopColor="#f4511e" />
              <stop offset="100%" stopColor="#bf360c" />
            </radialGradient>

            {/* Gradients for Player 2 (AI: Neon Cyan) */}
            <radialGradient id="disc-p2" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </radialGradient>

            {/* Board Face Metallic Gradient */}
            <linearGradient id="board-panel-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e2954" />
              <stop offset="50%" stopColor="#141c3d" />
              <stop offset="100%" stopColor="#0d132b" />
            </linearGradient>

            {/* Winning Halo Filter */}
            <filter id="golden-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fbbf24" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 1. Board Backing Plate */}
          <rect x="0" y="0" width="700" height="600" rx="18" fill="#080c1d" />

          {/* 2. Placed Discs Layer (Behind Front Panel Mask) */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const val = board[r * COLS + c];
              if (val === 0) return null;

              const isWinning = isWinningCell(r, c);
              const cx = c * 100 + 50;
              const cy = r * 100 + 50;
              const fill = val === 1 ? 'url(#disc-p1)' : 'url(#disc-p2)';

              return (
                <motion.g
                  key={`disc-${r}-${c}`}
                  initial={{ y: -((r + 1) * 100) }}
                  animate={{ y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 22,
                    mass: 0.8,
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r="37"
                    fill={fill}
                    filter={isWinning ? 'url(#golden-glow)' : undefined}
                    className={isWinning ? 'winning-disc-pulse' : ''}
                  />

                  {/* Tactile inner disc groove ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="25"
                    fill="none"
                    stroke={val === 1 ? '#ffccbc' : '#a5f3fc'}
                    strokeWidth="2.5"
                    opacity="0.45"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="none"
                    stroke={val === 1 ? '#ffccbc' : '#a5f3fc'}
                    strokeWidth="1.5"
                    opacity="0.3"
                  />

                  {/* Winning golden ring outline */}
                  {isWinning && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="37"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="5"
                    />
                  )}
                </motion.g>
              );
            })
          )}

          {/* 3. Ghost Disc for Active Hover */}
          {!disabled && hoveredCol !== null && (
            (() => {
              const lowestEmptyRow = findLowestEmptyRow(board, hoveredCol);
              if (lowestEmptyRow === -1) return null;
              const ghostCx = hoveredCol * 100 + 50;
              const ghostCy = lowestEmptyRow * 100 + 50;
              const ghostColor = activePlayer === 1 ? '#ff7043' : '#00f0ff';

              return (
                <g>
                  <circle
                    cx={ghostCx}
                    cy={ghostCy}
                    r="36"
                    fill={ghostColor}
                    fillOpacity="0.25"
                    stroke={ghostColor}
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                </g>
              );
            })()
          )}

          {/* 4. Front Panel with Circular Cutouts */}
          <rect
            x="0"
            y="0"
            width="700"
            height="600"
            rx="18"
            fill="url(#board-panel-gradient)"
            mask="url(#c4-front-holes)"
          />

          {/* 5. Hole Bevel Borders (Adds physical depth to holes) */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => (
              <circle
                key={`hole-rim-${r}-${c}`}
                cx={c * 100 + 50}
                cy={r * 100 + 50}
                r="38"
                fill="none"
                stroke="rgba(0, 0, 0, 0.45)"
                strokeWidth="3.5"
              />
            ))
          )}

          {/* 6. Board Border Neon Highlight */}
          <rect
            x="2"
            y="2"
            width="696"
            height="596"
            rx="16"
            fill="none"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth="3"
          />

          {/* 7. Interactive Column Click Zones */}
          {Array.from({ length: COLS }).map((_, c) => {
            const isFull = board[c] !== 0;
            return (
              <rect
                key={`click-col-${c}`}
                id={`connect4-col-${c}`}
                x={c * 100}
                y="0"
                width="100"
                height="600"
                fill="transparent"
                className={`transition-colors ${
                  disabled || isFull
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:fill-cyan-500/10'
                }`}
                onClick={() => handleColClick(c)}
                onMouseEnter={() => setHoveredCol(c)}
                onMouseLeave={() => setHoveredCol(null)}
              />
            );
          })}
        </svg>

        {/* Board Feet / Base Stand */}
        <div className="flex justify-between items-center -mt-1 px-6">
          <div className="w-16 h-4 bg-slate-800 rounded-b-lg border-x border-b border-cyan-500/30"></div>
          <div className="flex gap-4 items-center">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
              AI GAME ARENA • 6×7 MATRIX
            </span>
          </div>
          <div className="w-16 h-4 bg-slate-800 rounded-b-lg border-x border-b border-cyan-500/30"></div>
        </div>
      </div>
    </div>
  );
}
