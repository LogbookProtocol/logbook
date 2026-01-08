// Campaign statuses (campaigns start immediately, no "upcoming")
export const CAMPAIGN_STATUSES = {
  active: { label: 'Active', color: 'green' },
  ended: { label: 'Ended', color: 'gray' },
} as const;

export type CampaignStatus = keyof typeof CAMPAIGN_STATUSES;

// Portfolio campaign (created by user)
export interface PortfolioCampaign {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  endDate: string;
  responsesCount: number;
  createdAt: string;
  isEncrypted?: boolean;
}

// Activity campaign (campaigns user has responded to)
export interface ActivityCampaign {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  endDate: string;
  respondedAt: string;
  createdAt?: string;
  isEncrypted?: boolean;
}

// Campaigns created by user (for Portfolio)
export const mockPortfolioCampaigns: PortfolioCampaign[] = [
  {
    id: 'camp-1',
    title: 'Q1 2025 Product Roadmap Vote',
    description: 'Vote on which features to prioritize for Q1 2025',
    status: 'active',
    endDate: '2025-02-15',
    responsesCount: 234,
    createdAt: '2025-01-10',
  },
  {
    id: 'camp-3',
    title: 'Conference Speaker Selection',
    description: 'Vote for speakers at ETH Denver 2025',
    status: 'active',
    endDate: '2025-02-10',
    responsesCount: 45,
    createdAt: '2025-01-12',
  },
  {
    id: 'camp-4',
    title: 'Workshop Feedback Survey',
    description: 'Share your feedback on Solidity Workshop',
    status: 'ended',
    endDate: '2024-12-20',
    responsesCount: 45,
    createdAt: '2024-11-25',
  },
  {
    id: 'camp-5',
    title: 'Q4 2024 Budget Allocation',
    description: 'Decide how to allocate remaining Q4 budget',
    status: 'ended',
    endDate: '2024-10-25',
    responsesCount: 127,
    createdAt: '2024-10-10',
  },
  {
    id: 'camp-6',
    title: 'Product Feature Feedback',
    description: 'Share your thoughts on the new dashboard',
    status: 'active',
    endDate: '2025-03-01',
    responsesCount: 12,
    createdAt: '2025-01-14',
  },
];

// Campaigns where user has responded
export const mockActivityCampaigns: ActivityCampaign[] = [
  {
    id: 'act-1',
    title: 'ETH Denver Community Survey',
    description: 'Share your expectations for ETH Denver 2025',
    status: 'active',
    endDate: '2025-02-20',
    respondedAt: '2025-01-10',
  },
  {
    id: 'act-2',
    title: 'Protocol Upgrade Vote',
    description: 'Vote on major protocol changes',
    status: 'ended',
    endDate: '2024-12-15',
    respondedAt: '2024-12-10',
  },
  {
    id: 'act-3',
    title: 'Community Experience Survey',
    description: 'Rate your experience with our community events',
    status: 'ended',
    endDate: '2024-11-30',
    respondedAt: '2024-11-25',
  },
  {
    id: 'act-4',
    title: 'Q3 Product Survey',
    description: 'Your feedback on our Q3 releases',
    status: 'ended',
    endDate: '2024-10-01',
    respondedAt: '2024-09-28',
  },
];

// Detailed campaign information
export interface CampaignDetails {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  isEncrypted: boolean;
  creator: {
    address: string;
    name: string | null;
    avatar: string | null;
  };
  dates: {
    created: string;
    endDate: string;
  };
  stats: {
    responses: number;
  };
  questions: CampaignQuestion[];
  onChain: {
    objectId: string;
    txHash: string;
    network: string;
  };
}

export interface CampaignQuestion {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'text';
  question: string;
  description?: string;
  required: boolean;
  options?: { id: string; label: string }[];
  placeholder?: string;
  maxLength?: number;
}

