from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_algorithms():
    """Verify algorithms metadata endpoint returns all 4 algorithms and syllabus."""
    response = client.get("/api/algorithms")
    assert response.status_code == 200
    data = response.json()
    assert "algorithms" in data
    assert len(data["algorithms"]) == 4
    algo_ids = [a["id"] for a in data["algorithms"]]
    assert "alphabeta" in algo_ids
    assert "minimax" in algo_ids
    assert "mcts" in algo_ids
    assert "random" in algo_ids
    assert "syllabus" in data


def test_ai_move_valid():
    """Verify move endpoint responds with legal column, stats, and 2-ply tree."""
    board = [0] * 42
    # Player 1 played center (row 5, col 3)
    board[5 * 7 + 3] = 1

    payload = {
        "board": board,
        "player": 2,
        "algorithm": "alphabeta",
        "difficulty": "easy",
    }
    response = client.post("/api/ai/move", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["move"] in range(7)
    assert res["algorithm"] == "alphabeta"
    assert "stats" in res
    assert "columns" in res
    assert len(res["columns"]) == 7
    assert "tree" in res


def test_ai_move_rejects_floating_disc():
    """Verify endpoint rejects floating disc with 400 Bad Request."""
    board = [0] * 42
    # Floating disc at row 2, col 3 with empty cells below it
    board[2 * 7 + 3] = 1

    payload = {
        "board": board,
        "player": 2,
        "algorithm": "alphabeta",
        "difficulty": "easy",
    }
    response = client.post("/api/ai/move", json=payload)
    assert response.status_code == 400
    assert "floating disc" in response.json()["detail"].lower()


def test_ai_move_rejects_finished_game():
    """Verify endpoint rejects move requests on already finished games with 400."""
    board = [0] * 42
    # Player 1 has 4 discs in a horizontal row on bottom row 5 (cols 0, 1, 2, 3)
    # Player 2 has 3 discs on row 4 (cols 0, 1, 2)
    # Total P1 = 4, P2 = 3 (valid count balance and valid gravity)
    for c in range(4):
        board[5 * 7 + c] = 1
    for c in range(3):
        board[4 * 7 + c] = 2

    payload = {
        "board": board,
        "player": 2,
        "algorithm": "alphabeta",
        "difficulty": "easy",
    }
    response = client.post("/api/ai/move", json=payload)
    assert response.status_code == 400
    assert "already finished" in response.json()["detail"].lower()


def test_game_save_and_leaderboard():
    """Verify saving a game and checking leaderboard updates points."""
    save_payload = {
        "player_name": "TestHero",
        "winner": 1,
        "player1_type": "human",
        "player2_type": "alphabeta",
        "difficulty": "medium",
        "moves_count": 12,
        "moves_history": [3, 3, 2, 4, 1, 5],
    }
    res_save = client.post("/api/games", json=save_payload)
    assert res_save.status_code == 200
    assert "id" in res_save.json()

    # Fetch recent games
    res_games = client.get("/api/games")
    assert res_games.status_code == 200
    assert len(res_games.json()["games"]) >= 1

    # Fetch leaderboard
    res_lead = client.get("/api/leaderboard")
    assert res_lead.status_code == 200
    leaderboard = res_lead.json()["leaderboard"]
    assert any(p["player_name"] == "TestHero" for p in leaderboard)
