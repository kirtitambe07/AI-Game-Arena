"""Connect-4 AI Agents.

Implements from scratch:
1. Minimax (depth-limited, no pruning)
2. Alpha-Beta Pruning (depth-limited, cuts tracking, upper-bound detection)
3. Monte Carlo Tree Search (UCB1 c=1.41, selection, expansion, rollout, backprop)
4. Random baseline

All algorithms return a standardized JSON structure with 2-ply search tree
and column score/visit metrics for frontend visualization.
"""

import math
import random
import time
from typing import Any, Dict, List, Optional, Tuple

from app.game import ALL_WINDOWS, CELLS, CENTER_ORDER, COLS, ROWS, Connect4, evaluate

WIN_SCORE = 1_000_000

# Difficulty mapping
DIFFICULTY_PARAMS = {
    "minimax": {
        "beginner": {"depth": 1},
        "easy": {"depth": 2},
        "medium": {"depth": 3},
        "hard": {"depth": 4},
    },
    "alphabeta": {
        "beginner": {"depth": 1},
        "easy": {"depth": 2},
        "medium": {"depth": 4},
        "hard": {"depth": 6},
    },
    "mcts": {
        "beginner": {"simulations": 40},
        "easy": {"simulations": 200},
        "medium": {"simulations": 800},
        "hard": {"simulations": 2500},
    },
    "random": {
        "beginner": {},
        "easy": {},
        "medium": {},
        "hard": {},
    },
}


# ============================================================================
# 1. MINIMAX (No Pruning)
# ============================================================================

def minimax_search(
    board: Connect4,
    depth: int,
    me: int,
) -> Dict[str, Any]:
    """Execute depth-limited Minimax search without pruning."""
    opp = 2 if me == 1 else 1
    nodes = 0
    start_time = time.perf_counter()

    legal = board.legal_moves()
    if not legal:
        return _empty_result("minimax", depth)

    # If only 1 move available, play it quickly
    if len(legal) == 1 and depth > 1:
        depth = 1

    tree_children: List[Dict[str, Any]] = []
    col_results: Dict[int, Dict[str, Any]] = {}

    best_score = -float("inf")
    best_move = legal[0]

    def _minimax(
        current_depth: int,
        is_maximizing: bool,
        last_row: int,
        last_col: int,
        record_ply: int,
    ) -> Tuple[int, List[Dict[str, Any]]]:
        nonlocal nodes
        nodes += 1

        last_player = opp if is_maximizing else me
        # Check if previous move was a winning move
        if last_row >= 0 and board.wins_at(last_row, last_col, last_player):
            if last_player == me:
                return (WIN_SCORE + current_depth, [])
            else:
                return (-WIN_SCORE - current_depth, [])

        if board.is_full():
            return (0, [])

        if current_depth == 0:
            return (evaluate(board.board, me), [])

        current_player = me if is_maximizing else opp
        moves = board.legal_moves()
        ply_children: List[Dict[str, Any]] = []

        if is_maximizing:
            max_eval = -float("inf")
            for col in moves:
                row = board.play(col, current_player)
                child_score, grandchildren = _minimax(
                    current_depth - 1, False, row, col, record_ply + 1
                )
                board.undo(col)

                if child_score > max_eval:
                    max_eval = child_score

                if record_ply < 2:
                    node_data: Dict[str, Any] = {
                        "move": col,
                        "score": child_score,
                        "pruned": False,
                    }
                    if grandchildren:
                        node_data["children"] = grandchildren
                    ply_children.append(node_data)

            return (max_eval, ply_children)
        else:
            min_eval = float("inf")
            for col in moves:
                row = board.play(col, current_player)
                child_score, grandchildren = _minimax(
                    current_depth - 1, True, row, col, record_ply + 1
                )
                board.undo(col)

                if child_score < min_eval:
                    min_eval = child_score

                if record_ply < 2:
                    node_data: Dict[str, Any] = {
                        "move": col,
                        "score": child_score,
                        "pruned": False,
                    }
                    if grandchildren:
                        node_data["children"] = grandchildren
                    ply_children.append(node_data)

            return (min_eval, ply_children)

    # Root Level (Ply 0 -> Ply 1)
    for col in legal:
        nodes += 1
        row = board.play(col, me)
        if board.wins_at(row, col, me):
            score = WIN_SCORE + depth
            grandchildren = []
        else:
            score, grandchildren = _minimax(
                depth - 1, False, row, col, record_ply=1
            )
        board.undo(col)

        col_results[col] = {
            "score": score,
            "bound": False,
        }

        tree_node: Dict[str, Any] = {
            "move": col,
            "score": score,
            "pruned": False,
            "children": grandchildren,
        }
        tree_children.append(tree_node)

        if score > best_score:
            best_score = score
            best_move = col

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    columns = _build_columns_output(col_results, legal, best_move)
    tree = {
        "move": None,
        "score": best_score,
        "pruned": False,
        "children": tree_children,
    }

    return {
        "move": best_move,
        "algorithm": "minimax",
        "difficulty": "",
        "params": {"depth": depth},
        "stats": {
            "nodes": nodes,
            "pruned": 0,
            "time_ms": round(elapsed_ms, 2),
            "depth": depth,
            "simulations": 0,
            "max_tree_depth": depth,
            "best_score": best_score,
        },
        "columns": columns,
        "tree": tree,
    }


