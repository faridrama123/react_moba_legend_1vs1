import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; z: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const radius = 45; // Max knob movement radius

  const handlePointerStart = (clientX: number, clientY: number) => {
    setIsActive(true);
    updateVector(clientX, clientY);
  };

  const updateVector = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let finalX = dx;
    let finalY = dy;

    if (dist > radius) {
      finalX = (dx / dist) * radius;
      finalY = (dy / dist) * radius;
    }

    setKnobPos({ x: finalX, y: finalY });

    // In 3D space: X is left/right, Z is forward/backward
    // Moving up on screen (negative dy) = positive Z or forward depending on camera
    // Camera is looking towards +Z (enemy base), so moving up on screen means +Z forward!
    const normX = finalX / radius;
    const normZ = -finalY / radius; // screen up is forward in world +Z
    onMove({ x: normX, z: normZ });
  }, [radius, onMove]);

  const handlePointerEnd = useCallback(() => {
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    touchIdRef.current = null;
    onMove({ x: 0, z: 0 });
  }, [onMove]);

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isActive && touchIdRef.current === null) {
        updateVector(e.clientX, e.clientY);
      }
    };

    const handleWindowMouseUp = () => {
      if (isActive && touchIdRef.current === null) {
        handlePointerEnd();
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isActive, updateVector, handlePointerEnd]);

  return (
    <div
      ref={baseRef}
      onMouseDown={(e) => {
        touchIdRef.current = null;
        handlePointerStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        if (e.changedTouches.length > 0) {
          const t = e.changedTouches[0];
          touchIdRef.current = t.identifier;
          handlePointerStart(t.clientX, t.clientY);
        }
      }}
      onTouchMove={(e) => {
        if (touchIdRef.current !== null) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdRef.current) {
              updateVector(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
              break;
            }
          }
        }
      }}
      onTouchEnd={(e) => {
        if (touchIdRef.current !== null) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdRef.current) {
              handlePointerEnd();
              break;
            }
          }
        }
      }}
      className="relative w-28 h-28 rounded-full bg-slate-900/70 border-2 border-slate-700/80 flex items-center justify-center pointer-events-auto select-none touch-none shadow-xl"
    >
      {/* Decorative center ring */}
      <div className="absolute inset-2 rounded-full border border-slate-600/40 pointer-events-none" />
      <div className="absolute w-2 h-2 rounded-full bg-slate-500/50 pointer-events-none" />

      {/* Movable Knob */}
      <div
        className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)] border-2 border-amber-300 flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-amber-200 shadow-inner" />
      </div>
    </div>
  );
};
