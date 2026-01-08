'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function SessionExpiryWarning() {
  const { sessionStatus, refreshSession } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset dismissed state when session status changes significantly
  useEffect(() => {
    if (sessionStatus?.epochsRemaining && sessionStatus.epochsRemaining <= 1) {
      setDismissed(false);
    }
  }, [sessionStatus?.epochsRemaining]);

  // Don't show if no session status, session is fine, or user dismissed
  if (!sessionStatus || !sessionStatus.shouldRefresh || dismissed) {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsRefreshing(false);
    }
  };

  const urgency = sessionStatus.epochsRemaining <= 1 ? 'critical' : 'warning';

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-xl shadow-lg border z-50 ${
      urgency === 'critical'
        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
        : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          urgency === 'critical'
            ? 'bg-red-100 dark:bg-red-800/50'
            : 'bg-amber-100 dark:bg-amber-800/50'
        }`}>
          <svg className={`w-5 h-5 ${
            urgency === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            urgency === 'critical' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
          }`}>
            {urgency === 'critical' ? 'Session expiring soon' : 'Session will expire'}
          </p>
          <p className={`text-xs mt-0.5 ${
            urgency === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {sessionStatus.epochsRemaining === 1
              ? 'Your session expires in ~24 hours'
              : `Your session expires in ~${sessionStatus.epochsRemaining} days`}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                urgency === 'critical'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              } disabled:opacity-50`}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh now'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                urgency === 'critical'
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50'
              }`}
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 p-1 rounded-lg transition ${
            urgency === 'critical'
              ? 'text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300'
              : 'text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
