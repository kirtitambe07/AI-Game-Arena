/**
 * API client communicating with FastAPI backend via Vite proxy (/api).
 */

const BASE_URL = '/api';

export async function fetchAlgorithms() {
  const res = await fetch(`${BASE_URL}/algorithms`);
  if (!res.ok) throw new Error(`Failed to load algorithms: ${res.statusText}`);
  return res.json();
}

export async function fetchAiMove(board, player, algorithm, difficulty) {
  const res = await fetch(`${BASE_URL}/ai/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, player, algorithm, difficulty }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${res.status})`);
  }
  return res.json();
}

export async function fetchHint(board, player = 1) {
  const res = await fetch(`${BASE_URL}/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, player }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Could not compute hint');
  }
  return res.json();
}

export async function runSpeedBenchmark() {
  const res = await fetch(`${BASE_URL}/ai/benchmark/speed`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to execute speed benchmark');
  }
  return res.json();
}

export async function runTournamentBenchmark() {
  const res = await fetch(`${BASE_URL}/ai/benchmark/tournament`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to execute tournament');
  }
  return res.json();
}

export async function saveGame(gameRecord) {
  const res = await fetch(`${BASE_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameRecord),
  });
  if (!res.ok) {
    console.warn('Game save failed');
    return null;
  }
  return res.json();
}

export async function fetchRecentGames() {
  const res = await fetch(`${BASE_URL}/games`);
  if (!res.ok) throw new Error('Failed to fetch recent games');
  return res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch(`${BASE_URL}/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
