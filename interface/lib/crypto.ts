/**
 * Crypto utilities for password-protected campaigns
 * Uses Web Crypto API with AES-256-GCM encryption
 */

// Password storage keys
const PASSWORD_STORAGE_PREFIX = 'campaign_password_';

/**
 * Generate a cryptographically secure password for campaign encryption
 * Returns a 256-bit password encoded as base64url
 */
export function generateCampaignPassword(): string {
  const bytes = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/**
 * Validate password format
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  // Must be at least 32 chars (256 bits base64url encoded = 43 chars, but allow shorter for manual entry)
  if (password.length < 32) return false;
  // Must be valid base64url characters
  return /^[A-Za-z0-9_-]+$/.test(password);
}

/**
 * Derive an AES-256 key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 * Returns base64 encoded string: salt (16 bytes) + iv (12 bytes) + ciphertext + auth tag
 */
export async function encryptData(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return base64UrlEncode(combined);
}

/**
 * Decrypt data using AES-256-GCM
 * Input is base64 encoded string: salt (16 bytes) + iv (12 bytes) + ciphertext + auth tag
 */
export async function decryptData(ciphertext: string, password: string): Promise<string> {
  const combined = base64UrlDecode(ciphertext);

  // Extract salt, iv, and ciphertext
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encryptedData = combined.slice(28);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Campaign data that gets encrypted
 */
export interface CampaignEncryptedData {
  title: string;
  description: string;
  questions: Array<{
    text: string;
    options: string[];
  }>;
}

/**
 * Encrypt campaign data (title, description, question texts, options)
 */
export async function encryptCampaignData(
  data: CampaignEncryptedData,
  password: string
): Promise<CampaignEncryptedData> {
  const [title, description, ...questionData] = await Promise.all([
    encryptData(data.title, password),
    encryptData(data.description, password),
    ...data.questions.flatMap((q) => [
      encryptData(q.text, password),
      ...q.options.map((opt) => encryptData(opt, password)),
    ]),
  ]);

  // Reconstruct questions array from flattened encrypted data
  let dataIndex = 0;
  const encryptedQuestions = data.questions.map((q) => {
    const text = questionData[dataIndex++];
    const options = q.options.map(() => questionData[dataIndex++]);
    return { text, options };
  });

  return {
    title,
    description,
    questions: encryptedQuestions,
  };
}

/**
 * Decrypt campaign data
 */
export async function decryptCampaignData(
  data: CampaignEncryptedData,
  password: string
): Promise<CampaignEncryptedData> {
  const [title, description, ...questionData] = await Promise.all([
    decryptData(data.title, password),
    decryptData(data.description, password),
    ...data.questions.flatMap((q) => [
      decryptData(q.text, password),
      ...q.options.map((opt) => decryptData(opt, password)),
    ]),
  ]);

  // Reconstruct questions array from flattened decrypted data
  let dataIndex = 0;
  const decryptedQuestions = data.questions.map((q) => {
    const text = questionData[dataIndex++];
    const options = q.options.map(() => questionData[dataIndex++]);
    return { text, options };
  });

  return {
    title,
    description,
    questions: decryptedQuestions,
  };
}

/**
 * Encrypt response answers
 * answers is a map of questionIndex -> answer string
 */
export async function encryptAnswers(
  answers: Record<number, string>,
  password: string
): Promise<Record<number, string>> {
  const entries = Object.entries(answers);
  const encryptedValues = await Promise.all(
    entries.map(([, value]) => encryptData(value, password))
  );

  const result: Record<number, string> = {};
  entries.forEach(([key], i) => {
    result[Number(key)] = encryptedValues[i];
  });

  return result;
}

/**
 * Decrypt response answers
 */
export async function decryptAnswers(
  answers: Record<number, string>,
  password: string
): Promise<Record<number, string>> {
  const entries = Object.entries(answers);
  const decryptedValues = await Promise.all(
    entries.map(([, value]) => decryptData(value, password))
  );

  const result: Record<number, string> = {};
  entries.forEach(([key], i) => {
    result[Number(key)] = decryptedValues[i];
  });

  return result;
}

// === LocalStorage utilities ===

/**
 * Get the current user address from wallet or zkLogin
 */
function getCurrentUserAddress(): string | null {
  if (typeof window === 'undefined') return null;
  // Try zkLogin first (more common for this app)
  const zkLoginAddress = localStorage.getItem('zklogin_address');
  if (zkLoginAddress) return zkLoginAddress;
  // Wallet address would need to be passed in, so we return null here
  return null;
}

/**
 * Build storage key for password - includes user address for isolation
 */
function buildPasswordKey(campaignId: string, userAddress?: string | null): string {
  const address = userAddress || getCurrentUserAddress();
  if (address) {
    // Use first 8 and last 4 chars of address for shorter key
    const shortAddress = `${address.slice(0, 8)}${address.slice(-4)}`;
    return `${PASSWORD_STORAGE_PREFIX}${shortAddress}_${campaignId}`;
  }
  // Fallback to campaign-only key (for backwards compatibility during transition)
  return `${PASSWORD_STORAGE_PREFIX}${campaignId}`;
}

/**
 * Store password in localStorage (tied to user address)
 */
export function storePassword(campaignId: string, password: string, userAddress?: string | null): void {
  try {
    const key = buildPasswordKey(campaignId, userAddress);
    localStorage.setItem(key, password);
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Get stored password from localStorage (tied to user address)
 */
export function getStoredPassword(campaignId: string, userAddress?: string | null): string | null {
  try {
    const key = buildPasswordKey(campaignId, userAddress);
    const password = localStorage.getItem(key);
    if (password) return password;

    // Fallback: check old key format without user address (migration support)
    const oldKey = `${PASSWORD_STORAGE_PREFIX}${campaignId}`;
    const oldPassword = localStorage.getItem(oldKey);
    if (oldPassword) {
      // Migrate to new format
      const newKey = buildPasswordKey(campaignId, userAddress);
      if (newKey !== oldKey) {
        localStorage.setItem(newKey, oldPassword);
        localStorage.removeItem(oldKey);
      }
      return oldPassword;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Remove stored password from localStorage (tied to user address)
 */
export function removeStoredPassword(campaignId: string, userAddress?: string | null): void {
  try {
    const key = buildPasswordKey(campaignId, userAddress);
    localStorage.removeItem(key);
    // Also remove old format key if exists
    const oldKey = `${PASSWORD_STORAGE_PREFIX}${campaignId}`;
    if (oldKey !== key) {
      localStorage.removeItem(oldKey);
    }
  } catch {
    // ignore
  }
}

// === Base64URL encoding utilities ===

function base64UrlEncode(bytes: Uint8Array): string {
  // Convert to regular base64 first
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  // Convert to base64url (URL-safe)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  // Convert from base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/**
 * Generate password file content with context
 */
export function generatePasswordFileContent(
  password: string,
  campaignName: string,
  campaignId: string,
  createdAt: Date
): string {
  return `===========================================
LOGBOOK CAMPAIGN PASSWORD
===========================================

Campaign: ${campaignName}
Campaign ID: ${campaignId}
Created: ${createdAt.toLocaleString()}

-------------------------------------------
PASSWORD (KEEP THIS SECRET):
${password}
-------------------------------------------

IMPORTANT:
- This password is required to view and participate in this campaign
- Store this file securely - the password cannot be recovered if lost
- Do not share this password unless you want others to access the campaign
- The campaign data is encrypted and unreadable without this password

Share link with password:
${typeof window !== 'undefined' ? `${window.location.origin}/campaigns/${campaignId}?key=${password}` : `[URL]/campaigns/${campaignId}?key=${password}`}

Share link without password (recipients will need to enter password):
${typeof window !== 'undefined' ? `${window.location.origin}/campaigns/${campaignId}` : `[URL]/campaigns/${campaignId}`}

===========================================
Generated by Logbook Protocol
===========================================
`;
}
