'use client';

import { useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';

interface AnimatedBorderButtonProps {
  href: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function AnimatedBorderButton({
  href,
  active = false,
  disabled = false,
  onClick,
  children,
  className = '',
}: AnimatedBorderButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  // IMPORTANT: Always call useEffect before any conditional returns
  // to maintain consistent hook order across renders
  // TODO: Uncomment to enable animated border effect
  // useEffect(() => {
  //   // Only animate when button is NOT active and NOT disabled
  //   if (disabled || active) return;

  //   const button = buttonRef.current;
  //   if (!button) return;

  //   let angle = 0;
  //   let animationId: number;

  //   const updateAngle = () => {
  //     angle = (angle + 1) % 360; // 1 degree per frame for slower animation
  //     button.style.setProperty('--angle', `${angle}deg`);
  //     animationId = requestAnimationFrame(updateAngle);
  //   };

  //   animationId = requestAnimationFrame(updateAngle);

  //   return () => {
  //     cancelAnimationFrame(animationId);
  //   };
  // }, [active, disabled]);

  // Always render Link to prevent layout shift from conditional rendering
  return (
    <Link
      ref={buttonRef}
      href={disabled ? '#' : href}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition whitespace-nowrap ${className}`}
      style={{
        '--angle': '0deg',
      } as React.CSSProperties}
    >
      <span className={`relative z-10 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent ${
        active ? '' : 'hover:opacity-80'
      }`}>
        {children}
      </span>
      {active && <div className="absolute inset-0 rounded-lg -z-10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/15 dark:to-blue-500/15 border border-cyan-500/20 dark:border-cyan-400/20" />}
      {/* TODO: Uncomment to enable animated border effect */}
      {/* {!active && (
        <div
          className="absolute inset-[-1.5px] rounded-lg pointer-events-none"
          style={{
            background: `
              conic-gradient(
                from var(--angle),
                transparent 0deg,
                transparent 340deg,
                rgba(6, 182, 212, 0.8) 350deg,
                rgba(59, 130, 246, 0.8) 360deg,
                transparent 360deg
              )
            `,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: '1.5px',
            filter: 'blur(0.5px)',
          }}
        />
      )} */}
    </Link>
  );
}
