import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const frequencies = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly'];

export default function RecurringPaymentsScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [showCreate, setShowCreate] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [token, setToken] = useState('USDC');
  const [network, setNetwork] = useState('Base');

  const fetchPayments = async () => {
    if (!walletAddress) return;
    try {
      const { data } = await supabase.from('payments').select('*').eq('sender_wallet', walletAddress).eq('is_recurring', true).order('created_at', { ascending: false });
      if (data) setPayments(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPayments(); }, [walletAddress]);

  const handleCreate = async () => {
    if (!recipient || !amount) { Alert.alert('Error', 'Fill in all fields'); return; }
    try {
      let nextPayment = new Date();
      switch (frequency) {
        case 'Daily': nextPayment.setDate(nextPayment.getDate() + 1); break;
        case 'Weekly': nextPayment.setDate(nextPayment.getDate() + 7); break;
        case 'Biweekly': nextPayment.setDate(nextPayment.getDate() + 14); break;
        case 'Monthly': nextPayment.setMonth(nextPayment.getMonth() + 1); break;
        case 'Quarterly': nextPayment.setMonth(nextPayment.getMonth() + 3); break;
      }
      await supabase.from('payments').insert({
        sender_wallet: walletAddress, recipient_email: recipient.includes('@') ? recipient : null,
        recipient_wallet: recipient.includes('@') ? null : recipient, amount: parseFloat(amount), token,
        status: 'pending', chain_id: network === 'Base' ? 84532 : network === 'Celo' ? 44787 : 80002,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        is_recurring: true, recurring_frequency: frequency, recurring_next_payment: nextPayment.toISOString(),
        recurring_total_payments: 12, recurring_completed_payments: 0, recurring_paused: false,
      });
      Alert.alert('Success', `Recurring ${frequency} payment created`);
      setShowCreate(false); setRecipient(''); setAmount(''); fetchPayments();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (!authenticated) return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet</Text></View>;

  if (showCreate) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
          <Text style={styles.headerTitle}>New Recurring</Text><View style={{ width: 24 }} />
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Recipient</Text>
          <TextInput style={styles.input} value={recipient} onChangeText={setRecipient} placeholder="Email or address" placeholderTextColor="#CCC" autoCapitalize="none" />
          <Text style={styles.label}>Amount ({token})</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#CCC" keyboardType="decimal-pad" />
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.freqRow}>{frequencies.map(f => (
            <TouchableOpacity key={f} style={[styles.freqChip, frequency === f && styles.freqChipActive]} onPress={() => setFrequency(f)}>
              <Text style={[styles.freqChipText, frequency === f && styles.freqChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}</View>
          <Text style={[styles.label, { marginTop: 12 }]}>Token</Text>
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
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}><Text style={styles.createBtnText}>Create</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.createCard} onPress={() => setShowCreate(true)}>
        <Ionicons name="repeat-outline" size={32} color="#000" />
        <Text style={styles.createTitle}>Create Recurring Payment</Text>
        <Text style={styles.createSubtext}>Set up automated payments</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Active Recurring Payments</Text>
      {payments.length === 0 ? (
        <View style={styles.emptyState}><Ionicons name="repeat-outline" size={48} color="#CCC" /><Text style={styles.emptyText}>No recurring payments</Text></View>
      ) : (
        payments.map(payment => {
          const progress = payment.recurring_total_payments > 0 ? (payment.recurring_completed_payments / payment.recurring_total_payments) * 100 : 0;
          return (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View><Text style={styles.recipient}>{payment.recipient_email || payment.recipient_wallet}</Text>
                  <Text style={styles.paymentMeta}>{payment.chain_id === 84532 ? 'Base' : payment.chain_id === 44787 ? 'Celo' : 'Polygon'} • {payment.token} • {payment.recurring_frequency}</Text></View>
                <View style={[styles.statusBadge, { backgroundColor: payment.recurring_paused ? '#FF950020' : '#34C75920' }]}>
                  <Ionicons name={payment.recurring_paused ? 'pause-circle' : 'play-circle'} size={16} color={payment.recurring_paused ? '#FF9500' : '#34C759'} />
                </View>
              </View>
              <View style={styles.amountRow}><Text style={styles.amount}>${payment.amount}</Text>
                <Text style={styles.nextPayment}>Next: {payment.recurring_next_payment ? new Date(payment.recurring_next_payment).toLocaleDateString() : 'N/A'}</Text></View>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}><Text style={styles.progressLabel}>{payment.recurring_completed_payments || 0} of {payment.recurring_total_payments || 12} payments</Text><Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text></View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: payment.recurring_paused ? '#FF9500' : '#34C759' }]} /></View>
              </View>
              <View style={styles.paymentActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={async () => {
                  await supabase.from('payments').update({ recurring_paused: !payment.recurring_paused }).eq('id', payment.id);
                  fetchPayments();
                }}>
                  <Ionicons name={payment.recurring_paused ? 'play' : 'pause'} size={14} color={payment.recurring_paused ? '#34C759' : '#FF9500'} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: payment.recurring_paused ? '#34C759' : '#FF9500' }]}>{payment.recurring_paused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={async () => {
                  await supabase.from('payments').update({ status: 'cancelled' }).eq('id', payment.id);
                  fetchPayments();
                }}>
                  <Ionicons name="close" size={14} color="#FF3B30" style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Cancel</Text>
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
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  freqChipActive: { backgroundColor: '#000' },
  freqChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  freqChipTextActive: { color: '#FFF' },
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
  paymentCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 8 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipient: { fontSize: 14, fontWeight: '600', color: '#000' },
  paymentMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  amount: { fontSize: 20, fontWeight: '700', color: '#000' },
  nextPayment: { fontSize: 13, color: '#666' },
  progressSection: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#666' },
  progressPercent: { fontSize: 12, fontWeight: '600', color: '#000' },
  progressBar: { height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  paymentActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F5F5F5', borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
});
