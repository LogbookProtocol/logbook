export interface ProtocolStats {
  overview: {
    totalCampaigns: number;
    totalResponses: number;
    totalParticipants: number;
  };
  growth: {
    campaignsThisMonth: number;
    campaignsLastMonth: number;
    responsesThisMonth: number;
    responsesLastMonth: number;
    newParticipantsThisMonth: number;
  };
  recentActivity: Array<{
    date: string;
    campaigns: number;
    responses: number;
  }>;
}

export const protocolStats: ProtocolStats = {
  overview: {
    totalCampaigns: 12847,
    totalResponses: 1283456,
    totalParticipants: 89234,
  },

  growth: {
    campaignsThisMonth: 847,
    campaignsLastMonth: 623,
    responsesThisMonth: 94521,
    responsesLastMonth: 78234,
    newParticipantsThisMonth: 4521,
  },

  recentActivity: [
    { date: '2025-01-14', campaigns: 42, responses: 3421 },
    { date: '2025-01-13', campaigns: 38, responses: 2987 },
    { date: '2025-01-12', campaigns: 51, responses: 4123 },
    { date: '2025-01-11', campaigns: 29, responses: 2156 },
    { date: '2025-01-10', campaigns: 45, responses: 3654 },
    { date: '2025-01-09', campaigns: 33, responses: 2890 },
    { date: '2025-01-08', campaigns: 47, responses: 3234 },
  ],
};
