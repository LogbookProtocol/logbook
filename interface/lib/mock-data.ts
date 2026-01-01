// Campaign types
export const CAMPAIGN_TYPES = {
  voting: { label: 'Voting', icon: '🗳️', color: 'cyan' },
  feedback: { label: 'Feedback', icon: '📊', color: 'blue' },
  registration: { label: 'Registration', icon: '📝', color: 'green' },
  certification: { label: 'Certification', icon: '🎓', color: 'purple' },
  fundraising: { label: 'Fundraising', icon: '💰', color: 'yellow' },
  lottery: { label: 'Lottery', icon: '🎲', color: 'pink' },
} as const;

export type CampaignType = keyof typeof CAMPAIGN_TYPES;

// Campaign statuses
export const CAMPAIGN_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  upcoming: { label: 'Upcoming', color: 'orange' },
  active: { label: 'Active', color: 'green' },
  ended: { label: 'Ended', color: 'gray' },
} as const;

export type CampaignStatus = keyof typeof CAMPAIGN_STATUSES;

// Space reference
export interface SpaceRef {
  id: string;
  name: string;
  icon: string;
}

// Portfolio campaign (created by user)
export interface PortfolioCampaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  visibility: 'public' | 'private';
  space: SpaceRef | null;
  startDate: string | null;
  endDate: string | null;
  responsesCount: number;
  participantsTarget: number | null;
  createdAt: string;
}

// Activity campaign (user participates)
export interface ActivityCampaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  space: SpaceRef | null;
  startDate?: string;
  endDate: string;
  participation: 'pending' | 'completed';
  respondedAt: string | null;
  reward: string | null;
}

// Campaigns created by user (for Portfolio)
export const mockPortfolioCampaigns: PortfolioCampaign[] = [
  {
    id: 'camp-1',
    title: 'Q1 2025 Product Roadmap Vote',
    description: 'Vote on which features to prioritize for Q1 2025',
    type: 'voting',
    status: 'active',
    visibility: 'public',
    space: { id: 'space-1', name: 'Acme Corp', icon: '🏢' },
    startDate: null,
    endDate: '2025-02-15',
    responsesCount: 234,
    participantsTarget: 500,
    createdAt: '2025-01-10',
  },
  {
    id: 'camp-2',
    title: 'Team Satisfaction Survey',
    description: 'Anonymous feedback on team culture and processes',
    type: 'feedback',
    status: 'active',
    visibility: 'private',
    space: { id: 'space-7', name: 'Engineering Team', icon: '👔' },
    startDate: null,
    endDate: '2025-01-31',
    responsesCount: 8,
    participantsTarget: 12,
    createdAt: '2025-01-05',
  },
  {
    id: 'camp-3',
    title: 'Conference Speaker Selection',
    description: 'Vote for speakers at ETH Denver 2025',
    type: 'voting',
    status: 'upcoming',
    visibility: 'public',
    space: { id: 'space-1', name: 'Ethereum Developers Portugal', icon: '👥' },
    startDate: '2025-02-01',
    endDate: '2025-02-10',
    responsesCount: 0,
    participantsTarget: 200,
    createdAt: '2025-01-12',
  },
  {
    id: 'camp-4',
    title: 'Workshop Registration',
    description: 'Register for Solidity Workshop Feb 2025',
    type: 'registration',
    status: 'ended',
    visibility: 'public',
    space: null,
    startDate: '2024-12-01',
    endDate: '2024-12-20',
    responsesCount: 45,
    participantsTarget: 50,
    createdAt: '2024-11-25',
  },
  {
    id: 'camp-5',
    title: 'Q4 2024 Budget Allocation',
    description: 'Decide how to allocate remaining Q4 budget',
    type: 'voting',
    status: 'ended',
    visibility: 'private',
    space: { id: 'space-4', name: 'Acme Corporation', icon: '🏢' },
    startDate: '2024-10-15',
    endDate: '2024-10-25',
    responsesCount: 127,
    participantsTarget: 150,
    createdAt: '2024-10-10',
  },
  {
    id: 'camp-6',
    title: 'Product Feature Feedback',
    description: 'Share your thoughts on the new dashboard',
    type: 'feedback',
    status: 'draft',
    visibility: 'public',
    space: null,
    startDate: null,
    endDate: null,
    responsesCount: 0,
    participantsTarget: 100,
    createdAt: '2025-01-14',
  },
];

