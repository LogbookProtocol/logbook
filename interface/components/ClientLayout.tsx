'use client';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Providers } from '@/app/providers';
import { SettingsMenu } from '@/components/SettingsMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectOptionsModal } from '@/components/ConnectOptionsModal';
import { Footer } from '@/components/Footer';
import { LogoIcon } from '@/components/LogoIcon';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit';

function LayoutContent({ children }: { children: ReactNode }) {
  const [zkLoginData, setZkLoginData] = useState<{ address: string; email?: string } | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [shouldAnimateHeader, setShouldAnimateHeader] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isInitialLoadRef = useRef(true);
  const router = useRouter();
  const walletAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
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

  // Measure header height
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Header fade-in animation on initial load of home page
  useEffect(() => {
    // Check if this is fresh page load (not navigation) on home page
    const isHomePage = pathname === '/';
    const hasNavigated = sessionStorage.getItem('logbook_has_navigated');

    if (isHomePage && isInitialLoadRef.current && !hasNavigated) {
      // Fresh load on home page - animate header with delay
      setShouldAnimateHeader(true);
      // Trigger fade-in after 2 second delay
      setTimeout(() => {
        setHeaderVisible(true);
      }, 2000);
    } else {
      // Navigation or other page - show header immediately
      setHeaderVisible(true);
      setShouldAnimateHeader(false);
    }

    // Mark that navigation has occurred
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      sessionStorage.setItem('logbook_has_navigated', 'true');
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative">
      {/* Global gradient overlay from top */}
      <div className="fixed inset-x-0 top-0 h-[500px] bg-gradient-to-b from-cyan-50/50 via-cyan-50/20 to-transparent dark:from-cyan-950/30 dark:via-cyan-950/10 dark:to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <div
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 pointer-events-none bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-sm ${
          shouldAnimateHeader ? 'transition-opacity duration-[3000ms] ease-out' : ''
        } ${headerVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 51 }}
      >
        <div className="flex items-center justify-between h-14 px-6 relative pointer-events-none">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 text-lg whitespace-nowrap tracking-tight pointer-events-auto">
            <LogoIcon size={24} />
            <span className="font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Logbook</span><sup className="text-[0.55em] font-semibold text-blue-500 -ml-0.5">β</sup>
          </Link>

          {/* Navigation Menu - centered */}
          <nav className="hidden md:flex items-center gap-1 pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname === '/' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Home</Link>
            <Link href="/campaigns" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname.startsWith('/campaigns') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Campaigns</Link>
            <Link href="/stats" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname === '/stats' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Stats</Link>
            <Link href="/docs" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname === '/docs' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Docs</Link>
          </nav>

          {/* Auth, Theme toggle and Settings */}
          <div className="flex items-center gap-1 pointer-events-auto">
          {/* Auth icon */}
          {connectedAddress ? (
              <div className="relative" ref={authMenuRef}>
                <button
                  onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  title={connectedAddress}
                >
                  {zkLoginData ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ) : currentWallet?.icon ? (
                    <img src={currentWallet.icon} alt={currentWallet.name} className="w-4 h-4 rounded" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                  )}
                  <span>{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${isAuthMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isAuthMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {zkLoginData ? 'Signed in as' : 'Connected with'}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {zkLoginData ? zkLoginData.email : currentWallet?.name || 'Wallet'}
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
                className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Log in
              </button>
            )}
          <ThemeToggle />
          <SettingsMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-visible" style={{ paddingTop: headerHeight }}>
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
