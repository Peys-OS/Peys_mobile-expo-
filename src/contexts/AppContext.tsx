import React, { ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { usePrivyContext } from './PrivyContext';

interface Transaction {
  id: string;
  amount: number;
  token: string;
  status: string;
  type: 'send' | 'receive';
  counterparty: string;
  created_at: string;
  chain_id: number;
}

interface AppState {
  totalBalanceUSD: number;
  transactions: Transaction[];
  transactionsLoading: boolean;
  isDarkMode: boolean;
  refreshTransactions: () => Promise<void>;
  setDarkMode: (value: boolean) => void;
}

const AppContext = createContext<AppState>({
  totalBalanceUSD: 0,
  transactions: [],
  transactionsLoading: false,
  isDarkMode: false,
  refreshTransactions: async () => {},
  setDarkMode: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;
    
    setTransactionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`sender_wallet.eq.${walletAddress},recipient_wallet.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const txns: Transaction[] = data.map(p => ({
          id: p.id,
          amount: p.amount,
          token: p.token || 'USDC',
          status: p.status,
          type: p.sender_wallet === walletAddress ? 'send' : 'receive',
          counterparty: p.recipient_email || p.recipient_wallet || p.sender_wallet || 'Unknown',
          created_at: p.created_at,
          chain_id: p.chain_id,
        }));
        setTransactions(txns);
        
        const total = txns.reduce((sum, t) => {
          if (t.status === 'claimed' && t.type === 'receive') {
            return sum + t.amount;
          }
          return sum;
        }, 0);
        setTotalBalanceUSD(total);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (authenticated && walletAddress) {
      fetchTransactions();
    }
  }, [authenticated, walletAddress, fetchTransactions]);

  return (
    <AppContext.Provider 
      value={{ 
        totalBalanceUSD, 
        transactions, 
        transactionsLoading, 
        isDarkMode,
        refreshTransactions: fetchTransactions,
        setDarkMode: setIsDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);