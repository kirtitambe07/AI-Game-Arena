# 🎮 AI Game Arena — Connect-4 Adversarial Search & Heuristic Visualizer

A college Artificial Intelligence coursework project demonstrating **adversarial search** (Unit III), **heuristic state evaluation** (Unit II), and **rational agents** (Unit I). Built with high-performance algorithms implemented completely from scratch without external game-AI libraries.

Features live visualization of the AI's reasoning: an **SVG 2-ply game tree**, **per-column strategic evaluations**, **animated search telemetry**, **automated empirical benchmarks**, an **AI vs AI exhibition arena**, and a **points-based Hall of Fame leaderboard**.

---

## ⚡ Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLite (Python stdlib `sqlite3`), Pytest, Uvicorn
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Canvas Confetti
- **Audio**: Web Audio API procedural synthesizer (zero audio asset dependencies, instantaneous arcade feedback)
- **Networking**: Vite reverse proxy (`/api` ➔ `http://localhost:8000`)

---

## 🚀 Quickstart & Setup

### 1. Backend Setup & Run

```bash
cd ai-game-arena/backend

# (Optional) create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run pytest test suite
pytest

# Start FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI documentation will be accessible at: `http://localhost:8000/docs`

---

### 2. Frontend Setup & Run

```bash
cd ai-game-arena/frontend

# Install node dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```
Open your browser at `http://localhost:5173`. The Vite proxy will route all `/api/*` calls directly to the FastAPI server at `http://localhost:8000`.

---

## 🧠 Syllabus Mapping

This project maps directly to standard university Artificial Intelligence syllabi:

| Syllabus Module | Concepts Covered | Implementation in AI Game Arena |
| :--- | :--- | :--- |
| **Unit I: Agents & Environments** | • PEAS Framework<br>• Rational Agent Concept<br>• Simple Reflex Baseline | • **P**: Win (+1), Draw (0), Loss (-1)<br>• **E**: 6×7 zero-sum discrete Connect-4 grid<br>• **A**: Drop disc in columns 0–6<br>• **S**: Flat 42-cell array representation<br>• **Random Baseline Agent**: Uniform stochastic sampling |
| **Unit II: Heuristics & State Evaluation** | • Heuristic Evaluation Functions<br>• Feature Weighting<br>• Central File Control | • **69-Window Heuristic**: Scans all 69 possible 4-in-a-row lines (24 horizontal, 21 vertical, 12 down-right, 12 up-right)<br>• **Scoring Rules**:<br>&nbsp;&nbsp;+ 3 mine + 1 empty = **+5**<br>&nbsp;&nbsp;+ 2 mine + 2 empty = **+2**<br>&nbsp;&nbsp;+ 3 opponent + 1 empty = **-4**<br>&nbsp;&nbsp;+ Center column discs = **+3** |
| **Unit III: Adversarial Search** | • Zero-Sum Minimax Theorem<br>• Alpha-Beta Branch Pruning<br>• Upper-Bound Detection<br>• Monte Carlo Tree Search (MCTS)<br>• UCB1 Exploration vs Exploitation | • **Minimax**: Exhaustive depth-limited search with in-place play/undo and leaf evaluation<br>• **Alpha-Beta**: Depth-limited search with $[\alpha, \beta]$ branch bounding and center-first move ordering (`[3, 2, 4, 1, 5, 0, 6]`)<br>• **Upper-Bound Root Flagging**: Sub-optimal root choices flagged as bounds<br>• **MCTS**: Asymmetric tree growth using $UCB1 = \frac{W_i}{N_i} + c\sqrt{\frac{\ln N_p}{N_i}}$ ($c=1.41$) |

---

## 🔍 Algorithms Implemented From Scratch

### 1. Minimax (No Pruning)
- **Concept**: Recursively expands all legal game paths up to depth $d$. Assumes optimal play from both sides.
- **Terminal Win**: $+1,000,000 + \text{depth}$ (encourages finding the fastest win).
- **Terminal Loss**: $-1,000,000 - \text{depth}$ (encourages delaying inevitable defeat).
- **Complexity**: $O(b^d)$ time, $O(b \cdot d)$ space, where $b \approx 7$.

### 2. Alpha-Beta Pruning
- **Concept**: Maintains two values:
  - $\alpha$: Highest score guaranteed to the Maximizer so far.
  - $\beta$: Lowest score guaranteed to the Minimizer so far.
- **Cutoffs**: When $\beta \le \alpha$, the opponent would never allow this state to be reached. The subtree is immediately pruned.
- **Move Ordering**: Explores columns in center-first order (`[3, 2, 4, 1, 5, 0, 6]`), enabling optimal pruning down to $O(b^{d/2})$.
- **Root Upper Bound (`bound: true`)**: At the root, any column evaluation that does not strictly beat the current best score has undergone cutoffs; its returned value is an upper bound on that column's true minimax value.

### 3. Monte Carlo Tree Search (MCTS)
- **Concept**: Simulation-driven decision algorithm building an asymmetric tree.
- **Phases**:
  1. **Selection**: Traverses from root using UCB1 balance:
     $$UCB1 = \frac{W_i}{N_i} + 1.41 \sqrt{\frac{\ln N_{\text{parent}}}{N_i}}$$
  2. **Expansion**: Adds an untried legal column to the search tree.
  3. **Rollout (Simulation)**: Plays fast biased random moves until terminal state.
  4. **Backpropagation**: Propagates outcome (+1.0 for win, +0.5 for draw, 0.0 for loss) up the ancestral path.
