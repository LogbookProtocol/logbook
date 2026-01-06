'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Currency = 'usd' | 'eur';
export type CurrencySetting = 'auto' | Currency;

interface CurrencyContextType {
  currency: Currency; // The actual resolved currency (never 'auto')
  currencySetting: CurrencySetting; // The user's setting (can be 'auto')
  setCurrency: (currency: CurrencySetting) => void;
  formatPrice: (value: number) => string;
  currencySymbol: string;
  currencyLabel: string; // 'USD' or 'EUR'
  mounted: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Eurozone country codes (used with browser locale)
const eurozoneLocales = [
  'de', // Germany
  'fr', // France
  'it', // Italy
  'es', // Spain
  'pt', // Portugal
  'nl', // Netherlands
  'be', // Belgium
  'at', // Austria
  'fi', // Finland
  'ie', // Ireland
  'gr', // Greece
  'sk', // Slovakia
  'si', // Slovenia
  'ee', // Estonia
  'lv', // Latvia
  'lt', // Lithuania
  'lu', // Luxembourg
  'mt', // Malta
  'cy', // Cyprus
  'hr', // Croatia
];

// Detect currency based on browser locale
function detectBrowserCurrency(): Currency {
  // Get browser languages (returns array like ['de-DE', 'en-US', 'en'])
  const browserLanguages = navigator.languages || [navigator.language];

  for (const browserLang of browserLanguages) {
    // Extract country code from locale (e.g., 'DE' from 'de-DE')
    const parts = browserLang.split('-');
    const countryCode = parts.length > 1 ? parts[1].toLowerCase() : parts[0].toLowerCase();
    const languageCode = parts[0].toLowerCase();

    // Check if country code or language code matches eurozone
    if (eurozoneLocales.includes(countryCode) || eurozoneLocales.includes(languageCode)) {
      return 'eur';
    }
  }

  // Default to USD
  return 'usd';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencySetting, setCurrencySettingState] = useState<CurrencySetting>('auto');
  const [resolvedCurrency, setResolvedCurrency] = useState<Currency>('usd');
  const [mounted, setMounted] = useState(false);

  // Update resolved currency when setting changes or when in auto mode
  const updateResolvedCurrency = (setting: CurrencySetting) => {
    if (setting === 'auto') {
      setResolvedCurrency(detectBrowserCurrency());
    } else {
      setResolvedCurrency(setting);
    }
  };

  useEffect(() => {
    setMounted(true);
    const validSettings: CurrencySetting[] = ['auto', 'usd', 'eur'];

    // Check for saved currency preference
    const savedSetting = localStorage.getItem('currency') as CurrencySetting | null;
    if (savedSetting && validSettings.includes(savedSetting)) {
      setCurrencySettingState(savedSetting);
      updateResolvedCurrency(savedSetting);
    } else {
      // Default to auto
      setCurrencySettingState('auto');
      updateResolvedCurrency('auto');
    }
  }, []);

  const setCurrency = (currency: CurrencySetting) => {
    setCurrencySettingState(currency);
    updateResolvedCurrency(currency);
    localStorage.setItem('currency', currency);
  };

  const currencySymbol = resolvedCurrency === 'eur' ? '€' : '$';
  const currencyLabel = resolvedCurrency === 'eur' ? 'EUR' : 'USD';

  const formatPrice = (value: number): string => {
    if (resolvedCurrency === 'eur') {
      // European format: €1.234,56 or just €1,23 for smaller amounts
      return `€${value.toFixed(2).replace('.', ',')}`;
    }
    // US format: $1,234.56 or just $1.23 for smaller amounts
    return `$${value.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency: resolvedCurrency,
      currencySetting,
      setCurrency,
      formatPrice,
      currencySymbol,
      currencyLabel,
      mounted
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