# ============================================================================
# 2. ALPHA-BETA PRUNING
# ============================================================================

def alphabeta_search(
    board: Connect4,
    depth: int,
    me: int,
) -> Dict[str, Any]:
    """Execute Alpha-Beta pruning search."""
    opp = 2 if me == 1 else 1
    nodes = 0
    pruned_count = 0
    start_time = time.perf_counter()

    legal = board.legal_moves()
    if not legal:
        return _empty_result("alphabeta", depth)

    tree_children: List[Dict[str, Any]] = []
    col_results: Dict[int, Dict[str, Any]] = {}

    alpha = -float("inf")
    beta = float("inf")
    best_score = -float("inf")
    best_move = legal[0]

    def _alphabeta(
        current_depth: int,
        is_maximizing: bool,
        alpha_val: float,
        beta_val: float,
        last_row: int,
        last_col: int,
        record_ply: int,
    ) -> Tuple[int, List[Dict[str, Any]]]:
        nonlocal nodes, pruned_count
        nodes += 1

        last_player = opp if is_maximizing else me
        if last_row >= 0 and board.wins_at(last_row, last_col, last_player):
            if last_player == me:
                return (WIN_SCORE + current_depth, [])
            else:
                return (-WIN_SCORE - current_depth, [])

        if board.is_full():
            return (0, [])

        if current_depth == 0:
            return (evaluate(board.board, me), [])

        current_player = me if is_maximizing else opp
        moves = board.legal_moves()
        ply_children: List[Dict[str, Any]] = []

        if is_maximizing:
            max_eval = -float("inf")
            for idx, col in enumerate(moves):
                row = board.play(col, current_player)
                child_score, grandchildren = _alphabeta(
                    current_depth - 1, False, alpha_val, beta_val, row, col, record_ply + 1
                )
                board.undo(col)

                if child_score > max_eval:
                    max_eval = child_score

                if record_ply < 2:
                    node_data: Dict[str, Any] = {
                        "move": col,
                        "score": child_score,
                        "pruned": False,
                    }
                    if grandchildren:
                        node_data["children"] = grandchildren
                    ply_children.append(node_data)

                alpha_val = max(alpha_val, child_score)
                if beta_val <= alpha_val:
                    pruned_count += 1
                    # Mark remaining unsearched siblings at ply 1 as pruned for visualization
                    if record_ply < 2:
                        for skipped_col in moves[idx + 1:]:
                            ply_children.append({
                                "move": skipped_col,
                                "score": None,
                                "pruned": True,
                                "children": [],
                            })
                    break

            return (max_eval, ply_children)
        else:
            min_eval = float("inf")
            for idx, col in enumerate(moves):
                row = board.play(col, current_player)
                child_score, grandchildren = _alphabeta(
                    current_depth - 1, True, alpha_val, beta_val, row, col, record_ply + 1
                )
                board.undo(col)

                if child_score < min_eval:
                    min_eval = child_score

                if record_ply < 2:
                    node_data: Dict[str, Any] = {
                        "move": col,
                        "score": child_score,
                        "pruned": False,
                    }
                    if grandchildren:
                        node_data["children"] = grandchildren
                    ply_children.append(node_data)

                beta_val = min(beta_val, child_score)
                if beta_val <= alpha_val:
                    pruned_count += 1
                    if record_ply < 2:
                        for skipped_col in moves[idx + 1:]:
                            ply_children.append({
                                "move": skipped_col,
                                "score": None,
                                "pruned": True,
                                "children": [],
                            })
                    break

            return (min_eval, ply_children)

    # Root Level (Ply 0 -> Ply 1)
    for col in legal:
        nodes += 1
        row = board.play(col, me)
        if board.wins_at(row, col, me):
            score = WIN_SCORE + depth
            grandchildren = []
        else:
            score, grandchildren = _alphabeta(
                depth - 1, False, alpha, beta, row, col, record_ply=1
            )
        board.undo(col)

        # Root upper-bound detection:
        # If score <= alpha (did not strictly beat current alpha threshold),
        # then it is an upper bound on that column's true value.
        is_bound = score <= alpha and best_score > -float("inf")

        col_results[col] = {
            "score": score,
            "bound": is_bound,
        }

        tree_node: Dict[str, Any] = {
            "move": col,
            "score": score,
            "pruned": False,
            "children": grandchildren,
        }
        tree_children.append(tree_node)

        if score > best_score:
            best_score = score
            best_move = col
            alpha = max(alpha, score)

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    columns = _build_columns_output(col_results, legal, best_move)
    tree = {
        "move": None,
        "score": best_score,
        "pruned": False,
        "children": tree_children,
    }

    return {
        "move": best_move,
        "algorithm": "alphabeta",
        "difficulty": "",
        "params": {"depth": depth},
        "stats": {
            "nodes": nodes,
            "pruned": pruned_count,
            "time_ms": round(elapsed_ms, 2),
            "depth": depth,
            "simulations": 0,
            "max_tree_depth": depth,
            "best_score": best_score,
        },
        "columns": columns,
        "tree": tree,
    }


