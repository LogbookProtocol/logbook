'use client';

import { useState, useRef, useEffect } from 'react';
import { usePollingInterval, PollingInterval } from '@/contexts/PollingContext';

export function PollingIntervalSelector() {
  const { pollingInterval, setPollingInterval } = usePollingInterval();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const intervals: { value: PollingInterval; label: string }[] = [
    { value: 0, label: 'Off' },
    { value: 5, label: '5s' },
    { value: 30, label: '30s' },
    { value: 60, label: '60s' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (interval: PollingInterval) => {
    setPollingInterval(interval);
    setIsOpen(false);
  };

  const currentLabel = intervals.find(i => i.value === pollingInterval)?.label || 'Off';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition relative group"
        aria-label="Polling interval settings"
        title="Auto-refresh interval"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {/* Current interval badge */}
        <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[9px] font-medium px-1 rounded">
          {currentLabel}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Auto-refresh</div>
          </div>
          <div className="py-1">
            {intervals.map(interval => (
              <button
                key={interval.value}
                onClick={() => handleSelect(interval.value)}
                className={`w-full px-3 py-2 text-left text-sm transition ${
                  pollingInterval === interval.value
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{interval.label}</span>
                  {pollingInterval === interval.value && (
                    <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
