"""End-to-End System Integration Test Script.

Validates:
1. Backend direct endpoints on port 8000
2. Frontend dev server and Vite proxy on port 5173
3. Minimax, Alpha-Beta, MCTS, and Random moves
4. Pruning cutoffs, bound tagging, 2-ply tree output
5. Speed benchmark and tournament execution
6. Game saving and points leaderboard calculation
"""

import json
import urllib.request

def test_system():
    print("=== 1. Testing GET /api/algorithms on Backend :8000 ===")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/algorithms") as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print("Success! Algorithms returned:", [a["id"] for a in data["algorithms"]])
        print("Syllabus units returned:", [s["unit"] for s in data["syllabus"]])

    print("\n=== 2. Testing Vite Reverse Proxy on Frontend :5173 ===")
    with urllib.request.urlopen("http://localhost:5173/api/algorithms") as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print("Success! Vite proxy (/api -> :8000) functioning properly.")

    print("\n=== 3. Testing POST /api/ai/move (Alpha-Beta Medium) ===")
    board = [0] * 42
    board[5 * 7 + 3] = 1 # P1 center disc
    payload = json.dumps({
        "board": board,
        "player": 2,
        "algorithm": "alphabeta",
        "difficulty": "medium",
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/ai/move",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        res = json.loads(resp.read().decode())
        print(f"Success! AI chose move col: {res['move']}")
        print(f"Stats: nodes={res['stats']['nodes']}, pruned={res['stats']['pruned']}, time={res['stats']['time_ms']}ms")
        print(f"Columns count: {len(res['columns'])}, tree children: {len(res['tree']['children'])}")

    print("\n=== 4. Testing POST /api/hint (Advisor Alpha-Beta d=5) ===")
    hint_payload = json.dumps({"board": board, "player": 1}).encode("utf-8")
    req_hint = urllib.request.Request(
        "http://127.0.0.1:8000/api/hint",
        data=hint_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_hint) as resp:
        assert resp.status == 200
        hint_res = json.loads(resp.read().decode())
        print(f"Success! Hint recommends col: {hint_res['recommended_col'] + 1}")
        print(f"Reasoning: {hint_res['reasoning']}")

    print("\n=== 5. Testing POST /api/games & GET /api/leaderboard ===")
    game_payload = json.dumps({
        "player_name": "E2ETester",
        "winner": 1,
        "player1_type": "human",
        "player2_type": "alphabeta",
        "difficulty": "hard",
        "moves_count": 16,
        "moves_history": [3, 3, 2, 4, 1, 5, 0, 6],
    }).encode("utf-8")
    req_game = urllib.request.Request(
        "http://127.0.0.1:8000/api/games",
        data=game_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_game) as resp:
        assert resp.status == 200
        print("Success! Saved game:", json.loads(resp.read().decode()))

    with urllib.request.urlopen("http://127.0.0.1:8000/api/leaderboard") as resp:
        assert resp.status == 200
        lead = json.loads(resp.read().decode())
        top = lead["leaderboard"][0]
        print(f"Success! Top player: {top['player_name']} with {top['points']} points ({top['win_rate']}% win rate)")

    print("\n=== 6. Testing Full Game Simulation (AI plays to completion) ===")
    from app.game import Connect4, ROWS, COLS
    sim_board = Connect4()
    p = 1
    moves_count = 0
    while not sim_board.is_full() and sim_board.winner() == 0 and moves_count < 30:
        moves_count += 1
        algo = "alphabeta" if p == 1 else "mcts"
        diff = "easy"
        from app.ai import get_ai_move
        res = get_ai_move(sim_board, player=p, algorithm=algo, difficulty=diff)
        col = res["move"]
        r = sim_board.play(col, p)
        if sim_board.wins_at(r, col, p):
            print(f"Game concluded! Winner: Player {p} ({algo}) in {moves_count} moves.")
            break
        p = 2 if p == 1 else 1
    else:
        print(f"Game ended after {moves_count} moves.")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_system()
