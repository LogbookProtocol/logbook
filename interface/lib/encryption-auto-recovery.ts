/**
 * Auto-recovery utilities for private campaigns
 * Handles creator and participant auto-unlocking via deterministic key derivation
 */

import CryptoJS from 'crypto-js';
import { encryptData, decryptData } from './crypto';

/**
 * Parse JWT token (for zkLogin Google sub extraction)
 */
function parseJWT(token: string): { sub: string; aud: string; iss: string; exp?: number } | null {
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
 * Check if JWT token is expired or will expire soon
 * Returns true if token is valid and not expiring soon (more than 5 minutes left)
 */
function isJWTValid(token: string): boolean {
  const decoded = parseJWT(token);
  if (!decoded || !decoded.exp) {
    console.log('[JWT Check] No expiration in token or failed to parse');
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;

  // Consider token invalid if it expires in less than 5 minutes (300 seconds)
  const isValid = expiresIn > 300;

  if (!isValid) {
    console.log(`[JWT Check] Token expired or expiring soon (${expiresIn}s remaining)`);
  }

  return isValid;
}

/**
 * Trigger zkLogin session refresh if token is expired
 * Returns true if refresh was triggered, false otherwise
 */
async function triggerSessionRefreshIfNeeded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const jwt = sessionStorage.getItem('zklogin_jwt');
  if (!jwt) {
    console.log('[Auto-Recovery] No JWT token found, skipping refresh check');
    return false;
  }

  if (!isJWTValid(jwt)) {
    console.log('[Auto-Recovery] JWT token expired, triggering session refresh...');

    // Import zklogin-utils dynamically to avoid circular dependencies
    try {
      const { refreshZkLoginSession } = await import('./zklogin-utils');
      await refreshZkLoginSession();
      return true;
    } catch (error) {
      console.error('[Auto-Recovery] Failed to trigger session refresh:', error);
      return false;
    }
  }

  return false;
}

/**
 * Get Google sub from zkLogin JWT
 * Returns sub if available, null otherwise
 * Checks token validity and triggers refresh if needed
 */
async function getGoogleSub(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const jwt = sessionStorage.getItem('zklogin_jwt');
  if (!jwt) return null;

  // Check if token is valid and trigger refresh if needed
  const refreshTriggered = await triggerSessionRefreshIfNeeded();
  if (refreshTriggered) {
    // Refresh was triggered, return null so the operation can retry after redirect
    return null;
  }

  const decoded = parseJWT(jwt);
  return decoded?.sub || null;
}

/**
 * Get creator key for password generation
 * For Google: directly uses Google sub
 * For Wallet: derives from signature of "creator_key_{campaignSeed}"
 * Returns null if no authentication method is available
 */
export async function getCreatorKey(
  campaignSeed: string,
  signMessage?: (message: string) => Promise<string>
): Promise<string | null> {
  // Try Google zkLogin first
  const googleSub = await getGoogleSub();
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
      return null;
    }
  }

  // No authentication method available - this is expected for automatic unlock attempts
  console.log('[Auto-Recovery] No authentication method available for creator key (expected for automatic unlock)');
  return null;
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
 * Returns null if no authentication method is available
 */
export async function getPersonalKey(
  signMessage?: (message: string) => Promise<string>
): Promise<string | null> {
  // Try Google zkLogin first
  const googleSub = await getGoogleSub();
  if (googleSub) {
    const hashedKey = CryptoJS.SHA256(googleSub).toString();
    return hashedKey;
  }

  // Try Wallet signature
  if (signMessage) {
    try {
      const message = 'key_derivation_v1';
      const signature = await signMessage(message);
      const hashedKey = CryptoJS.SHA256(signature).toString();
      return hashedKey;
    } catch (error) {
      console.error('[Auto-Recovery] Failed to get wallet signature:', error);
      return null;
    }
  }

  // No authentication method available - this is expected for automatic unlock attempts
  console.log('[Auto-Recovery] No authentication method available for personal key (expected for automatic unlock)');
  return null;
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

  console.log('[Auto-Recovery] Attempting creator auto-unlock...');
  const creatorKey = await getCreatorKey(campaignSeed, signMessage);

  if (!creatorKey) {
    console.log('[Auto-Recovery] Creator auto-unlock not available (no authentication method)');
    return null;
  }

  const password = generatePasswordFromSeed(campaignSeed, creatorKey);
  console.log('[Auto-Recovery] Creator auto-unlock successful');
  return password;
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

  console.log('[Auto-Recovery] Attempting participant auto-unlock...');
  const personalKey = await getPersonalKey(signMessage);

  if (!personalKey) {
    console.log('[Auto-Recovery] Participant auto-unlock not available (no authentication method)');
    return null;
  }

  try {
    const password = await decryptPasswordFromStorage(responseSeed, personalKey);
    console.log('[Auto-Recovery] Participant auto-unlock successful');
    return password;
  } catch (error) {
    console.error('[Auto-Recovery] Participant auto-unlock failed:', error);
    return null;
  }
}

/**
 * Generate campaign seed (256-bit random hex string)
 * This is public and stored on blockchain
 */
export function generateCampaignSeed(): string {
  // Use crypto.getRandomValues() for secure 256-bit random generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32); // 32 bytes = 256 bits
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: use CryptoJS random (32 bytes = 256 bits)
  const random = CryptoJS.lib.WordArray.random(32);
  return random.toString(CryptoJS.enc.Hex);
}

/**
 * Generate response seed (256-bit random hex string)
 * Used for participant auto-recovery, stored encrypted on blockchain
 */
export function generateResponseSeed(): string {
  // Use crypto.getRandomValues() for secure 256-bit random generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32); // 32 bytes = 256 bits
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: use CryptoJS random (32 bytes = 256 bits)
  const random = CryptoJS.lib.WordArray.random(32);
  return random.toString(CryptoJS.enc.Hex);
}
