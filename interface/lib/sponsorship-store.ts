import { SuiClient } from '@mysten/sui/client';

// Sponsorship limits
export const SPONSORSHIP_LIMITS = {
  MAX_CAMPAIGNS: 2,    // First 2 campaigns are sponsored
  MAX_RESPONSES: 10,   // First 10 responses are sponsored
} as const;

// Sui config for server-side usage (keep in sync with sui-config.ts)
const SUI_CONFIG = {
  devnet: {
    registryId: '0x26a0cdebbc6d22566121777ca33271ce403853d645beee48316fc3fff284d6a4',
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
  },
  testnet: {
    registryId: '0x19e600e809c3a312738da4b4169a6d0fa79110c1de16c914874ff6cedf3c7b0b',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
};

// Get current network from env or default to testnet
function getNetwork(): 'devnet' | 'testnet' {
  return (process.env.SUI_NETWORK as 'devnet' | 'testnet') || 'testnet';
}

function createSuiClient(): SuiClient {
  const network = getNetwork();
  return new SuiClient({ url: SUI_CONFIG[network].rpcUrl });
}

function getRegistryId(): string {
  const network = getNetwork();
  return SUI_CONFIG[network].registryId;
}

// User sponsorship data
export interface UserSponsorship {
  address: string;
  campaignsSponsored: number;
  responsesSponsored: number;
}

// Count campaigns created by user from blockchain registry
async function countUserCampaigns(client: SuiClient, address: string): Promise<number> {
  try {
    const registryId = getRegistryId();
    const registry = await client.getObject({
      id: registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return 0;
    }

    const registryData = registry.data.content.fields as {
      campaigns_by_creator: {
        fields: {
          contents: Array<{
            fields: { key: string; value: Array<string | { id: string }> };
          }>;
        };
      };
    };

    // Find campaigns for this creator
    const creatorEntry = registryData.campaigns_by_creator?.fields?.contents?.find(
      (entry) => entry.fields.key === address
    );

    if (!creatorEntry) {
      return 0;
    }

    return creatorEntry.fields.value.length;
  } catch (error) {
    console.error('Error counting user campaigns:', error);
    return 0;
  }
}

// Count total responses received on campaigns created by user
async function countUserResponses(client: SuiClient, address: string): Promise<number> {
  try {
    const registryId = getRegistryId();
    const registry = await client.getObject({
      id: registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return 0;
    }

    const registryData = registry.data.content.fields as {
      campaigns_by_creator: {
        fields: {
          contents: Array<{
            fields: { key: string; value: Array<string | { id: string }> };
          }>;
        };
      };
    };

    // Find campaigns created by this user
    const creatorEntry = registryData.campaigns_by_creator?.fields?.contents?.find(
      (entry) => entry.fields.key === address
    );

    if (!creatorEntry || creatorEntry.fields.value.length === 0) {
      return 0;
    }

    const campaignIds = creatorEntry.fields.value.map((c) =>
      typeof c === 'string' ? c : c.id
    );

    // Fetch user's campaign objects
    const campaigns = await client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    });

    let totalResponses = 0;

    for (const obj of campaigns) {
      if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue;

      const content = obj.data.content as unknown as {
        fields: {
          total_responses: string;
        };
      };

      totalResponses += parseInt(content.fields.total_responses || '0', 10);
    }

    return totalResponses;
  } catch (error) {
    console.error('Error counting user responses:', error);
    return 0;
  }
}

// Get user sponsorship data from blockchain
export async function getUserSponsorshipAsync(address: string): Promise<UserSponsorship> {
  const client = createSuiClient();

  const [campaignsSponsored, responsesSponsored] = await Promise.all([
    countUserCampaigns(client, address),
    countUserResponses(client, address),
  ]);

  return {
    address,
    campaignsSponsored,
    responsesSponsored,
  };
}

// Synchronous wrapper - returns null, use async version
export function getUserSponsorship(address: string): UserSponsorship | null {
  // For backwards compatibility - returns null, caller should use async version
  return null;
}

// Check if user can have campaign sponsored (async)
export async function canSponsorCampaignAsync(address: string): Promise<boolean> {
  const user = await getUserSponsorshipAsync(address);
  return user.campaignsSponsored < SPONSORSHIP_LIMITS.MAX_CAMPAIGNS;
}

// Check if user can have response sponsored (async)
export async function canSponsorResponseAsync(address: string): Promise<boolean> {
  const user = await getUserSponsorshipAsync(address);
  return user.responsesSponsored < SPONSORSHIP_LIMITS.MAX_RESPONSES;
}

// Sync versions for backwards compatibility - always return true, use async
export function canSponsorCampaign(address: string): boolean {
  // Deprecated: use canSponsorCampaignAsync
  return true;
}

export function canSponsorResponse(address: string): boolean {
  // Deprecated: use canSponsorResponseAsync
  return true;
}

// Get remaining sponsorship quota (async)
export async function getRemainingSponsorship(address: string): Promise<{
  campaignsRemaining: number;
  responsesRemaining: number;
}> {
  const user = await getUserSponsorshipAsync(address);
  return {
    campaignsRemaining: Math.max(0, SPONSORSHIP_LIMITS.MAX_CAMPAIGNS - user.campaignsSponsored),
    responsesRemaining: Math.max(0, SPONSORSHIP_LIMITS.MAX_RESPONSES - user.responsesSponsored),
  };
}

// Record functions are no longer needed - blockchain is the source of truth
// Keeping them as no-ops for backwards compatibility
export function recordSponsoredCampaign(_address: string): boolean {
  // No-op: blockchain is the source of truth
  return true;
}

export function recordSponsoredResponse(_address: string): boolean {
  // No-op: blockchain is the source of truth
  return true;
}