- **Decision**: Selects the child with the highest visit count $N_i$ (robust child criterion).

### 4. Random Baseline Agent
- Uniformly chooses among legal non-full columns. Serves as experimental control.

---

## 📊 Difficulty Levels

| Algorithm | Beginner | Easy | Medium | Hard |
| :--- | :---: | :---: | :---: | :---: |
| **Minimax** | Depth 1 | Depth 2 | Depth 3 | Depth 4 |
| **Alpha-Beta** | Depth 1 | Depth 2 | Depth 4 | Depth 6 (under ~200ms) |
| **MCTS** | 40 Sims | 200 Sims | 800 Sims | 2,500 Sims |
| **Random** | 1 Sim | 1 Sim | 1 Sim | 1 Sim |

---

## 📡 REST API Specification

### `GET /api/algorithms`
Returns algorithm metadata, Big-O complexities, descriptions, and university syllabus topics.

### `POST /api/ai/move`
Calculates AI move and 2-ply search tree for live visualization.
- **Request Body**:
  ```json
  {
    "board": [0, 0, ..., 1, 2],
    "player": 2,
    "algorithm": "alphabeta",
    "difficulty": "medium"
  }
  ```
- **Validation**:
  - Exactly 42 integers in `{0, 1, 2}`.
  - Gravity check: no floating discs (rejects with `400 Bad Request`).
  - Finished game check: cannot move if game already won (`400 Bad Request`).
  - Full board check: cannot move if draw (`400 Bad Request`).
- **Response**:
  ```json
  {
    "move": 3,
    "algorithm": "alphabeta",
    "difficulty": "medium",
    "params": { "depth": 4 },
    "stats": {
      "nodes": 452,
      "pruned": 189,
      "time_ms": 28.4,
      "depth": 4,
      "simulations": 0,
      "max_tree_depth": 4,
      "best_score": 15
    },
    "columns": [
      { "col": 0, "legal": true, "score": -10, "norm": 0.25, "label": "-10", "bound": true, "visits": 0, "win_rate": 0.0 }
    ],
    "tree": {
      "move": null,
      "score": 15,
      "pruned": false,
      "children": [ ... ]
    }
  }
  ```

### `POST /api/hint`
Calls Alpha-Beta at Depth 5 from the player's perspective to provide strategic column recommendations and natural language explanations.

### `POST /api/ai/benchmark/speed`
Executes fixed mid-game test boards at depths 1..5 for Minimax and Alpha-Beta, validating score identity and computing node savings percentages. Tests MCTS scaling across 100, 300, and 1,000 simulations.

### `POST /api/ai/benchmark/tournament`
Runs a 12-match round-robin tournament between Random, Minimax(d3), Alpha-Beta(d4), and MCTS(300) with randomized opening plies. Returns win rates, node statistics, and match history.

### `POST /api/games` & `GET /api/games`
Saves and retrieves match history in SQLite (`arena.db`).

### `GET /api/leaderboard`
Returns ranked leaderboard by points:
- Win on Beginner: **1 pt**
- Win on Easy: **2 pts**
- Win on Medium: **4 pts**
- Win on Hard: **7 pts**
- Draw: **1 pt**

---

## 🧪 Test Suite

Run all unit and integration tests:
```bash
cd ai-game-arena/backend
pytest -v
```

Verified test coverage:
1. `test_horizontal_win`, `test_vertical_win`, `test_diagonal_down_right_win`, `test_diagonal_up_right_win` (all 4 win directions).
2. `test_ai_takes_immediate_win` (Minimax, Alpha-Beta, MCTS seize immediate 4-in-a-row).
3. `test_ai_blocks_immediate_loss` (AI detects opponent 3-in-a-row and blocks).
4. `test_minimax_and_alphabeta_same_best_score_and_fewer_nodes` (verifies Alpha-Beta scores are identical to Minimax while exploring significantly fewer nodes and recording branch cuts).
5. `test_hard_alphabeta_speed` (verifies Depth 6 Alpha-Beta finishes in under 3 seconds).
6. `test_gravity_validation` (verifies floating discs are detected and rejected).
7. `test_api_*` (smoke test endpoints: `/api/algorithms`, `/api/ai/move`, 400 validation on floating discs and finished games, leaderboard persistence).

---

## 🎨 Design Direction

- **Dark Neon Arcade Aesthetic**: Deep space indigo background (`#070913`), neon cyan accents (`#00f0ff`) for AI agents, and warm electric coral/amber (`#ff7043`) for human players.
- **Glassmorphism**: Backdrop blur cards with luminous neon borders and soft drop shadows.
- **Typography**: Space Grotesk for arcade headers, JetBrains Mono for telemetry metrics, and Inter for clean body copy.
- **Responsive Physical Board**: SVG Connect-4 board using a 2D cut-out mask with realistic depth bevels, spring gravity animations, ghost disc hovering, and confetti celebrations.