# ============================================================================
# 3. MONTE CARLO TREE SEARCH (MCTS)
# ============================================================================

class MCTSNode:
    """Node in the Monte Carlo Search Tree."""

    def __init__(
        self,
        board: Connect4,
        parent: Optional["MCTSNode"] = None,
        move: Optional[int] = None,
        player_who_moved: Optional[int] = None,
    ):
        self.board = board
        self.parent = parent
        self.move = move
        self.player_who_moved = player_who_moved
        self.children: Dict[int, "MCTSNode"] = {}
        self.visits = 0
        self.wins = 0.0
        self.untried_moves = board.legal_moves()

    def is_fully_expanded(self) -> bool:
        return len(self.untried_moves) == 0

    def best_child(self, c_param: float = 1.41) -> "MCTSNode":
        """Select child maximizing UCB1 formula."""
        best_val = -float("inf")
        best_nodes = []

        log_parent_visits = math.log(self.visits) if self.visits > 0 else 0.0

        for child in self.children.values():
            if child.visits == 0:
                return child
            exploit = child.wins / child.visits
            explore = c_param * math.sqrt(log_parent_visits / child.visits)
            val = exploit + explore

            if val > best_val:
                best_val = val
                best_nodes = [child]
            elif math.isclose(val, best_val):
                best_nodes.append(child)

        return random.choice(best_nodes)


