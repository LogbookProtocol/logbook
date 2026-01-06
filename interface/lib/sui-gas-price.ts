import { Currency } from '@/contexts/CurrencyContext';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedPrice {
  value: number;
  timestamp: number;
}

const FALLBACK_PRICE = 0.004; // Fallback if APIs fail
const AVG_GAS_UNITS = 3000; // Typical transaction gas units

function getCacheKey(currency: Currency): string {
  return `sui_tx_cost_${currency}`;
}

export async function getTransactionCost(currency: Currency = 'usd'): Promise<number> {
  const cacheKey = getCacheKey(currency);

  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { value, timestamp }: CachedPrice = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return value;
      }
    }
  }

  try {
    // Fetch gas price and SUI price in parallel
    const [gasPrice, suiPrice] = await Promise.all([
      fetchGasPrice(),
      fetchSuiPrice(currency),
    ]);

    // Calculate cost: (gas_units × gas_price_mist × sui_price) / 1e9
    const costInSui = (AVG_GAS_UNITS * gasPrice) / 1_000_000_000;
    const costInFiat = costInSui * suiPrice;

    // Round to 4 decimal places
    const rounded = Math.round(costInFiat * 10000) / 10000;

    // Cache result
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ value: rounded, timestamp: Date.now() })
      );
    }

    return rounded;
  } catch (error) {
    console.error('Failed to fetch transaction cost:', error);
    return FALLBACK_PRICE;
  }
}

// Legacy function for backwards compatibility
export async function getTransactionCostUsd(): Promise<number> {
  return getTransactionCost('usd');
}

async function fetchGasPrice(): Promise<number> {
  const response = await fetch('https://fullnode.mainnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getReferenceGasPrice',
      params: [],
    }),
  });

  const data = await response.json();
  return parseInt(data.result, 10);
}

const FALLBACK_SUI_PRICE_USD = 2.0; // Approximate fallback price
const FALLBACK_SUI_PRICE_EUR = 1.85;
const SUI_PRICE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getSuiPriceCacheKey(currency: Currency): string {
  return `sui_price_${currency}`;
}

export interface SuiPriceResult {
  price: number;
  timestamp: Date | null;
  isFallback: boolean;
}

export async function fetchSuiPrice(currency: Currency = 'usd'): Promise<number> {
  const result = await fetchSuiPriceWithMeta(currency);
  return result.price;
}

export async function fetchSuiPriceWithMeta(currency: Currency = 'usd', forceRefresh = false): Promise<SuiPriceResult> {
  // Check cache first (unless force refresh)
  if (!forceRefresh && typeof window !== 'undefined') {
    const cacheKey = getSuiPriceCacheKey(currency);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { value, timestamp }: CachedPrice = JSON.parse(cached);
        if (Date.now() - timestamp < SUI_PRICE_CACHE_TTL) {
          return { price: value, timestamp: new Date(timestamp), isFallback: false };
        }
      } catch {
        // Invalid cache, continue to fetch
      }
    }
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=${currency}`
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const price = data.sui[currency];
    const now = Date.now();

    // Cache the result
    if (typeof window !== 'undefined') {
      const cacheKey = getSuiPriceCacheKey(currency);
      localStorage.setItem(cacheKey, JSON.stringify({ value: price, timestamp: now }));
    }

    return { price, timestamp: new Date(now), isFallback: false };
  } catch (error) {
    console.error('Failed to fetch SUI price:', error);
    // Return fallback price
    const fallbackPrice = currency === 'eur' ? FALLBACK_SUI_PRICE_EUR : FALLBACK_SUI_PRICE_USD;
    return { price: fallbackPrice, timestamp: null, isFallback: true };
  }
}

// Get cached price info without fetching
export function getCachedSuiPrice(currency: Currency): SuiPriceResult | null {
  if (typeof window === 'undefined') return null;

  const cacheKey = getSuiPriceCacheKey(currency);
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;

  try {
    const { value, timestamp }: CachedPrice = JSON.parse(cached);
    return { price: value, timestamp: new Date(timestamp), isFallback: false };
  } catch {
    return null;
  }
}
