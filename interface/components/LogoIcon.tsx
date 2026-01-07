'use client';

interface LogoIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  monochrome?: boolean;
  blurChaos?: boolean; // Blur the three chaos squares (no animation)
}

export function LogoIcon({ size = 28, className, style, monochrome = false, blurChaos = false }: LogoIconProps) {
  const s = 5; // square size
  const g = 1.5; // gap between squares
  const fill = monochrome ? 'currentColor' : 'url(#logoGradient)';

  return (
    <svg
      width={style ? undefined : size}
      height={style ? undefined : size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Logbook logo"
      role="img"
    >
      <title>Logbook</title>
      <defs>
        {!monochrome && (
          <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        )}
        {blurChaos && (
          <>
            {/* Less blur for closer squares */}
            <filter id="chaosBlurNear" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.15" />
            </filter>
            {/* More blur for farther square */}
            <filter id="chaosBlurFar" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.30" />
            </filter>
          </>
        )}
      </defs>

      {/* Chaos - scattered rotated squares */}
      {/* Top right - farther, more blur */}
      <rect
        x="25"
        y="1"
        width={s}
        height={s}
        transform="rotate(45 27.5 3.5)"
        fill={fill}
        filter={blurChaos ? 'url(#chaosBlurFar)' : undefined}
      />
      {/* Middle - closer, less blur */}
      <rect
        x="16"
        y="4"
        width={s}
        height={s}
        transform="rotate(15 18.5 6.5)"
        fill={fill}
        filter={blurChaos ? 'url(#chaosBlurNear)' : undefined}
      />
      {/* Bottom right - closer, less blur */}
      <rect
        x="24"
        y="14"
        width={s}
        height={s}
        transform="rotate(-25 26.5 16.5)"
        fill={fill}
        filter={blurChaos ? 'url(#chaosBlurNear)' : undefined}
      />

      {/* Order - L-shaped grid */}
      {/* Left column - 3 squares */}
      <rect x="2" y="9" width={s} height={s} fill={fill} />
      <rect x="2" y={9 + s + g} width={s} height={s} fill={fill} />
      <rect x="2" y={9 + (s + g) * 2} width={s} height={s} fill={fill} />

      {/* Middle column - 2 squares */}
      <rect x={2 + s + g} y={9 + s + g} width={s} height={s} fill={fill} />
      <rect x={2 + s + g} y={9 + (s + g) * 2} width={s} height={s} fill={fill} />

      {/* Right bottom square */}
      <rect x={2 + (s + g) * 2} y={9 + (s + g) * 2} width={s} height={s} fill={fill} />
    </svg>
  );
}
