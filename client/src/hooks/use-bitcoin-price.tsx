import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinPrice } from '@/lib/bitcoin';
import { useEffect, useState } from 'react'; // Added import for useEffect and useState

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['/api/bitcoin/price'],
    queryFn: fetchBitcoinPrice,
    refetchInterval: 30000, // Refresh every 30 seconds
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