// Sui Network Configuration - Logbook
export const SUI_CONFIG = {
  devnet: {
    packageId: '0x864dc36953c2fc645fb66a4d7827cc5562e9d982cc077ec3dc1073bbd9bc577d',
    registryId: '0x2a14c51ea75512e3e297ff3463f58b8ab9b3b68f0d7927dacbab6635de372249',
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
    network: 'devnet' as const,
  },
  testnet: {
    packageId: '0x6c7f7c9353b835325c3057d50ebd5920d257c70794873f09edf6b1f374ae208e',
    registryId: '0x19e600e809c3a312738da4b4169a6d0fa79110c1de16c914874ff6cedf3c7b0b',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet' as const,
  },
  mainnet: {
    packageId: '', // TODO: Deploy to mainnet
    registryId: '',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    network: 'mainnet' as const,
  },
} as const;

// Data source toggle - stored in localStorage
const DATA_SOURCE_KEY = 'logbook-data-source';

export type DataSource = 'mock' | 'devnet' | 'testnet' | 'mainnet';

export function getDataSource(): DataSource {
  if (typeof window === 'undefined') return 'devnet';
  const stored = localStorage.getItem(DATA_SOURCE_KEY);
  // Only allow devnet, testnet, mainnet - no mock mode
  if (stored === 'devnet' || stored === 'testnet' || stored === 'mainnet') {
    return stored;
  }
  // Default to devnet and save it
  localStorage.setItem(DATA_SOURCE_KEY, 'devnet');
  return 'devnet';
}

export function setDataSource(source: DataSource): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DATA_SOURCE_KEY, source);
    window.dispatchEvent(new CustomEvent('data-source-changed', { detail: { source } }));
  }
}

export function getSuiConfig(source: DataSource = getDataSource()) {
  if (source === 'devnet') return SUI_CONFIG.devnet;
  if (source === 'testnet') return SUI_CONFIG.testnet;
  if (source === 'mainnet') return SUI_CONFIG.mainnet;
  return null; // Mock data, no Sui config needed
}

// Question type mappings (match Move contract)
export const QUESTION_TYPES = {
  single_choice: 0,
  multiple_choice: 1,
  text_input: 2,
} as const;

export const QUESTION_TYPES_REVERSE = {
  0: 'single-choice',
  1: 'multiple-choice',
  2: 'text',
} as const;

// Access type mappings
export const ACCESS_TYPES = {
  public: 0,
  whitelist: 1,
} as const;

// Get Suiscan base URL based on current network
export function getSuiscanBaseUrl(source: DataSource = getDataSource()): string {
  switch (source) {
    case 'devnet':
      return 'https://suiscan.xyz/devnet';
    case 'testnet':
      return 'https://suiscan.xyz/testnet';
    case 'mainnet':
      return 'https://suiscan.xyz/mainnet';
    default:
      return 'https://suiscan.xyz/devnet'; // Default for mock mode
  }
}

// Get Suiscan object URL
export function getSuiscanObjectUrl(objectId: string, source?: DataSource): string {
  return `${getSuiscanBaseUrl(source)}/object/${objectId}`;
}

// Get Suiscan transaction URL
export function getSuiscanTxUrl(txHash: string, source?: DataSource): string {
  return `${getSuiscanBaseUrl(source)}/tx/${txHash}`;
}

// Get Suiscan account URL
export function getSuiscanAccountUrl(address: string, source?: DataSource): string {
  return `${getSuiscanBaseUrl(source)}/account/${address}`;
}
