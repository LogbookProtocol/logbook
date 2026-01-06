'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@logbook.zone');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <footer className="relative z-10 mt-auto bg-gray-50 dark:bg-white/[0.02]">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center">
        <div className="flex flex-row justify-between items-center w-full">
          {/* Left: Copyright */}
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © 2025 Logbook<sup className="text-[0.7em] font-semibold ml-0.5">β</sup>
          </p>

          {/* Center: Links - hidden on smaller screens */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/docs" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm">Docs</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm">GitHub</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm">Twitter</a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm">Telegram</a>
            <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm">Discord</a>
          </nav>

          {/* Right: Email */}
          <button
            onClick={copyEmail}
            className={`flex items-center gap-1.5 text-sm transition-colors ${emailCopied ? 'text-green-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            title={emailCopied ? 'Copied!' : 'Copy email'}
          >
            <span>hello@logbook.zone</span>
            {emailCopied ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
