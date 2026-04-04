import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PrivyProvider } from './src/contexts/PrivyContext';
import { AppProvider } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PrivyProvider>
        <AppProvider>
          {showSplash ? <SplashScreen /> : <AppNavigator />}
        </AppProvider>
      </PrivyProvider>
    </SafeAreaProvider>
  );
}
