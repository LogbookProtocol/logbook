'use client';

import Link from 'next/link';
import { FloatingBlocks } from '@/components/FloatingBlocks';
import { LogoIcon } from '@/components/LogoIcon';
import { useTheme } from '@/contexts/ThemeContext';

export function HeroSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="min-h-[90vh] flex items-center justify-center relative">
      <FloatingBlocks />

      {/* Large background logo - temporarily hidden
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] dark:opacity-[0.05] -translate-y-36">
        <LogoIcon size={600} monochrome={isDark} blurChaos className="text-gray-900 dark:text-white" />
      </div>
      */}

      <div className="relative z-10 text-center max-w-4xl px-6 -translate-y-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Permanent records
          </span>
          <br />
          <span className="text-gray-900 dark:text-white">for collective action</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Create campaigns, collect responses, record results on-chain. Votes, surveys,
          registrations — verified and immutable forever.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/campaigns"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            Access App
          </Link>
          <Link
            href="/docs"
            className="px-8 py-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition"
          >
            Documentation
          </Link>
        </div>

      </div>

      <p className="absolute bottom-[60px] left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500">
        These responses are imaginary. Yours won't be.
      </p>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