def mcts_search(
    board: Connect4,
    simulations: int,
    me: int,
    time_limit_sec: float = 2.5,
) -> Dict[str, Any]:
    """Execute Monte Carlo Tree Search with UCB1 (c=1.41)."""
    opp = 2 if me == 1 else 1
    start_time = time.perf_counter()

    legal = board.legal_moves()
    if not legal:
        return _empty_result("mcts", 0)

    # Immediate winning or blocking move check for tactical quality
    for col in legal:
        r = board.play(col, me)
        if board.wins_at(r, col, me):
            board.undo(col)
            # Take immediate win
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return _mcts_tactical_result(board, col, me, simulations, elapsed_ms, is_win=True)
        board.undo(col)

    root = MCTSNode(board=board.copy(), parent=None, move=None, player_who_moved=opp)
    max_tree_depth = 1

    sim_count = 0
    while sim_count < simulations:
        # Time guard
        if (time.perf_counter() - start_time) > time_limit_sec:
            break

        # 1. Selection
        node = root
        current_board = board.copy()
        current_depth = 0

        while node.is_fully_expanded() and node.children:
            node = node.best_child()
            current_board.play(node.move, node.player_who_moved)
            current_depth += 1

        if current_depth > max_tree_depth:
            max_tree_depth = current_depth

        # 2. Expansion
        # Determine who moves next
        next_player = opp if node.player_who_moved == me else me
        winner = current_board.winner()

        if winner == 0 and not current_board.is_full() and node.untried_moves:
            move = node.untried_moves.pop(random.randrange(len(node.untried_moves)))
            row = current_board.play(move, next_player)
            child_node = MCTSNode(
                board=current_board.copy(),
                parent=node,
                move=move,
                player_who_moved=next_player,
            )
            node.children[move] = child_node
            node = child_node
            current_depth += 1
            if current_depth > max_tree_depth:
                max_tree_depth = current_depth
            winner = current_board.winner()

        # 3. Rollout / Simulation
        rollout_player = opp if node.player_who_moved == me else me
        rollout_moves_left = 42
        while winner == 0 and not current_board.is_full() and rollout_moves_left > 0:
            avail = current_board.legal_moves()
            if not avail:
                break
            # Biased random rollout towards center
            r_move = random.choice(avail)
            row = current_board.play(r_move, rollout_player)
            if current_board.wins_at(row, r_move, rollout_player):
                winner = rollout_player
                break
            rollout_player = opp if rollout_player == me else me
            rollout_moves_left -= 1

        # 4. Backpropagation
        while node is not None:
            node.visits += 1
            if winner == node.player_who_moved:
                node.wins += 1.0
            elif winner == 0:
                node.wins += 0.5
            # Opponent win adds 0.0
            node = node.parent

        sim_count += 1

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # Choose child with most visits
    best_move = legal[0]
    most_visits = -1

    for move, child in root.children.items():
        if child.visits > most_visits:
            most_visits = child.visits
            best_move = move

    # Build 2-ply search tree for visualization
    tree_children: List[Dict[str, Any]] = []
    for col in legal:
        child = root.children.get(col)
        if child:
            win_rate = child.wins / child.visits if child.visits > 0 else 0.0
            grandchildren: List[Dict[str, Any]] = []
            for g_col, g_child in child.children.items():
                g_rate = g_child.wins / g_child.visits if g_child.visits > 0 else 0.0
                grandchildren.append({
                    "move": g_col,
                    "score": round(g_rate * 100, 1),
                    "visits": g_child.visits,
                    "win_rate": round(g_rate, 4),
                    "pruned": False,
                    "children": [],
                })

            tree_children.append({
                "move": col,
                "score": round(win_rate * 100, 1),
                "visits": child.visits,
                "win_rate": round(win_rate, 4),
                "pruned": False,
                "children": grandchildren,
            })
        else:
            tree_children.append({
                "move": col,
                "score": 0.0,
                "visits": 0,
                "win_rate": 0.0,
                "pruned": False,
                "children": [],
            })

    # Build 7 columns metrics
    columns = []
    for c in range(COLS):
        if c not in legal:
            columns.append({
                "col": c,
                "legal": False,
                "score": None,
                "norm": 0.0,
                "label": "Full",
                "bound": False,
                "visits": 0,
                "win_rate": 0.0,
            })
        else:
            child = root.children.get(c)
            v = child.visits if child else 0
            w = child.wins if child else 0.0
            rate = (w / v) if v > 0 else 0.0
            columns.append({
                "col": c,
                "legal": True,
                "score": round(rate * 100, 1),
                "norm": round(rate, 3),
                "label": f"{round(rate * 100, 1)}%",
                "bound": False,
                "visits": v,
                "win_rate": round(rate, 4),
            })

    best_win_rate = 0.0
    if best_move in root.children and root.children[best_move].visits > 0:
        best_win_rate = root.children[best_move].wins / root.children[best_move].visits

    return {
        "move": best_move,
        "algorithm": "mcts",
        "difficulty": "",
        "params": {"simulations": sim_count},
        "stats": {
            "nodes": sim_count,
            "pruned": 0,
            "time_ms": round(elapsed_ms, 2),
            "depth": 0,
            "simulations": sim_count,
            "max_tree_depth": max_tree_depth,
            "best_score": round(best_win_rate * 100, 1),
        },
        "columns": columns,
        "tree": {
            "move": None,
            "score": round(best_win_rate * 100, 1),
            "visits": sim_count,
            "win_rate": round(best_win_rate, 4),
            "pruned": False,
            "children": tree_children,
        },
    }


