import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function EscrowScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchEscrows = async () => {
    if (!walletAddress) return;
    try {
      let query = supabase.from('payments').select('*').eq('sender_wallet', walletAddress);
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) setEscrows(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchEscrows(); }, [walletAddress, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEscrows();
    setRefreshing(false);
  };

  const handleRefund = async (item: any) => {
    Alert.alert('Refund', `Refund ${item.amount} ${item.token}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Refund', style: 'destructive', onPress: async () => {
        await supabase.from('payments').update({ status: 'refunded' }).eq('id', item.id);
        fetchEscrows();
      }}
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'claimed': return '#34C759';
      case 'expired': return '#FF3B30';
      case 'refunded': return '#8E8E93';
      default: return '#999';
    }
  };

  if (!authenticated) {
    return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet to view escrow</Text></View>;
  }

  const totalPending = escrows.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Pending</Text>
        <Text style={styles.summaryAmount}>${totalPending.toFixed(2)}</Text>
        <Text style={styles.summarySubtext}>{escrows.filter(e => e.status === 'pending').length} pending payment(s)</Text>
      </View>

      <View style={styles.filterRow}>
        {['all', 'pending', 'claimed', 'expired', 'refunded'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {escrows.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No escrow payments</Text>
        </View>
      ) : (
        escrows.map(item => (
          <View key={item.id} style={styles.escrowCard}>
            <View style={styles.escrowHeader}>
              <View style={styles.escrowLeft}>
                <View style={[styles.statusIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons name={item.status === 'claimed' ? 'checkmark-circle' : item.status === 'expired' ? 'alert-circle' : 'time'} size={18} color={getStatusColor(item.status)} />
                </View>
                <View>
                  <Text style={styles.recipient}>{item.recipient_email || item.recipient_wallet || 'Unknown'}</Text>
                  <Text style={styles.network}>{item.chain_id === 84532 ? 'Base' : item.chain_id === 44787 ? 'Celo' : 'Polygon'} • {item.token || 'USDC'}</Text>
                </View>
              </View>
              <Text style={[styles.amount, { color: getStatusColor(item.status) }]}>${item.amount}</Text>
            </View>
            <View style={styles.escrowFooter}>
              <Text style={styles.date}>Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.refundBtn} onPress={() => handleRefund(item)}>
                  <Ionicons name="arrow-undo" size={14} color="#FF3B30" style={{ marginRight: 4 }} />
                  <Text style={styles.refundBtnText}>Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  summaryCard: { backgroundColor: '#000', margin: 20, borderRadius: 16, padding: 24, alignItems: 'center' },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryAmount: { color: '#FFF', fontSize: 36, fontWeight: '700', marginVertical: 8 },
  summarySubtext: { color: '#666', fontSize: 13 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0' },
  filterChipActive: { backgroundColor: '#000', borderColor: '#000' },
  filterText: { fontSize: 12, color: '#666', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  escrowCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 8, borderRadius: 12, padding: 16 },
  escrowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  escrowLeft: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recipient: { fontSize: 14, fontWeight: '600', color: '#000' },
  network: { fontSize: 12, color: '#666', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700' },
  escrowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  date: { fontSize: 12, color: '#999' },
  refundBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFF0F0', borderRadius: 8 },
  refundBtnText: { fontSize: 12, fontWeight: '600', color: '#FF3B30' },
});
