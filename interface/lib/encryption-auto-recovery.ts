/**
 * Auto-recovery utilities for private campaigns
 * Handles creator and participant auto-unlocking via deterministic key derivation
 */

import CryptoJS from 'crypto-js';
import { encryptData, decryptData } from './crypto';

/**
 * Parse JWT token (for zkLogin Google sub extraction)
 */
function parseJWT(token: string): { sub: string; aud: string; iss: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Get Google sub from zkLogin JWT
 * Returns sub if available, null otherwise
 */
function getGoogleSub(): string | null {
  if (typeof window === 'undefined') return null;

  const jwt = sessionStorage.getItem('zklogin_jwt');
  if (!jwt) return null;

  const decoded = parseJWT(jwt);
  return decoded?.sub || null;
}

/**
 * Get creator key for password generation
 * For Google: directly uses Google sub
 * For Wallet: derives from signature of "creator_key_{campaignSeed}"
 */
export async function getCreatorKey(
  campaignSeed: string,
  signMessage?: (message: string) => Promise<string>
): Promise<string> {
  // Try Google zkLogin first
  const googleSub = getGoogleSub();
  if (googleSub) {
    console.log('[Auto-Recovery] Using Google sub as creator key');
    return googleSub;
  }

  // Try Wallet signature
  if (signMessage) {
    try {
      const message = `creator_key_${campaignSeed}`;
      const signature = await signMessage(message);
      const hashedKey = CryptoJS.SHA256(signature).toString();
      console.log('[Auto-Recovery] Using wallet signature as creator key');
      return hashedKey;
    } catch (error) {
      console.error('[Auto-Recovery] Failed to get wallet signature:', error);
      throw new Error('Failed to sign message with wallet');
    }
  }

  throw new Error('No authentication method available (need Google or Wallet)');
}

/**
 * Generate campaign password from seed and creator key
 * password = SHA256(campaignSeed + creatorKey)
 */
export function generatePasswordFromSeed(campaignSeed: string, creatorKey: string): string {
  return CryptoJS.SHA256(campaignSeed + creatorKey).toString();
}

/**
 * Get personal decryption key for participants
 * For Google: hash of Google sub
 * For Wallet: hash of signature of "key_derivation_v1"
 */
export async function getPersonalKey(
  signMessage?: (message: string) => Promise<string>
): Promise<string> {
  // Try Google zkLogin first
  const googleSub = getGoogleSub();
  if (googleSub) {
    const hashedKey = CryptoJS.SHA256(googleSub).toString();
    console.log('[Auto-Recovery] Using hashed Google sub as personal key');
    return hashedKey;
  }

  // Try Wallet signature
  if (signMessage) {
    try {
      const message = 'key_derivation_v1';
      const signature = await signMessage(message);
      const hashedKey = CryptoJS.SHA256(signature).toString();
      console.log('[Auto-Recovery] Using hashed wallet signature as personal key');
      return hashedKey;
    } catch (error) {
      console.error('[Auto-Recovery] Failed to get wallet signature:', error);
      throw new Error('Failed to sign message with wallet');
    }
  }

  throw new Error('No authentication method available (need Google or Wallet)');
}

/**
 * Encrypt password for storage in response_seed
 * Uses AES encryption with participant's personal key
 */
export async function encryptPasswordForStorage(
  password: string,
  personalKey: string
): Promise<string> {
  try {
    // Use crypto-js for simple AES encryption
    const encrypted = CryptoJS.AES.encrypt(password, personalKey).toString();
    return encrypted;
  } catch (error) {
    console.error('[Auto-Recovery] Failed to encrypt password:', error);
    throw error;
  }
}

/**
 * Decrypt password from response_seed
 * Uses AES decryption with participant's personal key
 */
export async function decryptPasswordFromStorage(
  encryptedPassword: string,
  personalKey: string
): Promise<string> {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, personalKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption produced empty result');
    }
    return decrypted;
  } catch (error) {
    console.error('[Auto-Recovery] Failed to decrypt password:', error);
    throw error;
  }
}

/**
 * Try to auto-unlock campaign as creator
 * Returns password if successful, null if not
 */
export async function tryCreatorAutoUnlock(
  campaignSeed: string,
  creatorAddress: string,
  currentAddress: string,
  signMessage?: (message: string) => Promise<string>
): Promise<string | null> {
  // Check if current user is the creator
  if (currentAddress !== creatorAddress) {
    console.log('[Auto-Recovery] Not the creator, skipping creator auto-unlock');
    return null;
  }

  try {
    console.log('[Auto-Recovery] Attempting creator auto-unlock...');
    const creatorKey = await getCreatorKey(campaignSeed, signMessage);
    const password = generatePasswordFromSeed(campaignSeed, creatorKey);
    console.log('[Auto-Recovery] Creator auto-unlock successful');
    return password;
  } catch (error) {
    console.error('[Auto-Recovery] Creator auto-unlock failed:', error);
    return null;
  }
}

/**
 * Try to auto-unlock campaign as participant using response_seed
 * Returns password if successful, null if not
 */
export async function tryParticipantAutoUnlock(
  responseSeed: string | null | undefined,
  signMessage?: (message: string) => Promise<string>
): Promise<string | null> {
  if (!responseSeed) {
    console.log('[Auto-Recovery] No response_seed, skipping participant auto-unlock');
    return null;
  }

  try {
    console.log('[Auto-Recovery] Attempting participant auto-unlock...');
    const personalKey = await getPersonalKey(signMessage);
    const password = await decryptPasswordFromStorage(responseSeed, personalKey);
    console.log('[Auto-Recovery] Participant auto-unlock successful');
    return password;
  } catch (error) {
    console.error('[Auto-Recovery] Participant auto-unlock failed:', error);
    return null;
  }
}

/**
 * Generate campaign seed (UUID)
 * This is public and stored on blockchain
 */
export function generateCampaignSeed(): string {
  // Use crypto.randomUUID() if available (Node 19+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
