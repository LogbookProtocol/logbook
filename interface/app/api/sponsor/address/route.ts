import { NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { SuiClient } from '@mysten/sui/client';

export const runtime = 'edge';

function getTreasuryKeypair(): Ed25519Keypair {
  const privateKey = process.env.TREASURY_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('TREASURY_PRIVATE_KEY not configured');
  }

  if (privateKey.startsWith('suiprivkey')) {
    const { secretKey } = decodeSuiPrivateKey(privateKey);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  const hexStr = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  const keyBytes = new Uint8Array(hexStr.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  return Ed25519Keypair.fromSecretKey(keyBytes);
}

export async function GET() {
  try {
    const treasury = getTreasuryKeypair();
    const address = treasury.toSuiAddress();

    // Get balance (devnet)
    const client = new SuiClient({ url: 'https://fullnode.devnet.sui.io:443' });
    const balance = await client.getBalance({ owner: address });

    return NextResponse.json({
      address,
      balance: balance.totalBalance,
      balanceSui: (Number(balance.totalBalance) / 1_000_000_000).toFixed(4),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get treasury info' },
      { status: 500 }
    );
  }
}
