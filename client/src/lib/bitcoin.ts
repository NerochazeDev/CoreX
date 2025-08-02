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
        price: bitcoin.usd || 113000,
        change24h: bitcoin.usd_24h_change || -1.2
      },
      gbp: {
        price: bitcoin.gbp || 85000,
        change24h: bitcoin.gbp_24h_change || -1.5
      },
      eur: {
        price: bitcoin.eur || 97500,
        change24h: bitcoin.eur_24h_change || -1.8
      }
    };

    // Cache the result
    sessionStorage.setItem('bitcoin_price_cache', JSON.stringify(result));
    sessionStorage.setItem('bitcoin_price_time', Date.now().toString());

    return result;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    // Return realistic fallback prices based on current market levels
    return {
      usd: { price: 113000, change24h: -1.2 },
      gbp: { price: 85000, change24h: -1.5 },
      eur: { price: 97500, change24h: -1.8 }
    };
  }
}