'use client';

import { useEffect, useRef } from 'react';

// COMMENTED OUT: Particle-based spawn animation
// interface Particle {
//   angle: number; // Current angle in the vortex (radians)
//   radius: number; // Current distance from center
//   startRadius: number; // Initial distance
//   size: number;
//   opacity: number;
//   angularSpeed: number; // Angular rotation speed (radians per frame)
// }

interface Response {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  size: number;
  // Animation state
  state: 'spawning' | 'showing' | 'traveling' | 'settling' | 'settled';
  stateTime: number;
  // Target position in the grid
  targetX: number;
  targetY: number;
  // Label info
  label: {
    name: string;
    company: string; // Space name, empty if no space
    campaign: string; // Campaign name when no space
    action: string;
    avatarColor: string;
    authType: 'google' | 'sui' | 'slush' | 'nightly' | 'suiet'; // How user is logged in
  };
  labelOpacity: number;
  // Hover pause
  paused: boolean;
  // Whether to add to settled blocks (false for intermediate hits on special blocks)
  shouldSettle: boolean;
}

interface SettledBlock {
  x: number;
  y: number;
  size: number;
  color: string;
}

interface BackgroundBlock {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  gray: number; // 0-255 gray value for dark theme
  lightColor: { r: number; g: number; b: number }; // Individual color for light theme
  depthPlane: number; // 0-4, which depth plane this block belongs to
}

const BLOCK_SIZE = 24;
const GRID_GAP = 4;
const GRID_COLS = 20;
const MAX_ROWS = 6;
const TOTAL_BLOCKS = 121; // 6 rows × 20 cols + 1 top block = 11² = 121

const NAMES = ['Alex', 'Maria', 'John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'Tom', 'Anna', 'Chris', 'Julia'];
const COMPANIES = ['Nexus DAO', 'Acme Corp', 'TechFlow', 'DataSync', 'CloudBase', 'DevHub', 'CodeLab', 'ByteWorks'];
const ACTIONS = [
  { text: 'voted Yes on Proposal #42', icon: '✓' },
  { text: 'registered for Annual Summit', icon: '📅' },
  { text: 'submitted feedback', icon: '💬' },
  { text: 'joined the team', icon: '👋' },
  { text: 'completed Q4 survey', icon: '📋' },
  { text: 'approved budget request', icon: '✓' },
  { text: 'signed partnership agreement', icon: '✍' },
  { text: 'confirmed attendance', icon: '✓' },
];
const AVATAR_COLORS = [
  '#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1',
];

function generateSuiAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 64; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  // Return shortened format: 0x1234...abcd
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const CAMPAIGNS = ['Q4 Budget Vote', 'Team Offsite RSVP', 'Product Feedback', 'Hackathon Registration', 'Community Survey'];

const AUTH_TYPES = ['google', 'sui', 'slush', 'nightly', 'suiet'] as const;
const WALLET_TYPES = ['sui', 'slush', 'nightly', 'suiet'] as const;

function getRandomLabel() {
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

  // Pick auth type: 50% Google, 50% wallet
  const authType = Math.random() < 0.5
    ? 'google'
    : WALLET_TYPES[Math.floor(Math.random() * WALLET_TYPES.length)];

  // If wallet auth, use Sui address; if Google, use name
  const name = authType === 'google'
    ? NAMES[Math.floor(Math.random() * NAMES.length)]
    : generateSuiAddress();

  // 20% chance no space (campaign without space), 20% campaign name, 60% space name
  const rand = Math.random();
  let company: string;
  if (rand < 0.2) {
    // No space - show campaign name only
    company = CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)];
  } else if (rand < 0.4) {
    // Campaign within a space - show both
    company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  } else {
    company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  }

  return {
    name,
    company: rand < 0.2 ? '' : company, // Empty string means no space
    campaign: rand < 0.2 ? CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)] : '',
    action: action.text,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    authType,
  };
}

const BG_BLOCK_COUNT = 40;
const DEPTH_PLANES = 5; // Number of depth planes (0 = closest, 4 = farthest)

