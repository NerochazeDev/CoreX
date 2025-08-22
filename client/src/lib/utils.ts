import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBitcoin(amount: string | number, options?: { compact?: boolean; maxDecimals?: number }): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (options?.compact) {
    // For compact display, use smart decimal formatting
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.01) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toFixed(8);
  }

  // Use maxDecimals if specified
  if (options?.maxDecimals !== undefined) {
    return num.toFixed(options.maxDecimals);
  }

  // Smart formatting: remove trailing zeros for better readability
  const formatted = num.toFixed(8);
  return formatted.replace(/\.?0+$/, '') || '0';
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: 'USD' | 'GBP' | 'EUR', options?: { compact?: boolean }): string {
  const locale = currency === 'EUR' ? 'de-DE' : currency === 'GBP' ? 'en-GB' : 'en-US';

  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
  };

  if (options?.compact) {
    formatOptions.notation = 'compact';
    formatOptions.maximumFractionDigits = 1;
  }

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

// Format BTC amount with fiat equivalent
export function formatBitcoinWithFiat(
  btcAmount: string | number, 
  fiatPrice: number, 
  currency: 'USD' | 'GBP' | 'EUR',
  options?: { primaryCurrency?: 'BTC' | 'FIAT'; compact?: boolean }
): string {
  const btc = typeof btcAmount === 'string' ? parseFloat(btcAmount) : btcAmount;
  const fiatValue = btc * fiatPrice;

  if (options?.primaryCurrency === 'FIAT') {
    return `${formatCurrency(fiatValue, currency, options)} (${formatBitcoin(btc, options)} BTC)`;
  }

  return `${formatBitcoin(btc, options)} BTC (${formatCurrency(fiatValue, currency, options)})`;
}

// Convert fiat to BTC
export function convertFiatToBTC(fiatAmount: number, btcPrice: number): number {
  return fiatAmount / btcPrice;
}

// Convert BTC to fiat  
export function convertBTCToFiat(btcAmount: string | number, btcPrice: number): number {
  const btc = typeof btcAmount === 'string' ? parseFloat(btcAmount) : btcAmount;
  return btc * btcPrice;
}

export function calculateUSDValue(btcAmount: string | number, btcPrice: number): number {
  const btc = typeof btcAmount === 'string' ? parseFloat(btcAmount) : btcAmount;
  return btc * btcPrice;
}

export function calculateCurrencyValue(btcAmount: string | number, btcPrice: number): number {
  const btc = typeof btcAmount === 'string' ? parseFloat(btcAmount) : btcAmount;
  return btc * btcPrice;
}

export function calculateInvestmentProgress(startDate: Date, endDate: Date): number {
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}