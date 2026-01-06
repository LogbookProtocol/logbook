export const NETWORK = 'devnet';

export const PACKAGE_ID = '0x864dc36953c2fc645fb66a4d7827cc5562e9d982cc077ec3dc1073bbd9bc577d';

export const RPC_URL = 'https://fullnode.devnet.sui.io:443';

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
