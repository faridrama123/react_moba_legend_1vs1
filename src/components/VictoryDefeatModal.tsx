import React from 'react';
import { GameEngine } from '../game/gameEngine';
import { Trophy, Skull, Coins, Clock, RotateCcw, ArrowLeft } from 'lucide-react';

interface VictoryDefeatModalProps {
  engine: GameEngine;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const VictoryDefeatModal: React.FC<VictoryDefeatModalProps> = ({
  engine,
  onPlayAgain,
  onBackToMenu,
}) => {
  const isVictory = engine.winner === 'player';

  const totalSec = Math.floor(engine.gameTime);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const matchDuration = `${min}m ${sec}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 pointer-events-auto">
      <div
        className={`relative w-full max-w-lg p-6 rounded-3xl border-2 text-center shadow-2xl overflow-hidden ${
          isVictory
            ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950/60 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)]'
            : 'bg-gradient-to-b from-slate-900 via-slate-950 to-red-950/60 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]'
        }`}
      >
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 ${
            isVictory ? 'bg-amber-400' : 'bg-red-500'
          }`}
        />

        {/* Big Icon */}
        <div className="relative z-10 flex justify-center mb-3">
          {isVictory ? (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.8)] border-2 border-amber-200">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-rose-900 flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.8)] border-2 border-red-400">
              <Skull className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-4xl font-black uppercase tracking-wider mb-1 ${
            isVictory
              ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
              : 'text-red-500'
          }`}
        >
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </h2>
        <p className="text-xs text-slate-300 font-medium">
          {isVictory ? 'Selamat! Anda berhasil menghancurkan Base lawan!' : 'Base Anda dihancurkan oleh lawan!'}
        </p>

        {/* Match Statistics Card */}
        <div className="relative z-10 my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-3 text-white">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">KDA</span>
            <span className="text-lg font-black font-mono text-cyan-300 mt-0.5">
              {engine.playerKills} / {engine.playerDeaths}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Gold
            </span>
            <span className="text-lg font-black font-mono text-amber-400 mt-0.5">
              {engine.playerGold}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Durasi
            </span>
            <span className="text-lg font-black font-mono text-slate-200 mt-0.5">
              {matchDuration}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ganti Hero</span>
          </button>
        </div>
      </div>
    </div>
  );
};
