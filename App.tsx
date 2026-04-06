import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { PrivyProvider as PrivyProviderCore } from '@privy-io/expo';
import { PrivyProvider } from './src/contexts/PrivyContext';
import { AppProvider, useApp } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';
import { requestNotificationPermissions } from './src/lib/notifications';

const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'cmlpmbwgn00cb0dicbfwdkz40';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function NotificationHandler() {
  useEffect(() => {
    requestNotificationPermissions();
    
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      if (data?.type) {
        console.log('Notification type:', data.type);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  return null;
}

function DeepLinkHandler() {
  const { refreshTransactions } = useApp();
  const initialURL = useRef<string | null>(null);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      handleLink(event.url);
    };

    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        initialURL.current = url;
        handleLink(url);
      }
    };

    getInitialURL();

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLink = async (url: string) => {
    console.log('Processing deep link:', url);
    
    const parsed = Linking.parse(url);
    console.log('Parsed link:', parsed);

    if (parsed.path === 'claim' || parsed.path?.startsWith('claim/')) {
      const paymentId = parsed.path?.split('/')[1] || parsed.queryParams?.paymentId || parsed.queryParams?.id;
      if (paymentId) {
        console.log('Payment claim detected, ID:', paymentId);
      }
    }
  };

  return null;
}

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
            <NotificationHandler />
            <DeepLinkHandler />
            {showSplash ? <SplashScreen /> : <AppNavigator />}
          </AppProvider>
        </PrivyProvider>
      </PrivyProviderCore>
    </SafeAreaProvider>
  );
}