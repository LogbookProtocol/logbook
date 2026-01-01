export const NETWORK = 'testnet';

export const PACKAGE_ID = '0x6c7f7c9353b835325c3057d50ebd5920d257c70794873f09edf6b1f374ae208e';

export const RPC_URL = 'https://fullnode.testnet.sui.io:443';

// Константы из контракта
export const FORM_TYPES = {
  POLL: 0,
  VOTE: 1,
  SURVEY: 2,
  QUIZ: 3,
} as const;

export const ACCESS_TYPES = {
  PUBLIC: 0,
  LINK: 1,
  WHITELIST: 2,
} as const;

export const AUTH_METHODS = {
  SUI_WALLET: 1,
  ZKLOGIN: 2,
  BOTH: 3,
} as const;
