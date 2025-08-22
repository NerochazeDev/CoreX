import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'GBP' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    // Get saved preference from localStorage, default to USD
    const saved = localStorage.getItem('preferred-currency');
    return (saved as Currency) || 'USD';
  });

  const toggleCurrency = () => {
    setCurrency(current => {
      let next: Currency;
      if (current === 'USD') next = 'EUR';
      else if (current === 'EUR') next = 'GBP';
      else next = 'USD';
      
      // Save preference to localStorage
      localStorage.setItem('preferred-currency', next);
      return next;
    });
  };

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    // Save preference to localStorage
    localStorage.setItem('preferred-currency', newCurrency);
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