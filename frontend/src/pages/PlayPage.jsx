import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Play,
  User,
  Bot,
  AlertTriangle,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Board from '../components/Board';
import AiBrainPanel from '../components/AiBrainPanel';
import TreeVisualizer from '../components/TreeVisualizer';
import { fetchAiMove, fetchHint, saveGame } from '../utils/api';
import {
  CELLS,
  COLS,
  findLowestEmptyRow,
  checkWinAt,
  isBoardFull,
  checkEntireBoardWinner,
} from '../utils/gameLogic';
import { sound } from '../utils/sound';

export default function PlayPage() {
  // Board state: flat array of 42 cells (0=empty, 1=human, 2=AI)
  const [board, setBoard] = useState(Array(CELLS).fill(0));
  const [moveHistory, setMoveHistory] = useState([]); // array of { player, col, row }
  const [activePlayer, setActivePlayer] = useState(1); // 1 = Human, 2 = AI
  const [whoStarts, setWhoStarts] = useState(1); // 1 = Human, 2 = AI
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(0); // 0=none/draw, 1=Human, 2=AI
  const [winningCells, setWinningCells] = useState([]);

  // Player configuration
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('ai_arena_player') || 'Hero'
  );
  const [algorithm, setAlgorithm] = useState('alphabeta');
  const [difficulty, setDifficulty] = useState('medium');

  // AI Brain & Visualization Telemetry
  const [aiData, setAiData] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showScoresOverlay, setShowScoresOverlay] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Hint State
  const [hint, setHint] = useState(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Save player name in localStorage
  useEffect(() => {
    localStorage.setItem('ai_arena_player', playerName);
  }, [playerName]);

  // Trigger AI move if activePlayer == 2 and game is not over
  useEffect(() => {
    if (activePlayer === 2 && !gameOver && !isAiThinking) {
      triggerAiMove();
    }
  }, [activePlayer, gameOver]);

  // Reset or Start New Game
  const handleNewGame = (starter = whoStarts) => {
    setBoard(Array(CELLS).fill(0));
    setMoveHistory([]);
    setGameOver(false);
    setWinner(0);
    setWinningCells([]);
    setAiData(null);
    setHint(null);
    setServerError(null);
    setActivePlayer(starter);
  };

  // Human Column Click
  const handleHumanMove = async (col) => {
    if (activePlayer !== 1 || gameOver || isAiThinking) return;

    const row = findLowestEmptyRow(board, col);
    if (row === -1) return;

    const newBoard = [...board];
    newBoard[row * COLS + col] = 1;
    const newHistory = [...moveHistory, { player: 1, col, row }];

    setBoard(newBoard);
    setMoveHistory(newHistory);
    setHint(null);

    // Check if human won
    const winCheck = checkWinAt(newBoard, row, col, 1);
    if (winCheck.won) {
      setWinner(1);
      setWinningCells(winCheck.winningCells);
      setGameOver(true);
      persistGameResult(1, newHistory);
      return;
    }

    // Check draw
    if (isBoardFull(newBoard)) {
      setWinner(0);
      setGameOver(true);
      persistGameResult(0, newHistory);
      return;
    }

    // Hand turn to AI
    setActivePlayer(2);
  };

  // Trigger AI calculation from backend
  const triggerAiMove = async () => {
    setIsAiThinking(true);
    setServerError(null);

    try {
      const response = await fetchAiMove(board, 2, algorithm, difficulty);
      const chosenCol = response.move;
      const row = findLowestEmptyRow(board, chosenCol);

      if (row === -1) {
        throw new Error(`AI suggested full column ${chosenCol}`);
      }

      const newBoard = [...board];
      newBoard[row * COLS + chosenCol] = 2;
      const newHistory = [...moveHistory, { player: 2, col: chosenCol, row }];

      sound.playDrop(0.9);
      setBoard(newBoard);
      setMoveHistory(newHistory);
      setAiData(response);

      // Check if AI won
      const winCheck = checkWinAt(newBoard, row, chosenCol, 2);
      if (winCheck.won) {
        setWinner(2);
        setWinningCells(winCheck.winningCells);
        setGameOver(true);
        persistGameResult(2, newHistory);
        return;
      }

      // Check draw
      if (isBoardFull(newBoard)) {
        setWinner(0);
        setGameOver(true);
        persistGameResult(0, newHistory);
        return;
      }

      // Return turn to human
      setActivePlayer(1);
    } catch (err) {
      console.error('AI Move Error:', err);
      setServerError(
        err.message || 'Backend connection failed. Please ensure FastAPI server is running on port 8000.'
      );
    } finally {
      setIsAiThinking(false);
    }
  };

  // Undo last 2 plies (AI + Human)
  const handleUndo = () => {
    if (moveHistory.length < 2 || isAiThinking) return;

    // Remove last 2 moves
    const updatedHistory = moveHistory.slice(0, -2);
    const newBoard = Array(CELLS).fill(0);
    for (const move of updatedHistory) {
      newBoard[move.row * COLS + move.col] = move.player;
    }

    setBoard(newBoard);
    setMoveHistory(updatedHistory);
    setGameOver(false);
    setWinner(0);
    setWinningCells([]);
    setHint(null);
    setActivePlayer(1);
  };

  // Request intelligent hint from Alpha-Beta depth 5
  const handleAskHint = async () => {
    if (gameOver || isAiThinking || isLoadingHint) return;
    setIsLoadingHint(true);
    setHint(null);

    try {
      sound.playHint();
      const hintRes = await fetchHint(board, 1);
      setHint(hintRes);
    } catch (err) {
      console.warn('Hint fetch failed:', err);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Save completed game to database
  const persistGameResult = async (gameWinner, history) => {
    try {
      await saveGame({
        player_name: playerName || 'Player 1',
        winner: gameWinner,
        player1_type: 'human',
        player2_type: algorithm,
        difficulty: difficulty,
        moves_count: history.length,
        moves_history: history.map((m) => m.col),
      });
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  };

  const lastAiCol = aiData?.move ?? (moveHistory[moveHistory.length - 1]?.player === 2 ? moveHistory[moveHistory.length - 1]?.col : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{serverError}</span>
          </div>
          <button
            onClick={() => triggerAiMove()}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Left Board + Controls, Right AI Brain & Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Board & Quick Controls) */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-5">
          {/* Top Status & Turn Bar */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Player Info Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  activePlayer === 1
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-neon-amber'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Player 1 (Human)</div>
                <div className="font-heading font-bold text-slate-100 text-sm">
                  {playerName || 'Player 1'}
                </div>
              </div>
            </div>

            {/* Turn Status Indicator */}
            <div className="flex items-center gap-2">
              {!gameOver ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activePlayer === 1
                        ? 'bg-amber-400 animate-pulse shadow-sm shadow-amber-400'
                        : 'bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400'
                    }`}
                  ></span>
                  <span>
                    {activePlayer === 1 ? 'Your Turn' : 'AI Computing...'}
                  </span>
                </div>
              ) : (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    winner === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : winner === 2
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {winner === 1 ? '🎉 YOU WON!' : winner === 2 ? '🤖 AI WON!' : '🤝 DRAW!'}
                </div>
              )}
            </div>

            {/* AI Opponent Badge */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-xs text-slate-400">Player 2 (AI)</div>
                <div className="font-heading font-bold text-cyan-400 text-sm capitalize">
                  {algorithm} ({difficulty})
                </div>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  activePlayer === 2
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-neon-cyan animate-pulse'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Bot className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Connect-4 Board */}
          <Board
            board={board}
            onColumnClick={handleHumanMove}
            disabled={activePlayer !== 1 || gameOver || isAiThinking}
            winningCells={winningCells}
            lastMove={lastAiCol}
            showScoresOverlay={showScoresOverlay}
            columnScores={aiData?.columns || []}
            activePlayer={activePlayer}
            player1Name={playerName}
            player2Name={algorithm}
          />

          {/* Interactive Hint Callout (when user clicks Ask Hint) */}
          <AnimatePresence>
            {hint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 shadow-lg shadow-amber-500/5"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>Adversarial Advisor (Alpha-Beta d=5)</span>
                    <span className="font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Recommend Column {hint.recommended_col + 1}
                    </span>
                  </div>
                  <p className="text-amber-100/90 leading-relaxed font-sans">
                    {hint.reasoning}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Bar: New Game, Undo, Hint */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNewGame()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-heading font-bold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Match
              </button>

              <button
                onClick={handleUndo}
                disabled={moveHistory.length < 2 || isAiThinking || gameOver}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
                title="Roll back 2 plies (AI move + human move)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Turn
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAskHint}
                disabled={gameOver || activePlayer !== 1 || isAiThinking || isLoadingHint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {isLoadingHint ? 'Analyzing...' : 'Ask Hint'}
              </button>
            </div>
          </div>

          {/* Match Configuration Card */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            <h4 className="font-heading font-bold text-xs text-slate-300 uppercase tracking-wider">
              Arena Settings & Opponent Tuning
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Algorithm Select */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">AI Algorithm</label>
                <select
                  value={algorithm}
                  onChange={(e) => {
                    setAlgorithm(e.target.value);
                    handleNewGame();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="alphabeta">Alpha-Beta (Unit III)</option>
                  <option value="minimax">Minimax (Unit III)</option>
                  <option value="mcts">MCTS UCB1 (Unit III)</option>
                  <option value="random">Random Baseline (Unit I)</option>
                </select>
              </div>

              {/* Difficulty Select */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    handleNewGame();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono capitalize"
                >
                  <option value="beginner">Beginner</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard (Depth 6 / 2.5k Sims)</option>
                </select>
              </div>

              {/* Starter Select */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Who Starts?</label>
                <select
                  value={whoStarts}
                  onChange={(e) => {
                    const nextStarter = Number(e.target.value);
                    setWhoStarts(nextStarter);
                    handleNewGame(nextStarter);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value={1}>Human First (P1)</option>
                  <option value={2}>AI First (P2)</option>
                </select>
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                  placeholder="Hero"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Brain Telemetry & Game Tree */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6">
          {/* AI Brain Telemetry Panel */}
          <AiBrainPanel
            aiStats={aiData?.stats}
            columns={aiData?.columns || []}
            chosenMove={lastAiCol}
            algorithm={algorithm}
            difficulty={difficulty}
            showScoresOverlay={showScoresOverlay}
            setShowScoresOverlay={setShowScoresOverlay}
            isThinking={isAiThinking}
          />

          {/* 2-Ply Adversarial Search Tree Visualizer */}
          <TreeVisualizer
            treeData={aiData?.tree}
            chosenMove={lastAiCol}
            algorithm={algorithm}
          />

          {/* Move Log History */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 font-heading">
                Move Sequence ({moveHistory.length} plies)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {gameOver ? 'Match Concluded' : 'Active Game'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-900 font-mono text-xs">
              {moveHistory.length === 0 ? (
                <span className="text-slate-600 text-[11px] p-1">No moves played yet.</span>
              ) : (
                moveHistory.map((m, idx) => (
                  <span
                    key={`hist-${idx}`}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      m.player === 1
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    #{idx + 1} {m.player === 1 ? 'P1' : 'AI'}: C{m.col + 1}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