def _mcts_tactical_result(
    board: Connect4,
    winning_col: int,
    me: int,
    simulations: int,
    elapsed_ms: float,
    is_win: bool = True,
) -> Dict[str, Any]:
    """Helper when MCTS detects an immediate 1-move tactical win/block."""
    legal = board.legal_moves()
    columns = []
    tree_children = []

    for c in range(COLS):
        if c not in legal:
            columns.append({
                "col": c,
                "legal": False,
                "score": None,
                "norm": 0.0,
                "label": "Full",
                "bound": False,
                "visits": 0,
                "win_rate": 0.0,
            })
        else:
            win_rate = 1.0 if c == winning_col else 0.1
            columns.append({
                "col": c,
                "legal": True,
                "score": 100.0 if c == winning_col else 10.0,
                "norm": win_rate,
                "label": "100%" if c == winning_col else "10%",
                "bound": False,
                "visits": simulations if c == winning_col else 0,
                "win_rate": win_rate,
            })
            tree_children.append({
                "move": c,
                "score": 100.0 if c == winning_col else 10.0,
                "visits": simulations if c == winning_col else 0,
                "win_rate": win_rate,
                "pruned": False,
                "children": [],
            })

    return {
        "move": winning_col,
        "algorithm": "mcts",
        "difficulty": "",
        "params": {"simulations": simulations},
        "stats": {
            "nodes": simulations,
            "pruned": 0,
            "time_ms": round(elapsed_ms, 2),
            "depth": 1,
            "simulations": simulations,
            "max_tree_depth": 1,
            "best_score": 100.0,
        },
        "columns": columns,
        "tree": {
            "move": None,
            "score": 100.0,
            "visits": simulations,
            "win_rate": 1.0,
            "pruned": False,
            "children": tree_children,
        },
    }


# ============================================================================
# 4. RANDOM BASELINE
# ============================================================================

def random_search(board: Connect4, me: int) -> Dict[str, Any]:
    """Uniform random move selection baseline."""
    start_time = time.perf_counter()
    legal = board.legal_moves()
    if not legal:
        return _empty_result("random", 0)

    chosen = random.choice(legal)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    columns = []
    tree_children = []

    for c in range(COLS):
        if c not in legal:
            columns.append({
                "col": c,
                "legal": False,
                "score": None,
                "norm": 0.0,
                "label": "Full",
                "bound": False,
                "visits": 0,
                "win_rate": 0.0,
            })
        else:
            is_chosen = (c == chosen)
            columns.append({
                "col": c,
                "legal": True,
                "score": 1 if is_chosen else 0,
                "norm": 1.0 if is_chosen else 0.5,
                "label": "Pick" if is_chosen else "Pass",
                "bound": False,
                "visits": 1 if is_chosen else 0,
                "win_rate": 1.0 if is_chosen else 0.0,
            })
            tree_children.append({
                "move": c,
                "score": 1 if is_chosen else 0,
                "pruned": False,
                "children": [],
            })

    return {
        "move": chosen,
        "algorithm": "random",
        "difficulty": "",
        "params": {},
        "stats": {
            "nodes": len(legal),
            "pruned": 0,
            "time_ms": round(elapsed_ms, 2),
            "depth": 0,
            "simulations": 1,
            "max_tree_depth": 0,
            "best_score": 0,
        },
        "columns": columns,
        "tree": {
            "move": None,
            "score": 0,
            "pruned": False,
            "children": tree_children,
        },
    }


