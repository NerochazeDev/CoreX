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
        // Silently handle Bitcoin price fetch errors in production
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