// Campaigns where user participates (for Activity)
export const mockActivityCampaigns: ActivityCampaign[] = [
  {
    id: 'act-1',
    title: 'Community Governance Vote Q1 2025',
    description: 'Vote on proposals for protocol improvements',
    type: 'voting',
    status: 'active',
    space: { id: 'space-3', name: 'MakerDAO', icon: '🏛️' },
    endDate: '2025-02-01',
    participation: 'pending',
    respondedAt: null,
    reward: null,
  },
  {
    id: 'act-2',
    title: 'Stanford Course Feedback',
    description: 'Rate your experience in CS101',
    type: 'feedback',
    status: 'active',
    space: { id: 'space-2', name: 'Stanford University', icon: '🎓' },
    endDate: '2025-01-25',
    participation: 'pending',
    respondedAt: null,
    reward: null,
  },
  {
    id: 'act-3',
    title: 'ETH Denver Volunteer Registration',
    description: 'Sign up to volunteer at ETH Denver 2025',
    type: 'registration',
    status: 'active',
    space: { id: 'space-1', name: 'Ethereum Developers Portugal', icon: '👥' },
    endDate: '2025-02-20',
    participation: 'completed',
    respondedAt: '2025-01-10',
    reward: null,
  },
  {
    id: 'act-4',
    title: 'Solidity Certification Test',
    description: 'Prove your Solidity development skills',
    type: 'certification',
    status: 'upcoming',
    space: { id: 'space-2', name: 'Stanford University', icon: '🎓' },
    startDate: '2025-02-01',
    endDate: '2025-02-15',
    participation: 'pending',
    respondedAt: null,
    reward: 'Certificate NFT',
  },
  {
    id: 'act-5',
    title: 'Protocol Upgrade Vote',
    description: 'Vote on major protocol changes',
    type: 'voting',
    status: 'ended',
    space: { id: 'space-3', name: 'MakerDAO', icon: '🏛️' },
    endDate: '2024-12-15',
    participation: 'completed',
    respondedAt: '2024-12-10',
    reward: null,
  },
  {
    id: 'act-6',
    title: 'NFT Lottery Draw',
    description: 'Win exclusive NFTs from the community collection',
    type: 'lottery',
    status: 'ended',
    space: { id: 'space-1', name: 'Ethereum Developers Portugal', icon: '👥' },
    endDate: '2024-11-30',
    participation: 'completed',
    respondedAt: '2024-11-25',
    reward: 'Won: Rare NFT #234',
  },
  {
    id: 'act-7',
    title: 'Q3 Product Survey',
    description: 'Your feedback on our Q3 releases',
    type: 'feedback',
    status: 'ended',
    space: null,
    endDate: '2024-10-01',
    participation: 'completed',
    respondedAt: '2024-09-28',
    reward: '5 USDC',
  },
];

// Public campaign for registry/explore
export interface PublicCampaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  visibility: 'public' | 'private';
  space: SpaceRef | null;
  creator: string;
  startDate: string | null;
  endDate: string | null;
  responsesCount: number;
  participantsTarget: number | null;
}

