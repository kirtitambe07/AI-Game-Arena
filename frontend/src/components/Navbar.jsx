import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Gamepad2,
  Swords,
  BarChart3,
  Trophy,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function Navbar() {
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const navItems = [
    { to: '/', label: 'Play Arena', icon: Gamepad2 },
    { to: '/ai-vs-ai', label: 'AI vs AI', icon: Swords },
    { to: '/benchmark', label: 'Benchmark', icon: BarChart3 },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/learn', label: 'Learn & Syllabus', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 bg-[#070913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-shadow">
            <div className="w-full h-full bg-[#080d1f] rounded-[10px] flex items-center justify-center">
              <span className="font-heading font-black text-cyan-400 text-lg tracking-tighter">
                4<span className="text-amber-400 text-xs">AI</span>
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base tracking-wide text-slate-100 group-hover:text-cyan-300 transition-colors">
                AI GAME ARENA
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Unit III • Adversarial
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono -mt-0.5 hidden sm:block">
              Connect-4 Heuristic Search Visualizer
            </p>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Mute Button */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-[#090e21]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
