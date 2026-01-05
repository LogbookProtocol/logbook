'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ConnectOptionsModal } from '@/components/ConnectOptionsModal';

interface AuthContextType {
  isConnected: boolean;
  connectedAddress: string | null;
  openLoginModal: (returnUrl?: string) => void;
  closeLoginModal: () => void;
  requireAuth: (returnUrl?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);

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
  }, []);

  // Returns true if user is connected, false if not (and opens login modal)
  const requireAuth = useCallback((returnUrl?: string): boolean => {
    if (isConnected) {
      return true;
    }
    openLoginModal(returnUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'));
    return false;
  }, [isConnected, openLoginModal]);

  return (
    <AuthContext.Provider
      value={{
        isConnected,
        connectedAddress,
        openLoginModal,
        closeLoginModal,
        requireAuth,
      }}
    >
      {children}
      <ConnectOptionsModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
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
