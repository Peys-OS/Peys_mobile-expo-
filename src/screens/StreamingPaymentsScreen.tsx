import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function StreamingPaymentsScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [showCreate, setShowCreate] = useState(false);
  const [streams, setStreams] = useState<any[]>([]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [token, setToken] = useState('USDC');
  const [network, setNetwork] = useState('Base');

  const fetchStreams = async () => {
    if (!walletAddress) return;
    try {
      const { data } = await supabase.from('payments').select('*').eq('sender_wallet', walletAddress).eq('is_stream', true).order('created_at', { ascending: false });
      if (data) setStreams(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStreams(); }, [walletAddress]);

  const handleCreate = async () => {
    if (!recipient || !amount) { Alert.alert('Error', 'Fill in all fields'); return; }
    try {
      const endsAt = new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000);
      await supabase.from('payments').insert({
        sender_wallet: walletAddress, recipient_email: recipient.includes('@') ? recipient : null,
        recipient_wallet: recipient.includes('@') ? null : recipient, amount: parseFloat(amount), token,
        status: 'pending', chain_id: network === 'Base' ? 84532 : network === 'Celo' ? 44787 : 80002,
        expires_at: endsAt.toISOString(), is_stream: true,
        stream_rate: parseFloat(amount) / (parseInt(duration) * 24 * 60 * 60),
        stream_started_at: new Date().toISOString(), stream_ends_at: endsAt.toISOString(), stream_paused: false,
      });
      Alert.alert('Success', `Streaming ${amount} ${token} over ${duration} days`);
      setShowCreate(false); setRecipient(''); setAmount(''); fetchStreams();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (!authenticated) return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet</Text></View>;

  if (showCreate) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Create Stream</Text><View style={{ width: 24 }} />
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Recipient</Text>
          <TextInput style={styles.input} value={recipient} onChangeText={setRecipient} placeholder="Email or address" placeholderTextColor="#CCC" autoCapitalize="none" />
          <Text style={styles.label}>Amount ({token})</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#CCC" keyboardType="decimal-pad" />
          <Text style={styles.label}>Duration (days)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="30" placeholderTextColor="#CCC" keyboardType="number-pad" />
          <Text style={styles.label}>Token</Text>
          <View style={styles.tokenRow}>{['USDC', 'USDT'].map(t => (
            <TouchableOpacity key={t} style={[styles.tokenChip, token === t && styles.tokenChipActive]} onPress={() => setToken(t)}>
              <Text style={[styles.tokenChipText, token === t && styles.tokenChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}</View>
          <Text style={[styles.label, { marginTop: 12 }]}>Network</Text>
          <View style={styles.networkRow}>{['Base', 'Celo', 'Polygon'].map(n => (
            <TouchableOpacity key={n} style={[styles.networkChip, network === n && styles.networkChipActive]} onPress={() => setNetwork(n)}>
              <Text style={[styles.networkChipText, network === n && styles.networkChipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}</View>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}><Text style={styles.createBtnText}>Create Stream</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.createCard} onPress={() => setShowCreate(true)}>
        <Ionicons name="play-circle-outline" size={32} color="#000" />
        <Text style={styles.createTitle}>Create New Stream</Text>
        <Text style={styles.createSubtext}>Stream payments in real-time</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Your Streams</Text>
      {streams.length === 0 ? (
        <View style={styles.emptyState}><Ionicons name="play-circle-outline" size={48} color="#CCC" /><Text style={styles.emptyText}>No active streams</Text></View>
      ) : (
        streams.map(stream => {
          const started = new Date(stream.stream_started_at);
          const ends = new Date(stream.stream_ends_at);
          const elapsed = Date.now() - started.getTime();
          const total = ends.getTime() - started.getTime();
          const progress = total > 0 ? Math.min((elapsed / total) * 100, 100) : 0;
          const streamed = (stream.amount * progress) / 100;
          return (
            <View key={stream.id} style={styles.streamCard}>
              <View style={styles.streamHeader}>
                <View><Text style={styles.recipient}>{stream.recipient_email || stream.recipient_wallet}</Text>
                  <Text style={styles.streamMeta}>{stream.chain_id === 84532 ? 'Base' : stream.chain_id === 44787 ? 'Celo' : 'Polygon'} • {stream.token} • {stream.stream_rate?.toFixed(4)}/sec</Text></View>
                <View style={[styles.statusBadge, { backgroundColor: stream.stream_paused ? '#FF950020' : '#34C75920' }]}>
                  <Ionicons name={stream.stream_paused ? 'pause-circle' : 'play-circle'} size={16} color={stream.stream_paused ? '#FF9500' : '#34C759'} />
                </View>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}><Text style={styles.progressLabel}>${streamed.toFixed(2)} of ${stream.amount}</Text><Text style={styles.progressPercent}>{progress.toFixed(1)}%</Text></View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: stream.stream_paused ? '#FF9500' : '#34C759' }]} /></View>
              </View>
              <View style={styles.streamFooter}>
                <Text style={styles.streamDate}>Ends: {ends.toLocaleDateString()}</Text>
                <TouchableOpacity style={styles.streamActionBtn} onPress={async () => {
                  await supabase.from('payments').update({ stream_paused: !stream.stream_paused }).eq('id', stream.id);
                  fetchStreams();
                }}>
                  <Ionicons name={stream.stream_paused ? 'play' : 'pause'} size={16} color={stream.stream_paused ? '#34C759' : '#FF9500'} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  form: { padding: 20 },
  label: { fontSize: 12, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#000', marginBottom: 12 },
  tokenRow: { flexDirection: 'row', gap: 8 },
  tokenChip: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  tokenChipActive: { backgroundColor: '#000' },
  tokenChipText: { fontSize: 14, color: '#666', fontWeight: '600' },
  tokenChipTextActive: { color: '#FFF' },
  networkRow: { flexDirection: 'row', gap: 8 },
  networkChip: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  networkChipActive: { backgroundColor: '#000' },
  networkChipText: { fontSize: 14, color: '#666', fontWeight: '600' },
  networkChipTextActive: { color: '#FFF' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  createBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#000', alignItems: 'center' },
  createBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  createCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, alignItems: 'center', margin: 20, borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  createTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 12, marginBottom: 4 },
  createSubtext: { fontSize: 14, color: '#666' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: 16, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  streamCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 8 },
  streamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipient: { fontSize: 14, fontWeight: '600', color: '#000' },
  streamMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  progressSection: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#666' },
  progressPercent: { fontSize: 12, fontWeight: '600', color: '#000' },
  progressBar: { height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  streamFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  streamDate: { fontSize: 12, color: '#999' },
  streamActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
});
