'use client';

import { ZkLoginErrorInfo, getZkLoginUrl, clearZkLoginSession } from '@/lib/zklogin-utils';
import { useState } from 'react';

interface ZkLoginErrorAlertProps {
  error: ZkLoginErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ZkLoginErrorAlert({ error, onRetry, onDismiss }: ZkLoginErrorAlertProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRelogin = async () => {
    setIsRedirecting(true);
    // Clear old session data
    clearZkLoginSession();
    // Redirect to Google auth
    const url = await getZkLoginUrl('google');
    window.location.href = url;
  };

  const isExpiredError = error.type === 'session_expired' || error.type === 'session_invalid';

  return (
    <div className={`p-4 rounded-xl border mb-6 ${
      isExpiredError
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isExpiredError
            ? 'bg-amber-100 dark:bg-amber-900/40'
            : 'bg-red-100 dark:bg-red-900/40'
        }`}>
          {isExpiredError ? (
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${
            isExpiredError
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-red-800 dark:text-red-300'
          }`}>
            {isExpiredError ? 'Session Expired' : 'Error'}
          </h3>
          <p className={`text-sm mt-1 ${
            isExpiredError
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-red-700 dark:text-red-400'
          }`}>
            {error.message}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {error.actionRequired === 'relogin' && (
              <button
                onClick={handleRelogin}
                disabled={isRedirecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                {isRedirecting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            )}

            {error.actionRequired === 'retry' && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