// Active campaign
export const mockActiveCampaign: CampaignDetails = {
  id: 'camp-1',
  title: 'Community Governance Vote Q1 2025',
  description: `Vote on key proposals for the protocol's future direction. This vote will determine our priorities for Q1 2025 including new feature development, treasury allocation, and partnership decisions.

Your vote matters! All token holders are eligible to participate.`,

  status: 'active',
  isEncrypted: false,

  creator: {
    address: '0x456...def',
    name: 'MakerDAO',
    avatar: null,
  },

  dates: {
    created: '2025-01-01T00:00:00Z',
    endDate: '2025-02-15T23:59:59Z',
  },

  stats: {
    responses: 234,
  },

  questions: [
    {
      id: 'q1',
      type: 'single-choice',
      question: 'Should we allocate 500,000 DAI to the Growth Fund?',
      description: 'This would fund marketing and business development for 6 months.',
      required: true,
      options: [
        { id: 'opt1', label: 'Yes, approve the allocation' },
        { id: 'opt2', label: 'No, keep funds in treasury' },
        { id: 'opt3', label: 'Abstain' },
      ],
    },
    {
      id: 'q2',
      type: 'single-choice',
      question: 'Which feature should we prioritize for Q1?',
      required: true,
      options: [
        { id: 'opt1', label: 'Cross-chain bridging' },
        { id: 'opt2', label: 'Mobile app' },
        { id: 'opt3', label: 'Advanced analytics dashboard' },
        { id: 'opt4', label: 'API improvements' },
      ],
    },
    {
      id: 'q3',
      type: 'multiple-choice',
      question: 'Which partnerships should we pursue? (Select all that apply)',
      required: false,
      options: [
        { id: 'opt1', label: 'Major CEX listing' },
        { id: 'opt2', label: 'DeFi protocol integration' },
        { id: 'opt3', label: 'Enterprise partnerships' },
        { id: 'opt4', label: 'Academic collaborations' },
      ],
    },
    {
      id: 'q4',
      type: 'text',
      question: 'Any additional feedback or suggestions?',
      required: false,
      placeholder: 'Share your thoughts...',
      maxLength: 500,
    },
  ],

  onChain: {
    objectId: '0x1234567890abcdef...',
    txHash: '0xabcdef1234567890...',
    network: 'sui:mainnet',
  },
};

// Ended campaign
export const mockEndedCampaign: CampaignDetails = {
  id: 'camp-4',
  title: 'Q4 2024 Budget Allocation Vote',
  description: `Community vote on how to allocate the remaining Q4 2024 budget across development, marketing, and community initiatives.

This vote has concluded. Thank you to everyone who participated!`,

  status: 'ended',
  isEncrypted: false,

  creator: {
    address: '0x456...def',
    name: 'MakerDAO',
    avatar: null,
  },

  dates: {
    created: '2024-10-01T00:00:00Z',
    endDate: '2024-10-25T23:59:59Z',
  },

  stats: {
    responses: 127,
  },

  questions: [
    {
      id: 'q1',
      type: 'single-choice',
      question: 'How should we allocate the remaining budget?',
      description: 'Choose the primary focus for Q4 spending.',
      required: true,
      options: [
        { id: 'opt1', label: '60% Development, 30% Marketing, 10% Community' },
        { id: 'opt2', label: '40% Development, 40% Marketing, 20% Community' },
        { id: 'opt3', label: '50% Development, 25% Marketing, 25% Community' },
      ],
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      question: 'Which initiatives should receive priority funding?',
      required: true,
      options: [
        { id: 'opt1', label: 'Security audits' },
        { id: 'opt2', label: 'Developer grants' },
        { id: 'opt3', label: 'Community events' },
        { id: 'opt4', label: 'Marketing campaigns' },
      ],
    },
  ],

  onChain: {
    objectId: '0x9876543210fedcba...',
    txHash: '0xfedcba0987654321...',
    network: 'sui:mainnet',
  },
};

