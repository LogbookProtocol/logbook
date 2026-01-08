'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { ConnectOptionsModal } from '@/components/ConnectOptionsModal';
import { checkSessionEpoch, refreshZkLoginSession, isZkLoginSessionValid } from '@/lib/zklogin-utils';

interface AuthContextType {
  isConnected: boolean;
  connectedAddress: string | null;
  openLoginModal: (returnUrl?: string) => void;
  closeLoginModal: () => void;
  requireAuth: (returnUrl?: string) => boolean;
  logout: () => void;
  sessionStatus: {
    valid: boolean;
    epochsRemaining: number;
    shouldRefresh: boolean;
  } | null;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<{
    valid: boolean;
    epochsRemaining: number;
    shouldRefresh: boolean;
  } | null>(null);

  // Load zkLogin address from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zklogin_address');
      setZkLoginAddress(stored);

      // Listen for zkLogin changes
      const handleZkLoginChange = () => {
        const updated = localStorage.getItem('zklogin_address');
        setZkLoginAddress(updated);
      };

      window.addEventListener('zklogin-changed', handleZkLoginChange);
      window.addEventListener('storage', handleZkLoginChange);

      return () => {
        window.removeEventListener('zklogin-changed', handleZkLoginChange);
        window.removeEventListener('storage', handleZkLoginChange);
      };
    }
  }, []);

  // Check zkLogin session epoch validity periodically
  useEffect(() => {
    if (!zkLoginAddress || !isZkLoginSessionValid()) {
      setSessionStatus(null);
      return;
    }

    const checkEpoch = async () => {
      try {
        const status = await checkSessionEpoch();
        setSessionStatus({
          valid: status.valid,
          epochsRemaining: status.epochsRemaining,
          shouldRefresh: status.shouldRefresh,
        });

        // If session is invalid, clear it
        if (!status.valid) {
          console.log('zkLogin session expired, clearing...');
          localStorage.removeItem('zklogin_address');
          localStorage.removeItem('zklogin_email');
          setZkLoginAddress(null);
          window.dispatchEvent(new CustomEvent('zklogin-changed'));
        }
      } catch (error) {
        console.error('Failed to check session epoch:', error);
      }
    };

    // Check immediately
    checkEpoch();

    // Check every 5 minutes
    const interval = setInterval(checkEpoch, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [zkLoginAddress]);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    await refreshZkLoginSession();
  }, []);

  const connectedAddress = account?.address || zkLoginAddress;
  const isConnected = !!connectedAddress;

  const openLoginModal = useCallback((returnUrl?: string) => {
    if (returnUrl) {
      sessionStorage.setItem('zklogin_return_url', returnUrl);
    }
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    // Clear return URL when user dismisses the login modal
    sessionStorage.removeItem('zklogin_return_url');
  }, []);

  // Returns true if user is connected, false if not (and opens login modal)
  const requireAuth = useCallback((returnUrl?: string): boolean => {
    if (isConnected) {
      return true;
    }
    openLoginModal(returnUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'));
    return false;
  }, [isConnected, openLoginModal]);

  // Logout - clear zkLogin data and disconnect wallet
  const logout = useCallback(() => {
    // Clear all zkLogin data from localStorage
    localStorage.removeItem('zklogin_address');
    localStorage.removeItem('zklogin_email');
    localStorage.removeItem('zklogin_ephemeral_keypair');
    localStorage.removeItem('zklogin_jwt');
    localStorage.removeItem('zklogin_salt');
    localStorage.removeItem('zklogin_proof');
    localStorage.removeItem('zklogin_max_epoch');

    // Disconnect wallet if connected
    if (account) {
      disconnectWallet();
    }

    // Update state
    setZkLoginAddress(null);

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('zklogin-changed'));
  }, [account, disconnectWallet]);

  return (
    <AuthContext.Provider
      value={{
        isConnected,
        connectedAddress,
        openLoginModal,
        closeLoginModal,
        requireAuth,
        logout,
        sessionStatus,
        refreshSession,
      }}
    >
      {children}
      <ConnectOptionsModal
        open={isLoginModalOpen}
        onOpenChange={(open) => {
          setIsLoginModalOpen(open);
          // Clear return URL when modal is closed (user cancelled login)
          if (!open) {
            sessionStorage.removeItem('zklogin_return_url');
          }
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
