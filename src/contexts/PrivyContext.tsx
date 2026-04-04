import React, { ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/expo';

interface PrivyContextType {
  user: any;
  ready: boolean;
  authenticated: boolean;
  walletAddress: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const PrivyContext = createContext<PrivyContextType | undefined>(undefined);

export function PrivyProvider({ children }: { children: ReactNode }) {
  const { user, ready, authenticated, login, logout, wallets } = usePrivy();
  const walletAddress = wallets[0]?.address || '';

  return (
    <PrivyContext.Provider value={{ user, ready, authenticated, walletAddress, login, logout }}>
      {children}
    </PrivyContext.Provider>
  );
}

export const usePrivyContext = () => {
  const context = useContext(PrivyContext);
  if (!context) throw new Error('usePrivyContext must be used within PrivyProvider');
  return context;
};
