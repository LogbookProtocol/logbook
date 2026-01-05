const CACHE_KEY = 'sui_tx_cost_usd';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedPrice {
  value: number;
  timestamp: number;
}

const FALLBACK_PRICE = 0.004; // Fallback if APIs fail
const AVG_GAS_UNITS = 3000; // Typical transaction gas units

export async function getTransactionCostUsd(): Promise<number> {
  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
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
      fetchSuiPrice(),
    ]);

    // Calculate cost: (gas_units × gas_price_mist × sui_price) / 1e9
    const costInSui = (AVG_GAS_UNITS * gasPrice) / 1_000_000_000;
    const costInUsd = costInSui * suiPrice;

    // Round to 4 decimal places
    const rounded = Math.round(costInUsd * 10000) / 10000;

    // Cache result
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ value: rounded, timestamp: Date.now() })
      );
    }

    return rounded;
  } catch (error) {
    console.error('Failed to fetch transaction cost:', error);
    return FALLBACK_PRICE;
  }
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

async function fetchSuiPrice(): Promise<number> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd'
  );
  const data = await response.json();
  return data.sui.usd;
}
