export interface AuditFindings {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export interface Audit {
  id: string;
  auditor: string;
  auditorLogo: string | null;
  date: string;
  scope: string;
  status: 'completed' | 'in-progress';
  findings: AuditFindings | null;
  reportUrl: string | null;
}

export interface BugBounty {
  active: boolean;
  platform: string;
  maxReward: number;
  totalPaid: number;
  reportsResolved: number;
  link: string;
}

export interface Contract {
  name: string;
  address: string;
  network: string;
  verified: boolean;
  explorerUrl: string;
}

export interface SecurityFeature {
  title: string;
  description: string;
  icon: string;
}

export interface GitHubRepo {
  name: string;
  description: string;
  stars: number;
}

export interface SecurityData {
  audits: Audit[];
  bugBounty: BugBounty;
  contracts: Contract[];
  securityFeatures: SecurityFeature[];
  github: {
    url: string;
    repos: GitHubRepo[];
  };
}

export const securityData: SecurityData = {
  audits: [
    {
      id: 'audit-1',
      auditor: 'OtterSec',
      auditorLogo: null,
      date: '2024-12-15',
      scope: 'Core Protocol Smart Contracts',
      status: 'completed',
      findings: {
        critical: 0,
        high: 0,
        medium: 2,
        low: 5,
        informational: 8,
      },
      reportUrl: '#',
    },
    {
      id: 'audit-2',
      auditor: 'Zellic',
      auditorLogo: null,
      date: '2024-11-01',
      scope: 'Campaign Module',
      status: 'completed',
      findings: {
        critical: 0,
        high: 1,
        medium: 3,
        low: 4,
        informational: 6,
      },
      reportUrl: '#',
    },
    {
      id: 'audit-3',
      auditor: 'MoveBit',
      auditorLogo: null,
      date: '2025-02-01',
      scope: 'Spaces & Membership Module',
      status: 'in-progress',
      findings: null,
      reportUrl: null,
    },
  ],

  bugBounty: {
    active: true,
    platform: 'Immunefi',
    maxReward: 50000,
    totalPaid: 12500,
    reportsResolved: 8,
    link: 'https://immunefi.com/bounty/logbook',
  },

  contracts: [
    {
      name: 'LogbookCore',
      address: '0x1234...5678',
      network: 'Sui Mainnet',
      verified: true,
      explorerUrl: '#',
    },
    {
      name: 'CampaignModule',
      address: '0x2345...6789',
      network: 'Sui Mainnet',
      verified: true,
      explorerUrl: '#',
    },
    {
      name: 'SpacesModule',
      address: '0x3456...7890',
      network: 'Sui Mainnet',
      verified: true,
      explorerUrl: '#',
    },
    {
      name: 'ResponseModule',
      address: '0x4567...8901',
      network: 'Sui Mainnet',
      verified: true,
      explorerUrl: '#',
    },
  ],

  securityFeatures: [
    {
      title: 'Non-Upgradeable Contracts',
      description: 'Core contracts are immutable once deployed. No admin keys or upgrade mechanisms.',
      icon: '🔒',
    },
    {
      title: 'Open Source',
      description: 'All smart contract code is open source and publicly verifiable on GitHub.',
      icon: '📖',
    },
    {
      title: 'No Custody',
      description: 'Logbook never holds user funds. All transactions are direct wallet-to-contract.',
      icon: '🏦',
    },
    {
      title: 'zkLogin Security',
      description: 'OAuth integration uses zero-knowledge proofs. We never see your credentials.',
      icon: '🛡️',
    },
  ],

  github: {
    url: 'https://github.com/logbook-protocol',
    repos: [
      { name: 'logbook-protocol', description: 'Core Move smart contracts', stars: 234 },
      { name: 'logbook-interface', description: 'Web application', stars: 89 },
      { name: 'logbook-sdk', description: 'TypeScript SDK (coming soon)', stars: 12 },
    ],
  },
};
