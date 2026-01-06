'use client';

import { useState, useEffect } from 'react';
import { formatTimeWithSeconds } from '@/lib/format-date';

interface LastUpdatedProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function LastUpdated({ lastUpdated, onRefresh, isLoading }: LastUpdatedProps) {
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update display time when lastUpdated changes or format changes
  useEffect(() => {
    if (!lastUpdated) return;

    const updateDisplay = () => {
      setDisplayTime(formatTimeWithSeconds(lastUpdated));
    };

    updateDisplay();

    // Listen for format changes
    const handleFormatChange = () => updateDisplay();
    window.addEventListener('date-format-changed', handleFormatChange);
    return () => window.removeEventListener('date-format-changed', handleFormatChange);
  }, [lastUpdated]);

  if (!lastUpdated) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
      <span>Updated: {displayTime}</span>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition disabled:opacity-50"
        title="Refresh now"
      >
        <svg
          className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
