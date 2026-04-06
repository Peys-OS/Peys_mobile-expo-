import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5630',
    });

    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Payments',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Payment notifications',
    });
  }

  return true;
}

export async function schedulePaymentReceivedNotification(amount: string, token: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Payment Received! 💰',
      body: `You received ${amount} ${token}`,
      data: { type: 'payment_received' },
    },
    trigger: null,
  });
}

export async function schedulePaymentSentNotification(amount: string, token: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Payment Sent',
      body: `You sent ${amount} ${token}`,
      data: { type: 'payment_sent' },
    },
    trigger: null,
  });
}

export async function scheduleEscrowClaimedNotification(amount: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Escrow Claimed! 🎉',
      body: `Your escrow of ${amount} has been claimed`,
      data: { type: 'escrow_claimed' },
    },
    trigger: null,
  });
}

export async function scheduleExpirationWarningNotification(hoursLeft: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Payment Expiring Soon',
      body: `Your payment link expires in ${hoursLeft} hours`,
      data: { type: 'expiration_warning' },
    },
    trigger: null,
  });
}

export function addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}