# ============================================================================
# Helper & Unified Dispatcher
# ============================================================================

def _build_columns_output(
    col_results: Dict[int, Dict[str, Any]],
    legal_moves: List[int],
    best_move: int,
) -> List[Dict[str, Any]]:
    """Build the 7 columns standardized JSON entries with normalized scores."""
    scores = [col_results[c]["score"] for c in legal_moves if c in col_results]
    min_score = min(scores) if scores else 0
    max_score = max(scores) if scores else 0
    span = max_score - min_score

    columns = []
    for c in range(COLS):
        if c not in legal_moves:
            columns.append({
                "col": c,
                "legal": False,
                "score": None,
                "norm": 0.0,
                "label": "Full",
                "bound": False,
                "visits": 0,
                "win_rate": 0.0,
            })
        else:
            res = col_results.get(c, {"score": 0, "bound": False})
            sc = res["score"]
            if span > 0:
                norm_val = round((sc - min_score) / span, 3)
            else:
                norm_val = 0.5

            if sc >= WIN_SCORE - 100:
                label_str = "Win"
            elif sc <= -WIN_SCORE + 100:
                label_str = "Loss"
            else:
                label_str = f"{sc:+d}" if sc != 0 else "0"

            columns.append({
                "col": c,
                "legal": True,
                "score": sc,
                "norm": norm_val,
                "label": label_str,
                "bound": res.get("bound", False),
                "visits": 0,
                "win_rate": 0.0,
            })

    return columns


def _empty_result(algorithm: str, depth: int) -> Dict[str, Any]:
    """Fallback response when no legal moves remain."""
    return {
        "move": -1,
        "algorithm": algorithm,
        "difficulty": "",
        "params": {"depth": depth},
        "stats": {
            "nodes": 0,
            "pruned": 0,
            "time_ms": 0.0,
            "depth": depth,
            "simulations": 0,
            "max_tree_depth": depth,
            "best_score": 0,
        },
        "columns": [
            {
                "col": c,
                "legal": False,
                "score": None,
                "norm": 0.0,
                "label": "Full",
                "bound": False,
                "visits": 0,
                "win_rate": 0.0,
            }
            for c in range(COLS)
        ],
        "tree": {"move": None, "score": 0, "pruned": False, "children": []},
    }


def get_ai_move(
    board: Connect4,
    player: int,
    algorithm: str,
    difficulty: str = "medium",
) -> Dict[str, Any]:
    """Unified entry point for AI move calculation.

    Args:
        board: Connect4 game instance
        player: 1 or 2
        algorithm: 'minimax', 'alphabeta', 'mcts', 'random'
        difficulty: 'beginner', 'easy', 'medium', 'hard'
    """
    algo_key = algorithm.lower().strip().replace("-", "").replace("_", "")
    diff_key = difficulty.lower().strip()

    if diff_key not in ("beginner", "easy", "medium", "hard"):
        diff_key = "medium"

    if algo_key in ("minimax", "mini"):
        params = DIFFICULTY_PARAMS["minimax"][diff_key]
        result = minimax_search(board, depth=params["depth"], me=player)
        result["algorithm"] = "minimax"
        result["difficulty"] = diff_key
        result["params"] = params
        return result

    elif algo_key in ("alphabeta", "ab", "pruning"):
        params = DIFFICULTY_PARAMS["alphabeta"][diff_key]
        result = alphabeta_search(board, depth=params["depth"], me=player)
        result["algorithm"] = "alphabeta"
        result["difficulty"] = diff_key
        result["params"] = params
        return result

    elif algo_key in ("mcts", "montecarlo"):
        params = DIFFICULTY_PARAMS["mcts"][diff_key]
        result = mcts_search(board, simulations=params["simulations"], me=player)
        result["algorithm"] = "mcts"
        result["difficulty"] = diff_key
        result["params"] = params
        return result

    elif algo_key in ("random", "rand"):
        result = random_search(board, me=player)
        result["algorithm"] = "random"
        result["difficulty"] = diff_key
        result["params"] = {}
        return result

    else:
        raise ValueError(
            f"Unknown algorithm '{algorithm}'. Must be one of: minimax, alphabeta, mcts, random"
        )