// All campaign details mapped by ID
export const mockCampaignDetailsMap: Record<string, CampaignDetails> = {
  'camp-1': {
    id: 'camp-1',
    title: 'Q1 2025 Product Roadmap Vote',
    description: `Vote on which features to prioritize for Q1 2025. Your input will directly shape our development priorities for the upcoming quarter.

Help us decide where to focus our engineering resources!`,
    status: 'active',
    isEncrypted: false,
    creator: { address: '0x456789abcdef1234567890abcdef1234567890def', name: 'MakerDAO', avatar: null },
    dates: { created: '2025-01-10T00:00:00Z', endDate: '2025-02-15T23:59:59Z' },
    stats: { responses: 234 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'Should we allocate 500,000 DAI to the Growth Fund?',
        description: 'This would fund marketing and business development for 6 months.',
        required: true,
        options: [
          { id: 'opt1', label: 'Yes, approve the allocation' },
          { id: 'opt2', label: 'No, keep funds in treasury' },
          { id: 'opt3', label: 'Abstain' },
        ],
      },
      {
        id: 'q2',
        type: 'single-choice',
        question: 'Which feature should we prioritize for Q1?',
        required: true,
        options: [
          { id: 'opt1', label: 'Cross-chain bridging' },
          { id: 'opt2', label: 'Mobile app' },
          { id: 'opt3', label: 'Advanced analytics dashboard' },
          { id: 'opt4', label: 'API improvements' },
        ],
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'Which partnerships should we pursue? (Select all that apply)',
        required: false,
        options: [
          { id: 'opt1', label: 'Major CEX listing' },
          { id: 'opt2', label: 'DeFi protocol integration' },
          { id: 'opt3', label: 'Enterprise partnerships' },
          { id: 'opt4', label: 'Academic collaborations' },
        ],
      },
      {
        id: 'q4',
        type: 'text',
        question: 'Any additional feedback or suggestions?',
        required: false,
        placeholder: 'Share your thoughts...',
        maxLength: 500,
      },
    ],
    onChain: { objectId: '0x1234567890abcdef...', txHash: '0xabcdef1234567890...', network: 'sui:mainnet' },
  },
  'camp-3': {
    id: 'camp-3',
    title: 'Conference Speaker Selection',
    description: `Vote for speakers at ETH Denver 2025. We have limited slots and want the community to decide who should represent us.

Each vote counts equally.`,
    status: 'active',
    isEncrypted: false,
    creator: { address: '0x456789abcdef1234567890abcdef1234567890def', name: 'MakerDAO', avatar: null },
    dates: { created: '2025-01-12T00:00:00Z', endDate: '2025-02-10T23:59:59Z' },
    stats: { responses: 45 },
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which speakers would you like to see at ETH Denver?',
        description: 'Select up to 3 speakers',
        required: true,
        options: [
          { id: 'opt1', label: 'Vitalik Buterin - Ethereum Future' },
          { id: 'opt2', label: 'Stani Kulechov - DeFi Innovation' },
          { id: 'opt3', label: 'Hayden Adams - AMM Deep Dive' },
          { id: 'opt4', label: 'Community Speaker TBD' },
        ],
      },
    ],
    onChain: { objectId: '0x3456789012cdef01...', txHash: '0xcdef012345678912...', network: 'sui:mainnet' },
  },
  'camp-4': {
    id: 'camp-4',
    title: 'Workshop Feedback Survey',
    description: `Share your feedback on Solidity Workshop. Help us improve future educational content.

This survey has concluded. Thank you to all participants!`,
    status: 'ended',
    isEncrypted: false,
    creator: { address: '0x456789abcdef1234567890abcdef1234567890def', name: 'MakerDAO', avatar: null },
    dates: { created: '2024-11-25T00:00:00Z', endDate: '2024-12-20T23:59:59Z' },
    stats: { responses: 45 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'How would you rate the workshop overall?',
        required: true,
        options: [
          { id: 'opt1', label: 'Excellent' },
          { id: 'opt2', label: 'Good' },
          { id: 'opt3', label: 'Average' },
          { id: 'opt4', label: 'Poor' },
        ],
      },
      {
        id: 'q2',
        type: 'text',
        question: 'What topics would you like in future workshops?',
        required: false,
        placeholder: 'Share your ideas...',
        maxLength: 500,
      },
    ],
    onChain: { objectId: '0x4567890123def012...', txHash: '0xdef0123456789123...', network: 'sui:mainnet' },
  },
  'camp-5': {
    id: 'camp-5',
    title: 'Q4 2024 Budget Allocation',
    description: `Decide how to allocate remaining Q4 budget across development, marketing, and community initiatives.

This vote has concluded. Thank you to everyone who participated!`,
    status: 'ended',
    isEncrypted: false,
    creator: { address: '0x456789abcdef1234567890abcdef1234567890def', name: 'MakerDAO', avatar: null },
    dates: { created: '2024-10-10T00:00:00Z', endDate: '2024-10-25T23:59:59Z' },
    stats: { responses: 127 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'How should we allocate the remaining budget?',
        description: 'Choose the primary focus for Q4 spending.',
        required: true,
        options: [
          { id: 'opt1', label: '60% Development, 30% Marketing, 10% Community' },
          { id: 'opt2', label: '40% Development, 40% Marketing, 20% Community' },
          { id: 'opt3', label: '50% Development, 25% Marketing, 25% Community' },
        ],
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Which initiatives should receive priority funding?',
        required: true,
        options: [
          { id: 'opt1', label: 'Security audits' },
          { id: 'opt2', label: 'Developer grants' },
          { id: 'opt3', label: 'Community events' },
          { id: 'opt4', label: 'Marketing campaigns' },
        ],
      },
    ],
    onChain: { objectId: '0x9876543210fedcba...', txHash: '0xfedcba0987654321...', network: 'sui:mainnet' },
  },
  'camp-6': {
    id: 'camp-6',
    title: 'Product Feature Feedback',
    description: `Share your thoughts on the new dashboard. We want to know what you think about the recent updates.

Share your thoughts on the new dashboard.`,
    status: 'active',
    isEncrypted: false,
    creator: { address: '0x456789abcdef1234567890abcdef1234567890def', name: 'MakerDAO', avatar: null },
    dates: { created: '2025-01-14T00:00:00Z', endDate: '2025-03-01T23:59:59Z' },
    stats: { responses: 12 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'How do you like the new dashboard design?',
        required: true,
        options: [
          { id: 'opt1', label: 'Love it!' },
          { id: 'opt2', label: 'It\'s okay' },
          { id: 'opt3', label: 'Prefer the old design' },
        ],
      },
      {
        id: 'q2',
        type: 'text',
        question: 'Any specific feedback on the UI/UX?',
        required: false,
        placeholder: 'Tell us what you think...',
        maxLength: 500,
      },
    ],
    onChain: { objectId: '0x5678901234ef0123...', txHash: '0xef01234567890134...', network: 'sui:mainnet' },
  },
  // Activity campaigns (campaigns user participated in)
  'act-1': {
    id: 'act-1',
    title: 'ETH Denver Community Survey',
    description: `Share your expectations for ETH Denver 2025. Help us plan the best experience for the community.

Your feedback will directly influence event planning!`,
    status: 'active',
    isEncrypted: false,
    creator: { address: '0x789abcdef1234567890abcdef1234567890abc', name: 'ETH Denver DAO', avatar: null },
    dates: { created: '2025-01-05T00:00:00Z', endDate: '2025-02-20T23:59:59Z' },
    stats: { responses: 312 },
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which topics are you most interested in?',
        required: true,
        options: [
          { id: 'opt1', label: 'DeFi & Trading' },
          { id: 'opt2', label: 'NFTs & Gaming' },
          { id: 'opt3', label: 'Infrastructure & Scaling' },
          { id: 'opt4', label: 'DAOs & Governance' },
        ],
      },
      {
        id: 'q2',
        type: 'text',
        question: 'What speakers would you like to see?',
        required: false,
        placeholder: 'Share your suggestions...',
        maxLength: 500,
      },
    ],
    onChain: { objectId: '0x6789012345f01234...', txHash: '0xf012345678901235...', network: 'sui:mainnet' },
  },
  'act-2': {
    id: 'act-2',
    title: 'Protocol Upgrade Vote',
    description: `Vote on major protocol changes. This upgrade includes performance improvements and new features.

This vote has concluded.`,
    status: 'ended',
    isEncrypted: false,
    creator: { address: '0xabcdef1234567890abcdef1234567890789', name: 'Protocol Foundation', avatar: null },
    dates: { created: '2024-12-01T00:00:00Z', endDate: '2024-12-15T23:59:59Z' },
    stats: { responses: 567 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'Do you approve the protocol upgrade?',
        required: true,
        options: [
          { id: 'opt1', label: 'Yes, approve' },
          { id: 'opt2', label: 'No, reject' },
          { id: 'opt3', label: 'Abstain' },
        ],
      },
    ],
    onChain: { objectId: '0x7890123456012345...', txHash: '0x0123456789012346...', network: 'sui:mainnet' },
  },
  'act-3': {
    id: 'act-3',
    title: 'Community Experience Survey',
    description: `Rate your experience with our community events. Your feedback helps us improve future events.

This survey has concluded.`,
    status: 'ended',
    isEncrypted: false,
    creator: { address: '0xdef1234567890abcdef1234567890012', name: 'Community Team', avatar: null },
    dates: { created: '2024-11-15T00:00:00Z', endDate: '2024-11-30T23:59:59Z' },
    stats: { responses: 89 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'How would you rate our community events?',
        required: true,
        options: [
          { id: 'opt1', label: 'Excellent' },
          { id: 'opt2', label: 'Good' },
          { id: 'opt3', label: 'Average' },
          { id: 'opt4', label: 'Poor' },
        ],
      },
    ],
    onChain: { objectId: '0x8901234567123456...', txHash: '0x1234567890123457...', network: 'sui:mainnet' },
  },
  'act-4': {
    id: 'act-4',
    title: 'Q3 Product Survey',
    description: `Your feedback on our Q3 releases. Tell us what you think about the new features.

This survey has concluded.`,
    status: 'ended',
    isEncrypted: false,
    creator: { address: '0x3456789abcdef1234567890abcdef1234567890678', name: 'Product Team', avatar: null },
    dates: { created: '2024-09-15T00:00:00Z', endDate: '2024-10-01T23:59:59Z' },
    stats: { responses: 156 },
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'How satisfied are you with Q3 releases?',
        required: true,
        options: [
          { id: 'opt1', label: 'Very satisfied' },
          { id: 'opt2', label: 'Satisfied' },
          { id: 'opt3', label: 'Neutral' },
          { id: 'opt4', label: 'Dissatisfied' },
        ],
      },
      {
        id: 'q2',
        type: 'text',
        question: 'Any feedback on the new features?',
        required: false,
        placeholder: 'Share your thoughts...',
        maxLength: 500,
      },
    ],
    onChain: { objectId: '0x9012345678234567...', txHash: '0x2345678901234568...', network: 'sui:mainnet' },
  },
};

