'use client';

import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Start free, scale as you grow. No hidden fees.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Free tier */}
        <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Free Tier</h2>
          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-6">
            $0
          </div>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
            <li className="flex items-center gap-2">
              <CheckIcon />
              10 free responses per campaign
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Unlimited campaigns
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              All campaign types
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Basic analytics
            </li>
          </ul>
          <Link
            href="/campaigns/new"
            className="block w-full py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-center text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition"
          >
            Get Started
          </Link>
        </div>

        {/* Pay as you go */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pay as you go</h2>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ~$0.001<span className="text-lg font-normal text-gray-500">/response</span>
          </div>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
            <li className="flex items-center gap-2">
              <CheckIcon />
              Protocol fee = Sui gas × multiplier
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Multiplier: 1x → 0.1x (scales with volume)
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              1% fee on money flows
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Priority support
            </li>
          </ul>
          <Link
            href="/campaigns/new"
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-center text-white font-medium hover:opacity-90 transition"
          >
            Start Building
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">What counts as a response?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              A response is any submission to your campaign — a vote, survey answer, registration, or form entry that gets recorded on-chain.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">How does the multiplier work?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              The more responses your campaigns receive, the lower your multiplier. High-volume users can reach as low as 0.1x the base Sui gas cost.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">What are money flows?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Money flows include reward distributions, payment splits, and any other value transfers within campaigns. The 1% fee applies only to these transfers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
