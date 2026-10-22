
# 🎮 AI Game Arena — Connect-4 Adversarial Search & Heuristic Visualizer

AI Game Arena is a Connect-4 game application that demonstrates artificial intelligence search algorithms through interactive gameplay. It allows users to play against AI agents and explore how different algorithms make decisions.

## 🚀 Features

- Interactive Connect-4 gameplay.
- AI opponents powered by adversarial search algorithms.
- Minimax search algorithm.
- Alpha-Beta pruning for reducing unnecessary search.
- Monte Carlo Tree Search (MCTS), if implemented in the project.
- Heuristic evaluation of game states.
- Backend API for game operations.
- Frontend interface for playing and visualizing the game.
- Automated tests for supported functionality.

## 🛠️ Technologies Used

- **Frontend:** JavaScript and the project's frontend framework.
- **Backend:** Python.
- **API:** REST API.
- **Version Control:** Git and GitHub.

## 📁 Project Structure

```text
ai-game-arena/
├── backend/
│   ├── tests/
│   └── application source files
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

The exact files and folders may differ depending on the implementation.

## ⚙️ Prerequisites

Install the following tools before running the project:

- Python 3
- Node.js and npm
- Git

## 💻 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/kirtitambe07/AI-Game-Arena.git
cd AI-Game-Arena
```

### 2. Set up the backend

Open a terminal in the project folder.

```powershell
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies if a `requirements.txt` file exists:

```powershell
pip install -r requirements.txt
```

Start the backend using the entry point configured in the project.

### 3. Set up the frontend

Open another terminal in the project folder:

```powershell
cd frontend
npm install
npm run dev
```

Use the local URL displayed in the terminal to open the application.

**Note:** The exact backend startup command and available npm scripts depend on the project's configuration.

## 🧠 AI Algorithms

### Minimax

Minimax explores possible future moves and selects a move that maximizes the AI's outcome while assuming the opponent also plays optimally.

### Alpha-Beta Pruning

Alpha-Beta pruning improves Minimax by skipping branches that cannot affect the final decision.

### Monte Carlo Tree Search (MCTS)

MCTS uses repeated simulations to estimate the value of possible moves. Include this feature in the description only if it is implemented in the application.

### Heuristic Evaluation

A heuristic function estimates the strength of a board position by considering factors such as potential winning lines, threats, and opportunities.

## 🎯 Project Objectives

- Understand adversarial search in artificial intelligence.
- Implement decision-making algorithms for Connect-4.
- Compare search strategies and their performance.
- Demonstrate heuristic evaluation of game states.
- Build an interactive application with a frontend and backend.

## 🧪 Testing

Run the project's tests using the tools configured in the repository.

For Python projects using pytest:

```powershell
cd backend
python -m pytest
```

For frontend projects, check the available scripts in `frontend/package.json` before running the test command.

## 🔌 API

The backend may expose REST API endpoints for game actions, board state, and AI move selection. Refer to the backend source code for the actual routes, request formats, and response formats.

## 🔒 Git and Security

The `.gitignore` file excludes local dependencies, generated files, environment variables, databases, and private keys where applicable.

Never commit passwords, API keys, or other secrets to GitHub.

## 📚 Learning Outcomes

After completing this project, students can understand:

- Adversarial search and game-tree exploration.
- Minimax and Alpha-Beta pruning.
- Heuristic-based decision-making.
- Backend and frontend integration.
- Testing and version control with Git.

## 🏁 Conclusion

AI Game Arena demonstrates how artificial intelligence algorithms can be applied to a two-player strategy game. The project provides a practical way to study search algorithms, evaluate possible moves, and understand AI decision-making through Connect-4.

## 🎨 Design Direction

The application aims to provide a clear, interactive interface that makes AI decision-making easier to understand while keeping gameplay accessible.

