import React from 'react';
import { Item, HeroState } from '../types/game';
import { SHOP_ITEMS } from '../data/heroes';
import { X, Coins, Shield, Swords, Zap, Heart, Check } from 'lucide-react';

interface ShopModalProps {
  player: HeroState;
  gold: number;
  isOpen: boolean;
  onClose: () => void;
  onBuyItem: (item: Item) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ player, gold, isOpen, onClose, onBuyItem }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black tracking-wide uppercase bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Toko Perlengkapan (Item Shop)
            </h3>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm">
              <Coins className="w-4 h-4" />
              <span>{gold} Gold</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Inventory Bar */}
        <div className="py-2.5 flex items-center gap-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Inventory ({player.inventory.length}/6):</span>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const item = player.inventory[idx];
              return (
                <div
                  key={idx}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center text-lg"
                  title={item ? item.name : 'Empty Slot'}
                >
                  {item ? item.iconEmoji : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Item Catalog List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {SHOP_ITEMS.map((item) => {
            const hasItem = player.inventory.some((i: Item) => i.id === item.id);
            const canAfford = gold >= item.cost && !hasItem && player.inventory.length < 6;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  hasItem
                    ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75'
                    : canAfford
                    ? 'bg-slate-800/60 border-slate-700 hover:border-amber-500/60'
                    : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {item.iconEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-0.5">
                        <Coins className="w-3.5 h-3.5" />
                        {item.cost}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {hasItem ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Terbeli
                    </span>
                  ) : (
                    <button
                      onClick={() => onBuyItem(item)}
                      disabled={!canAfford}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Beli
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
