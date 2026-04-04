import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const { walletAddress, login, authenticated } = usePrivyContext();
  const { totalBalanceUSD } = useApp();

  if (!authenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Peys</Text>
        <Text style={styles.title}>Pay Anyone, Anywhere</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={login}>
          <Text style={styles.loginBtnText}>Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.address}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>${totalBalanceUSD.toFixed(2)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Send')}>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSec]} onPress={() => navigation.navigate('Receive')}>
            <Text style={styles.actionTextSec}>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        {[
          { icon: 'qr-code' as const, label: 'Scan', screen: 'Send' },
          { icon: 'add-circle' as const, label: 'Request', screen: 'Receive' },
          { icon: 'swap-horizontal' as const, label: 'Swap', screen: 'Send' },
          { icon: 'card' as const, label: 'Buy', screen: 'Send' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.quickAction} onPress={() => navigation.navigate(item.screen)}>
            <View style={styles.quickActionIcon}>
              <Ionicons name={item.icon} size={24} color="#000" />
            </View>
            <Text style={styles.quickActionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
  logo: { fontSize: 48, fontWeight: '700', color: '#000', textAlign: 'center', marginTop: 100 },
  title: { fontSize: 18, color: '#666', textAlign: 'center', marginTop: 12, marginBottom: 32 },
  loginBtn: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14, color: '#666' },
  address: { fontSize: 12, color: '#999', marginTop: 2 },
  balanceCard: { backgroundColor: '#000', borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceLabel: { color: '#888', fontSize: 14 },
  balanceAmount: { color: '#FFF', fontSize: 40, fontWeight: '700', marginVertical: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: '#333', padding: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnSec: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666' },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actionTextSec: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  quickAction: { alignItems: 'center' },
  quickActionIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2 },
  quickActionLabel: { fontSize: 12, color: '#666' },
});
