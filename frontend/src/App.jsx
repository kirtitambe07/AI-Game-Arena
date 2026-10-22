import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PlayPage from './pages/PlayPage';
import AiVsAiPage from './pages/AiVsAiPage';
import BenchmarkPage from './pages/BenchmarkPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LearnPage from './pages/LearnPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col arcade-grid-bg relative selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Ambient Top Glow Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        {/* Navigation Bar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<PlayPage />} />
            <Route path="/play" element={<Navigate to="/" replace />} />
            <Route path="/ai-vs-ai" element={<AiVsAiPage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-[#05070e] py-6 px-4 text-center font-mono text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-heading font-bold text-slate-300">AI GAME ARENA</span>
              <span>•</span>
              <span>Connect-4 Live Search Visualizer</span>
            </div>
            <div>
              <span>College AI Project • Unit I (Agents) • Unit II (Heuristics) • Unit III (Adversarial)</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
