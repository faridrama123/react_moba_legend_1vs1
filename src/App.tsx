import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeroId, BattleSpellId, Item } from './types/game';
import { GameEngine } from './game/gameEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { ShopModal } from './components/ShopModal';
import { VictoryDefeatModal } from './components/VictoryDefeatModal';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Selected match config
  const [playerHero, setPlayerHero] = useState<HeroId>('layla');
  const [playerSpell, setPlayerSpell] = useState<BattleSpellId>('flicker');
  const [enemyHero, setEnemyHero] = useState<HeroId>('eudora');
  const [enemySpell, setEnemySpell] = useState<BattleSpellId>('execute');

  // React state trigger for HUD sync
  const [, setHudTick] = useState(0);

  // Canvas & GameEngine references
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const keysDownRef = useRef<Set<string>>(new Set());
  const reqAnimFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  // Start game handler
  const handleStartGame = (
    pHero: HeroId,
    pSpell: BattleSpellId,
    eHero: HeroId,
    eSpell: BattleSpellId
  ) => {
    setPlayerHero(pHero);
    setPlayerSpell(pSpell);
    setEnemyHero(eHero);
    setEnemySpell(eSpell);
    setGameState('playing');
  };

  // Stop current game
  const handleStopGame = useCallback(() => {
    if (reqAnimFrameRef.current) {
      cancelAnimationFrame(reqAnimFrameRef.current);
      reqAnimFrameRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setGameState('title');
    setIsShopOpen(false);
  }, []);

  // Initialize and run the 60fps Game Loop when gameState === 'playing'
  useEffect(() => {
    if (gameState !== 'playing' || !containerRef.current) return;

    // Clean up container
    containerRef.current.innerHTML = '';

    // Create engine
    const engine = new GameEngine(
      containerRef.current,
      playerHero,
      playerSpell,
      enemyHero,
      enemySpell
    );
    engineRef.current = engine;
    lastTimeRef.current = performance.now();

    // Keyboard controls listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore typing in input fields if any
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const code = e.code;
      keysDownRef.current.add(code);

      // Edge-triggered actions
      if (code === 'Space') {
        e.preventDefault();
        engine.triggerPlayerAttack();
      } else if (code === 'KeyQ') {
        engine.castSkill(engine.player, 0);
      } else if (code === 'KeyW') {
        engine.castSkill(engine.player, 1);
      } else if (code === 'KeyE') {
        engine.castSkill(engine.player, 2);
      } else if (code === 'KeyD') {
        engine.castBattleSpell(engine.player);
      } else if (code === 'KeyB') {
        engine.triggerRecall(engine.player);
      } else if (code === 'KeyP' || code === 'Tab') {
        e.preventDefault();
        setIsShopOpen((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    const handleBlur = () => {
      keysDownRef.current.clear();
      if (engineRef.current) {
        engineRef.current.moveVector = { x: 0, z: 0 };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && engineRef.current) {
        engineRef.current.sceneManager.handleResize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    // 60fps Simulation Game Loop
    let lastHudUpdate = 0;
    const loop = (now: number) => {
      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent frame spikes

      // Keyboard WASD / Arrow movement calculation
      const keys = keysDownRef.current;
      let kx = 0;
      let kz = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) kz += 1; // forward
      if (keys.has('KeyS') || keys.has('ArrowDown')) kz -= 1; // backward

      if (kx !== 0 || kz !== 0) {
        const len = Math.hypot(kx, kz);
        engine.moveVector = { x: kx / len, z: kz / len };
      } else if (!engine.isMoving) {
        // Only reset if joystick is not actively driving moveVector
      }

      // Step simulation
      engine.tick(dt);

      // Throttled HUD update (~15fps for smooth UI updates without React overhead)
      if (now - lastHudUpdate > 66) {
        lastHudUpdate = now;
        setHudTick((t) => t + 1);
      }

      reqAnimFrameRef.current = requestAnimationFrame(loop);
    };

    reqAnimFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      if (reqAnimFrameRef.current) {
        cancelAnimationFrame(reqAnimFrameRef.current);
      }
      engine.dispose();
    };
  }, [gameState, playerHero, playerSpell, enemyHero, enemySpell]);

  const handleBuyItem = (item: Item) => {
    if (engineRef.current) {
      engineRef.current.buyItem(engineRef.current.player, item);
      setHudTick((t) => t + 1);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 w-full h-full ${gameState === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* Active Game HUD */}
      {gameState === 'playing' && engineRef.current && (
        <>
          <GameHUD
            engine={engineRef.current}
            onOpenShop={() => setIsShopOpen(true)}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onSurrender={handleStopGame}
          />

          {/* In-Game Item Shop Modal */}
          <ShopModal
            player={engineRef.current.player}
            gold={engineRef.current.playerGold}
            isOpen={isShopOpen}
            onClose={() => setIsShopOpen(false)}
            onBuyItem={handleBuyItem}
          />

          {/* Victory / Defeat Modal */}
          {engineRef.current.isGameOver && (
            <VictoryDefeatModal
              engine={engineRef.current}
              onPlayAgain={() => {
                handleStopGame();
                setTimeout(() => {
                  handleStartGame(playerHero, playerSpell, enemyHero, enemySpell);
                }, 100);
              }}
              onBackToMenu={handleStopGame}
            />
          )}
        </>
      )}
    </div>
  );
}
