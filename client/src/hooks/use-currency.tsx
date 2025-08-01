import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'GBP' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('EUR');

  const toggleCurrency = () => {
    setCurrency(current => {
      if (current === 'EUR') return 'USD';
      if (current === 'USD') return 'GBP';
      return 'EUR';
    });
  };

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, setCurrency: updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}