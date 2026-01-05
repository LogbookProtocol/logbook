import { NextRequest, NextResponse } from 'next/server';
import {
  getRemainingSponsorship,
  getUserSponsorshipAsync,
  SPONSORSHIP_LIMITS,
} from '@/lib/sponsorship-store';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    );
  }

  try {
    const [user, remaining] = await Promise.all([
      getUserSponsorshipAsync(address),
      getRemainingSponsorship(address),
    ]);

    return NextResponse.json({
      address,
      limits: SPONSORSHIP_LIMITS,
      used: {
        campaigns: user.campaignsSponsored,
        responses: user.responsesSponsored,
      },
      remaining: {
        campaigns: remaining.campaignsRemaining,
        responses: remaining.responsesRemaining,
      },
      canSponsorCampaign: remaining.campaignsRemaining > 0,
      canSponsorResponse: remaining.responsesRemaining > 0,
    });
  } catch (error) {
    console.error('Error fetching sponsorship status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsorship status' },
      { status: 500 }
    );
  }
}
