import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive'>('all');

  const fetchTransactions = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .or(`sender_wallet.eq.${walletAddress},recipient_wallet.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;
      if (!error && data) {
        let filtered = data;
        if (filter === 'send') {
          filtered = data.filter((t: any) => t.sender_wallet?.toLowerCase() === walletAddress.toLowerCase());
        } else if (filter === 'receive') {
          filtered = data.filter((t: any) => t.recipient_wallet?.toLowerCase() === walletAddress.toLowerCase());
        }
        setTransactions(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [walletAddress, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const groupTransactionsByDate = (txs: any[]) => {
    const groups: { title: string; data: any[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDateHeader = (date: Date) => {
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const grouped = txs.reduce((acc: Record<string, any[]>, tx) => {
      const date = new Date(tx.created_at).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(tx);
      return acc;
    }, {});

    Object.keys(grouped).forEach(date => {
      groups.push({
        title: formatDateHeader(new Date(date)),
        data: grouped[date],
      });
    });

    return groups;
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const renderRightActions = (item: any) => {
    const txHash = item.tx_hash;
    const recipient = item.recipient_wallet || item.recipient_email;
    
    return (
      <View style={styles.swipeActions}>
        {txHash && (
          <TouchableOpacity 
            style={[styles.swipeAction, { backgroundColor: '#007AFF' }]}
            onPress={() => copyToClipboard(txHash, 'Transaction hash')}
          >
            <Ionicons name="link" size={18} color="#FFF" />
            <Text style={styles.swipeActionText}>Tx</Text>
          </TouchableOpacity>
        )}
        {recipient && (
          <TouchableOpacity 
            style={[styles.swipeAction, { backgroundColor: theme.primary }]}
            onPress={() => copyToClipboard(recipient, 'Address')}
          >
            <Ionicons name="person" size={18} color="#FFF" />
            <Text style={styles.swipeActionText}>Copy</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = { 84532: 'Base', 44787: 'Celo', 80002: 'Polygon' };
    return networks[chainId] || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: theme.warning,
      claimed: theme.success,
      expired: theme.error,
      refunded: theme.textTertiary,
    };
    return statusColors[status] || theme.textTertiary;
  };

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Connect wallet to view history</Text>
      </View>
    );
  }

  const renderItem = ({ item }: any) => {
    const isSend = item.sender_wallet?.toLowerCase() === walletAddress.toLowerCase();
    const txColor = isSend ? theme.error : theme.success;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <TouchableOpacity style={[styles.txItem, { backgroundColor: theme.surface }]}>
          <View style={[styles.txIcon, { backgroundColor: isSend ? '#FFF0F0' : '#F0FFF0' }]}>
            <Ionicons name={isSend ? 'arrow-up' : 'arrow-down'} size={18} color={txColor} />
          </View>
          <View style={styles.txInfo}>
            <Text style={[styles.txCounterparty, { color: theme.text }]}>
              {isSend ? (item.recipient_email || item.recipient_wallet?.slice(0, 8) + '...') : (item.sender_wallet?.slice(0, 8) + '...')}
            </Text>
            <View style={styles.txMeta}>
              <Text style={[styles.txTime, { color: theme.textTertiary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={[styles.txNetwork, { color: theme.textTertiary }]}> • {getNetworkName(item.chain_id)}</Text>
            </View>
          </View>
          <View style={styles.txAmountContainer}>
            <Text style={[styles.txAmount, { color: txColor }]}>
              {isSend ? '-' : '+'}${item.amount} {item.token || 'USDC'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CalendarView')}>
            <Ionicons name="calendar" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {(['all', 'send', 'receive'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: theme.surface },
                filter === f && { backgroundColor: theme.primary }
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f ? '#FFF' : theme.textSecondary }
              ]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionList
          sections={groupTransactionsByDate(transactions)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{section.title}</Text>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: 60, paddingBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  filters: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  filterText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  sectionHeader: { fontSize: 13, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  txInfo: { flex: 1 },
  txCounterparty: { fontSize: 15, fontWeight: '500' },
  txMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  txTime: { fontSize: 12 },
  txNetwork: { fontSize: 12 },
  txAmountContainer: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: spacing.sm },
  swipeActions: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  swipeAction: { justifyContent: 'center', alignItems: 'center', width: 60, height: '100%', borderRadius: borderRadius.md },
  swipeActionText: { fontSize: 10, fontWeight: '600', color: '#FFF', marginTop: 2 },
});