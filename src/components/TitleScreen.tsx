import React, { useState, useEffect } from 'react';
import { HeroId, BattleSpellId } from '../types/game';
import { HEROES, BATTLE_SPELLS } from '../data/heroes';
import { soundEngine } from '../audio/soundEngine';
import { Volume2, VolumeX, Shield, Zap, Swords, Crosshair, ArrowRight, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (playerHero: HeroId, playerSpell: BattleSpellId, enemyHero: HeroId, enemySpell: BattleSpellId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, isMuted, onToggleMute }) => {
  const [selectedHero, setSelectedHero] = useState<HeroId>('layla');
  const [selectedSpell, setSelectedSpell] = useState<BattleSpellId>('flicker');
  const [enemyHero, setEnemyHero] = useState<HeroId>('eudora');

  // Listen for Enter/Space to quick start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        if ((e.target as HTMLElement)?.tagName !== 'BUTTON') {
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHero, selectedSpell, enemyHero]);

  const handleStart = () => {
    soundEngine.playLevelUp();
    onStartGame(selectedHero, selectedSpell, enemyHero, 'execute');
  };

  const currentHero = HEROES[selectedHero];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-radial from-slate-900 via-slate-950 to-black text-white select-none overflow-y-auto">
      {/* Background visual accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-96 bg-indigo-600/10 blur-3xl"></div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Bespoke SVG Crest */}
          <svg className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.3l6 3.33v4.47c0 4.2-2.91 8.13-6 9.28-3.09-1.15-6-5.08-6-9.28V8.63l6-3.33zM11 7v7h2V7h-2zm0 9v2h2v-2h-2z" />
          </svg>
          <div>
            <h1 className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
              Mobile Legends: Bang Bang
            </h1>
            <p className="text-xs text-cyan-400 font-semibold tracking-widest uppercase">1 vs 1 Custom Showdown</p>
          </div>
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
          title="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </header>

      {/* Center Hero Selection Zone */}
      <main className="relative z-10 my-4 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Hero Roster */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilih Hero Anda</span>
            <span className="text-xs text-amber-400 font-medium">5 Heroes Siap Tempur</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {Object.values(HEROES).map((h) => {
              const isSelected = selectedHero === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => {
                    setSelectedHero(h.id);
                    // Ensure enemy isn't mirror if possible
                    if (enemyHero === h.id) {
                      const other = (Object.keys(HEROES) as HeroId[]).find((id) => id !== h.id);
                      if (other) setEnemyHero(other);
                    }
                  }}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                      : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl shadow-inner border border-white/20"
                    style={{ backgroundColor: h.avatarColor, color: '#000' }}
                  >
                    {h.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>{h.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {h.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{h.title}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Enemy Hero Selection */}
          <div className="mt-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Lawan (Bot AI 1v1)
            </label>
            <div className="flex gap-2">
              {Object.values(HEROES).map((h) => (
                <button
                  key={h.id}
                  onClick={() => setEnemyHero(h.id)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    enemyHero === h.id
                      ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Hero Details, Skills & Battle Spell */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div>
            {/* Hero Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white">{currentHero.name}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    {currentHero.role}
                  </span>
                </div>
                <p className="text-xs text-cyan-400 mt-0.5">{currentHero.title}</p>
              </div>

              {/* Base Stats Pills */}
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>{currentHero.baseStats.maxHp} HP</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentHero.baseStats.physicalAttack} ATK</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>{currentHero.baseStats.attackRange} M Range</span>
                </div>
              </div>
            </div>

            {/* Passive Description */}
            <div className="my-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-amber-300 mr-1.5">Passive - {currentHero.passive.name}:</span>
              <span className="text-slate-300">{currentHero.passive.description}</span>
            </div>

            {/* Signature Skills */}
            <div className="space-y-2.5 my-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Signature Skills</span>
              <div className="grid grid-cols-1 gap-2">
                {currentHero.skills.map((skill) => (
                  <div
                    key={skill.slot}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-slate-950 shadow-md"
                      style={{ backgroundColor: skill.iconColor }}
                    >
                      {skill.hotkey}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200">
                          {skill.slot === 3 ? 'ULT: ' : `S${skill.slot}: `}
                          {skill.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">CD: {skill.cooldown}s</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{skill.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Battle Spell Selection */}
            <div className="my-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Pilih Battle Spell (Tombol D)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BATTLE_SPELLS.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => setSelectedSpell(sp.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      selectedSpell === sp.id
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: sp.iconColor }}
                      ></div>
                      <span className="text-xs font-bold text-white">{sp.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-mono">CD: {sp.cooldown}s</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTA & Hotkey Guide */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[11px]">Enter</kbd> atau Klik Mulai</span>
            </div>

            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_24px_rgba(245,158,11,0.5)] transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Mulai Pertempuran 1v1</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer Controls Hint */}
      <footer className="relative z-10 text-center py-2">
        <p className="text-xs text-slate-500 tracking-wide font-mono">
          WASD Gerak · Q/W/E Skill · Spasi Serang · D Spell · B Recall · Mouse Drag Joystick Support
        </p>
      </footer>
    </div>
  );
};
