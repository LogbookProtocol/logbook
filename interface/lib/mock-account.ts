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
    memberSince: string;
  };
}

export interface Transaction {
  id: string;
  type: 'create_campaign' | 'respond' | 'sponsored_gas';
  amount: number;
  symbol: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
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
    memberSince: '2024-06-15',
  },
};

export const mockTransactionHistory: Transaction[] = [
  {
    id: 'tx-1',
    type: 'create_campaign',
    amount: 0.12,
    symbol: 'SUI',
    description: 'Created "Q1 2025 Product Roadmap Vote"',
    timestamp: '2025-01-10T14:30:00Z',
    status: 'completed',
    txHash: '0xabc123...def456',
  },
  {
    id: 'tx-2',
    type: 'sponsored_gas',
    amount: 0.05,
    symbol: 'SUI',
    description: 'Sponsored response in "Q1 Governance Vote"',
    timestamp: '2025-01-09T10:15:00Z',
    status: 'completed',
    txHash: '0xdef456...ghi789',
  },
  {
    id: 'tx-3',
    type: 'respond',
    amount: 0.02,
    symbol: 'SUI',
    description: 'Responded to "ETH Denver Community Survey"',
    timestamp: '2025-01-08T16:45:00Z',
    status: 'completed',
    txHash: '0xghi789...jkl012',
  },
  {
    id: 'tx-4',
    type: 'create_campaign',
    amount: 0.15,
    symbol: 'SUI',
    description: 'Created "Team Satisfaction Survey"',
    timestamp: '2025-01-05T09:00:00Z',
    status: 'completed',
    txHash: '0xjkl012...mno345',
  },
  {
    id: 'tx-5',
    type: 'sponsored_gas',
    amount: 0.03,
    symbol: 'SUI',
    description: 'Sponsored response in "Team Satisfaction Survey"',
    timestamp: '2025-01-04T11:20:00Z',
    status: 'completed',
    txHash: '0xmno345...pqr678',
  },
  {
    id: 'tx-6',
    type: 'respond',
    amount: 0.02,
    symbol: 'SUI',
    description: 'Responded to "Protocol Upgrade Vote"',
    timestamp: '2024-12-10T08:30:00Z',
    status: 'completed',
    txHash: '0xpqr678...stu901',
  },
];

// Calculate total spent
export const getTotalSpentSui = () => {
  return mockTransactionHistory
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const mockUserSettings: UserSettings = {
  theme: 'dark',
};
