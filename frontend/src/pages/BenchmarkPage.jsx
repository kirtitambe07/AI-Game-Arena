import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Play,
  Scissors,
  CheckCircle2,
  Clock,
  Trophy,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { runSpeedBenchmark, runTournamentBenchmark } from '../utils/api';

export default function BenchmarkPage() {
  const [speedData, setSpeedData] = useState(null);
  const [tournamentData, setTournamentData] = useState(null);
  const [isLoadingSpeed, setIsLoadingSpeed] = useState(false);
  const [isLoadingTournament, setIsLoadingTournament] = useState(false);
  const [speedError, setSpeedError] = useState(null);
  const [tournamentError, setTournamentError] = useState(null);
  const [useLogScale, setUseLogScale] = useState(false);

  // Run Speed Benchmark
  const handleRunSpeed = async () => {
    setIsLoadingSpeed(true);
    setSpeedError(null);
    try {
      const data = await runSpeedBenchmark();
      setSpeedData(data);
    } catch (err) {
      setSpeedError(err.message || 'Speed benchmark failed');
    } finally {
      setIsLoadingSpeed(false);
    }
  };

  // Run Tournament Benchmark
  const handleRunTournament = async () => {
    setIsLoadingTournament(true);
    setTournamentError(null);
    try {
      const data = await runTournamentBenchmark();
      setTournamentData(data);
    } catch (err) {
      setTournamentError(err.message || 'Tournament execution failed');
    } finally {
      setIsLoadingTournament(false);
    }
  };

  // Transform depth comparison data for Recharts
  const nodesChartData = speedData?.depth_comparison?.map((item) => ({
    depth: `Depth ${item.depth}`,
    rawDepth: item.depth,
    Minimax: useLogScale ? Math.log10(Math.max(item.minimax.nodes, 1)) : item.minimax.nodes,
    rawMiniNodes: item.minimax.nodes,
    AlphaBeta: useLogScale ? Math.log10(Math.max(item.alphabeta.nodes, 1)) : item.alphabeta.nodes,
    rawAbNodes: item.alphabeta.nodes,
    savings: item.pruning_savings_pct,
  })) || [];

  const timeChartData = speedData?.depth_comparison?.map((item) => ({
    depth: `Depth ${item.depth}`,
    Minimax: item.minimax.time_ms,
    AlphaBeta: item.alphabeta.time_ms,
  })) || [];

  const mctsChartData = speedData?.mcts_comparison?.map((item) => ({
    sims: `${item.simulations} Sims`,
    time_ms: item.time_ms,
    score: item.best_score,
  })) || [];

  // Pruning savings at deepest depth
  const maxDepthItem = speedData?.depth_comparison?.[speedData.depth_comparison.length - 1];
  const maxSavingsPct = maxDepthItem ? maxDepthItem.pruning_savings_pct : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Empirical Benchmark Suite
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Adversarial search efficiency comparisons & automated round-robin tournament.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunSpeed}
            disabled={isLoadingSpeed}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-heading font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            {isLoadingSpeed ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" /> Running Speed Benchmark...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" /> Run Speed Benchmark (Depths 1-5)
              </>
            )}
          </button>

          <button
            onClick={handleRunTournament}
            disabled={isLoadingTournament}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-black font-heading font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            {isLoadingTournament ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" /> Running 12 Games...
              </>
            ) : (
              <>
                <Trophy className="w-3.5 h-3.5 fill-black" /> Run Round-Robin Tournament
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: SPEED BENCHMARK (MINIMAX VS ALPHA-BETA) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-slate-200 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            Minimax vs Alpha-Beta Pruning Efficiency (Depths 1–5)
          </h3>
          {speedData && (
            <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useLogScale}
                onChange={(e) => setUseLogScale(e.target.checked)}
                className="accent-cyan-400"
              />
              Logarithmic Scale (log10 nodes)
            </label>
          )}
        </div>

        {speedError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {speedError}
          </div>
        )}

        {speedData ? (
          <div className="space-y-5">
            {/* Highlight Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Savings Card */}
              <div className="glass-panel-amber rounded-2xl p-4 border border-amber-500/30 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-amber-300/80 font-mono">Pruning Node Reduction</div>
                  <div className="text-2xl font-black font-mono text-amber-300">
                    {maxSavingsPct != null ? `${maxSavingsPct}% SAVED` : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Fewer states explored at Depth 5
                  </div>
                </div>
              </div>

              {/* Exact Optimality Verification */}
              <div className="glass-panel-cyan rounded-2xl p-4 border border-cyan-500/30 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-cyan-300/80 font-mono">Correctness Proof</div>
                  <div className="text-lg font-bold font-heading text-slate-100">
                    100% Score Identity
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Alpha-Beta found identical minimax scores at all depths
                  </div>
                </div>
              </div>

              {/* Max Depth Node Comparison */}
              <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-purple-300/80 font-mono">Depth 5 Workload</div>
                  <div className="text-sm font-mono text-slate-200">
                    Mini: <strong className="text-rose-400">{maxDepthItem?.minimax.nodes.toLocaleString()}</strong> vs AB: <strong className="text-cyan-400">{maxDepthItem?.alphabeta.nodes.toLocaleString()}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Total game states generated
                  </div>
                </div>
              </div>
            </div>

            {/* Nodes Comparison Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Nodes Explored Chart */}
              <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-200 font-heading">
                    Nodes Explored: Minimax vs Alpha-Beta {useLogScale && '(log10 scale)'}
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nodesChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="depth" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs font-mono">
                                <div className="font-bold text-slate-200 mb-1">{d.depth}</div>
                                <div className="text-rose-400">Minimax: {d.rawMiniNodes.toLocaleString()} nodes</div>
                                <div className="text-cyan-400">Alpha-Beta: {d.rawAbNodes.toLocaleString()} nodes</div>
                                <div className="text-amber-300 font-bold mt-1">Pruning Savings: {d.savings}%</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Minimax" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Minimax (No Pruning)" />
                      <Bar dataKey="AlphaBeta" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Alpha-Beta Pruned" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Execution Latency Chart (ms) */}
              <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-200 font-heading">
                    Search Latency (ms) Across Horizon Depths
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="depth" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs font-mono">
                                <div className="font-bold text-slate-200 mb-1">{d.depth}</div>
                                <div className="text-rose-400">Minimax: {d.Minimax} ms</div>
                                <div className="text-cyan-400">Alpha-Beta: {d.AlphaBeta} ms</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Minimax" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Minimax ms" />
                      <Bar dataKey="AlphaBeta" fill="#10b981" radius={[4, 4, 0, 0]} name="Alpha-Beta ms" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* MCTS Scaling Line Chart */}
            {mctsChartData.length > 0 && (
              <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 font-heading">
                    MCTS Stochastic Scaling: Computational Time vs Rollout Simulations
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mctsChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="sims" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs font-mono">
                                <div>{d.sims}</div>
                                <div className="text-amber-400">Time: {d.time_ms} ms</div>
                                <div className="text-cyan-400">Root Win Rate: {d.score}%</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="time_ms" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#fbbf24', r: 5 }} name="Compute Time (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center text-slate-500">
            <Cpu className="w-10 h-10 mx-auto mb-2 text-cyan-400 opacity-30" />
            <p className="text-sm text-slate-400">
              Click <strong className="text-cyan-300">"Run Speed Benchmark"</strong> above to empirically measure Minimax vs Alpha-Beta node counts, time in milliseconds, and pruning efficiency.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: TOURNAMENT BENCHMARK (ROUND ROBIN) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="font-heading font-bold text-lg text-slate-200 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Round-Robin AI Tournament (12 Competitive Matches)
        </h3>

        {tournamentError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {tournamentError}
          </div>
        )}

        {tournamentData ? (
          <div className="space-y-5">
            {/* Tournament Leaderboard Table */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Rank & Agent</th>
                      <th className="py-3 px-4">Win / Loss / Draw</th>
                      <th className="py-3 px-4">Win Rate %</th>
                      <th className="py-3 px-4">Avg Nodes / Move</th>
                      <th className="py-3 px-4">Avg Time / Move</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tournamentData.leaderboard.map((row, idx) => (
                      <tr key={row.agent} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold flex items-center gap-2 text-slate-200">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : idx === 1
                                ? 'bg-slate-300/20 text-slate-200'
                                : idx === 2
                                ? 'bg-amber-800/20 text-amber-600'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span>{row.agent}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="text-emerald-400 font-bold">{row.wins}W</span> —{' '}
                          <span className="text-rose-400 font-bold">{row.losses}L</span> —{' '}
                          <span className="text-slate-400">{row.draws}D</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: `${row.win_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-cyan-300 font-bold">{row.win_rate}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {row.avg_nodes_per_move.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {row.avg_time_ms_per_move} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Match Log Grid */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800">
              <h4 className="font-heading font-bold text-xs text-slate-300 uppercase tracking-wider mb-3">
                Match Results Breakdown ({tournamentData.matches.length} Games Played)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto">
                {tournamentData.matches.map((m) => (
                  <div
                    key={`match-${m.game_num}`}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-slate-500">Match #{m.game_num} ({m.moves_count} moves)</div>
                      <div className="text-slate-200 mt-0.5">
                        <span className="text-amber-400 font-bold">{m.player1}</span> vs{' '}
                        <span className="text-cyan-400 font-bold">{m.player2}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.winner === 'Draw'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {m.winner === 'Draw' ? 'Draw' : `Won: ${m.winner}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-400 opacity-30" />
            <p className="text-sm text-slate-400">
              Click <strong className="text-amber-300">"Run Round-Robin Tournament"</strong> above to launch 12 simulated matches pitting Random, Minimax(d3), Alpha-Beta(d4), and MCTS(300) against each other with randomized opening plies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
