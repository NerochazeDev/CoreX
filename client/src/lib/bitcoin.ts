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
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp,eur&include_24hr_change=true'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    const data = await response.json();
    const bitcoin = data.bitcoin;

    const result = {
      usd: {
        price: bitcoin.usd || 45000,
        change24h: bitcoin.usd_24h_change || 0
      },
      gbp: {
        price: bitcoin.gbp || 35000,
        change24h: bitcoin.gbp_24h_change || 0
      },
      eur: {
        price: bitcoin.eur || 42000,
        change24h: bitcoin.eur_24h_change || 0
      }
    };

    // Cache the result
    sessionStorage.setItem('bitcoin_price_cache', JSON.stringify(result));
    sessionStorage.setItem('bitcoin_price_time', Date.now().toString());

    return result;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    // Return fallback prices
    return {
      usd: { price: 45000, change24h: 0 },
      gbp: { price: 35000, change24h: 0 },
      eur: { price: 42000, change24h: 0 }
    };
  }
}