// Helper function to get campaign by ID
export function getCampaignById(id: string): CampaignDetails | null {
  return mockCampaignDetailsMap[id] || null;
}

// Default export for backwards compatibility
export const mockCampaignDetails = mockActiveCampaign;

// Text response with respondent info
export interface TextResponseWithRespondent {
  text: string;
  respondent: string;
  respondentAddress: string;
  txDigest?: string;
}

// Campaign results
export interface QuestionResult {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'text';
  totalVotes?: number;
  totalResponses?: number;
  results?: {
    id: string;
    label: string;
    votes: number;
    percentage: number;
  }[];
  winners?: string[]; // Array of option IDs that have the highest votes (can be multiple in case of tie)
  textResponses?: TextResponseWithRespondent[];
}

export interface CampaignResults {
  campaignId: string;
  totalResponses: number;
  completionRate: number;
  questions: QuestionResult[];
  timeline: { date: string; responses: number }[];
  finalizedOnChain: boolean;
  finalizationTx: string | null;
}

export const mockCampaignResults: CampaignResults = {
  campaignId: 'camp-1',
  totalResponses: 234,
  completionRate: 46.8,

  questions: [
    {
      id: 'q1',
      question: 'Should we allocate 500,000 DAI to the Growth Fund?',
      type: 'single-choice',
      totalVotes: 234,
      results: [
        { id: 'opt1', label: 'Yes, approve the allocation', votes: 156, percentage: 66.7 },
        { id: 'opt2', label: 'No, keep funds in treasury', votes: 52, percentage: 22.2 },
        { id: 'opt3', label: 'Abstain', votes: 26, percentage: 11.1 },
      ],
      winners: ['opt1'],
    },
    {
      id: 'q2',
      question: 'Which feature should we prioritize for Q1?',
      type: 'single-choice',
      totalVotes: 234,
      results: [
        { id: 'opt1', label: 'Cross-chain bridging', votes: 89, percentage: 38.0 },
        { id: 'opt2', label: 'Mobile app', votes: 67, percentage: 28.6 },
        { id: 'opt3', label: 'Advanced analytics dashboard', votes: 45, percentage: 19.2 },
        { id: 'opt4', label: 'API improvements', votes: 33, percentage: 14.1 },
      ],
      winners: ['opt1'],
    },
    {
      id: 'q3',
      question: 'Which partnerships should we pursue?',
      type: 'multiple-choice',
      totalVotes: 198,
      results: [
        { id: 'opt1', label: 'Major CEX listing', votes: 145, percentage: 73.2 },
        { id: 'opt2', label: 'DeFi protocol integration', votes: 134, percentage: 67.7 },
        { id: 'opt3', label: 'Enterprise partnerships', votes: 89, percentage: 45.0 },
        { id: 'opt4', label: 'Academic collaborations', votes: 56, percentage: 28.3 },
      ],
    },
    {
      id: 'q4',
      question: 'Any additional feedback or suggestions?',
      type: 'text',
      totalResponses: 67,
    },
  ],

  timeline: [
    { date: '2025-01-01', responses: 45 },
    { date: '2025-01-02', responses: 67 },
    { date: '2025-01-03', responses: 34 },
    { date: '2025-01-04', responses: 28 },
    { date: '2025-01-05', responses: 19 },
    { date: '2025-01-06', responses: 23 },
    { date: '2025-01-07', responses: 18 },
  ],

  finalizedOnChain: true,
  finalizationTx: '0xfinal123...',
};

