// lib/mock-account.ts

export interface UserAccount {
  address: string;
  shortAddress: string;
  suinsName: string | null;
  avatar: string | null;
  authMethod: 'wallet' | 'google' | 'apple' | 'facebook';
  email: string | null;
  stats: {
    campaignsCreated: number;
    campaignsParticipated: number;
    totalResponses: number;
    spacesJoined: number;
    memberSince: string;
  };
}

export interface WalletToken {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  icon: string;
}

export interface WalletAssets {
  sui: WalletToken;
  tokens: WalletToken[];
  totalUsdValue: number;
}

export interface LogbookDeposit {
  balance: number;
  usdValue: number;
  sponsoredTransactions: number;
  lastDeposit: string | null;
  lastWithdraw: string | null;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'send' | 'receive' | 'sponsor';
  amount: number;
  symbol: string;
  description?: string;
  from?: string;
  to?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  notifications: {
    email: boolean;
    campaignStart: boolean;
    campaignEnd: boolean;
    newResponse: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
  };
}

export const mockUserAccount: UserAccount = {
  address: '0xf2a8b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0686c',
  shortAddress: '0xf2a...686c',
  suinsName: '@mikhail',
  avatar: null,
  authMethod: 'google',
  email: 'mikhail@example.com',
  stats: {
    campaignsCreated: 12,
    campaignsParticipated: 47,
    totalResponses: 156,
    spacesJoined: 8,
    memberSince: '2024-06-15',
  },
};

export const mockWalletAssets: WalletAssets = {
  sui: {
    symbol: 'SUI',
    name: 'Sui',
    balance: 245.67,
    usdValue: 892.45,
    icon: 'SUI',
  },
  tokens: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 1250.00,
      usdValue: 1250.00,
      icon: 'USDC',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      balance: 500.00,
      usdValue: 500.00,
      icon: 'USDT',
    },
  ],
  totalUsdValue: 2642.45,
};

export const mockLogbookDeposit: LogbookDeposit = {
  balance: 50.00,
  usdValue: 181.50,
  sponsoredTransactions: 234,
  lastDeposit: '2025-01-10',
  lastWithdraw: null,
};

export const mockTransactionHistory: Transaction[] = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 25.00,
    symbol: 'SUI',
    timestamp: '2025-01-10T14:30:00Z',
    status: 'completed',
    txHash: '0xabc123...def456',
  },
  {
    id: 'tx-2',
    type: 'sponsor',
    amount: 0.05,
    symbol: 'SUI',
    description: 'Sponsored response in "Q1 Governance Vote"',
    timestamp: '2025-01-09T10:15:00Z',
    status: 'completed',
    txHash: '0xdef456...ghi789',
  },
  {
    id: 'tx-3',
    type: 'deposit',
    amount: 25.00,
    symbol: 'SUI',
    timestamp: '2025-01-05T09:00:00Z',
    status: 'completed',
    txHash: '0xghi789...jkl012',
  },
  {
    id: 'tx-4',
    type: 'receive',
    amount: 100.00,
    symbol: 'USDC',
    from: '0x123...456',
    timestamp: '2025-01-03T16:45:00Z',
    status: 'completed',
    txHash: '0xjkl012...mno345',
  },
  {
    id: 'tx-5',
    type: 'send',
    amount: 50.00,
    symbol: 'SUI',
    to: '0x789...abc',
    timestamp: '2024-12-28T11:20:00Z',
    status: 'completed',
    txHash: '0xmno345...pqr678',
  },
];

export const mockUserSettings: UserSettings = {
  theme: 'dark',
  notifications: {
    email: true,
    campaignStart: true,
    campaignEnd: true,
    newResponse: false,
    weeklyDigest: true,
  },
  privacy: {
    showProfile: true,
    showStats: true,
  },
};
