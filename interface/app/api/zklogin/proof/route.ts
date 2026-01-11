import { NextRequest, NextResponse } from 'next/server';
import { EnokiClient } from '@mysten/enoki';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

export const runtime = 'edge';

// Use private key on server-side only
const ENOKI_PRIVATE_KEY = process.env.ENOKI_PRIVATE_KEY || 'enoki_private_a4ef53997a3e76aae50cbf5496ae6a03';

const enokiClient = new EnokiClient({
  apiKey: ENOKI_PRIVATE_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jwt, ephemeralPublicKeyBase64, maxEpoch, randomness } = body;

    if (!jwt || !ephemeralPublicKeyBase64 || !maxEpoch || !randomness) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Reconstruct the public key from base64
    const ephemeralPublicKey = new Ed25519PublicKey(
      Uint8Array.from(atob(ephemeralPublicKeyBase64), c => c.charCodeAt(0))
    );

    console.log('Creating zkLogin proof via Enoki...', {
      maxEpoch,
      randomness,
    });

    const zkProof = await enokiClient.createZkLoginZkp({
      jwt,
      ephemeralPublicKey,
      maxEpoch,
      randomness,
    });

    console.log('ZK proof created successfully');

    return NextResponse.json(zkProof);
  } catch (error) {
    console.error('Enoki zkLogin proof error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ZK proof' },
      { status: 500 }
    );
  }
}
