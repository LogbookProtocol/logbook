'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useWallets, useConnectWallet } from '@mysten/dapp-kit';
import { getZkLoginUrl } from '@/lib/zklogin-utils';

interface ConnectOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectOptionsModal({ open, onOpenChange }: ConnectOptionsModalProps) {
  const router = useRouter();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showMoreWallets, setShowMoreWallets] = useState(false);
  const [lastUsedWallet, setLastUsedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Загружаем последний использованный кошелек и сохраняем текущий URL при открытии модала
  useEffect(() => {
    if (open) {
      const lastWallet = localStorage.getItem('last_used_wallet');
      setLastUsedWallet(lastWallet);
      console.log('Last used wallet from localStorage:', lastWallet);

      // Save current URL when modal opens (so we return here after login)
      const currentUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('zklogin_return_url', currentUrl);
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle modal close - clear return URL only if user explicitly closes without logging in
  const handleClose = () => {
    sessionStorage.removeItem('zklogin_return_url');
    onOpenChange(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError(null);
    try {
      // Save scroll position to restore after login
      sessionStorage.setItem('zklogin_scroll_position', String(window.scrollY));
      const authUrl = await getZkLoginUrl('google');
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initialize zkLogin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect. Please try again.';
      setError(errorMessage);
      setIsLoadingGoogle(false);
    }
  };

  const handleWalletConnect = (walletName: string) => {
    console.log('Connecting to wallet:', walletName);
    const wallet = wallets.find(w => w.name === walletName);
    if (wallet) {
      connect(
        { wallet },
        {
          onSuccess: () => {
            console.log('Successfully connected to:', walletName);
            onOpenChange(false);

            // Redirect to return URL if set (from requireAuth flow)
            const returnUrl = sessionStorage.getItem('zklogin_return_url');
            if (returnUrl) {
              sessionStorage.removeItem('zklogin_return_url');
              router.push(returnUrl);
            }
          },
        }
      );
    }
  };

  // Полный список всех поддерживаемых Sui кошельков
  const allSupportedWallets = [
    { name: 'Slush Wallet', iconUrl: 'https://cdn.prod.website-files.com/680905cfdc450738383648a6/6870becddb972b0b143dfe65_Slush_Logo_3D_Blue.avif', url: 'https://slush.app' },
    { name: 'Slush Web Wallet', iconUrl: 'https://cdn.prod.website-files.com/680905cfdc450738383648a6/6870becddb972b0b143dfe65_Slush_Logo_3D_Blue.avif', url: 'https://slush.app' },
    { name: 'Phantom', iconUrl: 'https://phantom.app/img/logo.png', url: 'https://phantom.app' },
    { name: 'Wallet Connect', iconUrl: 'https://walletconnect.com/meta/favicon.ico', url: 'https://walletconnect.com' },
    { name: 'Suiet', iconUrl: 'https://framerusercontent.com/modules/6HmgaTsk3ODDySrS62PZ/aWCkbIQfLPJmjLfPz012/assets/pwNZfqcmzEXoGGabpcBYjz7PaI.svg', url: 'https://suiet.app' },
    { name: 'OKX Wallet', iconUrl: 'https://static.okx.com/cdn/assets/imgs/MPC/okxwallet.png', url: 'https://okx.com/web3' },
    { name: 'Backpack', iconUrl: 'https://raw.githubusercontent.com/coral-xyz/backpack/master/assets/backpack.png', url: 'https://backpack.app' },
    { name: 'OneKey Wallet', iconUrl: 'https://onekey.so/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.4d98fd4f.png&w=64&q=75', url: 'https://onekey.so' },
    { name: 'Binance Wallet', iconUrl: 'https://bin.bnbstatic.com/static/images/common/favicon.ico', url: 'https://binance.com/wallet' },
    { name: 'Bitget Wallet', iconUrl: 'https://static-web.jjdsn.vip/17c3dc65b04a52709561f1c2f7d0ccd8/img/f84b9173413a.png', url: 'https://web3.bitget.com' },
    { name: 'Surf Wallet', iconUrl: 'https://avatars.githubusercontent.com/u/125699596', url: 'https://surf.tech' },
    { name: 'Martian Sui Wallet', iconUrl: 'https://martianwallet.xyz/favicon.png', url: 'https://martianwallet.xyz' },
    { name: 'Nightly', iconUrl: 'https://nightly.app/favicon.ico', url: 'https://nightly.app' },
    { name: 'Gate Wallet', iconUrl: 'https://www.gate.com/favicon.ico', url: 'https://www.gate.io/web3' },
  ];

  // Фильтруем: показываем только те кошельки, которых НЕТ в основном списке
  // (чтобы избежать дублирования)
  const additionalWallets = allSupportedWallets
    .filter(w => !wallets.some(installedWallet => installedWallet.name === w.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!open || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop - полный экран */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
        onClick={handleClose}
      />

      {/* Modal Container - полный экран с центрированием */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 text-center border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-2">
              <span className="text-gray-900 dark:text-gray-100">Log in to </span>
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">Logbook</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose your connection method
            </p>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-1">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Google zkLogin */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {isLoadingGoogle ? 'Connecting...' : 'Google'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sign in with Google account
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  or connect with wallet
                </span>
              </div>
            </div>

            {/* Sui Wallets List */}
            {wallets.map((wallet) => {
              // Проверяем, является ли этот кошелек последним использованным
              const isLastUsed = lastUsedWallet === wallet.name;

              const getWalletStatus = () => {
                if (isLastUsed) {
                  return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-500 rounded-full"></span>
                      Last Used
                    </span>
                  );
                }

                return null;
              };

              return (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletConnect(wallet.name)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      {wallet.icon && (
                        <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {wallet.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getWalletStatus()}
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}

            {wallets.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No Sui wallets detected. Please install a Sui wallet extension.
              </div>
            )}

            {/* Other web3 wallets button - TEMPORARILY DISABLED */}
            {/* <button
              onClick={() => setShowMoreWallets(!showMoreWallets)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Other web3 wallets ({additionalWallets.length})
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {showMoreWallets ? 'Hide' : 'Show'} more options
                  </div>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showMoreWallets ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button> */}

            {/* Additional wallets list (expandable) - TEMPORARILY DISABLED */}
            {/* {showMoreWallets && (
              <div className="space-y-1 pt-2">
                {additionalWallets.map((wallet) => (
                  <a
                    key={wallet.name}
                    href={wallet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img src={wallet.iconUrl} alt={wallet.name} className="w-6 h-6 rounded" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {wallet.name}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                      Get
                    </span>
                  </a>
                ))}
              </div>
            )} */}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By connecting, you agree to our{' '}
              <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms & Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
