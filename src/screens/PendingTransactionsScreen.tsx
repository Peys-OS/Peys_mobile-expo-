import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PendingTransactionsScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [pending, setPending] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = async () => {
    if (!walletAddress) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('sender_wallet', walletAddress)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (!error && data) setPending(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPending(); }, [walletAddress]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  };

  const handleCancel = async (item: any) => {
    await supabase.from('payments').update({ status: 'refunded' }).eq('id', item.id);
    fetchPending();
  };

  if (!authenticated) {
    return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet to view pending</Text></View>;
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{pending.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#FF9500' }]}>{pending.filter(p => new Date(p.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000)).length}</Text>
          <Text style={styles.summaryLabel}>Expiring</Text>
        </View>
      </View>

      {pending.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No pending transactions</Text>
        </View>
      ) : (
        pending.map(item => (
          <View key={item.id} style={styles.txCard}>
            <View style={styles.txHeader}>
              <View style={styles.txLeft}>
                <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
                  <Ionicons name="time" size={16} color="#34C759" />
                </View>
                <View>
                  <Text style={styles.recipient}>{item.recipient_email || item.recipient_wallet || 'Unknown'}</Text>
                  <Text style={styles.txMeta}>{item.chain_id === 84532 ? 'Base' : item.chain_id === 44787 ? 'Celo' : 'Polygon'} • {item.token || 'USDC'}</Text>
                </View>
              </View>
              <Text style={[styles.amount, { color: '#34C759' }]}>${item.amount}</Text>
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.detailLabel}>Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.txActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="share-outline" size={16} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Share Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleCancel(item)}>
                <Ionicons name="close" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFF', margin: 20, borderRadius: 12, padding: 16 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  summaryLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  txCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 8, borderRadius: 12, padding: 16 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recipient: { fontSize: 14, fontWeight: '600', color: '#000' },
  txMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700' },
  txDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  detailLabel: { fontSize: 13, color: '#666' },
  txActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 8 },
  cancelBtn: { backgroundColor: '#FFF0F0' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#000' },
});
