import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const { walletAddress, login, authenticated } = usePrivyContext();
  const { totalBalanceUSD, transactions, transactionsLoading, refreshTransactions, isDarkMode } = useApp();
  
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleRefresh = async () => {
    await refreshTransactions();
  };

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, { color: theme.text }]}>Peys</Text>
          <Text style={[styles.title, { color: theme.textSecondary }]}>Pay Anyone, Anywhere</Text>
        </View>
        <TouchableOpacity style={[styles.loginBtn, { backgroundColor: theme.primary }]} onPress={login}>
          <Text style={[styles.loginBtnText, { color: theme.background === '#000000' ? '#FFF' : '#FFF' }]}>Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const quickActions = [
    { icon: 'send' as const, label: 'Send', screen: 'Send', color: theme.primary },
    { icon: 'arrow-down' as const, label: 'Receive', screen: 'Receive', color: theme.primary },
    { icon: 'document-text' as const, label: 'Escrow', screen: 'Escrow', color: '#35D07F' },
    { icon: 'layers' as const, label: 'Bulk', screen: 'BulkSend', color: '#FF9500' },
    { icon: 'wallet' as const, label: 'Assets', screen: 'Assets', color: '#5856D6' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={transactionsLoading} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.address, { color: theme.textTertiary }]}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.profileIcon, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="person-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
        <Text style={[styles.balanceLabel, { color: theme.textTertiary }]}>Total Balance</Text>
        <Text style={[styles.balanceAmount, { color: theme.background === '#000000' ? '#FFF' : '#FFF' }]}>${totalBalanceUSD.toFixed(2)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#333' : 'rgba(255,255,255,0.2)' }]} 
            onPress={() => navigation.navigate('Send')}
          >
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnSec, { borderColor: isDarkMode ? '#666' : 'rgba(255,255,255,0.3)' }]} 
            onPress={() => navigation.navigate('Receive')}
          >
            <Text style={[styles.actionTextSec, { color: '#FFF' }]}>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        {quickActions.map((item) => (
          <TouchableOpacity key={item.label} style={styles.quickAction} onPress={() => navigation.navigate(item.screen)}>
            <View style={[styles.quickActionIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name={item.icon} size={22} color={theme.primary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {transactions.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={[styles.seeAll, { color: theme.textTertiary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.slice(0, 5).map((tx) => (
            <TouchableOpacity 
              key={tx.id} 
              style={[styles.transactionItem, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('History')}
            >
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'send' ? '#FFF0F0' : '#F0FFF0' }]}>
                <Ionicons 
                  name={tx.type === 'send' ? 'arrow-up' : 'arrow-down'} 
                  size={16} 
                  color={tx.type === 'send' ? '#FF3B30' : '#34C759'} 
                />
              </View>
              <View style={styles.txDetails}>
                <Text style={[styles.txType, { color: theme.text }]}>
                  {tx.type === 'send' ? 'Sent' : 'Received'}
                </Text>
                <Text style={[styles.txCounterparty, { color: theme.textTertiary }]} numberOfLines={1}>
                  {tx.counterparty}
                </Text>
              </View>
              <View style={styles.txAmount}>
                <Text style={[
                  styles.txValue, 
                  { color: tx.type === 'send' ? theme.text : '#34C759' }
                ]}>
                  {tx.type === 'send' ? '-' : '+'}${tx.amount.toFixed(2)}
                </Text>
                <Text style={[styles.txToken, { color: theme.textTertiary }]}>{tx.token}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoContainer: { alignItems: 'center', marginTop: 100 },
  logo: { fontSize: 48, fontWeight: '700', textAlign: 'center' },
  title: { fontSize: 18, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  loginBtn: { padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginHorizontal: spacing.xl },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  profileIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 14 },
  address: { fontSize: 12, marginTop: 2 },
  balanceCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  balanceLabel: { fontSize: 14 },
  balanceAmount: { fontSize: 40, fontWeight: '700', marginVertical: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, padding: 14, borderRadius: borderRadius.sm, alignItems: 'center' },
  actionBtnSec: { borderWidth: 1 },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actionTextSec: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  quickAction: { alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  quickActionLabel: { fontSize: 12 },
  recentSection: { paddingHorizontal: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  seeAll: { fontSize: 14 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  txDetails: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '600' },
  txCounterparty: { fontSize: 12, marginTop: 2 },
  txAmount: { alignItems: 'flex-end' },
  txValue: { fontSize: 14, fontWeight: '600' },
  txToken: { fontSize: 11, marginTop: 2 },
  bottomPadding: { height: 100 },
});