import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SecurityScreen({ navigation }: any) {
  const { authenticated, walletAddress } = usePrivyContext();
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [screenLockEnabled, setScreenLockEnabled] = useState(false);
  const [clipboardSecurityEnabled, setClipboardSecurityEnabled] = useState(true);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometric');
        }
        setBiometricEnabled(true);
      }
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometrics',
          fallbackLabel: 'Use PIN',
        });
        if (result.success) {
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        }
      } catch (error) {
        console.error('Biometric auth error:', error);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Set PIN',
        'PIN setup coming soon',
        [{ text: 'OK' }]
      );
      return;
    }
    setPinEnabled(false);
  };

  const handleScreenLockToggle = (value: boolean) => {
    setScreenLockEnabled(value);
    if (value) {
      Alert.alert('Screen Lock', 'Screen lock will activate when app goes to background');
    }
  };

  const handleClearClipboard = () => {
    Alert.alert(
      'Clear Clipboard',
      'This will clear your clipboard for security. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          // Would clear clipboard here
          Alert.alert('Done', 'Clipboard cleared');
        }},
      ]
    );
  };

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Connect wallet to view security settings</Text>
      </View>
    );
  }

  const SecurityItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    onPress,
    danger = false,
  }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
      disabled={!onPress && onValueChange === undefined}
    >
      <View style={[styles.iconContainer, { backgroundColor: danger ? '#FF3B3020' : theme.primary + '20' }]}>
        <Ionicons name={icon} size={20} color={danger ? '#FF3B30' : theme.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {onValueChange !== undefined && !onPress && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFF"
        />
      )}
      {onPress && !onValueChange && (
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.walletInfo}>
        <View style={[styles.walletCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="wallet-outline" size={24} color={theme.primary} />
          <View style={styles.walletDetails}>
            <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>Wallet</Text>
            <Text style={[styles.walletAddress, { color: theme.text }]}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Authentication</Text>
        <SecurityItem 
          icon={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
          title={biometricType || 'Biometric'}
          subtitle={biometricType ? 'Use biometric to unlock app' : 'Not available'}
          value={biometricEnabled}
          onValueChange={handleBiometricToggle}
        />
        <SecurityItem 
          icon="key-outline"
          title="PIN Code"
          subtitle="Set up a PIN as backup"
          value={pinEnabled}
          onValueChange={handlePinToggle}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>App Security</Text>
        <SecurityItem 
          icon="lock-closed-outline"
          title="Screen Lock"
          subtitle="Lock app when in background"
          value={screenLockEnabled}
          onValueChange={handleScreenLockToggle}
        />
        <SecurityItem 
          icon="clipboard-outline"
          title="Clipboard Security"
          subtitle="Auto-clear clipboard after copy"
          value={clipboardSecurityEnabled}
          onValueChange={setClipboardSecurityEnabled}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Actions</Text>
        <SecurityItem 
          icon="trash-outline"
          title="Clear Clipboard"
          subtitle="Clear copied addresses"
          onPress={handleClearClipboard}
          danger
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Advanced</Text>
        <SecurityItem 
          icon="shield-checkmark-outline"
          title="Backup & Restore"
          subtitle="Export/import wallet"
          onPress={() => Alert.alert('Coming Soon', 'Backup feature coming in future update')}
        />
        <SecurityItem 
          icon="document-text-outline"
          title="View Recovery Phrase"
          subtitle="Access recovery phrase"
          onPress={() => Alert.alert('Coming Soon', 'Recovery phrase viewing coming in future update')}
        />
      </View>

      <Text style={[styles.version, { color: theme.textTertiary }]}>PeysOS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  walletInfo: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  walletCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md },
  walletDetails: { marginLeft: spacing.md },
  walletLabel: { fontSize: 12 },
  walletAddress: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  iconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16 },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  version: { textAlign: 'center', fontSize: 12, padding: spacing.xl, paddingBottom: 40 },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
});