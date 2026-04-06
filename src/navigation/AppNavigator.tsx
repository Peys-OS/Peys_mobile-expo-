import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SendScreen from '../screens/SendScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EscrowScreen from '../screens/EscrowScreen';
import ContactsScreen from '../screens/ContactsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import NetworkSettingsScreen from '../screens/NetworkSettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AssetsScreen from '../screens/AssetsScreen';
import PendingTransactionsScreen from '../screens/PendingTransactionsScreen';
import BulkSendScreen from '../screens/BulkSendScreen';
import InvoiceScreen from '../screens/InvoiceScreen';
import BillsScreen from '../screens/BillsScreen';
import StreamingPaymentsScreen from '../screens/StreamingPaymentsScreen';
import RecurringPaymentsScreen from '../screens/RecurringPaymentsScreen';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.light.primary,
    background: colors.light.background,
    card: colors.light.surface,
    text: colors.light.text,
    border: colors.light.border,
  },
};

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.dark.primary,
    background: colors.dark.background,
    card: colors.dark.surface,
    text: colors.dark.text,
    border: colors.dark.border,
  },
};

function MainTabs() {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, "home" | "home-outline" | "time" | "time-outline" | "settings" | "settings-outline"> = {
            Home: focused ? 'home' : 'home-outline',
            History: focused ? 'time' : 'time-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          const iconName = icons[route.name] || 'home-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingTop: 8,
          height: 85,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isDarkMode } = useApp();
  const navTheme = isDarkMode ? darkNavTheme : lightNavTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Send" component={SendScreen} />
        <Stack.Screen name="Receive" component={ReceiveScreen} />
        <Stack.Screen name="Escrow" component={EscrowScreen} />
        <Stack.Screen name="PendingTransactions" component={PendingTransactionsScreen} />
        <Stack.Screen name="BulkSend" component={BulkSendScreen} />
        <Stack.Screen name="Invoice" component={InvoiceScreen} />
        <Stack.Screen name="Bills" component={BillsScreen} />
        <Stack.Screen name="StreamingPayments" component={StreamingPaymentsScreen} />
        <Stack.Screen name="RecurringPayments" component={RecurringPaymentsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Contacts" component={ContactsScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="NetworkSettings" component={NetworkSettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Assets" component={AssetsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}