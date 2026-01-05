'use client';

import { ReactNode } from 'react';

interface UseCaseCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function UseCaseCard({ icon, title, description }: UseCaseCardProps) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-center">
      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5 mx-auto">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export function UseCasesSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Built for coordination
        </h2>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          From simple polls to governance decisions — one protocol for all your collective action needs.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <UseCaseCard
            icon={
              <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            title="Voting & Governance"
            description="DAO proposals, elections, community decisions with transparent results."
          />
          <UseCaseCard
            icon={
              <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Surveys & Feedback"
            description="Collect verified responses with permanent audit trail."
          />
          <UseCaseCard
            icon={
              <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            title="Registration & Forms"
            description="Event signups, applications, waitlists with on-chain records."
          />
        </div>

        <p className="text-center text-lg text-gray-600 dark:text-gray-400">
          One tool for any decision that needs to be recorded and verified.
        </p>
      </div>
    </section>
  );
}
