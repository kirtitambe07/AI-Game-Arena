import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, CheckCircle2, XCircle, Code, Layers, Zap, Cpu } from 'lucide-react';
import { fetchAlgorithms } from '../utils/api';

export default function LearnPage() {
  const [algoData, setAlgoData] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [activeTab, setActiveTab] = useState('alphabeta');

  useEffect(() => {
    fetchAlgorithms()
      .then((res) => {
        setAlgoData(res.algorithms || []);
        setSyllabus(res.syllabus || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const pseudocodes = {
    alphabeta: `function ALPHA-BETA(state, depth, α, β, player) returns (value, move)
    if depth == 0 or IS-TERMINAL(state) then
        return EVALUATE(state, player), null

    if player == MAX then
        best_val = -∞
        best_move = null
        for each move in ORDERED-MOVES(state) do
            val, _ = ALPHA-BETA(RESULT(state, move), depth-1, α, β, MIN)
            if val > best_val then
                best_val = val
                best_move = move
            α = max(α, best_val)
            if β <= α then
                break  // Beta cutoff (Prune branch)
        return best_val, best_move
    else
        best_val = +∞
        best_move = null
        for each move in ORDERED-MOVES(state) do
            val, _ = ALPHA-BETA(RESULT(state, move), depth-1, α, β, MAX)
            if val < best_val then
                best_val = val
                best_move = move
            β = min(β, best_val)
            if β <= α then
                break  // Alpha cutoff (Prune branch)
        return best_val, best_move`,

    minimax: `function MINIMAX(state, depth, is_maximizing, player) returns value
    if depth == 0 or IS-TERMINAL(state) then
        return EVALUATE(state, player)

    if is_maximizing then
        max_eval = -∞
        for each move in LEGAL-MOVES(state) do
            eval = MINIMAX(RESULT(state, move), depth-1, false, player)
            max_eval = max(max_eval, eval)
        return max_eval
    else
        min_eval = +∞
        for each move in LEGAL-MOVES(state) do
            eval = MINIMAX(RESULT(state, move), depth-1, true, player)
            min_eval = min(min_eval, eval)
        return min_eval`,

    mcts: `function MCTS(root_state, simulations, c=1.41) returns best_move
    root = Node(state=root_state)

    for i = 1 to simulations do
        node = SELECT(root, c)          // Traverse tree with UCB1 formula
        if not TERMINAL(node.state) then
            node = EXPAND(node)         // Add new child node
        reward = ROLLOUT(node.state)    // Random simulation to game end
        BACKPROPAGATE(node, reward)     // Update visit counts and wins

    // Standard robust child choice: most visited node
    return child with max(visits)

formula UCB1(node, c) = (wins / visits) + c * sqrt(ln(parent.visits) / visits)`,

    random: `function RANDOM-AGENT(state) returns move
    legal_moves = GET-LEGAL-COLUMNS(state)
    return UNIFORM-SAMPLE(legal_moves)`,
  };

  const selectedAlgo = algoData.find((a) => a.id === activeTab) || algoData[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Title Header */}
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-2.5">
          <GraduationCap className="w-7 h-7 text-cyan-400" />
          Academic Syllabus Mapping & Algorithm Reference
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          College Artificial Intelligence Coursework: Units I, II, & III in action.
        </p>
      </div>

      {/* College AI Syllabus Modules Grid */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Curriculum Alignment Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Unit I */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                UNIT I
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Foundations</span>
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-100">
              Agents & Environments
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              PEAS formulation: Performance (win/draw), Environment (6x7 zero-sum discrete board), Actuators (drop disc into col 0-6), Sensors (flat 42-cell board vector). Baseline reflex agent.
            </p>
          </div>

          {/* Unit II */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                UNIT II
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Heuristic Search</span>
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-100">
              Domain State Evaluation
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Non-terminal evaluation function scanning all 69 windows of length 4: +5 for (3 mine + 1 empty), +2 for (2 mine + 2 empty), -4 for (3 opp + 1 empty), +3 per disc controlling the central file.
            </p>
          </div>

          {/* Unit III */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                UNIT III
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Adversarial Search</span>
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-100">
              Minimax, Pruning & MCTS
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Game theoretic zero-sum depth-limited search with in-place play/undo, Alpha-Beta pruning window cutoffs ($O(b^{d/2})$ with center ordering), and Monte Carlo Tree Search using UCB1 balance.
            </p>
          </div>
        </div>
      </div>

      {/* Algorithm Deep-Dive Tab System */}
      <div className="space-y-4 pt-2">
        <h3 className="font-heading font-bold text-base text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Interactive Algorithm Cheatsheets
        </h3>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {algoData.map((algo) => (
            <button
              key={algo.id}
              onClick={() => setActiveTab(algo.id)}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${
                activeTab === algo.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {algo.name}
            </button>
          ))}
        </div>

        {/* Selected Algorithm Card */}
        {selectedAlgo && (
          <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 font-bold">
                  {selectedAlgo.syllabus_unit}
                </span>
              </div>
              <h4 className="font-heading font-black text-xl text-slate-100">
                {selectedAlgo.name}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
                {selectedAlgo.description}
              </p>
            </div>

            {/* Complexity Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Time Complexity:</span>
                <span className="text-amber-400 font-bold">{selectedAlgo.time_complexity}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Space Complexity:</span>
                <span className="text-cyan-400 font-bold">{selectedAlgo.space_complexity}</span>
              </div>
            </div>

            {/* Pseudocode Fenced Code Block */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 font-heading flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-cyan-400" />
                  Algorithm Pseudocode Implementation
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Built From Scratch in Python
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-[#050711] border border-slate-800 overflow-x-auto text-[11px] font-mono text-cyan-200/90 leading-relaxed">
                <code>{pseudocodes[selectedAlgo.id] || '// Implementation code'}</code>
              </pre>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pros */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Advantages
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedAlgo.pros?.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <span className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Tradeoffs & Limitations
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedAlgo.cons?.map((con, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
