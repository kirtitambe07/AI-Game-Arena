import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Bot,
  Sliders,
  Trophy,
  Zap,
  Activity,
  Cpu,
} from 'lucide-react';
import Board from '../components/Board';
import { fetchAiMove } from '../utils/api';
import {
  CELLS,
  COLS,
  findLowestEmptyRow,
  checkWinAt,
  isBoardFull,
} from '../utils/gameLogic';
import { sound } from '../utils/sound';

export default function AiVsAiPage() {
  const [board, setBoard] = useState(Array(CELLS).fill(0));
  const [activePlayer, setActivePlayer] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(600);
  const [randomFirstMove, setRandomFirstMove] = useState(true);

  // Scoreboard
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [scoreDraws, setScoreDraws] = useState(0);

  // Agent Configurations
  const [agent1, setAgent1] = useState({ algorithm: 'alphabeta', difficulty: 'medium' });
  const [agent2, setAgent2] = useState({ algorithm: 'mcts', difficulty: 'easy' });

  // Live Stats per Side
  const [statsP1, setStatsP1] = useState({ nodes: 0, moves: 0, time_ms: 0 });
  const [statsP2, setStatsP2] = useState({ nodes: 0, moves: 0, time_ms: 0 });

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(0);
  const [winningCells, setWinningCells] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  const isExecutingRef = useRef(false);

  // Reset current board
  const handleResetBoard = (resetScores = false) => {
    setIsRunning(false);
    isExecutingRef.current = false;
    setBoard(Array(CELLS).fill(0));
    setGameOver(false);
    setWinner(0);
    setWinningCells([]);
    setLastMove(null);
    setActivePlayer(1);

    if (resetScores) {
      setScoreP1(0);
      setScoreP2(0);
      setScoreDraws(0);
      setStatsP1({ nodes: 0, moves: 0, time_ms: 0 });
      setStatsP2({ nodes: 0, moves: 0, time_ms: 0 });
    }
  };

  // Perform single step AI move
  const executeStep = async () => {
    if (gameOver || isExecutingRef.current) return;
    isExecutingRef.current = true;

    try {
      const currentAgent = activePlayer === 1 ? agent1 : agent2;
      let chosenCol;
      let moveStats = { nodes: 1, time_ms: 0 };

      // Optional random opening move for variety
      const movesPlayed = board.filter((x) => x !== 0).length;
      if (movesPlayed === 0 && randomFirstMove) {
        const centerOpenings = [2, 3, 4];
        chosenCol = centerOpenings[Math.floor(Math.random() * centerOpenings.length)];
      } else {
        const res = await fetchAiMove(
          board,
          activePlayer,
          currentAgent.algorithm,
          currentAgent.difficulty
        );
        chosenCol = res.move;
        moveStats = res.stats;
      }

      const row = findLowestEmptyRow(board, chosenCol);
      if (row === -1) {
        throw new Error(`AI picked full column ${chosenCol}`);
      }

      const newBoard = [...board];
      newBoard[row * COLS + chosenCol] = activePlayer;

      sound.playDrop(activePlayer === 1 ? 1.1 : 0.85);
      setBoard(newBoard);
      setLastMove(chosenCol);

      // Update Side Stats
      if (activePlayer === 1) {
        setStatsP1((prev) => ({
          nodes: prev.nodes + (moveStats.nodes || 0),
          moves: prev.moves + 1,
          time_ms: prev.time_ms + (moveStats.time_ms || 0),
        }));
      } else {
        setStatsP2((prev) => ({
          nodes: prev.nodes + (moveStats.nodes || 0),
          moves: prev.moves + 1,
          time_ms: prev.time_ms + (moveStats.time_ms || 0),
        }));
      }

      // Check win
      const winCheck = checkWinAt(newBoard, row, chosenCol, activePlayer);
      if (winCheck.won) {
        setWinner(activePlayer);
        setWinningCells(winCheck.winningCells);
        setGameOver(true);
        setIsRunning(false);
        if (activePlayer === 1) setScoreP1((s) => s + 1);
        else setScoreP2((s) => s + 1);
        return;
      }

      // Check draw
      if (isBoardFull(newBoard)) {
        setWinner(0);
        setGameOver(true);
        setIsRunning(false);
        setScoreDraws((s) => s + 1);
        return;
      }

      // Switch turn
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } catch (err) {
      console.error('AI vs AI step failed:', err);
      setIsRunning(false);
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Automated game loop runner
  useEffect(() => {
    let timer;
    if (isRunning && !gameOver) {
      timer = setTimeout(() => {
        executeStep();
      }, speedMs);
    }
    return () => clearTimeout(timer);
  }, [isRunning, gameOver, board, activePlayer, speedMs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-cyan-400" />
            AI vs AI Exhibition Arena
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Simulate and watch adversarial algorithms clash in real-time.
          </p>
        </div>

        {/* Global Reset */}
        <button
          onClick={() => handleResetBoard(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Everything
        </button>
      </div>

      {/* Live Head-to-Head Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Agent 1 Card (Player 1 / Coral Amber) */}
        <div className="glass-panel-amber rounded-2xl p-4 border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                PLAYER 1 (AMBER)
              </span>
              <span className="text-2xl font-mono font-black text-amber-300">
                {scoreP1} WINS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <select
                value={agent1.algorithm}
                onChange={(e) => setAgent1({ ...agent1, algorithm: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
              >
                <option value="alphabeta">Alpha-Beta</option>
                <option value="minimax">Minimax</option>
                <option value="mcts">MCTS UCB1</option>
                <option value="random">Random</option>
              </select>

              <select
                value={agent1.difficulty}
                onChange={(e) => setAgent1({ ...agent1, difficulty: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs capitalize"
              >
                <option value="beginner">Beginner</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20 text-[11px] font-mono text-slate-400">
            <div>
              Nodes: <span className="text-slate-100 font-bold">{statsP1.nodes.toLocaleString()}</span>
            </div>
            <div>
              Avg ms: <span className="text-slate-100 font-bold">{statsP1.moves > 0 ? (statsP1.time_ms / statsP1.moves).toFixed(1) : 0}</span>
            </div>
          </div>
        </div>

        {/* Center Match Controls & Draws */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between items-center text-center">
          <div>
            <div className="text-xs font-mono text-slate-400 mb-1">DRAWS: {scoreDraws}</div>
            <div className="text-xs font-semibold text-slate-300 mb-3">
              {gameOver ? (
                <span className="text-amber-400 font-bold text-sm">
                  {winner === 1 ? 'Player 1 Won!' : winner === 2 ? 'Player 2 Won!' : 'Match Drawn'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activePlayer === 1 ? 'bg-amber-400' : 'bg-cyan-400'
                    } animate-pulse`}
                  ></span>
                  Active: {activePlayer === 1 ? 'Player 1' : 'Player 2'}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 my-2">
            {!isRunning ? (
              <button
                onClick={() => {
                  if (gameOver) handleResetBoard(false);
                  setIsRunning(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-heading font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                Start Match
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Pause className="w-3.5 h-3.5 fill-black" />
                Pause
              </button>
            )}

            <button
              onClick={() => executeStep()}
              disabled={isRunning || gameOver}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition-all"
              title="Execute 1 single ply"
            >
              <StepForward className="w-3.5 h-3.5" />
              Step
            </button>

            <button
              onClick={() => handleResetBoard(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all"
              title="Reset Board"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Slider & Opening Toggle */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Simulation Delay</span>
              <span className="font-mono text-cyan-300">{speedMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <label className="flex items-center justify-center gap-2 text-[11px] text-slate-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={randomFirstMove}
                onChange={(e) => setRandomFirstMove(e.target.checked)}
                className="accent-cyan-400"
              />
              Random First Move (prevents identical games)
            </label>
          </div>
        </div>

        {/* Agent 2 Card (Player 2 / Neon Cyan) */}
        <div className="glass-panel-cyan rounded-2xl p-4 border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                PLAYER 2 (CYAN)
              </span>
              <span className="text-2xl font-mono font-black text-cyan-300">
                {scoreP2} WINS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <select
                value={agent2.algorithm}
                onChange={(e) => setAgent2({ ...agent2, algorithm: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
              >
                <option value="mcts">MCTS UCB1</option>
                <option value="alphabeta">Alpha-Beta</option>
                <option value="minimax">Minimax</option>
                <option value="random">Random</option>
              </select>

              <select
                value={agent2.difficulty}
                onChange={(e) => setAgent2({ ...agent2, difficulty: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs capitalize"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="beginner">Beginner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-500/20 text-[11px] font-mono text-slate-400">
            <div>
              Nodes: <span className="text-slate-100 font-bold">{statsP2.nodes.toLocaleString()}</span>
            </div>
            <div>
              Avg ms: <span className="text-slate-100 font-bold">{statsP2.moves > 0 ? (statsP2.time_ms / statsP2.moves).toFixed(1) : 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arena Connect-4 Board */}
      <div className="max-w-2xl mx-auto">
        <Board
          board={board}
          onColumnClick={() => {}}
          disabled={true}
          winningCells={winningCells}
          lastMove={lastMove}
          activePlayer={activePlayer}
          player1Name={`P1: ${agent1.algorithm}`}
          player2Name={`P2: ${agent2.algorithm}`}
        />
      </div>
    </div>
  );
}
