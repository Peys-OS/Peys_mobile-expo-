import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function NFCPaymentsScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress, authenticated } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'send' | 'receive'>('receive');

  const toggleNFC = () => {
    if (!authenticated) {
      Alert.alert('Connect Wallet', 'Please connect your wallet to use NFC payments');
      return;
    }
    
    setIsActive(!isActive);
    if (!isActive) {
      Vibration.vibrate([0, 200, 100, 200]);
      setTimeout(() => {
        Alert.alert(
          'NFC Ready',
          mode === 'receive' 
            ? 'Hold your phone near another device to receive payment'
            : 'Hold your phone near the payment terminal',
          [
            { text: 'Cancel', onPress: () => setIsActive(false) },
            { text: 'Done', onPress: () => setIsActive(false) },
          ]
        );
      }, 1500);
    }
  };

  const handleSimulatePayment = () => {
    if (!isActive) return;
    Vibration.vibrate([0, 100, 50, 100]);
    Alert.alert(
      'Payment Received',
      'Successfully received $50.00 USDC',
      [{ text: 'OK', onPress: () => setIsActive(false) }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>NFC Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: theme.surface },
              mode === 'receive' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setMode('receive')}
          >
            <Ionicons 
              name="arrow-down" 
              size={24} 
              color={mode === 'receive' ? '#FFF' : theme.text} 
            />
            <Text style={[
              styles.modeText,
              { color: mode === 'receive' ? '#FFF' : theme.text }
            ]}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: theme.surface },
              mode === 'send' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setMode('send')}
          >
            <Ionicons 
              name="arrow-up" 
              size={24} 
              color={mode === 'send' ? '#FFF' : theme.text} 
            />
            <Text style={[
              styles.modeText,
              { color: mode === 'send' ? '#FFF' : theme.text }
            ]}>Send</Text>
          </TouchableOpacity>
        </View>

        <View style={[
          styles.nfcCircle,
          { borderColor: isActive ? theme.primary : theme.border },
          isActive && styles.nfcCircleActive
        ]}>
          <Ionicons 
            name="nfc" 
            size={64} 
            color={isActive ? theme.primary : theme.textTertiary} 
          />
        </View>

        <Text style={[styles.statusText, { color: theme.text }]}>
          {isActive 
            ? (mode === 'receive' ? 'Waiting for payment...' : 'Ready to pay')
            : 'Tap to activate NFC'
          }
        </Text>

        {isActive && (
          <TouchableOpacity 
            style={[styles.testBtn, { backgroundColor: theme.success + '20' }]}
            onPress={handleSimulatePayment}
          >
            <Text style={[styles.testBtnText, { color: theme.success }]}>
              Simulate Payment (Demo)
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[
            styles.activateBtn,
            { backgroundColor: isActive ? theme.error : theme.primary }
          ]}
          onPress={toggleNFC}
        >
          <Ionicons 
            name={isActive ? 'close' : 'wifi'} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.activateBtnText}>
            {isActive ? 'Deactivate' : 'Activate NFC'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="information-circle" size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            NFC payments allow you to send and receive crypto by tapping your phone against another device or payment terminal.
          </Text>
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={theme.success} />
          <Text style={[styles.securityText, { color: theme.textTertiary }]}>
            Transactions are secured by your wallet's private keys
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  modeSelector: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm },
  modeText: { fontSize: 16, fontWeight: '600' },
  nfcCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  nfcCircleActive: { borderWidth: 6 },
  statusText: { fontSize: 18, fontWeight: '600', marginBottom: spacing.lg },
  testBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  testBtnText: { fontSize: 14, fontWeight: '600' },
  activateBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm, marginBottom: spacing.xl },
  activateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  infoCard: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'flex-start', marginBottom: spacing.lg },
  infoText: { flex: 1, fontSize: 13, marginLeft: spacing.sm, lineHeight: 18 },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  securityText: { fontSize: 12 },
});