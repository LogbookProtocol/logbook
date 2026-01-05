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
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

function LayoutContent({ children }: { children: ReactNode }) {
  const [zkLoginData, setZkLoginData] = useState<{ address: string; email?: string } | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const walletAccount = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  // Get connected address (zkLogin or wallet)
  const connectedAddress = zkLoginData?.address || walletAccount?.address;

  // Check zkLogin data from localStorage
  useEffect(() => {
    const checkZkLogin = () => {
      const address = localStorage.getItem('zklogin_address');
      const email = localStorage.getItem('zklogin_email');
      if (address) {
        setZkLoginData({ address, email: email || undefined });
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

  // Track scroll position for header visibility on home page
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    handleScroll(); // Check initial position
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after zkLogin redirect
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('restore_scroll_position');
    if (scrollPosition) {
      sessionStorage.removeItem('restore_scroll_position');
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(scrollPosition, 10));
      });
    }
  }, [pathname]);

  // Close auth menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setIsAuthMenuOpen(false);
      }
    }
    if (isAuthMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAuthMenuOpen]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleLogout = () => {
    // Clear zkLogin data
    localStorage.removeItem('zklogin_address');
    localStorage.removeItem('zklogin_email');
    localStorage.removeItem('zklogin_provider');
    sessionStorage.removeItem('zklogin_jwt');
    sessionStorage.removeItem('zklogin_return_url');
    sessionStorage.removeItem('zklogin_scroll_position');
    sessionStorage.removeItem('restore_scroll_position');
    setZkLoginData(null);

    // Disconnect wallet if connected
    if (walletAccount) {
      disconnectWallet();
    }

    setIsAuthMenuOpen(false);
    window.dispatchEvent(new Event('zklogin-changed'));
  };

  // Show logo and wallet button: always on other pages, only when scrolled on home page
  const showHeaderElements = !isHomePage || isScrolled;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative">
      {/* Global gradient overlay from top */}
      <div className="fixed inset-x-0 top-0 h-[500px] bg-gradient-to-b from-cyan-50/50 via-cyan-50/20 to-transparent dark:from-cyan-950/30 dark:via-cyan-950/10 dark:to-transparent pointer-events-none -z-10" />

      {/* Static logo in top-left corner - visible only on home page when not scrolled */}
      {isHomePage && (
        <div
          className={`fixed top-4 left-6 pointer-events-auto transition-opacity duration-500 ${!isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ zIndex: 51 }}
        >
          <Link href="/" className="flex items-center gap-1 text-lg whitespace-nowrap tracking-tight">
            <LogoIcon size={24} />
            <span className="font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Logbook</span><sup className="text-[0.55em] font-semibold text-blue-500 -ml-0.5">β</sup>
          </Link>
        </div>
      )}

      {/* Navigation Menu - always visible, separate from header */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{ zIndex: 51 }}
      >
        <div className="hidden md:flex justify-center pt-8">
          <nav className="flex items-center gap-1 pointer-events-auto">
            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Home</Link>
            <Link href="/campaigns" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Campaigns</Link>
            <Link href="/stats" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Stats</Link>
            <Link href="/docs" className="px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Docs</Link>
          </nav>
        </div>

        {/* Settings, Theme toggle and Auth */}
        <div className="absolute top-3 right-4 flex flex-col items-center gap-1 pointer-events-auto">
          <SettingsMenu />
          <ThemeToggle />
          {/* Auth icon - only on home page when not scrolled */}
          {isHomePage && !isScrolled && (
            connectedAddress ? (
              <div className="relative" ref={authMenuRef}>
                <button
                  onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  title={connectedAddress}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {isAuthMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {zkLoginData?.email ? 'Signed in as' : 'Connected'}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {zkLoginData?.email || `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}`}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/account');
                        setIsAuthMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Account</span>
                    </button>
                    <button
                      onClick={() => handleCopyAddress(connectedAddress)}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600 dark:text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy address</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Disconnect</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Log in"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16l4-4m0 0l-4-4m4 4H3m5-4V7a3 3 0 013-3h7a3 3 0 013 3v10a3 3 0 01-3 3h-7a3 3 0 01-3-3v-1" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {/* Header with blur background - only when scrolled or not on home page */}
      <div
        className={`fixed top-0 left-0 right-0 px-4 pt-4 pointer-events-none transition-all duration-500 ${showHeaderElements ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 50 }}
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <header className="relative flex items-center justify-between px-5 py-4 rounded-2xl">
            {/* Header background with blur */}
            <div className="absolute inset-0 rounded-2xl bg-gray-50/90 dark:bg-slate-900/75 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-lg shadow-black/[0.02] dark:shadow-black/5" />

            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0 relative pointer-events-auto">
              <Link href="/" className="flex items-center gap-1 text-xl whitespace-nowrap tracking-tight">
                <LogoIcon size={28} />
                <span className="font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Logbook</span><sup className="text-[0.6em] font-semibold text-blue-500 -ml-0.5">β</sup>
              </Link>
            </div>

            {/* Spacer for centered nav */}
            <div className="hidden md:block" />

            {/* Right side buttons */}
            <div className="flex items-center gap-2 relative pointer-events-auto">
              <WalletButton />
            </div>
          </header>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 pt-20 overflow-visible">
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
