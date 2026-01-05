import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64, toBase64 } from '@mysten/sui/utils';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import {
  canSponsorCampaignAsync,
  canSponsorResponseAsync,
  getRemainingSponsorship,
} from '@/lib/sponsorship-store';

// Transaction types we can detect
type TransactionType = 'create_campaign' | 'submit_response' | 'unknown';

// Detect transaction type from the serialized transaction
function detectTransactionType(txSerialized: string): TransactionType {
  // The serialized transaction contains the move call target
  // We look for the function names in the transaction data
  if (txSerialized.includes('create_campaign')) {
    return 'create_campaign';
  }
  if (txSerialized.includes('submit_response')) {
    return 'submit_response';
  }
  return 'unknown';
}

// Treasury keypair for sponsoring transactions
function getTreasuryKeypair(): Ed25519Keypair {
  const privateKey = process.env.TREASURY_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('TREASURY_PRIVATE_KEY not configured');
  }

  // Handle Sui bech32 format (suiprivkey1qq...)
  if (privateKey.startsWith('suiprivkey')) {
    const { secretKey } = decodeSuiPrivateKey(privateKey);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  // Handle hex format (0x... or raw hex)
  const keyBytes = privateKey.startsWith('0x')
    ? Buffer.from(privateKey.slice(2), 'hex')
    : Buffer.from(privateKey, 'hex');

  return Ed25519Keypair.fromSecretKey(keyBytes);
}

// Get Sui client based on network
function getSuiClient(): SuiClient {
  // Use devnet (contract and zkLogin prover are on devnet)
  return new SuiClient({ url: 'https://fullnode.devnet.sui.io:443' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txBytes, txSerialized, sender } = body;

    const treasury = getTreasuryKeypair();
    const treasuryAddress = treasury.toSuiAddress();
    const client = getSuiClient();

    let tx: Transaction;
    let txType: TransactionType = 'unknown';

    // Handle two formats: pre-built txBytes or serialized transaction
    if (txBytes) {
      // Legacy format: decode pre-built transaction bytes
      const txBytesData = fromBase64(txBytes);
      tx = Transaction.from(txBytesData);
    } else if (txSerialized && sender) {
      // New format: deserialize from JSON string (tx.serialize() output)
      tx = Transaction.from(txSerialized);
      tx.setSender(sender);

      // Detect transaction type for sponsorship limits
      txType = detectTransactionType(txSerialized);

      // Check sponsorship limits (async - queries blockchain)
      if (txType === 'create_campaign') {
        const canSponsor = await canSponsorCampaignAsync(sender);
        if (!canSponsor) {
          const remaining = await getRemainingSponsorship(sender);
          return NextResponse.json(
            {
              error: 'Sponsorship limit reached for campaigns',
              code: 'CAMPAIGN_LIMIT_REACHED',
              remaining,
            },
            { status: 403 }
          );
        }
      } else if (txType === 'submit_response') {
        const canSponsor = await canSponsorResponseAsync(sender);
        if (!canSponsor) {
          const remaining = await getRemainingSponsorship(sender);
          return NextResponse.json(
            {
              error: 'Sponsorship limit reached for responses',
              code: 'RESPONSE_LIMIT_REACHED',
              remaining,
            },
            { status: 403 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Missing txBytes or txSerialized+sender' },
        { status: 400 }
      );
    }

    // Set the gas owner to treasury
    tx.setGasOwner(treasuryAddress);

    // Get gas coins from treasury
    const coins = await client.getCoins({
      owner: treasuryAddress,
      coinType: '0x2::sui::SUI',
    });

    if (coins.data.length === 0) {
      return NextResponse.json(
        { error: 'Treasury has no gas coins' },
        { status: 500 }
      );
    }

    // Use the first coin for gas
    tx.setGasPayment([{
      objectId: coins.data[0].coinObjectId,
      version: coins.data[0].version,
      digest: coins.data[0].digest,
    }]);

    // Set gas budget
    tx.setGasBudget(10_000_000); // 0.01 SUI

    // Build the transaction
    const builtTx = await tx.build({ client });

    // Sign with treasury key (for gas sponsorship)
    const sponsorSignature = await treasury.signTransaction(builtTx);

    // No need to record - blockchain is the source of truth now
    // The transaction will be recorded on-chain after execution

    // Get remaining quota to return to client (after this tx executes, it will be less)
    const remaining = sender ? await getRemainingSponsorship(sender) : null;

    return NextResponse.json({
      txBytes: toBase64(builtTx),
      sponsorSignature: sponsorSignature.signature,
      sponsorAddress: treasuryAddress,
      remaining,
    });
  } catch (error) {
    console.error('Sponsor error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sponsor transaction' },
      { status: 500 }
    );
  }
}
