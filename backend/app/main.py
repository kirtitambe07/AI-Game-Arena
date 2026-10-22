"""AI Game Arena - FastAPI Backend Application.

Provides REST endpoints for:
- AI move computation (Minimax, Alpha-Beta, MCTS, Random)
- Algorithm metadata & college syllabus mapping
- Live speed & tournament benchmarks
- Game history & points leaderboard
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.ai import DIFFICULTY_PARAMS, get_ai_move
from app.benchmark import run_speed_benchmark, run_tournament
from app.db import (
    get_leaderboard,
    get_recent_games,
    init_db,
    save_game,
)
from app.game import Connect4, validate_board

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application startup and shutdown."""
    init_db()
    yield


app = FastAPI(
    title="AI Game Arena API",
    description="Full-stack Connect-4 with live AI search visualization (Minimax, Alpha-Beta, MCTS)",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------

class MoveRequest(BaseModel):
    board: List[int] = Field(..., description="Flat list of 42 cells (0=empty, 1=P1, 2=P2)")
    player: int = Field(..., ge=1, le=2, description="Active player (1 or 2)")
    algorithm: str = Field("alphabeta", description="minimax, alphabeta, mcts, random")
    difficulty: str = Field("medium", description="beginner, easy, medium, hard")


class SaveGameRequest(BaseModel):
    player_name: str = "Player 1"
    winner: int = Field(..., ge=0, le=2, description="0=draw, 1=P1, 2=P2")
    player1_type: str = "human"
    player2_type: str = "alphabeta"
    difficulty: str = "medium"
    moves_count: int = 0
    moves_history: List[int] = []


class HintRequest(BaseModel):
    board: List[int]
    player: int = 1


# ----------------------------------------------------------------------------
# Algorithm Metadata (College AI Syllabus Unit Mapping)
# ----------------------------------------------------------------------------

ALGORITHM_METADATA = [
    {
        "id": "alphabeta",
        "name": "Alpha-Beta Pruning",
        "syllabus_unit": "Unit III: Adversarial Search (Heuristic Pruning)",
        "unit_number": 3,
        "description": "Optimized adversarial minimax search that maintains [alpha, beta] window bounds. Dynamically cuts off branches that cannot influence the final decision, guaranteeing identical results to Minimax while searching up to exponentially fewer nodes.",
        "difficulty_levels": {
            "beginner": {"depth": 1, "label": "Depth 1 (Instant)"},
            "easy": {"depth": 2, "label": "Depth 2 (Tactical)"},
            "medium": {"depth": 4, "label": "Depth 4 (Strategic)"},
            "hard": {"depth": 6, "label": "Depth 6 (Expert)"},
        },
        "time_complexity": "O(b^(d/2)) with optimal move ordering",
        "space_complexity": "O(b * d) recursion stack",
        "pros": [
            "Exact minimax values guaranteed",
            "Cuts off vast subtrees via branch bounding",
            "Performs deeper lookahead in real time",
        ],
        "cons": [
            "Performance depends heavily on move ordering",
            "Evaluation heuristic needed at horizon leaf nodes",
        ],
    },
    {
        "id": "minimax",
        "name": "Minimax Search",
        "syllabus_unit": "Unit III: Adversarial Search (Game Theory & Zero-Sum Games)",
        "unit_number": 3,
        "description": "Classic recursive decision rule for two-player zero-sum games. Assumes the opponent plays optimally to minimize our outcome while we maximize ours. Exhaustively searches all legal branches up to the fixed depth horizon.",
        "difficulty_levels": {
            "beginner": {"depth": 1, "label": "Depth 1 (1-ply)"},
            "easy": {"depth": 2, "label": "Depth 2 (2-ply)"},
            "medium": {"depth": 3, "label": "Depth 3 (3-ply)"},
            "hard": {"depth": 4, "label": "Depth 4 (4-ply)"},
        },
        "time_complexity": "O(b^d) where b is branching factor (~7)",
        "space_complexity": "O(b * d) call stack",
        "pros": [
            "Theoretically optimal play under known horizon",
            "Clear conceptual model of game theory",
            "Exhaustive proof of all candidate moves",
        ],
        "cons": [
            "Combinatorial explosion at higher depths",
            "Wastes computation exploring unpromising subtrees",
        ],
    },
    {
        "id": "mcts",
        "name": "Monte Carlo Tree Search (MCTS)",
        "syllabus_unit": "Unit III / Unit IV: Planning & Stochastic Search",
        "unit_number": 3,
        "description": "Simulation-driven search algorithm that builds an asymmetric tree using the Upper Confidence Bound for Trees (UCB1). Balances exploitation of winning paths with exploration of less-visited branches without needing a heuristic function.",
        "difficulty_levels": {
            "beginner": {"simulations": 40, "label": "40 Simulations"},
            "easy": {"simulations": 200, "label": "200 Simulations"},
            "medium": {"simulations": 800, "label": "800 Simulations"},
            "hard": {"simulations": 2500, "label": "2,500 Simulations"},
        },
        "time_complexity": "O(N * L) where N is simulations, L is rollout length",
        "space_complexity": "O(Tree Nodes) in memory",
        "pros": [
            "Heuristic-free: learns directly from simulated outcomes",
            "Anytime algorithm: can halt at any time budget",
            "Asymmetric growth focuses heavily on promising moves",
        ],
        "cons": [
            "Tactical blind spots with low simulation budgets",
            "Stochastic rollouts can have variance",
        ],
    },
    {
        "id": "random",
        "name": "Random Baseline Agent",
        "syllabus_unit": "Unit I: Agents and Environments (Simple Reflex Baseline)",
        "unit_number": 1,
        "description": "Stochastic baseline agent that samples uniformly from available legal columns. Serves as a reference standard to demonstrate heuristic learning efficiency.",
        "difficulty_levels": {
            "beginner": {"label": "Uniform Random"},
            "easy": {"label": "Uniform Random"},
            "medium": {"label": "Uniform Random"},
            "hard": {"label": "Uniform Random"},
        },
        "time_complexity": "O(1)",
        "space_complexity": "O(1)",
        "pros": ["Zero computational latency", "Provides statistical baseline"],
        "cons": ["No lookahead or goal directedness"],
    },
]


# ----------------------------------------------------------------------------
# API Endpoints
# ----------------------------------------------------------------------------

@app.get("/api/algorithms")
def get_algorithms():
    """Return algorithm metadata, descriptions, difficulty parameters, and syllabus mapping."""
    return {
        "algorithms": ALGORITHM_METADATA,
        "syllabus": [
            {
                "unit": "Unit I",
                "title": "Agents & Environments",
                "topics": "PEAS representation, Rational Agent Concept, Simple Reflex Baseline",
            },
            {
                "unit": "Unit II",
                "title": "Heuristics & State Evaluation",
                "topics": "69-Window Evaluation Heuristic, Center Column Control, Feature Weighting",
            },
            {
                "unit": "Unit III",
                "title": "Adversarial Search & Decision Making",
                "topics": "Minimax Algorithm, Alpha-Beta Pruning Bounds, Monte Carlo Tree Search (UCB1)",
            },
        ],
    }


@app.post("/api/ai/move")
def post_ai_move(req: MoveRequest):
    """Compute and return next AI move with 2-ply search tree and metrics.

    Validates board physics, gravity, and game status.
    Returns 400 error for invalid boards, finished games, or full boards.
    """
    # 1. Physics and Gravity validation
    try:
        validate_board(req.board)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid board configuration: {str(e)}",
        )

    game = Connect4(req.board)

    # 2. Finished game check
    current_winner = game.winner()
    if current_winner != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Game is already finished. Player {current_winner} has won.",
        )

    # 3. Full board check
    if game.is_full():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Board is full. Game is a draw.",
        )

    # 4. Compute AI move
    try:
        result = get_ai_move(
            board=game,
            player=req.player,
            algorithm=req.algorithm,
            difficulty=req.difficulty,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI calculation error: {str(e)}",
        )


