import { genAddressSeed, computeZkLoginAddress } from '@mysten/sui/zklogin';

const GOOGLE_CLIENT_ID = '958021889620-eks8rjgllfbg4lgcrqr5kebopequs6fj.apps.googleusercontent.com';

export type OAuthProvider = 'google';

/**
 * Вычисляет детерминированный userSalt из JWT payload
 * userSalt = hash(iss + aud + sub) mod BN254_FIELD_SIZE
 * Результат всегда одинаковый для одного Google аккаунта
 * НЕ НУЖНО хранить в localStorage!
 */
async function computeUserSalt(jwtPayload: any): Promise<bigint> {
  // Создаем детерминированную строку из JWT claims
  const data = `${jwtPayload.iss}${jwtPayload.aud}${jwtPayload.sub}`;

  // Хешируем через SHA-256
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Конвертируем в bigint
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashValue = BigInt('0x' + hashHex);

  // BN254 field size (максимальное значение для zkLogin)
  const BN254_FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

  // Применяем модульную операцию, чтобы значение поместилось в BN254 поле
  const userSalt = hashValue % BN254_FIELD_SIZE;

  console.log('Computed deterministic userSalt from JWT:', userSalt.toString());

  return userSalt;
}

/**
 * Генерирует URL для OAuth авторизации через Google
 */
export function getZkLoginUrl(provider: OAuthProvider = 'google') {
  const redirectUrl = `${window.location.origin}/auth/zklogin-callback`;

  // Генерируем nonce для OAuth
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const nonce = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

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

  // 2. Генерируем address seed через Sui zkLogin SDK
  const addressSeed = genAddressSeed(
    userSalt,
    'sub',  // claim name
    jwtPayload.sub,  // claim value (уникальный ID пользователя)
    jwtPayload.aud || GOOGLE_CLIENT_ID  // audience (client_id)
  );

  // 3. Получаем zkAddress
  const zkAddress = computeZkLoginAddress({
    userSalt,
    claimName: 'sub',
    claimValue: jwtPayload.sub,
    aud: jwtPayload.aud || GOOGLE_CLIENT_ID
  });

  console.log('Computed zkLogin address:', zkAddress);
  console.log('For sub:', jwtPayload.sub);
  console.log('iss:', jwtPayload.iss);
  console.log('aud:', jwtPayload.aud);

  return zkAddress;
}

export function getProviderFromStorage(): OAuthProvider | null {
  return sessionStorage.getItem('zklogin_provider') as OAuthProvider | null;
}

export function clearZkLoginStorage() {
  sessionStorage.removeItem('zklogin_provider');
}
