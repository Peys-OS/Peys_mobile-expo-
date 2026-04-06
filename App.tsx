import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PrivyProvider as PrivyProviderCore } from '@privy-io/expo';
import { PrivyProvider } from './src/contexts/PrivyContext';
import { AppProvider } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'cmlpmbwgn00cb0dicbfwdkz40';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PrivyProviderCore appId={PRIVY_APP_ID}>
        <PrivyProvider>
          <AppProvider>
            {showSplash ? <SplashScreen /> : <AppNavigator />}
          </AppProvider>
        </PrivyProvider>
      </PrivyProviderCore>
    </SafeAreaProvider>
  );
}