// All public campaigns (for Campaigns page "All" tab)
export const mockCampaigns: PublicCampaign[] = [
  {
    id: 'pub-1',
    title: 'Community Governance Vote Q1 2025',
    description: 'Vote on proposals for protocol improvements and treasury allocation',
    type: 'voting',
    status: 'active',
    visibility: 'public',
    space: { id: 'space-3', name: 'MakerDAO', icon: '🏛️' },
    creator: '0x456...def',
    startDate: null,
    endDate: '2025-02-01',
    responsesCount: 1234,
    participantsTarget: 5000,
  },
  {
    id: 'pub-2',
    title: 'ETH Denver 2025 Speaker Selection',
    description: 'Vote for your favorite speakers at ETH Denver 2025',
    type: 'voting',
    status: 'active',
    visibility: 'public',
    space: { id: 'space-1', name: 'Ethereum Developers Portugal', icon: '👥' },
    creator: '0x789...ghi',
    startDate: null,
    endDate: '2025-02-10',
    responsesCount: 567,
    participantsTarget: 2000,
  },
  {
    id: 'pub-3',
    title: 'DeFi Protocol Feedback Survey',
    description: 'Share your experience using our DeFi protocol',
    type: 'feedback',
    status: 'active',
    visibility: 'public',
    space: { id: 'space-4', name: 'Uniswap', icon: '🦄' },
    creator: '0xabc...123',
    startDate: null,
    endDate: '2025-01-31',
    responsesCount: 89,
    participantsTarget: 500,
  },
  {
    id: 'pub-4',
    title: 'Solidity Workshop Registration',
    description: 'Register for advanced Solidity development workshop',
    type: 'registration',
    status: 'upcoming',
    visibility: 'public',
    space: { id: 'space-2', name: 'Stanford University', icon: '🎓' },
    creator: '0xdef...456',
    startDate: '2025-02-05',
    endDate: '2025-02-20',
    responsesCount: 0,
    participantsTarget: 100,
  },
  {
    id: 'pub-5',
    title: 'NFT Community Lottery',
    description: 'Enter to win exclusive NFTs from top artists',
    type: 'lottery',
    status: 'active',
    visibility: 'public',
    space: null,
    creator: '0x111...222',
    startDate: null,
    endDate: '2025-01-28',
    responsesCount: 3456,
    participantsTarget: null,
  },
  {
    id: 'pub-6',
    title: 'Web3 Developer Certification',
    description: 'Prove your Web3 development skills and earn a certificate',
    type: 'certification',
    status: 'active',
    visibility: 'public',
    space: { id: 'space-2', name: 'Stanford University', icon: '🎓' },
    creator: '0x333...444',
    startDate: null,
    endDate: '2025-03-01',
    responsesCount: 234,
    participantsTarget: 1000,
  },
  {
    id: 'pub-7',
    title: 'DAO Treasury Allocation Q1',
    description: 'Decide how to allocate DAO treasury funds for Q1 2025',
    type: 'voting',
    status: 'upcoming',
    visibility: 'public',
    space: { id: 'space-3', name: 'MakerDAO', icon: '🏛️' },
    creator: '0x555...666',
    startDate: '2025-02-01',
    endDate: '2025-02-15',
    responsesCount: 0,
    participantsTarget: 3000,
  },
  {
    id: 'pub-8',
    title: 'Community Event Feedback',
    description: 'Rate your experience at our recent community event',
    type: 'feedback',
    status: 'ended',
    visibility: 'public',
    space: { id: 'space-1', name: 'Ethereum Developers Portugal', icon: '👥' },
    creator: '0x777...888',
    startDate: '2024-12-01',
    endDate: '2024-12-20',
    responsesCount: 156,
    participantsTarget: 200,
  },
  {
    id: 'pub-9',
    title: 'Protocol Upgrade Vote v2.0',
    description: 'Vote on the proposed protocol upgrade to version 2.0',
    type: 'voting',
    status: 'ended',
    visibility: 'public',
    space: { id: 'space-4', name: 'Uniswap', icon: '🦄' },
    creator: '0x999...000',
    startDate: '2024-11-15',
    endDate: '2024-11-30',
    responsesCount: 4521,
    participantsTarget: 5000,
  },
  {
    id: 'pub-10',
    title: 'Hackathon Registration 2025',
    description: 'Register for the annual Web3 hackathon',
    type: 'registration',
    status: 'active',
    visibility: 'public',
    space: null,
    creator: '0xaaa...bbb',
    startDate: null,
    endDate: '2025-02-28',
    responsesCount: 789,
    participantsTarget: 1000,
  },
];

