"""SQLite Database Layer for AI Game Arena.

Stores games, leaderboard point aggregation, and benchmark results.
"""

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).parent.parent / "arena.db"

DIFFICULTY_POINTS = {
    "beginner": 1,
    "easy": 2,
    "medium": 4,
    "hard": 7,
}


def get_connection() -> sqlite3.Connection:
    """Get SQLite database connection with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize database tables if they do not exist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL DEFAULT 'Player 1',
                winner INTEGER NOT NULL, -- 0=draw, 1=P1, 2=P2
                player1_type TEXT NOT NULL,
                player2_type TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                moves_count INTEGER NOT NULL,
                moves_history TEXT NOT NULL, -- JSON array of column integers
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS benchmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                benchmark_type TEXT NOT NULL, -- 'speed' or 'tournament'
                data TEXT NOT NULL, -- JSON payload
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


def save_game(
    player_name: str,
    winner: int,
    player1_type: str,
    player2_type: str,
    difficulty: str,
    moves_count: int,
    moves_history: List[int],
) -> int:
    """Save completed game record to database."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO games (player_name, winner, player1_type, player2_type, difficulty, moves_count, moves_history)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                player_name.strip() or "Player 1",
                winner,
                player1_type,
                player2_type,
                difficulty,
                moves_count,
                json.dumps(moves_history),
            ),
        )
        conn.commit()
        return cursor.lastrowid or 0


def get_recent_games(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve list of recent games."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, player_name, winner, player1_type, player2_type, difficulty, moves_count, moves_history, created_at
            FROM games
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "player_name": r["player_name"],
            "winner": r["winner"],
            "player1_type": r["player1_type"],
            "player2_type": r["player2_type"],
            "difficulty": r["difficulty"],
            "moves_count": r["moves_count"],
            "moves_history": json.loads(r["moves_history"]) if r["moves_history"] else [],
            "created_at": r["created_at"],
        })
    return results


def get_leaderboard() -> List[Dict[str, Any]]:
    """Calculate and return human player leaderboard by points.

    Points system:
    - Win on beginner: 1 pt
    - Win on easy: 2 pts
    - Win on medium: 4 pts
    - Win on hard: 7 pts
    - Draw against any AI: 1 pt
    """
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT player_name, winner, difficulty
            FROM games
            WHERE player1_type = 'human'
            """
        )
        rows = cursor.fetchall()

    players: Dict[str, Dict[str, Any]] = {}

    for r in rows:
        name = r["player_name"] or "Anonymous"
        winner = r["winner"]
        diff = (r["difficulty"] or "medium").lower()

        if name not in players:
            players[name] = {
                "player_name": name,
                "points": 0,
                "wins": 0,
                "losses": 0,
                "draws": 0,
                "total_games": 0,
            }

        rec = players[name]
        rec["total_games"] += 1

        if winner == 1:
            rec["wins"] += 1
            rec["points"] += DIFFICULTY_POINTS.get(diff, 2)
        elif winner == 0:
            rec["draws"] += 1
            rec["points"] += 1
        else:
            rec["losses"] += 1

    leaderboard = list(players.values())
    for item in leaderboard:
        item["win_rate"] = (
            round((item["wins"] / item["total_games"]) * 100, 1)
            if item["total_games"] > 0
            else 0.0
        )

    # Sort primarily by points descending, secondarily by win_rate descending
    leaderboard.sort(key=lambda x: (x["points"], x["win_rate"], x["wins"]), reverse=True)

    # Add ranks
    for idx, item in enumerate(leaderboard, start=1):
        item["rank"] = idx

    return leaderboard


def save_benchmark(benchmark_type: str, data: Dict[str, Any]) -> int:
    """Store benchmark execution results in SQLite."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO benchmarks (benchmark_type, data)
            VALUES (?, ?)
            """,
            (benchmark_type, json.dumps(data)),
        )
        conn.commit()
        return cursor.lastrowid or 0


def get_latest_benchmark(benchmark_type: str) -> Optional[Dict[str, Any]]:
    """Retrieve most recent benchmark payload for given type."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT data, created_at
            FROM benchmarks
            WHERE benchmark_type = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (benchmark_type,),
        )
        row = cursor.fetchone()

    if row:
        payload = json.loads(row["data"])
        payload["timestamp"] = row["created_at"]
        return payload
    return None
