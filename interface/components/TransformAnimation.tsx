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

// Generate connection lines between adjacent blocks in grid
function generateConnections() {
  const connections: { from: number; to: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const i = row * GRID_SIZE + col;
      // Horizontal connection (to right neighbor)
      if (col < GRID_SIZE - 1) {
        connections.push({ from: i, to: i + 1 });
      }
      // Vertical connection (to bottom neighbor)
      if (row < GRID_SIZE - 1) {
        connections.push({ from: i, to: i + GRID_SIZE });
      }
    }
  }
  return connections;
}

const connections = generateConnections();

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
    <div className="relative w-full h-full">
      {/* Connection lines - only visible when ordered */}
      <svg
        className="absolute inset-0 w-full h-full transition-opacity duration-1000"
        style={{ opacity: isOrdered ? 0.6 : 0 }}
        preserveAspectRatio="none"
      >
        {connections.map((conn, i) => {
          const from = orderPositions[conn.from];
          const to = orderPositions[conn.to];
          return (
            <line
              key={i}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
            />
          );
        })}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Blocks */}
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 transition-all duration-1000 ease-in-out flex items-center justify-center"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) rotate(${pos.rotate}deg)`,
            backgroundColor: blockColors[i],
            borderRadius: isOrdered ? '0%' : '50%',
          }}
        >
          {/* Checkmark - only visible when ordered */}
          <svg
            className="w-2 h-2 text-white transition-opacity duration-500"
            style={{
              opacity: isOrdered ? 1 : 0,
              transitionDelay: isOrdered ? `${(i % 20) * 30}ms` : '0ms'
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={4}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ))}
    </div>
  );
}
