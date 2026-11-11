import React from 'react';
import { GameEngine, HeroState } from '../game/gameEngine';
import { Minimap } from './Minimap';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  Swords,
  Coins,
  Shield,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine;
  onOpenShop: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSurrender: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  onOpenShop,
  isMuted,
  onToggleMute,
  onSurrender,
}) => {
  const p = engine.player;
  const e = engine.enemy;

  // Format match time mm:ss
  const totalSec = Math.floor(engine.gameTime);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

  const latestAnnouncement = engine.announcements[0];
  const isAnnouncementActive = latestAnnouncement && Date.now() - latestAnnouncement.timestamp < 3500;

  // Health & Mana percentages
  const hpPercent = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
  const manaPercent = p.maxMana > 0 ? Math.max(0, Math.min(100, (p.mana / p.maxMana) * 100)) : 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none z-20">
      {/* ================= TOP PERIMETER BAR ================= */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Top-Left: Player Stats & Quick Shop */}
        <div className="flex items-center gap-2">
          {/* Shop Button with Gold Counter */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-amber-500/50 shadow-lg text-amber-400 font-mono font-bold text-xs transition-transform active:scale-95"
            title="Buka Toko Item"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums">{engine.playerGold}</span>
            <span className="text-[10px] text-amber-200 uppercase font-sans">Shop</span>
          </button>

          {/* Audio & Settings Buttons */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="Audio Mute Toggle"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onSurrender}
            className="px-2 py-1.5 rounded-xl bg-slate-900/85 hover:bg-red-950/80 border border-slate-700 text-slate-400 hover:text-red-400 text-[10px] font-bold uppercase transition-colors"
            title="Menyerah"
          >
            Menu
          </button>
        </div>

        {/* Top-Center: Scoreboard & Game Timer */}
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-950/85 border border-slate-700/80 shadow-2xl">
          {/* Blue Team Score (Player) */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            <span className="text-sm font-black text-cyan-300 font-mono tabular-nums">{engine.playerKills}</span>
          </div>

          {/* Match Time */}
          <div className="text-xs font-mono font-bold text-slate-300 px-2 border-x border-slate-700 tabular-nums">
            {timeStr}
          </div>

          {/* Red Team Score (Enemy) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-red-400 font-mono tabular-nums">{engine.enemyKills}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
        </div>

        {/* Top-Right: Minimap */}
        <Minimap
          player={p}
          enemy={e}
          turrets={engine.turrets}
          minions={engine.minions}
          crab={engine.crab}
        />
      </div>

      {/* ================= CENTER: ANNOUNCEMENT BANNER ================= */}
      {isAnnouncementActive && (
        <div className="self-center pointer-events-none transition-all duration-300 transform animate-bounce">
          <div
            className="px-6 py-2 rounded-2xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] text-center bg-slate-950/90"
            style={{ borderColor: latestAnnouncement.color }}
          >
            <div
              className="text-xl sm:text-2xl font-black uppercase tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
              style={{ color: latestAnnouncement.color }}
            >
              {latestAnnouncement.text}
            </div>
            {latestAnnouncement.subtext && (
              <p className="text-xs font-medium text-slate-300 mt-0.5">{latestAnnouncement.subtext}</p>
            )}
          </div>
        </div>
      )}

      {/* ================= RECALL PROGRESS BAR ================= */}
      {p.isRecalling && (
        <div className="self-center mb-4 flex flex-col items-center pointer-events-none">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 animate-pulse">
            Recalling to Base...
          </span>
          <div className="w-48 h-2.5 bg-slate-900 border border-emerald-500/60 rounded-full overflow-hidden shadow-[0_0_12px_rgba(34,197,94,0.4)]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-75"
              style={{ width: `${(p.recallProgress / 4.0) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ================= RESPAWN OVERLAY ================= */}
      {p.isDead && (
        <div className="self-center mb-8 flex flex-col items-center pointer-events-none p-3 rounded-2xl bg-black/85 border border-red-500/60 shadow-2xl">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">You have been slain</span>
          <span className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
            Respawn in {Math.ceil(p.respawnTime)}s
          </span>
        </div>
      )}

      {/* ================= BOTTOM ACTION & STATUS DOCK ================= */}
      <div className="w-full flex items-end justify-between pointer-events-none">
        {/* Bottom-Left: Virtual Joystick */}
        <div className="p-2">
          <VirtualJoystick onMove={(vec) => (engine.moveVector = vec)} />
        </div>

        {/* Bottom-Center: Hero Status Bar (HP, Mana, Level, Items) */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto pb-1 max-w-sm w-full mx-2">
          {/* HP and Mana bars */}
          <div className="w-full p-2.5 rounded-2xl bg-slate-950/85 border border-slate-700/80 shadow-2xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                  {p.level}
                </span>
                <span className="text-white font-black">{p.config.name}</span>
              </div>
              <span className="font-mono text-slate-300 tabular-nums">
                {Math.round(p.hp)} / {p.maxHp} HP
              </span>
            </div>

            {/* Health Bar (Segmented Look) */}
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400 transition-all duration-100"
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* Mana Bar */}
            {p.maxMana > 0 && (
              <div className="w-full h-1.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-100"
                  style={{ width: `${manaPercent}%` }}
                />
              </div>
            )}

            {/* Compact Inventory Slots */}
            <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-slate-800">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const item = p.inventory[idx];
                return (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-xs"
                    title={item?.name}
                  >
                    {item ? item.iconEmoji : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom-Right: Skill Cluster & Basic Attack */}
        <div className="relative p-2 flex items-center gap-2 pointer-events-auto">
          {/* Recall Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => engine.triggerRecall(p)}
              disabled={p.isDead || p.isRecalling}
              className="w-11 h-11 rounded-full bg-slate-900/90 border border-emerald-500/50 hover:bg-slate-800 flex flex-col items-center justify-center text-emerald-400 shadow-lg active:scale-95 transition-transform"
              title="Recall ke Base (Tombol B)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[9px] font-bold font-mono">B</span>
            </button>
            <span className="text-[9px] text-slate-400 mt-0.5">Recall</span>
          </div>

          {/* Battle Spell Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => engine.castBattleSpell(p)}
              disabled={p.isDead || p.spellCooldown > 0}
              className="relative w-12 h-12 rounded-full bg-slate-900/90 border-2 border-cyan-400/80 hover:bg-slate-800 flex items-center justify-center shadow-lg active:scale-95 transition-transform overflow-hidden"
              title="Battle Spell (Tombol D)"
            >
              <Sparkles className="w-5 h-5 text-cyan-300" />
              {/* Cooldown overlay */}
              {p.spellCooldown > 0 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center font-mono font-bold text-xs text-white">
                  {Math.ceil(p.spellCooldown)}s
                </div>
              )}
            </button>
            <span className="text-[9px] text-cyan-300 mt-0.5 font-bold uppercase">{p.selectedSpell} (D)</span>
          </div>

          {/* Skill 1, Skill 2, Ultimate */}
          {p.config.skills.map((skill, idx) => {
            const level = p.skillLevels[idx];
            const cd = p.skillCooldowns[idx];
            const canUpgrade = p.skillPoints > 0 && (idx !== 2 || p.level >= 4);

            return (
              <div key={skill.slot} className="relative flex flex-col items-center">
                {/* Level Up Button [+] */}
                {canUpgrade && (
                  <button
                    onClick={() => engine.upgradeSkill(idx)}
                    className="absolute -top-7 px-1.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse flex items-center gap-0.5"
                    title={`Tingkatkan Skill ${skill.name}`}
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                )}

                {/* Skill Cast Button */}
                <button
                  onClick={() => engine.castSkill(p, idx)}
                  disabled={p.isDead || level === 0 || cd > 0 || p.mana < skill.manaCost}
                  className={`relative w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all overflow-hidden ${
                    level === 0
                      ? 'bg-slate-950/80 border-slate-700 opacity-50 cursor-not-allowed'
                      : cd > 0 || p.mana < skill.manaCost
                      ? 'bg-slate-900 border-slate-600'
                      : 'bg-slate-900 border-amber-400 hover:border-amber-300 hover:shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                  }`}
                  style={{ width: idx === 2 ? '3.75rem' : '3.25rem', height: idx === 2 ? '3.75rem' : '3.25rem' }}
                >
                  <span
                    className={`font-black tracking-tight ${idx === 2 ? 'text-sm text-amber-300' : 'text-xs text-white'}`}
                  >
                    {skill.hotkey}
                  </span>
                  <span className="text-[8px] text-slate-300 truncate max-w-[42px]">{skill.name}</span>

                  {/* Cooldown Overlay */}
                  {cd > 0 && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center font-mono font-black text-sm text-amber-400">
                      {Math.ceil(cd)}s
                    </div>
                  )}

                  {/* Out of Mana Overlay */}
                  {level > 0 && cd === 0 && p.mana < skill.manaCost && (
                    <div className="absolute inset-0 bg-blue-950/80 flex items-center justify-center text-[9px] font-bold text-blue-300">
                      NO MANA
                    </div>
                  )}
                </button>

                {/* Skill Level indicator dots */}
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4].map((dot) => (
                    <span
                      key={dot}
                      className={`w-1.5 h-1.5 rounded-full ${dot <= level ? 'bg-amber-400' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Big Basic Attack Button */}
          <div className="flex flex-col items-center ml-1">
            <button
              onClick={() => engine.triggerPlayerAttack()}
              disabled={p.isDead}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-amber-500 active:scale-90 border-3 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex flex-col items-center justify-center text-slate-950 transition-transform"
              title="Basic Attack (Spasi / Klik)"
            >
              <Swords className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[9px] font-black tracking-widest uppercase">Spasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
