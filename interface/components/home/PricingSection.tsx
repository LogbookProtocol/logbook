'use client';

import Link from 'next/link';

export function PricingSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12">
          Pricing
        </h2>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-10 shadow-sm">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Free to start
          </h3>

          <div className="flex items-start gap-3 mb-6 text-left">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Your first campaign includes:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span>
                  Free campaign creation
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span>
                  First 10 responses sponsored by us
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 pt-6 mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">After 10 free responses:</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              Creator pays blockchain gas (~0.002 SUI per response)
            </p>
          </div>

          <ul className="space-y-3 mb-8 text-left">
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-500 text-lg">✓</span>
              Unlimited campaigns
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-500 text-lg">✓</span>
              Unlimited total responses
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-500 text-lg">✓</span>
              All features included
            </li>
          </ul>

          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition text-lg shadow-lg shadow-cyan-500/25"
          >
            Create Free Campaign
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
      </div>
    </section>
  );
}
