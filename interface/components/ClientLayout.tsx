'use client';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Providers } from '@/app/providers';
import { SettingsMenu } from '@/components/SettingsMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectOptionsModal } from '@/components/ConnectOptionsModal';
import { Footer } from '@/components/Footer';
import { LogoIcon } from '@/components/LogoIcon';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useDevice } from '@/hooks/useDevice';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit';

function LayoutContent({ children }: { children: ReactNode }) {
  const [zkLoginData, setZkLoginData] = useState<{ address: string; email?: string } | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [bannerEmailCopied, setBannerEmailCopied] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [bannerHeight, setBannerHeight] = useState(28);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [shouldAnimateHeader, setShouldAnimateHeader] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isInitialLoadRef = useRef(true);
  const router = useRouter();
  const walletAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { isMobile, isTablet } = useDevice();
  const showMobileUI = isMobile || isTablet;

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

  // Handle scroll restoration for page refresh
  useEffect(() => {
    // Enable browser's automatic scroll restoration for back/forward navigation
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'auto';
    }

    // Save scroll position before page unload (for refresh)
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll_${pathname}`, window.scrollY.toString());
    };

    // Restore scroll position on mount (for refresh)
    const savedScroll = sessionStorage.getItem(`scroll_${pathname}`);
    if (savedScroll) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      });
      sessionStorage.removeItem(`scroll_${pathname}`);
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);

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

  // Measure header height (including banner)
  useEffect(() => {
    const updateHeaderHeight = () => {
      const bannerH = bannerRef.current?.offsetHeight || 0;
      const headerNavHeight = headerRef.current?.offsetHeight || 0;
      setBannerHeight(bannerH);
      setHeaderHeight(bannerH + headerNavHeight);
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

    // Redirect to campaigns list if on account page or participate page
    if (pathname === '/account' || pathname.endsWith('/participate')) {
      router.push('/campaigns');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative">
      {/* Global gradient overlay from top */}
      <div className="fixed inset-x-0 top-0 h-[500px] bg-gradient-to-b from-cyan-50/50 via-cyan-50/20 to-transparent dark:from-cyan-950/30 dark:via-cyan-950/10 dark:to-transparent pointer-events-none -z-10" />

      {/* Beta Banner */}
      <div
        ref={bannerRef}
        className={`fixed top-0 left-0 right-0 bg-green-950 text-green-500 text-xs sm:text-sm text-center py-1.5 px-4 ${
          shouldAnimateHeader ? 'transition-opacity duration-[3000ms] ease-out' : ''
        } ${headerVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 52 }}
      >
        <span className="hidden sm:inline">You're testing Logbook Beta on Sui Devnet. All data will be deleted after testing. Found a bug or have questions? Let us know at </span>
        <span className="sm:hidden">Beta on Sui Devnet. Data will be deleted. Contact: </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText('hello@logbook.zone');
            setBannerEmailCopied(true);
            setTimeout(() => setBannerEmailCopied(false), 2000);
          }}
          className={`inline-flex items-center gap-1 font-medium transition-colors ${bannerEmailCopied ? 'text-white' : 'underline hover:no-underline'}`}
          title={bannerEmailCopied ? 'Copied!' : 'Copy email'}
        >
          <span>hello@logbook.zone</span>
          {bannerEmailCopied ? (
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

      {/* Header */}
      <div
        ref={headerRef}
        className={`fixed left-0 right-0 pointer-events-none bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-sm ${
          shouldAnimateHeader ? 'transition-opacity duration-[3000ms] ease-out' : ''
        } ${headerVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 51, top: bannerHeight }}
      >
        <div className="flex items-center justify-between h-14 px-6 relative pointer-events-none">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 text-lg whitespace-nowrap tracking-tight pointer-events-auto">
            <LogoIcon size={24} />
            <span className="font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Logbook</span><sup className="text-[0.55em] font-semibold text-blue-500 -ml-0.5">β</sup>
          </Link>

          {/* Navigation Menu - centered */}
          <nav className="hidden lg:flex items-center gap-1 pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname === '/' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Home</Link>
            <Link href="/campaigns" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname.startsWith('/campaigns') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Campaigns</Link>
            <Link href="/stats" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname === '/stats' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Stats</Link>
            <Link href="/docs" className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition ${pathname === '/docs' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}>Docs</Link>
            <button
              onClick={() => {
                if (connectedAddress) {
                  router.push('/account');
                } else {
                  sessionStorage.setItem('zklogin_return_url', '/account');
                  setIsConnectModalOpen(true);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wider transition cursor-pointer ${pathname === '/account' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >Account</button>
          </nav>

          {/* Mobile: hamburger menu, auth icon, settings */}
          {showMobileUI && (
            <div className="flex items-center gap-1 pointer-events-auto">
              {/* Hamburger menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Auth icon for mobile */}
              {connectedAddress ? (
                <div className="relative" ref={authMenuRef}>
                  <button
                    onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    title={connectedAddress}
                  >
                    {zkLoginData ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ) : currentWallet?.icon ? (
                      <img src={currentWallet.icon} alt={currentWallet.name} className="w-5 h-5 rounded" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                    )}
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
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  aria-label="Log in"
                >
                  {/* Arrow into door - login icon (arrow pointing right) */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                </button>
              )}

              {/* Theme toggle for mobile */}
              <ThemeToggle />

              {/* Settings for mobile */}
              <SettingsMenu />
            </div>
          )}

          {/* Desktop: Auth, Theme toggle and Settings */}
          {!showMobileUI && (
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
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileUI && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
          <div
            className="absolute top-14 right-4 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="py-2">
              <Link
                href="/campaigns"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                  pathname.startsWith('/campaigns')
                    ? 'bg-gray-100 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Campaigns
              </Link>
              <Link
                href="/stats"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                  pathname === '/stats'
                    ? 'bg-gray-100 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Stats
              </Link>
              <Link
                href="/docs"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                  pathname === '/docs'
                    ? 'bg-gray-100 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Docs
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (connectedAddress) {
                    router.push('/account');
                  } else {
                    sessionStorage.setItem('zklogin_return_url', '/account');
                    setIsConnectModalOpen(true);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition w-full text-left ${
                  pathname === '/account'
                    ? 'bg-gray-100 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

              {/* Social Links - icons in a row */}
              <div className="flex items-center justify-center gap-2 px-4 py-1">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  title="Twitter"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  title="Telegram"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  title="Discord"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('hello@logbook.zone');
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className={`p-1.5 transition ${emailCopied ? 'text-green-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title={emailCopied ? 'Copied!' : 'hello@logbook.zone'}
                >
                  {emailCopied ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className="flex-1 relative z-10 overflow-visible"
        style={{
          paddingTop: headerHeight,
          paddingBottom: isMobile ? 80 : 0, // Space for mobile navigation
        }}
      >
        {children}
      </main>

      {/* Footer - hidden on mobile */}
      {!isMobile && <Footer />}

      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation />}

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
