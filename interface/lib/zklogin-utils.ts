import { genAddressSeed, computeZkLoginAddress, getZkLoginSignature, getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { toBase64 } from '@mysten/sui/utils';

const GOOGLE_CLIENT_ID = '677620785976-lcr0umvoh8tt4fckjblfuvnipev0sle8.apps.googleusercontent.com';
// Use Mysten Labs production prover for testnet/mainnet (different zkey than devnet)
const PROVER_URL = 'https://prover.mystenlabs.com/v1';
const SUI_NETWORK_URL = 'https://fullnode.testnet.sui.io:443';

export type OAuthProvider = 'google';

// Ephemeral keypair storage keys
const EPHEMERAL_PRIVATE_KEY = 'zklogin_ephemeral_private_key';
const EPHEMERAL_MAX_EPOCH = 'zklogin_max_epoch';
const EPHEMERAL_RANDOMNESS = 'zklogin_randomness';

/**
 * Gets the audience (aud) value from JWT payload
 * aud can be a string or an array of strings
 */
function getAudience(jwtPayload: any): string {
  if (Array.isArray(jwtPayload.aud)) {
    return jwtPayload.aud[0];
  }
  return jwtPayload.aud || GOOGLE_CLIENT_ID;
}

/**
 * Вычисляет детерминированный userSalt из JWT payload
 * Salt must be exactly 16 bytes (128 bits) for the prover service
 * Результат всегда одинаковый для одного Google аккаунта
 * НЕ НУЖНО хранить в localStorage!
 */
export async function computeUserSalt(jwtPayload: any): Promise<bigint> {
  // Use normalized aud value (handles array case)
  const aud = getAudience(jwtPayload);

  // Создаем детерминированную строку из JWT claims
  const data = `${jwtPayload.iss}${aud}${jwtPayload.sub}`;

  // Хешируем через SHA-256
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = new Uint8Array(hashBuffer);

  // Take first 16 bytes (128 bits) for the salt - prover requires exactly 16 bytes
  const saltBytes = hashArray.slice(0, 16);
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const userSalt = BigInt('0x' + saltHex);

  console.log('Computed deterministic userSalt (16 bytes):', userSalt.toString());
  console.log('Using aud:', aud);

  return userSalt;
}

/**
 * Generates a new ephemeral keypair and stores it in sessionStorage
 * Returns the nonce to be used in the OAuth request
 */
export async function generateEphemeralKeyPair(): Promise<{ nonce: string; maxEpoch: number }> {
  const client = new SuiClient({ url: SUI_NETWORK_URL });

  // Get current epoch
  let epoch: string;
  try {
    const systemState = await client.getLatestSuiSystemState();
    epoch = systemState.epoch;
  } catch (error) {
    console.error('Failed to fetch Sui system state:', error);
    throw new Error('Unable to connect to Sui network. Please check your internet connection and try again.');
  }
  const maxEpoch = Number(epoch) + 10; // Valid for 10 epochs (~10 days on mainnet)

  // Generate ephemeral keypair
  const ephemeralKeyPair = new Ed25519Keypair();
  const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();

  // Generate randomness for nonce
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomness = BigInt('0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(''));

  // Compute nonce using the zkLogin SDK method
  // nonce = poseidon_hash(ephemeral_public_key, max_epoch, randomness)
  const { generateNonce } = await import('@mysten/sui/zklogin');
  const nonce = generateNonce(ephemeralPublicKey, maxEpoch, randomness);

  // Store ephemeral data in sessionStorage (only current tab)
  const secretKeyBech32 = ephemeralKeyPair.getSecretKey();
  sessionStorage.setItem(EPHEMERAL_PRIVATE_KEY, secretKeyBech32);
  sessionStorage.setItem(EPHEMERAL_MAX_EPOCH, maxEpoch.toString());
  sessionStorage.setItem(EPHEMERAL_RANDOMNESS, randomness.toString());

  // Log for debugging - verify the key can be restored
  const extPubKey = getExtendedEphemeralPublicKey(ephemeralPublicKey);
  console.log('Generated ephemeral keypair:');
  console.log('  - secretKey (bech32):', secretKeyBech32.substring(0, 20) + '...');
  console.log('  - extendedPublicKey:', extPubKey);
  console.log('  - maxEpoch:', maxEpoch);
  console.log('  - randomness:', randomness.toString());
  console.log('  - nonce:', nonce);

  return { nonce, maxEpoch };
}

/**
 * Gets the stored ephemeral keypair
 */
export function getEphemeralKeyPair(): Ed25519Keypair | null {
  const secretKey = sessionStorage.getItem(EPHEMERAL_PRIVATE_KEY);
  if (!secretKey) {
    console.log('No ephemeral key in sessionStorage');
    return null;
  }

  try {
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const extPubKey = getExtendedEphemeralPublicKey(keypair.getPublicKey());
    console.log('Restored ephemeral keypair:');
    console.log('  - secretKey (bech32):', secretKey.substring(0, 20) + '...');
    console.log('  - extendedPublicKey:', extPubKey);
    return keypair;
  } catch (e) {
    console.error('Failed to restore ephemeral keypair:', e);
    return null;
  }
}

/**
 * Gets the stored max epoch
 */
export function getMaxEpoch(): number | null {
  const maxEpoch = sessionStorage.getItem(EPHEMERAL_MAX_EPOCH);
  return maxEpoch ? Number(maxEpoch) : null;
}

/**
 * Gets the stored randomness
 */
export function getRandomness(): bigint | null {
  const randomness = sessionStorage.getItem(EPHEMERAL_RANDOMNESS);
  return randomness ? BigInt(randomness) : null;
}

/**
 * Генерирует URL для OAuth авторизации через Google
 * Now generates ephemeral keypair and includes proper nonce
 */
export async function getZkLoginUrl(provider: OAuthProvider = 'google'): Promise<string> {
  const redirectUrl = `${window.location.origin}/auth/zklogin-callback`;

  // Generate ephemeral keypair and get nonce
  const { nonce } = await generateEphemeralKeyPair();

  // Сохраняем provider для callback
  sessionStorage.setItem('zklogin_provider', provider);

  // Google OAuth параметры
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUrl,
    response_type: 'id_token',
    scope: 'openid email',
    nonce: nonce,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Вычисляет zkLogin адрес из JWT токена
 * Полностью детерминированно - ничего не хранит!
 */
export async function computeZkAddress(jwtPayload: any, provider: OAuthProvider): Promise<string> {
  // 1. Вычисляем userSalt детерминированно из JWT
  const userSalt = await computeUserSalt(jwtPayload);
  const aud = getAudience(jwtPayload);
  const iss = jwtPayload.iss || 'https://accounts.google.com';

  // 2. Генерируем address seed через Sui zkLogin SDK
  const addressSeed = genAddressSeed(
    userSalt,
    'sub',  // claim name
    jwtPayload.sub,  // claim value (уникальный ID пользователя)
    aud  // audience (client_id)
  );

  // 3. Получаем zkAddress
  const zkAddress = computeZkLoginAddress({
    userSalt,
    claimName: 'sub',
    claimValue: jwtPayload.sub,
    aud,
    iss,
  });

  console.log('Computed zkLogin address:', zkAddress);
  console.log('For sub:', jwtPayload.sub);
  console.log('iss:', iss);
  console.log('aud:', aud);
  console.log('userSalt:', userSalt.toString());

  return zkAddress;
}

export function getProviderFromStorage(): OAuthProvider | null {
  return sessionStorage.getItem('zklogin_provider') as OAuthProvider | null;
}

export function clearZkLoginStorage() {
  sessionStorage.removeItem('zklogin_provider');
}

/**
 * Fetches the ZK proof from Mysten Labs prover service
 */
export async function fetchZkProof(jwt: string): Promise<any> {
  const ephemeralKeyPair = getEphemeralKeyPair();
  const maxEpoch = getMaxEpoch();
  const randomness = getRandomness();

  if (!ephemeralKeyPair || !maxEpoch || randomness === null) {
    throw new Error('Missing ephemeral key data. Please re-login with Google.');
  }

  // Decode JWT to get payload
  const jwtPayload = JSON.parse(atob(jwt.split('.')[1]));
  const userSalt = await computeUserSalt(jwtPayload);

  const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();

  // Use the SDK function to get the extended ephemeral public key in the correct format
  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralPublicKey);

  // Verify nonce matches what's in the JWT
  const { generateNonce } = await import('@mysten/sui/zklogin');
  const expectedNonce = generateNonce(ephemeralPublicKey, maxEpoch, randomness);
  const jwtNonce = jwtPayload.nonce;
  console.log('Nonce verification:');
  console.log('  - JWT nonce:', jwtNonce);
  console.log('  - Expected nonce:', expectedNonce);
  console.log('  - Match:', jwtNonce === expectedNonce);

  if (jwtNonce !== expectedNonce) {
    console.error('NONCE MISMATCH! The ephemeral keypair does not match the one used for OAuth.');
    throw new Error('Ephemeral key mismatch. Please re-login with Google.');
  }

  console.log('Fetching ZK proof from prover...', {
    maxEpoch,
    extendedEphemeralPublicKey,
    randomness: randomness.toString(),
    salt: userSalt.toString(),
  });

  const response = await fetch(PROVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt,
      extendedEphemeralPublicKey,
      maxEpoch,
      jwtRandomness: randomness.toString(),
      salt: userSalt.toString(),
      keyClaimName: 'sub',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Prover error:', error);
    throw new Error(`Failed to get ZK proof: ${error}`);
  }

  const zkProof = await response.json();
  console.log('Received ZK proof:', JSON.stringify(zkProof, null, 2));
  console.log('proofPoints.a:', zkProof.proofPoints?.a);
  console.log('proofPoints.b:', zkProof.proofPoints?.b);
  console.log('proofPoints.c:', zkProof.proofPoints?.c);
  console.log('issBase64Details:', zkProof.issBase64Details);
  console.log('headerBase64:', zkProof.headerBase64);
  return zkProof;
}

/**
 * Signs a transaction using zkLogin
 * Returns the zkLogin signature that can be used to execute the transaction
 */
export async function signTransactionWithZkLogin(
  txBytes: Uint8Array
): Promise<string> {
  const jwt = sessionStorage.getItem('zklogin_jwt');
  if (!jwt) {
    throw new Error('No JWT token found. Please re-login with Google.');
  }

  const ephemeralKeyPair = getEphemeralKeyPair();
  const maxEpoch = getMaxEpoch();

  if (!ephemeralKeyPair || !maxEpoch) {
    throw new Error('Missing ephemeral key data. Please re-login with Google.');
  }

  // Decode JWT to get userSalt
  const jwtPayload = JSON.parse(atob(jwt.split('.')[1]));
  const userSalt = await computeUserSalt(jwtPayload);
  const aud = getAudience(jwtPayload);

  console.log('Signing transaction with zkLogin:', {
    sub: jwtPayload.sub,
    iss: jwtPayload.iss,
    aud,
    userSalt: userSalt.toString(),
    maxEpoch,
  });

  // Get ZK proof
  const zkProof = await fetchZkProof(jwt);

  // Sign transaction with ephemeral keypair
  const { signature: ephemeralSignature } = await ephemeralKeyPair.signTransaction(txBytes);

  // Combine into zkLogin signature
  const addressSeed = genAddressSeed(
    userSalt,
    'sub',
    jwtPayload.sub,
    aud
  );

  console.log('Address seed for signature:', addressSeed.toString());

  // Verify the address matches what we stored
  const expectedAddress = computeZkLoginAddress({
    userSalt,
    claimName: 'sub',
    claimValue: jwtPayload.sub,
    aud,
    iss: jwtPayload.iss,
  });
  const storedAddress = localStorage.getItem('zklogin_address');
  console.log('Expected address:', expectedAddress);
  console.log('Stored address:', storedAddress);

  if (expectedAddress !== storedAddress) {
    console.warn('Address mismatch! This may cause signature verification to fail.');
  }

  const inputs = {
    ...zkProof,
    addressSeed: addressSeed.toString(),
  };

  console.log('zkLoginSignature inputs:', {
    proofPoints: inputs.proofPoints,
    issBase64Details: inputs.issBase64Details,
    headerBase64: inputs.headerBase64,
    addressSeed: inputs.addressSeed,
  });
  console.log('maxEpoch:', maxEpoch);
  console.log('userSignature (ephemeral):', ephemeralSignature);

  const zkLoginSignature = getZkLoginSignature({
    inputs,
    maxEpoch,
    userSignature: ephemeralSignature,
  });

  console.log('Generated zkLogin signature:', zkLoginSignature.substring(0, 100) + '...');
  return zkLoginSignature;
}

/**
 * Checks if zkLogin session is valid (has all required data)
 */
export function isZkLoginSessionValid(): boolean {
  const jwt = sessionStorage.getItem('zklogin_jwt');
  const ephemeralKey = sessionStorage.getItem(EPHEMERAL_PRIVATE_KEY);
  const maxEpoch = getMaxEpoch();

  if (!jwt || !ephemeralKey || !maxEpoch) {
    return false;
  }

  return true;
}

/**
 * Checks the current epoch and returns session status
 * Returns: { valid: boolean, currentEpoch: number, maxEpoch: number, epochsRemaining: number }
 */
export async function checkSessionEpoch(): Promise<{
  valid: boolean;
  currentEpoch: number;
  maxEpoch: number | null;
  epochsRemaining: number;
  shouldRefresh: boolean;
}> {
  const client = new SuiClient({ url: SUI_NETWORK_URL });
  const { epoch } = await client.getLatestSuiSystemState();
  const currentEpoch = Number(epoch);
  const maxEpoch = getMaxEpoch();

  if (!maxEpoch) {
    return { valid: false, currentEpoch, maxEpoch: null, epochsRemaining: 0, shouldRefresh: false };
  }

  const epochsRemaining = maxEpoch - currentEpoch;
  const valid = epochsRemaining > 0;
  // Suggest refresh when 3 or fewer epochs remain
  const shouldRefresh = epochsRemaining <= 3 && epochsRemaining > 0;

  return { valid, currentEpoch, maxEpoch, epochsRemaining, shouldRefresh };
}

/**
 * Initiates silent session refresh by redirecting to Google OAuth
 * This should be called proactively before the session expires
 */
export async function refreshZkLoginSession(): Promise<void> {
  // Store current URL to return after refresh
  sessionStorage.setItem('zklogin_return_url', window.location.href);
  sessionStorage.setItem('zklogin_scroll_position', window.scrollY.toString());

  // Start new OAuth flow
  const { getZkLoginUrl } = await import('./zklogin-utils');
  const url = await getZkLoginUrl('google');
  window.location.href = url;
}

/**
 * Clears all zkLogin session data
 */
export function clearZkLoginSession() {
  localStorage.removeItem('zklogin_address');
  localStorage.removeItem('zklogin_email');
  localStorage.removeItem('zklogin_provider');
  sessionStorage.removeItem('zklogin_jwt');
  sessionStorage.removeItem(EPHEMERAL_PRIVATE_KEY);
  sessionStorage.removeItem(EPHEMERAL_MAX_EPOCH);
  sessionStorage.removeItem(EPHEMERAL_RANDOMNESS);
}

/**
 * Error types for zkLogin
 */
export type ZkLoginErrorType = 'session_expired' | 'session_invalid' | 'network_error' | 'unknown';

export interface ZkLoginErrorInfo {
  type: ZkLoginErrorType;
  message: string;
  actionRequired: 'relogin' | 'retry' | 'none';
}

/**
 * Parses zkLogin errors and returns structured error information
 */
export function parseZkLoginError(error: unknown): ZkLoginErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for epoch expiration error
  if (errorMessage.includes('ZKLogin expired at epoch') ||
      errorMessage.includes('expired at epoch')) {
    // Extract epochs from message like "ZKLogin expired at epoch 27, current epoch 28"
    const match = errorMessage.match(/expired at epoch (\d+), current epoch (\d+)/);
    const expiredEpoch = match ? match[1] : '?';
    const currentEpoch = match ? match[2] : '?';

    return {
      type: 'session_expired',
      message: `Your session has expired (epoch ${expiredEpoch} → ${currentEpoch}). Please sign in again with Google to continue.`,
      actionRequired: 'relogin',
    };
  }

  // Check for invalid signature
  if (errorMessage.includes('Invalid user signature') ||
      errorMessage.includes('Signature is not valid')) {
    return {
      type: 'session_expired',
      message: 'Your session is no longer valid. Please sign in again with Google.',
      actionRequired: 'relogin',
    };
  }

  // Check for missing session data
  if (errorMessage.includes('Missing ephemeral key') ||
      errorMessage.includes('No JWT token found') ||
      errorMessage.includes('re-login with Google')) {
    return {
      type: 'session_invalid',
      message: 'Session data is missing. Please sign in again with Google.',
      actionRequired: 'relogin',
    };
  }

  // Check for network errors
  if (errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout')) {
    return {
      type: 'network_error',
      message: 'Network error. Please check your connection and try again.',
      actionRequired: 'retry',
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: errorMessage || 'An unexpected error occurred.',
    actionRequired: 'none',
  };
}
