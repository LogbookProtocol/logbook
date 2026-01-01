'use client';

import Link from 'next/link';
import { LogoIcon } from '@/components/LogoIcon';

export function CTASection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <LogoIcon size={80} />
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Ready to make history permanent?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg">
          Join organizations already recording their collective actions on-chain.
        </p>

        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition text-lg shadow-lg shadow-cyan-500/25"
        >
          Create your first campaign
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
