'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PollingInterval = 5 | 30 | 60;

interface PollingContextType {
  pollingInterval: PollingInterval;
  setPollingInterval: (interval: PollingInterval) => void;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

const STORAGE_KEY = 'logbook_polling_interval';
const DEFAULT_INTERVAL: PollingInterval = 5;

export function PollingProvider({ children }: { children: ReactNode }) {
  const [pollingInterval, setPollingIntervalState] = useState<PollingInterval>(DEFAULT_INTERVAL);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed === 5 || parsed === 30 || parsed === 60) {
        setPollingIntervalState(parsed);
      }
    }
  }, []);

  const setPollingInterval = (interval: PollingInterval) => {
    setPollingIntervalState(interval);
    localStorage.setItem(STORAGE_KEY, interval.toString());
    // Dispatch custom event to notify all components
    window.dispatchEvent(new CustomEvent('polling-interval-changed', { detail: interval }));
  };

  return (
    <PollingContext.Provider value={{ pollingInterval, setPollingInterval }}>
      {children}
    </PollingContext.Provider>
  );
}

export function usePollingInterval() {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePollingInterval must be used within a PollingProvider');
  }
  return context;
}