// Campaign responses (for manage page)
export interface CampaignResponse {
  id: string;
  respondent: string;
  respondentAddress?: string; // Full address for Suiscan link
  timestamp: string;
  answers: Record<string, string | string[] | null>;
  txHash: string;
}

export const mockCampaignResponses: CampaignResponse[] = [
  {
    id: 'resp-1',
    respondent: '0x123...abc',
    respondentAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
    timestamp: '2025-01-07T14:32:00Z',
    answers: { q1: 'opt1', q2: 'opt2', q3: ['opt1', 'opt2'], q4: 'Great initiative!' },
    txHash: '0xresp123...',
  },
  {
    id: 'resp-2',
    respondent: '0x456...def',
    respondentAddress: '0x456789abcdef0123456789abcdef0123456789abcdef0123456789def',
    timestamp: '2025-01-07T13:15:00Z',
    answers: { q1: 'opt2', q2: 'opt1', q3: ['opt1'], q4: null },
    txHash: '0xresp456...',
  },
  {
    id: 'resp-3',
    respondent: '0x789...ghi',
    respondentAddress: '0x789abcdef0123456789abcdef0123456789abcdef0123456789ghi',
    timestamp: '2025-01-07T12:45:00Z',
    answers: { q1: 'opt1', q2: 'opt1', q3: ['opt1', 'opt3', 'opt4'], q4: 'Focus on security' },
    txHash: '0xresp789...',
  },
  {
    id: 'resp-4',
    respondent: '0xabc...123',
    respondentAddress: '0xabcdef0123456789abcdef0123456789abcdef0123456789abc123',
    timestamp: '2025-01-07T11:20:00Z',
    answers: { q1: 'opt1', q2: 'opt3', q3: ['opt2', 'opt3'], q4: null },
    txHash: '0xresp101...',
  },
  {
    id: 'resp-5',
    respondent: '0xdef...456',
    respondentAddress: '0xdef0123456789abcdef0123456789abcdef0123456789abcdef456',
    timestamp: '2025-01-07T10:05:00Z',
    answers: { q1: 'opt3', q2: 'opt2', q3: ['opt1', 'opt2', 'opt3', 'opt4'], q4: 'All partnerships are valuable' },
    txHash: '0xresp102...',
  },
];
