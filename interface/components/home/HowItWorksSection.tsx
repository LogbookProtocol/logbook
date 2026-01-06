'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { saveReferrer } from '@/lib/navigation';

interface StepCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: 'creator' | 'participant' | 'both' | 'anyone';
  button?: ReactNode;
}

function StepCard({ title, description, icon, badge, button }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 h-full flex flex-col">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        {/* Spacer + Button centered vertically */}
        <div className="flex-1 flex items-center justify-center">
          {button && <div className="mt-3">{button}</div>}
        </div>
        {/* Badge at bottom */}
        <div className="flex justify-center gap-1 mt-3">
          {badge === 'both' ? (
            <>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                Creator
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                Participant
              </span>
            </>
          ) : badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              badge === 'creator'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                : badge === 'participant'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
            }`}>
              {badge === 'creator' ? 'Creator' : badge === 'participant' ? 'Participant' : 'Anyone'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  const router = useRouter();
  const { requireAuth, isConnected, openLoginModal } = useAuth();

  const handleSignIn = () => {
    if (!isConnected) {
      openLoginModal();
    }
  };

  const handleCreateCampaign = () => {
    const targetPath = '/campaigns/new';
    if (requireAuth(targetPath)) {
      saveReferrer(targetPath);
      router.push(targetPath);
    }
  };

  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1 mb-4">
          How Logbook works
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          From sign-in to verified results in five steps.
        </p>

        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <StepCard
            title="Sign in"
            description="Connect with Google account or Sui wallet"
            badge="both"
            icon={
              <svg
                className="w-6 h-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            button={
              !isConnected ? (
                <button
                  onClick={handleSignIn}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium hover:opacity-90 transition shadow-md shadow-cyan-500/20"
                >
                  Sign in
                </button>
              ) : null
            }
          />
          <StepCard
            title="Create"
            description="Set up your campaign — questions and timeline"
            badge="creator"
            icon={
              <svg
                className="w-6 h-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
            button={
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium hover:opacity-90 transition shadow-md shadow-cyan-500/20"
              >
                New Campaign
              </button>
            }
          />
          <StepCard
            title="Share"
            description="Invite participants via link"
            badge="creator"
            icon={
              <svg
                className="w-6 h-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            }
          />
          <StepCard
            title="Respond"
            description="Open the link, complete the campaign, and submit — blockchain records your response permanently"
            badge="participant"
            icon={
              <svg
                className="w-6 h-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            }
          />
          <StepCard
            title="Verify"
            description="Anyone with the link can view results and verify they match the blockchain records"
            badge="anyone"
            icon={
              <svg
                className="w-6 h-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          />
        </div>

        <p className="text-center text-lg text-gray-600 dark:text-gray-400">
          Simple as Google Forms, but with blockchain guarantees.
        </p>
      </div>
    </section>
  );
}
