import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Clock, Users, RefreshCw, Flame } from 'lucide-react';
import { fetchLeaderboard, fetchRecentGames } from '../utils/api';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadRes, gamesRes] = await Promise.all([
        fetchLeaderboard(),
        fetchRecentGames(),
      ]);
      setLeaderboard(leadRes.leaderboard || []);
      setRecentGames(gamesRes.games || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            Arena Hall of Fame
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Ranked by AI difficulty victory points: Beginner (+1), Easy (+2), Medium (+4), Hard (+7), Draw (+1).
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-bold text-sm text-slate-200">
              Top Human Challengers
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {leaderboard.length} Ranked Players
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4 text-amber-400">Points</th>
                <th className="py-3 px-4">Record (W-L-D)</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4">Matches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No leaderboard matches recorded yet. Play a match in the Arena to make the board!
                  </td>
                </tr>
              ) : (
                leaderboard.map((player) => (
                  <tr
                    key={player.player_name}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold">
                      {player.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" /> #1 Gold
                        </span>
                      ) : player.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 text-slate-200 bg-slate-300/20 px-2 py-0.5 rounded-full border border-slate-300/40">
                          <Medal className="w-3.5 h-3.5 text-slate-300" /> #2 Silver
                        </span>
                      ) : player.rank === 3 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-700/20 px-2 py-0.5 rounded-full border border-amber-700/40">
                          <Award className="w-3.5 h-3.5 text-amber-600" /> #3 Bronze
                        </span>
                      ) : (
                        <span className="text-slate-400">#{player.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 font-heading text-sm">
                      {player.player_name}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-amber-400 text-sm">
                      {player.points} PTS
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="text-emerald-400 font-bold">{player.wins}W</span> —{' '}
                      <span className="text-rose-400 font-bold">{player.losses}L</span> —{' '}
                      <span className="text-slate-400">{player.draws}D</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-cyan-300 font-bold">{player.win_rate}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {player.total_games}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Games Feed */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-heading font-bold text-sm text-slate-200">
              Recent Match History
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Live Database Feed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentGames.length === 0 ? (
            <div className="col-span-full py-6 text-center text-slate-500 font-mono text-xs">
              No recent matches logged yet.
            </div>
          ) : (
            recentGames.map((game) => (
              <div
                key={game.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{game.player_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      game.winner === 1
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : game.winner === 2
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {game.winner === 1 ? 'Human Won' : game.winner === 2 ? 'AI Won' : 'Draw'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  vs <strong className="text-cyan-400 capitalize">{game.player2_type}</strong> ({game.difficulty})
                </div>
                <div className="text-slate-500 text-[10px] flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>{game.moves_count} moves</span>
                  <span>{game.created_at ? new Date(game.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
