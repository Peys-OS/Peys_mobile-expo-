import React, { ReactNode, createContext, useContext, useState } from 'react';

interface AppState {
  totalBalanceUSD: number;
  transactions: any[];
  transactionsLoading: boolean;
  refreshTransactions: () => void;
}

const AppContext = createContext<AppState>({
  totalBalanceUSD: 0,
  transactions: [],
  transactionsLoading: false,
  refreshTransactions: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [totalBalanceUSD] = useState(0);
  const [transactions] = useState<any[]>([]);
  const [transactionsLoading] = useState(false);

  const refreshTransactions = () => {};

  return (
    <AppContext.Provider value={{ totalBalanceUSD, transactions, transactionsLoading, refreshTransactions }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