@app.post("/api/hint")
def get_hint(req: HintRequest):
    """Provide intelligent hint for the human player using deep Alpha-Beta search."""
    try:
        validate_board(req.board)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    game = Connect4(req.board)
    if game.winner() != 0 or game.is_full():
        raise HTTPException(status_code=400, detail="No moves available")

    # Use Alpha-Beta depth 5 for high-quality human hint
    ai_res = get_ai_move(game, player=req.player, algorithm="alphabeta", difficulty="medium")
    best_col = ai_res["move"]
    best_score = ai_res["stats"]["best_score"]

    if best_score >= 900_000:
        reasoning = f"Column {best_col + 1} guarantees an immediate or forced win!"
    elif best_score <= -900_000:
        reasoning = f"Column {best_col + 1} delays opponent threat; defensive play required."
    elif best_col == 3:
        reasoning = f"Column 4 controls the center file, unlocking maximum diagonal and horizontal 4-windows."
    else:
        reasoning = f"Column {best_col + 1} maximizes heuristic window control and future board expansion."

    return {
        "recommended_col": best_col,
        "score": best_score,
        "reasoning": reasoning,
        "columns": ai_res["columns"],
    }


@app.post("/api/ai/benchmark/speed")
def benchmark_speed():
    """Run Minimax vs Alpha-Beta speed & correctness test across depths 1..5."""
    try:
        results = run_speed_benchmark()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speed benchmark error: {str(e)}")


@app.post("/api/ai/benchmark/tournament")
def benchmark_tournament():
    """Run round-robin tournament between Random, Minimax, Alpha-Beta, and MCTS."""
    try:
        results = run_tournament()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tournament benchmark error: {str(e)}")


@app.post("/api/games")
def create_game(req: SaveGameRequest):
    """Record completed game outcome to database."""
    try:
        game_id = save_game(
            player_name=req.player_name,
            winner=req.winner,
            player1_type=req.player1_type,
            player2_type=req.player2_type,
            difficulty=req.difficulty,
            moves_count=req.moves_count,
            moves_history=req.moves_history,
        )
        return {"id": game_id, "status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database save error: {str(e)}")


@app.get("/api/games")
def list_games(limit: int = 20):
    """Retrieve list of recent games."""
    return {"games": get_recent_games(limit=limit)}


@app.get("/api/leaderboard")
def get_player_leaderboard():
    """Retrieve leaderboard ranking of human players based on AI difficulty points."""
    return {"leaderboard": get_leaderboard()}
