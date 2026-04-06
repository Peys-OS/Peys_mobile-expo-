import React, { ReactNode, createContext, useContext } from 'react';
import { usePrivy } from '@privy-io/expo';
import type { User } from '@privy-io/api-types';

interface PrivyContextType {
  user: User | null;
  ready: boolean;
  authenticated: boolean;
  walletAddress: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const PrivyContext = createContext<PrivyContextType | undefined>(undefined);

export function PrivyProvider({ children }: { children: ReactNode }) {
  const { user, isReady, logout } = usePrivy();
  
  const embeddedWallet = user?.linked_accounts?.find(
    (account) => account.type === 'wallet' || account.type === 'smart_wallet'
  );
  const walletAddress = embeddedWallet?.address || '';
  const authenticated = !!user;

  const login = async () => {
    console.log('Login triggered - Privy handles authentication automatically');
    console.log('User:', user);
    console.log('Wallet address:', walletAddress);
  };

  return (
    <PrivyContext.Provider 
      value={{ 
        user, 
        ready: isReady, 
        authenticated, 
        walletAddress, 
        login, 
        logout 
      }}
    >
      {children}
    </PrivyContext.Provider>
  );
}

export const usePrivyContext = () => {
  const context = useContext(PrivyContext);
  if (!context) throw new Error('usePrivyContext must be used within PrivyProvider');
  return context;
};