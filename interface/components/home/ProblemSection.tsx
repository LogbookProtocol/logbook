'use client';

import { ReactNode } from 'react';

interface ProblemCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function ProblemCard({ icon, title, description }: ProblemCardProps) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-center">
      <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center mb-5 mx-auto">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section className="py-24 px-6 bg-gray-50 dark:bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1 mb-16">
          Traditional voting tools require trust
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <ProblemCard
            icon={
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Trust the platform"
            description="Google Forms, Discord, Telegram, Twitter — they control your data, can edit, delete, or hide votes."
          />
          <ProblemCard
            icon={
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            title="Trust the counting"
            description="Platform shows you results. You can't verify them independently. Algorithm is hidden."
          />
          <ProblemCard
            icon={
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            title="Trust it's permanent"
            description="Platform closes, poll deleted, history lost. No proof it ever happened."
          />
        </div>

        <p className="text-center text-lg text-gray-600 dark:text-gray-400">
          With traditional tools, truth is whatever the platform shows you.
        </p>
      </div>
    </section>
  );
}
