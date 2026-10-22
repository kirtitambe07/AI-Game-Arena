import React, { useState } from 'react';
import { GitBranch, Info, Zap } from 'lucide-react';

export default function TreeVisualizer({
  treeData,
  chosenMove = null,
  algorithm = 'alphabeta',
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const isMcts = algorithm.toLowerCase().includes('mcts');

  if (!treeData || !treeData.children || treeData.children.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center text-slate-500">
        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
        <p className="text-sm">Make an AI move to view the 2-ply adversarial search tree.</p>
      </div>
    );
  }

  // Canvas dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const rootX = svgWidth / 2;
  const rootY = 35;
  const ply1Y = 125;
  const ply2Y = 225;

  const children = treeData.children || [];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/20 shadow-xl relative overflow-hidden">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-200">
              2-Ply Adversarial Search Tree
            </h4>
            <p className="text-[11px] text-slate-400">
              Root (Current State) ➔ Ply 1 (AI Move) ➔ Ply 2 (Opponent Counter-Moves)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
            <span className="text-amber-300">Chosen Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-cyan-300">Explored</span>
          </div>
          {!isMcts && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-rose-400/80"></span>
              <span className="text-slate-400">Pruned (Cutoff)</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Tree Viewport */}
      <div className="w-full overflow-x-auto rounded-xl bg-slate-950/70 border border-slate-900 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[700px] h-auto"
        >
          {/* Defs for Glows and Gradients */}
          <defs>
            <filter id="node-glow-gold" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fbbf24" floodOpacity="0.8" />
            </filter>
            <filter id="node-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00f0ff" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. Branch Lines: Root to Ply 1 */}
          {children.map((c1Node, idx) => {
            const x1 = 60 + idx * 120;
            const isChosen = c1Node.move === chosenMove;
            const isPruned = c1Node.pruned;

            let strokeColor = '#06b6d4';
            let strokeWidth = 1.5;
            let strokeDash = undefined;

            if (isChosen) {
              strokeColor = '#fbbf24';
              strokeWidth = 3;
            } else if (isPruned) {
              strokeColor = '#475569';
              strokeDash = '4 3';
            }

            return (
              <line
                key={`line-root-${idx}`}
                x1={rootX}
                y1={rootY}
                x2={x1}
                y2={ply1Y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                opacity={isPruned ? 0.4 : 0.8}
              />
            );
          })}

          {/* 2. Branch Lines: Ply 1 to Ply 2 Grandchildren */}
          {children.map((c1Node, idx) => {
            const p1X = 60 + idx * 120;
            const grandchildren = c1Node.children || [];
            const isParentChosen = c1Node.move === chosenMove;

            return grandchildren.map((gNode, gIdx) => {
              // Space grandchildren evenly around parent column
              const offset = (gIdx - (grandchildren.length - 1) / 2) * 14;
              const gX = p1X + offset;
              const isPruned = gNode.pruned;

              return (
                <line
                  key={`line-p1-${idx}-g-${gIdx}`}
                  x1={p1X}
                  y1={ply1Y}
                  x2={gX}
                  y2={ply2Y}
                  stroke={isPruned ? '#334155' : isParentChosen ? '#f59e0b' : '#0891b2'}
                  strokeWidth={isPruned ? 1 : 1.2}
                  strokeDasharray={isPruned ? '2 2' : undefined}
                  opacity={isPruned ? 0.35 : 0.65}
                />
              );
            });
          })}

          {/* 3. Ply 2 Grandchildren Nodes (Dots / Pruned X) */}
          {children.map((c1Node, idx) => {
            const p1X = 60 + idx * 120;
            const grandchildren = c1Node.children || [];
            const isParentChosen = c1Node.move === chosenMove;

            return grandchildren.map((gNode, gIdx) => {
              const offset = (gIdx - (grandchildren.length - 1) / 2) * 14;
              const gX = p1X + offset;
              const isPruned = gNode.pruned;

              return (
                <g
                  key={`gnode-${idx}-${gIdx}`}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredNode({
                      ply: 2,
                      move: gNode.move,
                      parentMove: c1Node.move,
                      score: gNode.score,
                      pruned: isPruned,
                      visits: gNode.visits,
                      win_rate: gNode.win_rate,
                    })
                  }
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={gX}
                    cy={ply2Y}
                    r={isPruned ? 4 : 5}
                    fill={isPruned ? '#1e293b' : isParentChosen ? '#fbbf24' : '#06b6d4'}
                    stroke={isPruned ? '#ef4444' : '#0c4a6e'}
                    strokeWidth={1}
                  />
                  {isPruned && (
                    <text
                      x={gX}
                      y={ply2Y + 2.5}
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="7"
                      fontWeight="bold"
                    >
                      ×
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* 4. Root Node (Ply 0) */}
          <g
            className="cursor-pointer"
            onMouseEnter={() =>
              setHoveredNode({
                ply: 0,
                score: treeData.score,
                visits: treeData.visits,
                label: 'Root State (Before Decision)',
              })
            }
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle
              cx={rootX}
              cy={rootY}
              r="14"
              fill="#0f172a"
              stroke="#00f0ff"
              strokeWidth="2.5"
              filter="url(#node-glow-cyan)"
            />
            <text
              x={rootX}
              y={rootY + 4}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="10"
              fontWeight="bold"
              fontFamily="Space Grotesk"
            >
              ROOT
            </text>
          </g>

          {/* 5. Ply 1 Nodes (Level 1: AI Columns) */}
          {children.map((c1Node, idx) => {
            const x1 = 60 + idx * 120;
            const isChosen = c1Node.move === chosenMove;
            const isPruned = c1Node.pruned;

            let fillColor = '#0f172a';
            let strokeColor = '#06b6d4';
            let filterId = undefined;

            if (isChosen) {
              strokeColor = '#fbbf24';
              filterId = 'url(#node-glow-gold)';
            } else if (isPruned) {
              strokeColor = '#475569';
              fillColor = '#1e293b';
            }

            return (
              <g
                key={`p1node-${idx}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onMouseEnter={() =>
                  setHoveredNode({
                    ply: 1,
                    move: c1Node.move,
                    score: c1Node.score,
                    pruned: isPruned,
                    visits: c1Node.visits,
                    win_rate: c1Node.win_rate,
                    isChosen,
                  })
                }
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle
                  cx={x1}
                  cy={ply1Y}
                  r="13"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isChosen ? 3 : 2}
                  filter={filterId}
                />
                <text
                  x={x1}
                  y={ply1Y + 3.5}
                  textAnchor="middle"
                  fill={isChosen ? '#fbbf24' : isPruned ? '#64748b' : '#38bdf8'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                >
                  C{c1Node.move + 1}
                </text>

                {/* Score badge below node */}
                <text
                  x={x1}
                  y={ply1Y + 23}
                  textAnchor="middle"
                  fill={isChosen ? '#fbbf24' : isPruned ? '#64748b' : '#94a3b8'}
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                >
                  {isMcts
                    ? `${Math.round((c1Node.win_rate || 0) * 100)}%`
                    : isPruned
                    ? 'Pruned'
                    : c1Node.score != null
                    ? `${c1Node.score > 0 ? '+' : ''}${c1Node.score}`
                    : '—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Tooltip Card */}
      <div className="mt-3 min-h-[34px] px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
        {hoveredNode ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-cyan-300 font-bold">
              {hoveredNode.ply === 0
                ? 'Current Board State'
                : hoveredNode.ply === 1
                ? `AI Move: Column ${hoveredNode.move + 1}`
                : `Reply: Column ${hoveredNode.move + 1} after C${hoveredNode.parentMove + 1}`}
            </span>
            {hoveredNode.isChosen && (
              <span className="text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                ★ Chosen Move
              </span>
            )}
            {hoveredNode.pruned && (
              <span className="text-rose-400 font-bold bg-rose-500/20 px-2 py-0.5 rounded text-[11px]">
                ✕ Pruned Branch (Beta Cutoff)
              </span>
            )}
            {isMcts ? (
              <>
                <span>Win Rate: <strong className="text-cyan-300">{Math.round((hoveredNode.win_rate || 0) * 100)}%</strong></span>
                <span>Visits: <strong className="text-slate-100">{hoveredNode.visits || 0}</strong></span>
              </>
            ) : (
              <span>Heuristic Score: <strong className="text-cyan-300">{hoveredNode.score ?? 'N/A'}</strong></span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Hover over any tree node or branch dot to inspect exact score, visits, and pruning status.
          </span>
        )}
      </div>
    </div>
  );
}