// Detailed campaign information
export interface CampaignDetails {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  visibility: 'public' | 'private';
  creator: {
    address: string;
    name: string | null;
    avatar: string | null;
  };
  space: SpaceRef & { type: string } | null;
  dates: {
    created: string;
    startDate: string | null;
    endDate: string | null;
  };
  stats: {
    responses: number;
    target: number | null;
    uniqueParticipants: number;
    viewCount: number;
  };
  requirements: {
    authentication: 'wallet' | 'zklogin' | 'any';
    payment: { amount: number; token: string } | null;
    whitelist: string[] | null;
    nftGate: { collection: string } | null;
  };
  rewards: { type: 'nft' | 'token'; amount: number; token?: string } | null;
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

export const mockCampaignDetails: CampaignDetails = {
  id: 'camp-1',
  title: 'Community Governance Vote Q1 2025',
  description: `Vote on key proposals for the protocol's future direction. This vote will determine our priorities for Q1 2025 including new feature development, treasury allocation, and partnership decisions.

Your vote matters! All token holders are eligible to participate.`,

  type: 'voting',
  status: 'active',
  visibility: 'public',

  creator: {
    address: '0x456...def',
    name: 'MakerDAO',
    avatar: null,
  },

  space: {
    id: 'space-3',
    name: 'MakerDAO',
    icon: '🏛️',
    type: 'dao',
  },

  dates: {
    created: '2025-01-01T00:00:00Z',
    startDate: null,
    endDate: '2025-02-15T23:59:59Z',
  },

  stats: {
    responses: 234,
    target: 500,
    uniqueParticipants: 234,
    viewCount: 1456,
  },

  requirements: {
    authentication: 'any',
    payment: null,
    whitelist: null,
    nftGate: null,
  },

  rewards: null,

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
  winner?: string;
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
      winner: 'opt1',
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
      winner: 'opt1',
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
  timestamp: string;
  answers: Record<string, string | string[] | null>;
  txHash: string;
}

export const mockCampaignResponses: CampaignResponse[] = [
  {
    id: 'resp-1',
    respondent: '0x123...abc',
    timestamp: '2025-01-07T14:32:00Z',
    answers: { q1: 'opt1', q2: 'opt2', q3: ['opt1', 'opt2'], q4: 'Great initiative!' },
    txHash: '0xresp123...',
  },
  {
    id: 'resp-2',
    respondent: '0x456...def',
    timestamp: '2025-01-07T13:15:00Z',
    answers: { q1: 'opt2', q2: 'opt1', q3: ['opt1'], q4: null },
    txHash: '0xresp456...',
  },
  {
    id: 'resp-3',
    respondent: '0x789...ghi',
    timestamp: '2025-01-07T12:45:00Z',
    answers: { q1: 'opt1', q2: 'opt1', q3: ['opt1', 'opt3', 'opt4'], q4: 'Focus on security' },
    txHash: '0xresp789...',
  },
  {
    id: 'resp-4',
    respondent: '0xabc...123',
    timestamp: '2025-01-07T11:20:00Z',
    answers: { q1: 'opt1', q2: 'opt3', q3: ['opt2', 'opt3'], q4: null },
    txHash: '0xresp101...',
  },
  {
    id: 'resp-5',
    respondent: '0xdef...456',
    timestamp: '2025-01-07T10:05:00Z',
    answers: { q1: 'opt3', q2: 'opt2', q3: ['opt1', 'opt2', 'opt3', 'opt4'], q4: 'All partnerships are valuable' },
    txHash: '0xresp102...',
  },
];
