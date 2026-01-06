'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ConnectOptionsModal } from '@/components/ConnectOptionsModal';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPaths?: string[];
  requiresAuth?: boolean;
}

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CampaignsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const CreateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const AccountIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <HomeIcon className="w-6 h-6" />,
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: <CampaignsIcon className="w-6 h-6" />,
    matchPaths: ['/campaigns'],
  },
  {
    href: '/campaigns/new',
    label: 'Create',
    icon: <CreateIcon className="w-6 h-6" />,
  },
  {
    href: '/account',
    label: 'Account',
    icon: <AccountIcon className="w-6 h-6" />,
    requiresAuth: true,
  },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const walletAccount = useCurrentAccount();
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Check zkLogin address
  useEffect(() => {
    const checkZkLogin = () => {
      const address = localStorage.getItem('zklogin_address');
      setZkLoginAddress(address);
    };

    checkZkLogin();
    window.addEventListener('storage', checkZkLogin);
    window.addEventListener('zklogin-changed', checkZkLogin);

    return () => {
      window.removeEventListener('storage', checkZkLogin);
      window.removeEventListener('zklogin-changed', checkZkLogin);
    };
  }, []);

  const connectedAddress = walletAccount?.address || zkLoginAddress;

  const isActive = (item: NavItem) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    // Check exact match first
    if (pathname === item.href) {
      return true;
    }
    // For matchPaths, don't match if another item has exact match for this path
    if (item.matchPaths) {
      const anotherItemMatchesExactly = navItems.some(
        other => other.href !== item.href && pathname === other.href
      );
      if (anotherItemMatchesExactly) {
        return false;
      }
      return item.matchPaths.some(path => pathname.startsWith(path));
    }
    return false;
  };

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.requiresAuth && !connectedAddress) {
      e.preventDefault();
      sessionStorage.setItem('zklogin_return_url', item.href);
      setIsConnectModalOpen(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 sm:hidden z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  active
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white/90 dark:bg-gray-900/90" />
      </nav>

      <ConnectOptionsModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
      />
    </>
  );
}