// Depth plane properties: closer = bigger, faster; farther = smaller, slower
const DEPTH_PLANE_CONFIG = [
  { sizeRange: [30, 56], speedRange: [0.4, 0.6], baseOpacity: 0.375 },   // Plane 0: closest
  { sizeRange: [22, 40], speedRange: [0.3, 0.45], baseOpacity: 0.34 },  // Plane 1
  { sizeRange: [16, 30], speedRange: [0.2, 0.35], baseOpacity: 0.30 },  // Plane 2: middle (focus default)
  { sizeRange: [10, 22], speedRange: [0.15, 0.25], baseOpacity: 0.26 }, // Plane 3
  { sizeRange: [6, 14], speedRange: [0.1, 0.18], baseOpacity: 0.225 },   // Plane 4: farthest
];

function createBackgroundBlock(canvasWidth: number, canvasHeight: number): BackgroundBlock {
  // Assign to a random depth plane
  const depthPlane = Math.floor(Math.random() * DEPTH_PLANES);
  const config = DEPTH_PLANE_CONFIG[depthPlane];

  // Random direction angle
  const angle = Math.random() * Math.PI * 2;
  const speed = config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]);
  const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

  // Individual color for light theme: gradient from cyan-900 to blue-900
  const gradientRatio = Math.random();
  // cyan-900: rgb(22, 78, 99), blue-900: rgb(30, 58, 138)
  const lightColor = {
    r: Math.round(22 + (30 - 22) * gradientRatio),
    g: Math.round(78 + (58 - 78) * gradientRatio),
    b: Math.round(99 + (138 - 99) * gradientRatio),
  };

  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size,
    opacity: config.baseOpacity,
    speedX: Math.cos(angle) * speed,
    speedY: Math.sin(angle) * speed,
    gray: 200 + Math.floor(Math.random() * 55), // 200-255 gray (very light for dark theme)
    lightColor,
    depthPlane,
  };
}

