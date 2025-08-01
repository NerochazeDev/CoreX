export interface CurrencyPrice {
  price: number;
  change24h: number;
}

export interface BitcoinPrice {
  usd: CurrencyPrice;
  gbp: CurrencyPrice;
  eur: CurrencyPrice;
}

export async function fetchBitcoinPrice(currency: string = 'USD'): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    const data = await response.json();
    const price = data.bitcoin[currency.toLowerCase()];

    // Cache the result
    sessionStorage.setItem('bitcoin_price_cache', JSON.stringify({ [currency]: price }));
    sessionStorage.setItem('bitcoin_price_time', Date.now().toString());

    return price;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw error;
  }
}