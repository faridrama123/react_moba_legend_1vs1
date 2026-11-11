import React from 'react';
import { HeroState, Turret, Minion, JungleCreep } from '../types/game';

interface MinimapProps {
  player: HeroState;
  enemy: HeroState;
  turrets: Turret[];
  minions: Minion[];
  crab: JungleCreep;
}

export const Minimap: React.FC<MinimapProps> = ({ player, enemy, turrets, minions, crab }) => {
  // Map world bounds: X from -10 to 10, Z from -52 to 52
  // We project this into an SVG of width 110, height 150
  const svgW = 110;
  const svgH = 150;

  const toMapCoords = (x: number, z: number) => {
    // x: -8..8 -> 10..100
    const mapX = ((x + 8) / 16) * (svgW - 20) + 10;
    // z: -52..52 -> 140..10 (player base at bottom, enemy base at top)
    const mapY = ((52 - z) / 104) * (svgH - 20) + 10;
    return { x: mapX, y: mapY };
  };

  const pPos = toMapCoords(player.x, player.z);
  const ePos = toMapCoords(enemy.x, enemy.z);
  const crabPos = toMapCoords(crab.x, crab.z);

  // Is enemy visible on minimap?
  const enemyVisible = !enemy.isDead && (!enemy.inBush || player.inBush);

  return (
    <div className="relative w-28 h-36 bg-slate-950/85 border-2 border-slate-700/80 rounded-xl overflow-hidden shadow-2xl pointer-events-auto backdrop-blur-none">
      <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* River */}
        <rect x="0" y={svgH / 2 - 5} width={svgW} height="10" fill="#0369a1" opacity="0.4" />

        {/* Central Lane */}
        <line
          x1={svgW / 2}
          y1="12"
          x2={svgW / 2}
          y2={svgH - 12}
          stroke="#475569"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1={svgW / 2}
          y1="12"
          x2={svgW / 2}
          y2={svgH - 12}
          stroke="#64748b"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.8"
        />

        {/* River Bridge */}
        <rect x={svgW / 2 - 8} y={svgH / 2 - 4} width="16" height="8" fill="#334155" rx="2" />

        {/* Turrets */}
        {turrets.map((t) => {
          if (t.isDead) return null;
          const pos = toMapCoords(t.x, t.z);
          const isPlayer = t.team === 'player';
          return (
            <circle
              key={t.id}
              cx={pos.x}
              cy={pos.y}
              r="4.2"
              fill={isPlayer ? '#0284c7' : '#dc2626'}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Nexuses */}
        <rect
          x={svgW / 2 - 6}
          y={svgH - 14}
          width="12"
          height="8"
          fill="#0284c7"
          stroke="#38bdf8"
          strokeWidth="1.2"
          rx="2"
        />
        <rect
          x={svgW / 2 - 6}
          y={6}
          width="12"
          height="8"
          fill="#dc2626"
          stroke="#f87171"
          strokeWidth="1.2"
          rx="2"
        />

        {/* River Crab */}
        {!crab.isDead && (
          <circle cx={crabPos.x} cy={crabPos.y} r="3" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
        )}

        {/* Minions */}
        {minions.map((m) => {
          const mPos = toMapCoords(m.x, m.z);
          return (
            <circle
              key={m.id}
              cx={mPos.x}
              cy={mPos.y}
              r="2.2"
              fill={m.team === 'player' ? '#38bdf8' : '#ef4444'}
            />
          );
        })}

        {/* Enemy Hero Icon */}
        {enemyVisible && (
          <g transform={`translate(${ePos.x}, ${ePos.y})`}>
            <circle r="5.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text textAnchor="middle" dy="3" fill="#ffffff" fontSize="7" fontWeight="bold">
              {enemy.config.name[0]}
            </text>
          </g>
        )}

        {/* Player Hero Icon */}
        {!player.isDead && (
          <g transform={`translate(${pPos.x}, ${pPos.y})`}>
            <circle r="6" fill="#0284c7" stroke="#fbbf24" strokeWidth="2" />
            <text textAnchor="middle" dy="3" fill="#ffffff" fontSize="7.5" fontWeight="bold">
              {player.config.name[0]}
            </text>
          </g>
        )}
      </svg>
      <div className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400">1v1 MAP</div>
    </div>
  );
};
