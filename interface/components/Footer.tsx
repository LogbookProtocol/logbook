'use client';

import Link from 'next/link';

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const SuiIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 29 36" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M22.5363 15.0142L22.5357 15.0158C24.0044 16.8574 24.8821 19.1898 24.8821 21.7268C24.8821 24.3014 23.9781 26.6655 22.4698 28.5196L22.3399 28.6792L22.3055 28.4763C22.2762 28.3038 22.2418 28.1296 22.2018 27.954C21.447 24.6374 18.9876 21.7934 14.9397 19.4907C12.2063 17.9399 10.6417 16.0727 10.2309 13.9511C9.96558 12.5792 10.1628 11.2012 10.544 10.0209C10.9251 8.84103 11.4919 7.85247 11.9735 7.2573L11.9738 7.25692L13.5484 5.3315C13.8246 4.99384 14.3413 4.99384 14.6175 5.3315L22.5363 15.0142ZM25.0269 13.0906L25.0272 13.0898L14.4731 0.184802C14.2715 -0.0616007 13.8943 -0.0616009 13.6928 0.184802L3.1385 13.09L3.13878 13.0907L3.10444 13.1333C1.16226 15.5434 0 18.6061 0 21.9402C0 29.7051 6.30498 36 14.0829 36C21.8608 36 28.1658 29.7051 28.1658 21.9402C28.1658 18.6062 27.0035 15.5434 25.0614 13.1333L25.0269 13.0906ZM5.66381 14.9727L5.66423 14.9721L6.60825 13.8178L6.63678 14.0309C6.65938 14.1997 6.68678 14.3694 6.71928 14.5398C7.33009 17.7446 9.51208 20.4169 13.1602 22.4865C16.3312 24.2912 18.1775 26.3666 18.7095 28.6427C18.9314 29.5926 18.971 30.5272 18.8749 31.3443L18.8689 31.3948L18.8232 31.4172C17.3919 32.1164 15.783 32.5088 14.0826 32.5088C8.11832 32.5088 3.28308 27.6817 3.28308 21.7268C3.28308 19.1701 4.17443 16.8208 5.66381 14.9727Z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-gray-200/50 dark:border-white/[0.06] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1200px] mx-auto px-6 py-12">

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand column */}
          <div className="col-span-1">
            <div className="text-xl font-bold mb-3">
              <span className="text-gray-900 dark:text-white">
                Logbook
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Turn participation into<br />permanent records.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <DiscordIcon className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <GitHubIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/campaigns" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Campaigns</Link></li>
              <li><Link href="/spaces" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Spaces</Link></li>
              <li><Link href="/campaigns/new" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">New Campaign</Link></li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/docs" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Documentation</Link></li>
              <li><Link href="/security" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Security</Link></li>
              <li><Link href="/stats" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Stats</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">GitHub</a></li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200/50 dark:border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © 2025 Logbook. All rights reserved.
          </p>
          <a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm flex items-center gap-1.5 transition-colors">
            <SuiIcon className="w-3.5 h-4" />
            Built on Sui
          </a>
        </div>

      </div>
    </footer>
  );
}
