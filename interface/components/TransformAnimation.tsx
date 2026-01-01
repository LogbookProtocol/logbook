'use client';

import { useEffect, useState } from 'react';

const GRID_SIZE = 11;
const BLOCK_COUNT = GRID_SIZE * GRID_SIZE; // 121

// Seeded random number generator for deterministic results
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Interpolate between two colors based on t (0-1)
function interpolateColor(t: number): string {
  // cyan-400: #22d3ee = rgb(34, 211, 238)
  // blue-500: #3b82f6 = rgb(59, 130, 246)
  const r = Math.round(34 + (59 - 34) * t);
  const g = Math.round(211 + (130 - 211) * t);
  const b = Math.round(238 + (246 - 238) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Round to fixed decimal places for consistent SSR/client values
function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// Generate random chaos positions for 121 blocks (deterministic)
function generateChaosPositions() {
  const positions = [];
  for (let i = 0; i < BLOCK_COUNT; i++) {
    positions.push({
      x: round(5 + seededRandom(i * 3 + 1) * 90),
      y: round(5 + seededRandom(i * 3 + 2) * 90),
      rotate: round(seededRandom(i * 3 + 3) * 360 - 180),
    });
  }
  return positions;
}

// Generate 11x11 grid positions
function generateOrderPositions() {
  const positions = [];
  const gap = 7; // 7% gap between blocks
  const startX = 50 - (gap * (GRID_SIZE - 1)) / 2;
  const startY = 50 - (gap * (GRID_SIZE - 1)) / 2;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      positions.push({
        x: startX + col * gap,
        y: startY + row * gap,
        rotate: 0,
      });
    }
  }
  return positions;
}

// Pre-generate positions to avoid hydration mismatch
const chaosPositions = generateChaosPositions();
const orderPositions = generateOrderPositions();

// Pre-calculate colors based on grid position (diagonal gradient)
const blockColors = Array.from({ length: BLOCK_COUNT }, (_, i) => {
  const row = Math.floor(i / GRID_SIZE);
  const col = i % GRID_SIZE;
  // Diagonal gradient: top-left (0,0) = cyan, bottom-right (10,10) = blue
  const t = (row + col) / (2 * (GRID_SIZE - 1));
  return interpolateColor(t);
});

export function TransformAnimation() {
  const [isOrdered, setIsOrdered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOrdered((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const positions = isOrdered ? orderPositions : chaosPositions;

  return (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 transition-all duration-1000 ease-in-out"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) rotate(${pos.rotate}deg)`,
            backgroundColor: blockColors[i],
            borderRadius: isOrdered ? '0%' : '50%',
          }}
        />
      ))}

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-500">
        {isOrdered ? 'Order' : 'Chaos'}
      </div>
    </div>
  );
}
