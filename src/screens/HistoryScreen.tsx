import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!walletAddress) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`sender_wallet.eq.${walletAddress},recipient_wallet.eq.${walletAddress}`)
        .order('created_at', { ascending: false });
      if (!error && data) setTransactions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchTransactions(); }, [walletAddress]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  if (!authenticated) {
    return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet to view history</Text></View>;
  }

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: item.sender_wallet === walletAddress ? '#FF3B3020' : '#34C75920' }]}>
        <Ionicons name={item.sender_wallet === walletAddress ? 'arrow-up' : 'arrow-down'} size={18} color={item.sender_wallet === walletAddress ? '#FF3B30' : '#34C759'} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txCounterparty}>{item.recipient_email || item.recipient_wallet || 'Unknown'}</Text>
        <Text style={styles.txTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.txAmount, { color: item.sender_wallet === walletAddress ? '#FF3B30' : '#34C759' }]}>
        {item.sender_wallet === walletAddress ? '-' : '+'}${item.amount}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  list: { padding: 20 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txCounterparty: { fontSize: 15, fontWeight: '500', color: '#000' },
  txTime: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 60 },
});
