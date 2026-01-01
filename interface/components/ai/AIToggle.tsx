'use client';

interface AIToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  autoMode?: boolean;
  onAutoModeToggle?: (autoMode: boolean) => void;
  onResetChat?: () => void;
}

export function AIToggle({ enabled, onToggle, autoMode = true, onAutoModeToggle, onResetChat }: AIToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Auto/Manual Mode Toggle - Show first, only when AI is enabled */}
      {enabled && onAutoModeToggle && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
          <button
            onClick={() => onAutoModeToggle(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              autoMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            aria-label="Automatic changes mode"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-medium">Automatic changes</span>
          </button>
          <button
            onClick={() => onAutoModeToggle(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              !autoMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            aria-label="Manual confirmation mode"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Manual confirmation</span>
          </button>
        </div>
      )}

      {/* Reset Chat Button - Only show when AI is enabled */}
      {enabled && onResetChat && (
        <button
          onClick={onResetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          aria-label="Reset chat"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs font-medium">Reset chat</span>
        </button>
      )}

      {/* AI On/Off Toggle */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
        <button
          onClick={() => onToggle(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            enabled
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label="Enable AI Assistant"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-medium">AI On</span>
        </button>
        <button
          onClick={() => onToggle(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            !enabled
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label="Disable AI Assistant"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-xs font-medium">AI Off</span>
        </button>
      </div>
    </div>
  );
}
