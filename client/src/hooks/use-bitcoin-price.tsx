import { useQuery } from '@tanstack/react-query';

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Fetching Bitcoin price from CoinGecko API...');
      }

      try {
        // Use our backend as a proxy to avoid CORS issues
        const response = await fetch('/api/bitcoin/price', {
          method: 'GET',
          credentials: 'include'
        }).catch((networkError) => {
          console.error("Network error fetching Bitcoin price:", networkError);
          throw new Error("Network connection failed");
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Backend API failed, trying direct CoinGecko...');
          }
          // Fallback to direct CoinGecko API
          const directResponse = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp,eur&include_24hr_change=true',
            {
              mode: 'cors',
              headers: {
                'Accept': 'application/json'
              }
            }
          ).catch((networkError) => {
            console.error("Network error fetching Bitcoin price directly from CoinGecko:", networkError);
            throw new Error("Network connection failed");
          });


          if (!directResponse.ok) {
            throw new Error(`CoinGecko API error: ${directResponse.status}`);
          }

          const directData = await directResponse.json().catch((parseError) => {
            console.error("Error parsing Bitcoin price response from CoinGecko:", parseError);
            throw new Error("Invalid response format");
          });
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

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Bitcoin price fetched directly from CoinGecko:', result);
          }
          return result;
        }

        const data = await response.json().catch((parseError) => {
          console.error("Error parsing Bitcoin price response from backend:", parseError);
          throw new Error("Invalid response format");
        });
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Bitcoin price fetched from backend:', data);
        }
        return data;
      } catch (error: any) {
        console.error('❌ All Bitcoin price fetch attempts failed:', error);

        // Only use fallback as absolute last resort and log it clearly
        console.warn('⚠️ Using fallback Bitcoin price data - API unavailable');
        throw error; // Don't use fallback data, let React Query handle retries
      }
    },
    refetchInterval: 60000, // Refresh every 60 seconds (reduced frequency)
    staleTime: 50000, // Consider data stale after 50 seconds
    retry: 2, // Reduce retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    onError: (error: any) => {
      console.error("Bitcoin price query error:", error);
    },
  });
}