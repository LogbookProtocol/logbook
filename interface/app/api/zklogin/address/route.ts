import { NextRequest, NextResponse } from 'next/server';
import { EnokiClient } from '@mysten/enoki';

export const runtime = 'edge';

// Use private key on server-side only
const ENOKI_PRIVATE_KEY = process.env.ENOKI_PRIVATE_KEY || 'enoki_private_a4ef53997a3e76aae50cbf5496ae6a03';

const enokiClient = new EnokiClient({
  apiKey: ENOKI_PRIVATE_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jwt } = body;

    if (!jwt) {
      return NextResponse.json(
        { error: 'Missing JWT' },
        { status: 400 }
      );
    }

    console.log('Getting zkLogin address from Enoki...');

    const result = await enokiClient.getZkLogin({ jwt });

    console.log('Got zkLogin address:', result.address);

    return NextResponse.json({
      address: result.address,
      salt: result.salt,
    });
  } catch (error: any) {
    console.error('Enoki getZkLogin error:', error);
    const errorMessage = error?.errors?.[0]?.message || error?.message || 'Failed to get zkLogin address';
    return NextResponse.json(
      { error: errorMessage },
      { status: error?.status || 500 }
    );
  }
}
