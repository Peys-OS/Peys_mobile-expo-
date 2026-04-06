import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { JailbreakDetector, SecurityCheckResult } from '../lib/jailbreakDetector';
import { SecureStorage } from '../lib/secureStorage';

interface SecurityState {
  securityCheck: SecurityCheckResult | null;
  isLoading: boolean;
  isBlocked: boolean;
}

const SecurityContext = createContext<SecurityState>({
  securityCheck: null,
  isLoading: true,
  isBlocked: false,
});

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [securityCheck, setSecurityCheck] = useState<SecurityCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const performSecurityCheck = async () => {
      try {
        const result = JailbreakDetector.check();
        setSecurityCheck(result);

        const level = JailbreakDetector.getSecurityLevel(result);
        
        if (JailbreakDetector.shouldBlockAccess(result)) {
          setIsBlocked(true);
          Alert.alert(
            'Security Warning',
            'This device appears to be compromised. For your security, access is restricted.',
            [{ text: 'OK', style: 'destructive' }]
          );
        }

        await SecureStorage.saveUserPreferences({
          lastSecurityCheck: Date.now(),
          securityLevel: level,
          deviceSecurityWarning: level !== 'safe',
        });
      } catch (error) {
        console.error('Security check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSecurityCheck();
  }, []);

  return (
    <SecurityContext.Provider value={{ securityCheck, isLoading, isBlocked }}>
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);