'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTransactionCostUsd } from '@/lib/sui-gas-price';
import { saveReferrer } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function CTASection() {
  const [txCost, setTxCost] = useState<string>('~$0.004');
  const router = useRouter();
  const { requireAuth } = useAuth();

  useEffect(() => {
    getTransactionCostUsd().then(cost => {
      setTxCost(`~$${cost.toFixed(3)}`);
    });
  }, []);

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
          Create your first campaign
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          Takes under a minute
        </p>

        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-8 mb-14 text-left max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">Blockchain requires gas for:</p>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-tight">
              Creating campaigns and recording responses
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white dark:bg-white/5 rounded-xl p-5 text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2"><span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent font-medium">Logbook</span> sponsors your first 2 campaigns and 10 responses</p>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">FREE</p>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-xl p-5 text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Participants never pay for responses, just sign in with Google</p>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">FREE</p>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-xl p-5 text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">After free tier, creator pays per campaign or response</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{txCost}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              const targetPath = '/campaigns/new';
              if (requireAuth(targetPath)) {
                saveReferrer(targetPath);
                router.push(targetPath);
              }
            }}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            Start Free Now
          </button>
        </div>
      </div>
    </section>
  );
}
