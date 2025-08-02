import { useQuery } from '@tanstack/react-query';

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async () => {
      console.log('🚀 Fetching Bitcoin price from CoinGecko API...');
      
      try {
        // Use our backend as a proxy to avoid CORS issues
        const response = await fetch('/api/bitcoin/price', {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          console.log('Backend API failed, trying direct CoinGecko...');
          // Fallback to direct CoinGecko API
          const directResponse = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp,eur&include_24hr_change=true',
            {
              mode: 'cors',
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          
          if (!directResponse.ok) {
            throw new Error(`CoinGecko API error: ${directResponse.status}`);
          }
          
          const directData = await directResponse.json();
          const bitcoin = directData.bitcoin;
          
          const result = {
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
          
          console.log('✅ Bitcoin price fetched directly from CoinGecko:', result);
          return result;
        }

        const data = await response.json();
        console.log('✅ Bitcoin price fetched from backend:', data);
        return data;
      } catch (error) {
        console.error('❌ All Bitcoin price fetch attempts failed:', error);
        
        // Only use fallback as absolute last resort and log it clearly
        console.warn('⚠️ Using fallback Bitcoin price data - API unavailable');
        throw error; // Don't use fallback data, let React Query handle retries
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
    retry: 3, // Retry failed requests
    retryDelay: 2000, // Wait 2 seconds between retries
  });
}

