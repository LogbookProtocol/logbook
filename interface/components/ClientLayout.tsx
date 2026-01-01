'use client';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Providers } from '@/app/providers';
import { WalletButton } from '@/components/WalletButton';
import { SettingsMenu } from '@/components/SettingsMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectOptionsModal } from '@/components/ConnectOptionsModal';
import { Footer } from '@/components/Footer';
import { LogoIcon } from '@/components/LogoIcon';
import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';

function LayoutContent({ children }: { children: ReactNode }) {
  const [zkLoginData, setZkLoginData] = useState<{ address: string } | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Check zkLogin data from localStorage
  useEffect(() => {
    const checkZkLogin = () => {
      const address = localStorage.getItem('zklogin_address');
      if (address) {
        setZkLoginData({ address });
      } else {
        setZkLoginData(null);
      }
    };

    checkZkLogin();

    window.addEventListener('storage', checkZkLogin);
    const handleZkLoginChange = () => checkZkLogin();
    window.addEventListener('zklogin-changed', handleZkLoginChange);

    return () => {
      window.removeEventListener('storage', checkZkLogin);
      window.removeEventListener('zklogin-changed', handleZkLoginChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col relative">
      {/* Header with blur background - on all pages */}
      <div
        className="fixed top-0 left-0 right-0 px-4 pt-4 pointer-events-none"
        style={{ zIndex: 50 }}
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <header className="relative flex items-center justify-between px-5 py-4 rounded-2xl">
            {/* Header background with blur */}
            <div className="absolute inset-0 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-lg shadow-black/[0.02] dark:shadow-black/5" />

            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0 relative pointer-events-auto">
              <Link href="/" className="flex items-center gap-1 text-2xl whitespace-nowrap tracking-tight">
                <LogoIcon size={32} />
                <span className="font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Logbook</span>
              </Link>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex relative pointer-events-auto">
              <nav className="flex items-center gap-1">
                <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Home</Link>
                <Link href="/campaigns" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Campaigns</Link>
                <Link href="/spaces" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Spaces</Link>
                <Link href="/content" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Content</Link>
                <Link href="/pricing" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Pricing</Link>
                <Link href="/blog" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Blog</Link>
                <Link href="/stats" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Stats</Link>
                <Link href="/docs" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Docs</Link>
                <Link href="/security" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Security</Link>
              </nav>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-2 relative pointer-events-auto">
              <WalletButton />
            </div>
          </header>
        </div>

        {/* Theme toggle and Settings button */}
        <div className="absolute top-3 right-4 flex flex-col items-center gap-1 pointer-events-auto">
          <SettingsMenu />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 pt-20">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Connect Modal */}
      <ConnectOptionsModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
      />
    </div>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </LanguageProvider>
    </ThemeProvider>
  );
}