export function FloatingBlocks() {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const responsesRef = useRef<Response[]>([]);
  const settledBlocksRef = useRef<SettledBlock[]>([]);
  const backgroundBlocksRef = useRef<BackgroundBlock[]>([]);
  const animationRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const gridBaseYRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const nextGridIndexRef = useRef(0);
  const frameCountRef = useRef(0);
  const specialBlockHitsRef = useRef(0); // Counter for hits on special blocks (42 and 69)
  const isDarkModeRef = useRef(false);

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!mainCanvas || !bgCanvas) return;

    const ctx = mainCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    const resize = () => {
      mainCanvas.width = mainCanvas.offsetWidth;
      mainCanvas.height = mainCanvas.offsetHeight;
      bgCanvas.width = bgCanvas.offsetWidth;
      bgCanvas.height = bgCanvas.offsetHeight;
      // Grid starts from bottom, leaving space for scroll arrow (bottom-8 = 32px + arrow height ~24px + gap)
      gridBaseYRef.current = mainCanvas.height - 100;
    };
    resize();
    window.addEventListener('resize', resize);

    // Check dark mode and set up observer
    const checkDarkMode = () => {
      isDarkModeRef.current = document.documentElement.classList.contains('dark');
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Initialize background blocks
    if (backgroundBlocksRef.current.length === 0) {
      for (let i = 0; i < BG_BLOCK_COUNT; i++) {
        backgroundBlocksRef.current.push(createBackgroundBlock(mainCanvas.width, mainCanvas.height));
      }
    }

    // Track mouse for hover detection
    const handleMouseMove = (e: MouseEvent) => {
      const rect = mainCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = null;
      }
    };
    document.addEventListener('mousemove', handleMouseMove);

    const SPECIAL_BLOCKS = [41, 68]; // Blocks 42 and 69 (0-indexed) need 10 hits before advancing
    const SPECIAL_BLOCK_HITS_REQUIRED = 10;

    const getNextGridPosition = () => {
      const index = nextGridIndexRef.current;
      const gridWidth = GRID_COLS * (BLOCK_SIZE + GRID_GAP);
      const gridStartX = (mainCanvas.width - gridWidth) / 2;

      let targetX: number;
      let targetY: number;
      let shouldSettle = true; // By default, add to settled blocks

      // Check if this is the 121st block (index 120) - the leftmost block on row 7
      if (index === GRID_COLS * MAX_ROWS) {
        targetX = gridStartX + BLOCK_SIZE / 2;
        targetY = gridBaseYRef.current - MAX_ROWS * (BLOCK_SIZE + GRID_GAP);
      } else {
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        targetX = gridStartX + col * (BLOCK_SIZE + GRID_GAP) + BLOCK_SIZE / 2;
        targetY = gridBaseYRef.current - row * (BLOCK_SIZE + GRID_GAP);
      }

      // Check if current index is a special block (42 or 69)
      if (SPECIAL_BLOCKS.includes(index)) {
        specialBlockHitsRef.current++;
        // First hit creates the settled block, subsequent hits don't
        if (specialBlockHitsRef.current === 1) {
          shouldSettle = true;
        } else {
          shouldSettle = false;
        }
        // Only advance to next block after all required hits
        if (specialBlockHitsRef.current >= SPECIAL_BLOCK_HITS_REQUIRED) {
          nextGridIndexRef.current++;
          specialBlockHitsRef.current = 0; // Reset for next special block
        }
      } else {
        nextGridIndexRef.current++;
      }

      return { targetX, targetY, shouldSettle };
    };

    const spawnResponse = () => {
      const id = nextIdRef.current++;
      const { targetX, targetY, shouldSettle } = getNextGridPosition();

      // Exclusion zone: center area where logo and text are (shifted up to match -translate-y-28)
      const centerX = mainCanvas.width / 2;
      const centerY = mainCanvas.height / 2 - 140; // shifted up more
      const maxCardWidth = 350; // Max possible card width with long text

      // Adaptive exclusion zone: shrink on narrower screens to allow card spawning
      // For a valid spawn zone, we need: leftZoneMaxX > leftZoneMinX
      // leftZoneMaxX = (centerX - exclusionWidth/2) - cardOffsetX - maxCardWidth - 20
      // leftZoneMinX = 50
      // So: (width/2 - exclusionWidth/2) - 16 - 350 - 20 > 50
      // => exclusionWidth < width - 872
      const maxExclusionWidth = 800;
      const cardOffsetX = 16;
      const minZoneWidth = 50; // leftZoneMinX
      const margin = 20;
      // Calculate max exclusion that still allows valid left zone
      const maxValidExclusion = mainCanvas.width - 2 * (minZoneWidth + cardOffsetX + maxCardWidth + margin);
      const exclusionWidth = Math.max(300, Math.min(maxExclusionWidth, maxValidExclusion));
      const exclusionHeight = 400;

      // Calculate exclusion zone boundaries
      const exclusionLeft = centerX - exclusionWidth / 2;
      const exclusionRight = centerX + exclusionWidth / 2;

      // Card dimensions for overlap detection
      const cardHeight = 72;

      // Left zone: right edge of card must not overlap exclusion zone
      // Right edge of card = spawnX + 16 + maxCardWidth < exclusionLeft
      const leftZoneMaxX = exclusionLeft - cardOffsetX - maxCardWidth - 20;
      const leftZoneMinX = 50;

      // Right zone: left edge of card must be past exclusion zone
      // Left edge of card = spawnX + 16 > exclusionRight
      const rightZoneMinX = exclusionRight - cardOffsetX + 20;
      const rightZoneMaxX = mainCanvas.width - cardOffsetX - maxCardWidth - 30;

      // Check if a position overlaps with existing cards
      const overlapsExistingCard = (x: number, y: number): boolean => {
        for (const resp of responsesRef.current) {
          if (resp.state === 'spawning' || resp.state === 'showing') {
            // Card bounds: x+16 to x+16+cardWidth, y-36 to y+36
            const existingCardLeft = resp.x + cardOffsetX;
            const existingCardRight = resp.x + cardOffsetX + maxCardWidth;
            const existingCardTop = resp.y - cardHeight / 2;
            const existingCardBottom = resp.y + cardHeight / 2;

            const newCardLeft = x + cardOffsetX;
            const newCardRight = x + cardOffsetX + maxCardWidth;
            const newCardTop = y - cardHeight / 2;
            const newCardBottom = y + cardHeight / 2;

            // Check overlap with margin
            const margin = 20;
            if (
              newCardRight + margin > existingCardLeft &&
              newCardLeft - margin < existingCardRight &&
              newCardBottom + margin > existingCardTop &&
              newCardTop - margin < existingCardBottom
            ) {
              return true;
            }
          }
        }
        return false;
      };

      let spawnX: number;
      let spawnY: number;
      let attempts = 0;
      const maxAttempts = 20;

      // Determine which zones are available
      const leftZoneValid = leftZoneMaxX > leftZoneMinX;
      const rightZoneValid = rightZoneMaxX > rightZoneMinX;

      // Try to find a non-overlapping position
      do {
        // Randomly pick left or right zone (if both valid)
        const useLeftZone = leftZoneValid && (!rightZoneValid || Math.random() < 0.5);

        if (useLeftZone) {
          spawnX = leftZoneMinX + Math.random() * (leftZoneMaxX - leftZoneMinX);
        } else if (rightZoneValid) {
          spawnX = rightZoneMinX + Math.random() * (rightZoneMaxX - rightZoneMinX);
        } else {
          // No valid zone, skip spawn
          return;
        }

        spawnY = 80 + Math.random() * (mainCanvas.height * 0.4);

        // Clamp Y to valid range
        spawnY = Math.max(100, Math.min(mainCanvas.height * 0.45, spawnY));

        attempts++;
      } while (overlapsExistingCard(spawnX, spawnY) && attempts < maxAttempts);

      // If we couldn't find a non-overlapping position after max attempts, skip this spawn
      if (attempts >= maxAttempts && overlapsExistingCard(spawnX, spawnY)) {
        return; // Don't spawn this card
      }

      const response: Response = {
        id,
        x: spawnX,
        y: spawnY,
        startX: spawnX,
        startY: spawnY,
        size: BLOCK_SIZE,
        state: 'spawning',
        stateTime: 0,
        targetX,
        targetY,
        label: getRandomLabel(),
        labelOpacity: 0,
        paused: false,
        shouldSettle,
      };

      responsesRef.current.push(response);
    };

    // Update background blocks on separate canvas (runs every 2 frames for performance)
    const updateBackgroundCanvas = () => {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

      for (let i = 0; i < backgroundBlocksRef.current.length; i++) {
        const block = backgroundBlocksRef.current[i];

        // Move in random direction
        block.x += block.speedX;
        block.y += block.speedY;

        // Wrap around edges
        const margin = block.size + 20;
        if (block.x < -margin) block.x = bgCanvas.width + margin;
        if (block.x > bgCanvas.width + margin) block.x = -margin;
        if (block.y < -margin) block.y = bgCanvas.height + margin;
        if (block.y > bgCanvas.height + margin) block.y = -margin;

        // Draw block with opacity based on depth plane and theme
        const isDark = isDarkModeRef.current;
        const blockX = block.x - block.size / 2;
        const blockY = block.y - block.size / 2;

        const radius = block.size / 2;

        if (isDark) {
          // Dark theme: gray circles with 15% of base opacity
          bgCtx.globalAlpha = block.opacity * 0.15;
          bgCtx.fillStyle = `rgb(${block.gray}, ${block.gray}, ${block.gray})`;
          bgCtx.beginPath();
          bgCtx.arc(block.x, block.y, radius, 0, Math.PI * 2);
          bgCtx.fill();
        } else {
          // Light theme: gradient circles from cyan-500 to blue-500 with 50% of base opacity
          bgCtx.globalAlpha = block.opacity * 0.5;
          const gradient = bgCtx.createLinearGradient(blockX, blockY, blockX + block.size, blockY + block.size);
          // cyan-500: #06b6d4 = rgb(6, 182, 212), blue-500: #3b82f6 = rgb(59, 130, 246)
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(1, '#3b82f6');
          bgCtx.fillStyle = gradient;
          bgCtx.beginPath();
          bgCtx.arc(block.x, block.y, radius, 0, Math.PI * 2);
          bgCtx.fill();
        }
      }
      bgCtx.globalAlpha = 1;
    };

    const animate = (timestamp: number) => {
      frameCountRef.current++;
      const deltaTime = 16; // ~60fps
      ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

      // Update background canvas every 2 frames for performance
      if (frameCountRef.current % 2 === 0) {
        updateBackgroundCanvas();
      }

      // Check if any response is paused (hovered)
      const anyPaused = responsesRef.current.some(r => r.paused);

      // Check if grid is full (121 blocks total: 6 rows × 20 cols + 1 top block)
      // Use nextGridIndexRef to prevent spawning while last block is still animating
      const gridFull = nextGridIndexRef.current >= TOTAL_BLOCKS;

      // Draw grid placeholder (empty cells as subtle gray blocks)
      const gridWidth = GRID_COLS * (BLOCK_SIZE + GRID_GAP);
      const gridStartX = (mainCanvas.width - gridWidth) / 2;
      const gridEndX = gridStartX + gridWidth;

      ctx.globalAlpha = 0.04;
      ctx.fillStyle = 'rgb(128, 128, 128)';
      // Draw 6 rows × 20 cols
      for (let row = 0; row < MAX_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const x = gridStartX + col * (BLOCK_SIZE + GRID_GAP) + BLOCK_SIZE / 2;
          const y = gridBaseYRef.current - row * (BLOCK_SIZE + GRID_GAP);
          ctx.fillRect(x - BLOCK_SIZE / 2, y - BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
      // Draw the 121st block (leftmost on row 7)
      const topBlockX = gridStartX + BLOCK_SIZE / 2;
      const topBlockY = gridBaseYRef.current - MAX_ROWS * (BLOCK_SIZE + GRID_GAP);
      ctx.fillRect(topBlockX - BLOCK_SIZE / 2, topBlockY - BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);

      // Draw settled blocks on top of the placeholder grid
      for (const block of settledBlocksRef.current) {
        ctx.globalAlpha = 0.6;

        // Calculate color based on horizontal position in grid (gradient from cyan to blue)
        const progress = (block.x - gridStartX) / (gridEndX - gridStartX);
        // Interpolate between cyan (#22d3ee) and blue (#3b82f6)
        const r = Math.round(34 + (59 - 34) * progress);
        const g = Math.round(211 + (130 - 211) * progress);
        const b = Math.round(238 + (246 - 238) * progress);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
      }
      ctx.globalAlpha = 1;

      // Update and draw active responses
      const toRemove: number[] = [];
      const mouse = mouseRef.current;

      for (const resp of responsesRef.current) {
        // Check hover for pause (only during showing state, after label is visible)
        // Pause when hovering over the block OR the label
        if (mouse && resp.state === 'showing') {
          const halfSize = resp.size / 2 + 4;
          const overBlock =
            mouse.x >= resp.x - halfSize &&
            mouse.x <= resp.x + halfSize &&
            mouse.y >= resp.y - halfSize &&
            mouse.y <= resp.y + halfSize;

          // Label position: cardX = x+16, cardY = y - 36, size 220x72, with padding
          const cardX = resp.x + 12;
          const cardY = resp.y - 40;
          const overLabel =
            mouse.x >= cardX &&
            mouse.x <= cardX + 230 &&
            mouse.y >= cardY &&
            mouse.y <= cardY + 80;

          resp.paused = overBlock || overLabel;
        } else {
          resp.paused = false;
        }

        // Only advance time if not paused
        if (!resp.paused) {
          resp.stateTime += deltaTime;
        }

        switch (resp.state) {
          case 'spawning':
            // Fade in animation: 2 seconds
            const spawnDuration = 2000;
            const spawnProgress = Math.min(1, resp.stateTime / spawnDuration);

            // Opacity increases from 0 to 1 with easeOutCubic
            const eased = 1 - Math.pow(1 - spawnProgress, 3);
            resp.labelOpacity = eased;

            if (resp.stateTime > spawnDuration) {
              resp.state = 'showing';
              resp.stateTime = 0;
              resp.labelOpacity = 1;
            }
            break;

          case 'showing':
            // Show label for a moment (can be paused by hover)
            resp.labelOpacity = 1;
            if (resp.stateTime > 1200) {
              resp.state = 'traveling';
              resp.stateTime = 0;
            }
            break;

          case 'traveling':
            // Fast travel down with diagonal light trail
            resp.labelOpacity = Math.max(0, 1 - resp.stateTime / 100);
            const travelProgress = Math.min(1, resp.stateTime / 300);
            const travelEased = 1 - Math.pow(1 - travelProgress, 3); // ease out cubic

            // Move diagonally from start to target
            resp.x = resp.startX + (resp.targetX - resp.startX) * travelEased;
            resp.y = resp.startY + (resp.targetY - resp.startY) * travelEased;

            if (travelProgress >= 1) {
              resp.state = 'settling';
              resp.stateTime = 0;
              resp.x = resp.targetX;
              resp.y = resp.targetY;
            }
            break;

          case 'settling':
            // Quick settle animation
            if (resp.stateTime > 150) {
              resp.state = 'settled';
              // Add to settled blocks only if this response should settle
              // (intermediate hits on special blocks don't create settled blocks)
              if (resp.shouldSettle) {
                settledBlocksRef.current.push({
                  x: resp.targetX,
                  y: resp.targetY,
                  size: BLOCK_SIZE,
                  color: resp.label.avatarColor,
                });
              }
              toRemove.push(resp.id);
            }
            break;
        }

        // Draw response
        if (resp.state !== 'settled') {
          // Draw light beam during travel (no block, just the beam)
          if (resp.state === 'traveling') {
            // Beam starts from center of card (card is at x+16, width ~220, height 72)
            const cardCenterX = resp.startX + 16 + 110; // cardX + half of typical card width
            const cardCenterY = resp.startY; // card is centered vertically on spawn point

            // Calculate beam head position
            const travelProgress = Math.min(1, resp.stateTime / 300);
            const beamHeadX = cardCenterX + (resp.targetX - cardCenterX) * travelProgress;
            const beamHeadY = cardCenterY + (resp.targetY - cardCenterY) * travelProgress;

            // Beam tail follows behind (shorter trail)
            const tailProgress = Math.max(0, travelProgress - 0.3);
            const beamTailX = cardCenterX + (resp.targetX - cardCenterX) * tailProgress;
            const beamTailY = cardCenterY + (resp.targetY - cardCenterY) * tailProgress;

            const trailGradient = ctx.createLinearGradient(
              beamTailX, beamTailY,
              beamHeadX, beamHeadY
            );
            trailGradient.addColorStop(0, 'rgba(34, 211, 238, 0)');
            trailGradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.6)');
            trailGradient.addColorStop(1, resp.label.avatarColor);

            ctx.beginPath();
            ctx.strokeStyle = trailGradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.moveTo(beamTailX, beamTailY);
            ctx.lineTo(beamHeadX, beamHeadY);
            ctx.stroke();

            // Glow at beam head
            ctx.save();
            ctx.globalAlpha = 0.6;
            const glowGradient = ctx.createRadialGradient(beamHeadX, beamHeadY, 0, beamHeadX, beamHeadY, 20);
            glowGradient.addColorStop(0, resp.label.avatarColor);
            glowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(beamHeadX, beamHeadY, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw block only during settling (block appears when beam reaches destination)
          if (resp.state === 'settling') {
            ctx.save();
            ctx.translate(resp.x, resp.y);
            // Fade in effect
            const settleProgress = Math.min(1, resp.stateTime / 100);
            ctx.globalAlpha = settleProgress;

            // Use the avatar color for the block
            ctx.fillStyle = resp.label.avatarColor;
            ctx.fillRect(-resp.size / 2, -resp.size / 2, resp.size, resp.size);
            ctx.restore();
          }

          // Draw label
          if (resp.labelOpacity > 0 && (resp.state === 'spawning' || resp.state === 'showing' || resp.state === 'traveling')) {
            ctx.save();
            ctx.globalAlpha = resp.labelOpacity;

            const avatarSize = 36;
            const padding = 12;
            const textStartX = padding + avatarSize + 16; // avatar area + gap

            // Determine second line text (space or campaign)
            const secondLineText = resp.label.company
              ? `@ ${resp.label.company}`
              : resp.label.campaign;

            // Measure text widths to calculate card width
            ctx.font = 'bold 13px system-ui, sans-serif';
            const nameWidth = ctx.measureText(resp.label.name).width;
            ctx.font = '9px system-ui, sans-serif';
            const authLabel = resp.label.authType === 'google' ? 'Google' : resp.label.authType.charAt(0).toUpperCase() + resp.label.authType.slice(1);
            const authBadgeWidth = ctx.measureText(`via ${authLabel}`).width + 6;
            ctx.font = '11px system-ui, sans-serif';
            const companyWidth = ctx.measureText(secondLineText).width;
            const actionWidth = ctx.measureText(resp.label.action).width;

            const maxTextWidth = Math.max(nameWidth + authBadgeWidth, companyWidth, actionWidth);
            const cardWidth = Math.max(220, textStartX + maxTextWidth + padding + 8);
            const cardHeight = 72;
            const cardX = resp.x + 16;
            const cardY = resp.y - cardHeight / 2;

            // Theme-aware colors
            const isDark = isDarkModeRef.current;
            const cardBg = isDark ? 'rgba(20, 30, 48, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
            const shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)';
            const nameColor = isDark ? '#ffffff' : '#1f2937';
            const secondaryColor = isDark ? 'rgba(148, 163, 184, 0.9)' : 'rgba(107, 114, 128, 0.9)';
            const tertiaryColor = isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(156, 163, 175, 0.8)';

            // Shadow
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            // Background
            ctx.fillStyle = cardBg;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
            ctx.fill();

            // Reset shadow for other elements
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
            ctx.stroke();

            // Left accent bar (inside the card, matching the rounded corners)
            ctx.fillStyle = resp.label.avatarColor;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, 4, cardHeight, [12, 0, 0, 12]);
            ctx.fill();

            // Avatar circle with initials
            const avatarX = cardX + padding + avatarSize / 2 + 4;
            const avatarY = cardY + cardHeight / 2;

            // Avatar background
            ctx.fillStyle = resp.label.avatarColor;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Avatar initials
            const initials = resp.label.name.charAt(0).toUpperCase();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, avatarX, avatarY);

            // Text content
            const textX = avatarX + avatarSize / 2 + 12;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';

            // Name
            ctx.fillStyle = nameColor;
            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.fillText(resp.label.name, textX, cardY + 24);

            // Auth type badge (next to name)
            ctx.font = 'bold 13px system-ui, sans-serif'; // Reset to name font to measure
            const nameEndX = textX + ctx.measureText(resp.label.name).width + 6;
            ctx.font = '9px system-ui, sans-serif';
            ctx.fillStyle = tertiaryColor;
            ctx.fillText(`via ${authLabel}`, nameEndX, cardY + 24);

            // Second line: space with @ symbol, or campaign name
            ctx.fillStyle = secondaryColor;
            ctx.font = '11px system-ui, sans-serif';
            ctx.fillText(secondLineText, textX, cardY + 40);

            // Action
            ctx.fillStyle = resp.label.avatarColor;
            ctx.font = '11px system-ui, sans-serif';
            ctx.fillText(resp.label.action, textX, cardY + 58);

            ctx.restore();
          }
        }
      }

      // Remove settled responses from active list
      responsesRef.current = responsesRef.current.filter(r => !toRemove.includes(r.id));

      // Spawn new card every 2-3 seconds
      const timeSinceLastSpawn = timestamp - lastSpawnRef.current;
      const spawnInterval = 2000 + Math.random() * 1000; // 2-3 seconds
      if (!anyPaused && !gridFull && timeSinceLastSpawn > spawnInterval) {
        spawnResponse();
        lastSpawnRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize lastSpawnRef to 0 so first card spawns immediately
    lastSpawnRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Background layer with CSS blur for depth of field effect */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none blur-[3px]"
        style={{ zIndex: 40 }}
      />
      {/* Main canvas for responses, cards, beams */}
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 40 }}
      />
    </>
  );
}
