import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBitcoin(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(8);
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

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: 'USD' | 'GBP' | 'EUR'): string {
  return currency === 'USD' ? formatUSD(amount) : 
         currency === 'EUR' ? formatEUR(amount) : formatGBP(amount);
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
