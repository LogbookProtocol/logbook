import { SpaceType } from './mock-spaces';
import { CampaignType } from './mock-data';

export interface ProtocolStats {
  overview: {
    totalCampaigns: number;
    totalResponses: number;
    totalParticipants: number;
    totalSpaces: number;
    totalVolume: number;
  };
  growth: {
    campaignsThisMonth: number;
    campaignsLastMonth: number;
    responsesThisMonth: number;
    responsesLastMonth: number;
    newParticipantsThisMonth: number;
  };
  byType: Array<{
    type: CampaignType;
    count: number;
    percentage: number;
  }>;
  bySpaceType: Array<{
    type: SpaceType;
    spaces: number;
    campaigns: number;
  }>;
  recentActivity: Array<{
    date: string;
    campaigns: number;
    responses: number;
  }>;
  topSpaces: Array<{
    name: string;
    type: SpaceType;
    campaigns: number;
    responses: number;
  }>;
}

export const protocolStats: ProtocolStats = {
  overview: {
    totalCampaigns: 12847,
    totalResponses: 1283456,
    totalParticipants: 89234,
    totalSpaces: 1456,
    totalVolume: 2340000,
  },

  growth: {
    campaignsThisMonth: 847,
    campaignsLastMonth: 623,
    responsesThisMonth: 94521,
    responsesLastMonth: 78234,
    newParticipantsThisMonth: 4521,
  },

  byType: [
    { type: 'voting', count: 4521, percentage: 35.2 },
    { type: 'feedback', count: 3892, percentage: 30.3 },
    { type: 'registration', count: 2134, percentage: 16.6 },
    { type: 'certification', count: 1245, percentage: 9.7 },
    { type: 'fundraising', count: 678, percentage: 5.3 },
    { type: 'lottery', count: 377, percentage: 2.9 },
  ],

  bySpaceType: [
    { type: 'dao', spaces: 456, campaigns: 3421 },
    { type: 'community', spaces: 398, campaigns: 2845 },
    { type: 'organization', spaces: 287, campaigns: 2134 },
    { type: 'education', spaces: 156, campaigns: 1892 },
    { type: 'nonprofit', spaces: 89, campaigns: 1234 },
    { type: 'government', spaces: 45, campaigns: 678 },
    { type: 'team', spaces: 25, campaigns: 643 },
  ],

  recentActivity: [
    { date: '2025-01-14', campaigns: 42, responses: 3421 },
    { date: '2025-01-13', campaigns: 38, responses: 2987 },
    { date: '2025-01-12', campaigns: 51, responses: 4123 },
    { date: '2025-01-11', campaigns: 29, responses: 2156 },
    { date: '2025-01-10', campaigns: 45, responses: 3654 },
    { date: '2025-01-09', campaigns: 33, responses: 2890 },
    { date: '2025-01-08', campaigns: 47, responses: 3234 },
  ],

  topSpaces: [
    { name: 'MakerDAO', type: 'dao', campaigns: 234, responses: 45678 },
    { name: 'Uniswap Governance', type: 'dao', campaigns: 189, responses: 38921 },
    { name: 'Stanford University', type: 'education', campaigns: 127, responses: 34521 },
    { name: 'Ethereum Foundation', type: 'nonprofit', campaigns: 98, responses: 28934 },
    { name: 'Gitcoin', type: 'dao', campaigns: 87, responses: 23456 },
  ],
};
