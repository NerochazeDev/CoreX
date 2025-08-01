export interface CurrencyPrice {
  price: number;
  change24h: number;
}

export interface BitcoinPrice {
  usd: CurrencyPrice;
  gbp: CurrencyPrice;
  eur: CurrencyPrice;
}

export async function fetchBitcoinPrice(): Promise<BitcoinPrice> {
  const response = await fetch('/api/bitcoin/price');
  if (!response.ok) {
    throw new Error('Failed to fetch Bitcoin price');
  }
  return response.json();
}
