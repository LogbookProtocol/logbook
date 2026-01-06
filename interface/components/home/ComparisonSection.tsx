'use client';

import { ReactNode } from 'react';

interface ComparisonRowProps {
  category: string;
  traditional: ReactNode;
  logbook: ReactNode;
}

// Desktop table row
function ComparisonRow({ category, traditional, logbook }: ComparisonRowProps) {
  return (
    <tr className="border-b border-gray-200 dark:border-white/10">
      <td className="py-4 px-4 md:px-6 align-top bg-gray-50 dark:bg-white/[0.02]">
        <span className="font-medium text-gray-900 dark:text-white text-sm">{category}</span>
      </td>
      <td className="py-4 px-4 md:px-6 align-top text-sm text-gray-600 dark:text-gray-400">
        {traditional}
      </td>
      <td className="py-4 px-4 md:px-6 align-top bg-cyan-500/5 dark:bg-cyan-500/10 text-sm text-gray-700 dark:text-gray-300">
        {logbook}
      </td>
    </tr>
  );
}

// Mobile card
function ComparisonCard({ category, traditional, logbook }: ComparisonRowProps) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
        <span className="font-medium text-gray-900 dark:text-white text-sm">{category}</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Traditional</div>
          {traditional}
        </div>
        <div className="p-4 text-sm text-gray-700 dark:text-gray-300 bg-cyan-500/5 dark:bg-cyan-500/10">
          <div className="text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Logbook</div>
          {logbook}
        </div>
      </div>
    </div>
  );
}

export function ComparisonSection() {
  const comparisons: ComparisonRowProps[] = [
    {
      category: 'Who controls the truth?',
      traditional: 'The platform (Google, Telegram, etc)',
      logbook: <>The blockchain (Sui network). <a href="/docs?doc=why-sui" className="text-cyan-600 dark:text-cyan-400 hover:underline">Learn more →</a></>,
    },
    {
      category: 'Trust model',
      traditional: '"Trust us, we counted honestly"',
      logbook: '"Don\'t trust, verify" - Check transactions yourself',
    },
    {
      category: 'Can results be verified?',
      traditional: '❌ No - Must believe what platform shows you',
      logbook: '✅ Yes - Every vote has transaction hash on Sui Explorer',
    },
    {
      category: 'Can platform manipulate?',
      traditional: '✅ Yes - Can edit, delete, hide votes or results',
      logbook: '❌ No - Rules in smart contract, mathematically enforced',
    },
    {
      category: 'History & memory',
      traditional: '❌ Ephemeral - Poll closes → data lost',
      logbook: '✅ Permanent - Every decision timestamped, becomes institutional memory',
    },
    {
      category: 'Censorship resistance',
      traditional: '❌ Platform can censor - Delete poll, block users',
      logbook: '✅ Cannot be censored - Once on-chain, permanent',
    },
    {
      category: 'Ease of use',
      traditional: '✅ Instant, familiar - Just create account',
      logbook: <>✅ Google sign-in - No wallet needed (zkLogin). <a href="/docs?doc=authentication" className="text-cyan-600 dark:text-cyan-400 hover:underline">Learn more →</a></>,
    },
    {
      category: 'Cost',
      traditional: '✅ Free',
      logbook: <>✅ Free beta (first 2 campaigns and 10 responses free). <a href="/docs?doc=free-tier" className="text-cyan-600 dark:text-cyan-400 hover:underline">Learn more →</a></>,
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-white/[0.02]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1 mb-12">
          Traditional tools vs. blockchain verification
        </h2>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto mb-12">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-800 dark:bg-gray-800">
                <th className="text-left py-4 px-4 md:px-6 text-white font-medium rounded-tl-lg w-[180px] bg-gray-700">Criteria</th>
                <th className="text-left py-4 px-4 md:px-6 text-gray-300 font-medium">
                  Traditional Tools
                </th>
                <th className="text-left py-4 px-4 md:px-6 font-semibold rounded-tr-lg bg-cyan-600/30">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Logbook
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <ComparisonRow key={row.category} {...row} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden flex flex-col gap-4 mb-12">
          {comparisons.map((row) => (
            <ComparisonCard key={row.category} {...row} />
          ))}
        </div>

        {/* Summary */}
        <p className="text-center text-lg text-gray-600 dark:text-gray-400">
          With Logbook, you don't have to trust anyone — <span className="text-gray-900 dark:text-white font-medium">you can verify everything yourself.</span>
        </p>
      </div>
    </section>
  );
}
