import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Cpu, Scissors, Clock, Layers, Zap, Eye, HelpCircle } from 'lucide-react';

export default function AiBrainPanel({
  aiStats,
  columns = [],
  chosenMove = null,
  algorithm = 'alphabeta',
  difficulty = 'medium',
  showScoresOverlay,
  setShowScoresOverlay,
  isThinking = false,
}) {
  const isMcts = algorithm.toLowerCase().includes('mcts');

  // Format columns data for Recharts
  const chartData = columns.map((colData, idx) => {
    const isChosen = chosenMove === idx;
    let displayVal = 0;
    if (colData.legal && colData.score !== null) {
      displayVal = isMcts ? colData.win_rate * 100 : colData.score;
    }

    return {
      col: `Col ${idx + 1}`,
      rawCol: idx,
      score: displayVal,
      norm: colData.norm,
      label: colData.label,
      legal: colData.legal,
      bound: colData.bound,
      visits: colData.visits,
      isChosen,
    };
  });

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/20 shadow-xl relative overflow-hidden">
      {/* Background neon ambient flare */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header with Overlay Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
              AI Brain Live Telemetry
              {isThinking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                  <Zap className="w-3 h-3" /> Thinking...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {algorithm.toUpperCase()} • {difficulty.toUpperCase()} LEVEL
            </p>
          </div>
        </div>

        {/* Toggle overlay on board */}
        <button
          onClick={() => setShowScoresOverlay(!showScoresOverlay)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            showScoresOverlay
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Overlay column evaluation values directly over the board"
        >
          <Eye className="w-3.5 h-3.5" />
          {showScoresOverlay ? 'Scores On Board: ON' : 'Overlay Scores'}
        </button>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {/* Nodes Explored */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              {isMcts ? 'Simulations' : 'Nodes'}
            </span>
          </div>
          <div className="font-mono font-bold text-xl text-slate-100">
            {aiStats?.nodes?.toLocaleString() || (isMcts ? aiStats?.simulations : 0) || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">States evaluated</div>
        </div>

        {/* Pruned Branches (Alpha-Beta) or Win Rate (MCTS) */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              {isMcts ? (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
              )}
              {isMcts ? 'Est. Win Rate' : 'Pruned Cuts'}
            </span>
          </div>
          <div className="font-mono font-bold text-xl text-amber-400">
            {isMcts
              ? `${aiStats?.best_score || 0}%`
              : (aiStats?.pruned?.toLocaleString() || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {isMcts ? 'Root confidence' : 'Alpha-Beta cutoffs'}
          </div>
        </div>

        {/* Compute Time */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Latency
            </span>
          </div>
          <div className="font-mono font-bold text-xl text-emerald-400">
            {aiStats?.time_ms != null ? `${aiStats.time_ms} ms` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Search elapsed time</div>
        </div>

        {/* Depth / Horizon */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              {isMcts ? 'Tree Depth' : 'Depth'}
            </span>
          </div>
          <div className="font-mono font-bold text-xl text-purple-400">
            {isMcts ? aiStats?.max_tree_depth || 1 : aiStats?.depth || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {isMcts ? 'Deepest rollout ply' : 'Horizon limit'}
          </div>
        </div>
      </div>

      {/* Column Score Distribution Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span>Column Strategic Evaluation</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({isMcts ? 'Win Rate % per Column' : 'Heuristic Score'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"></span> Chosen
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block"></span> Evaluated
            </span>
            {!isMcts && (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-900 border border-dashed border-cyan-400 inline-block"></span> Bound
              </span>
            )}
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-44 w-full bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <pattern id="bound-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#38bdf8" strokeWidth="2.5" />
                  <rect width="8" height="8" fill="#0f172a" opacity="0.6" />
                </pattern>
              </defs>

              <XAxis
                dataKey="col"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-cyan-500/40 rounded-lg p-2.5 text-xs shadow-xl font-mono">
                        <div className="font-bold text-slate-200 mb-1 flex items-center justify-between gap-3">
                          <span>{data.col}</span>
                          {data.isChosen && (
                            <span className="text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">
                              CHOSEN MOVE
                            </span>
                          )}
                        </div>
                        <div className="text-cyan-300">
                          {isMcts ? 'Win Rate:' : 'Score:'} <span className="text-slate-100 font-bold">{data.label}</span>
                        </div>
                        {isMcts && (
                          <div className="text-slate-400 mt-0.5">
                            Visits: <span className="text-slate-200">{data.visits}</span>
                          </div>
                        )}
                        {data.bound && (
                          <div className="text-amber-300/80 text-[10px] mt-1 italic">
                            * Alpha-Beta Upper Bound (Pruned Branch)
                          </div>
                        )}
                        {!data.legal && (
                          <div className="text-rose-400 text-[10px] mt-1">Column Full (Illegal)</div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => {
                  let fill = '#06b6d4'; // default cyan
                  if (!entry.legal) {
                    fill = '#1e293b'; // greyed out
                  } else if (entry.isChosen) {
                    fill = '#f59e0b'; // amber gold chosen
                  } else if (entry.bound) {
                    fill = 'url(#bound-hatch)';
                  }

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={fill}
                      stroke={entry.isChosen ? '#fbbf24' : entry.bound ? '#00f0ff' : 'transparent'}
                      strokeWidth={entry.isChosen ? 2 : entry.bound ? 1 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
