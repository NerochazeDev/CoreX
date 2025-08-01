import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinPrice } from '@/lib/bitcoin';
import { useEffect, useState } from 'react'; // Added import for useEffect and useState

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async () => {
      try {
        // Fetch prices for multiple currencies
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp,eur&include_24hr_change=true'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Bitcoin price');
        }

        const data = await response.json();
        const bitcoin = data.bitcoin;

        return {
          usd: {
            price: bitcoin.usd,
            change24h: bitcoin.usd_24h_change || 0
          },
          gbp: {
            price: bitcoin.gbp,
            change24h: bitcoin.gbp_24h_change || 0
          },
          eur: {
            price: bitcoin.eur,
            change24h: bitcoin.eur_24h_change || 0
          }
        };
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        // Return fallback data
        return {
          usd: { price: 45000, change24h: 0 },
          gbp: { price: 35000, change24h: 0 },
          eur: { price: 42000, change24h: 0 }
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}

// Example component that uses the useBitcoinPrice hook and the useEffect
export function BitcoinPriceComponent() {
  const { data: priceData, isLoading, isError } = useBitcoinPrice();
  const [price, setPrice] = useState(null);

  useEffect(() => {
    // Check cache first
    const cachedPrice = sessionStorage.getItem('bitcoin_price_cache');
    const cacheTime = sessionStorage.getItem('bitcoin_price_time');

    if (cachedPrice && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 60000) { // Use cache if less than 1 minute old
        setPrice(JSON.parse(cachedPrice));
        return;
      }
    }

    if (priceData) {
      setPrice(priceData);
      sessionStorage.setItem('bitcoin_price_cache', JSON.stringify(priceData));
      sessionStorage.setItem('bitcoin_price_time', Date.now().toString());
    }

    const interval = setInterval(() => {
        if (priceData) {
          setPrice(priceData);
          sessionStorage.setItem('bitcoin_price_cache', JSON.stringify(priceData));
          sessionStorage.setItem('bitcoin_price_time', Date.now().toString());
        }
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [priceData]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching price.</p>;

  return (
    <div>
      {price ? <p>Bitcoin Price: {price.price}</p> : <p>Loading price...</p>}
    </div>
  );
}