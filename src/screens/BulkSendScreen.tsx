import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BulkSendScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [recipients, setRecipients] = useState<{ id: string; address: string; amount: string }[]>([{ id: '1', address: '', amount: '' }]);
  const [token, setToken] = useState('USDC');
  const [network, setNetwork] = useState('Base');

  const addRecipient = () => setRecipients([...recipients, { id: Date.now().toString(), address: '', amount: '' }]);
  const removeRecipient = (id: string) => { if (recipients.length > 1) setRecipients(recipients.filter(r => r.id !== id)); };
  const updateRecipient = (id: string, field: string, value: string) => setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));

  const totalAmount = recipients.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const handleSend = async () => {
    if (!walletAddress || recipients.some(r => !r.address || !r.amount)) {
      Alert.alert('Error', 'Please fill in all recipient addresses and amounts');
      return;
    }
    try {
      const payments = recipients.map(r => ({
        sender_wallet: walletAddress,
        recipient_wallet: r.address,
        amount: parseFloat(r.amount),
        token,
        chain_id: network === 'Base' ? 84532 : network === 'Celo' ? 44787 : 80002,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      const { error } = await supabase.from('payments').insert(payments);
      if (error) throw error;
      Alert.alert('Success', `Sent to ${recipients.length} recipients`);
      setRecipients([{ id: '1', address: '', amount: '' }]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (!authenticated) return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet to bulk send</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.configCard}>
        <Text style={styles.configLabel}>Token</Text>
        <View style={styles.tokenRow}>
          {['USDC', 'USDT'].map(t => (
            <TouchableOpacity key={t} style={[styles.tokenChip, token === t && styles.tokenChipActive]} onPress={() => setToken(t)}>
              <Text style={[styles.tokenChipText, token === t && styles.tokenChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.configLabel, { marginTop: 12 }]}>Network</Text>
        <View style={styles.networkRow}>
          {['Base', 'Celo', 'Polygon'].map(n => (
            <TouchableOpacity key={n} style={[styles.networkChip, network === n && styles.networkChipActive]} onPress={() => setNetwork(n)}>
              <Text style={[styles.networkChipText, network === n && styles.networkChipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addRecipient}>
        <Ionicons name="add-circle-outline" size={20} color="#000" style={{ marginRight: 6 }} />
        <Text style={styles.addBtnText}>Add Recipient</Text>
      </TouchableOpacity>

      {recipients.map((r, i) => (
        <View key={r.id} style={styles.recipientCard}>
          <View style={styles.recipientHeader}>
            <Text style={styles.recipientTitle}>Recipient {i + 1}</Text>
            {recipients.length > 1 && <TouchableOpacity onPress={() => removeRecipient(r.id)}><Ionicons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity>}
          </View>
          <TextInput style={styles.input} value={r.address} onChangeText={t => updateRecipient(r.id, 'address', t)} placeholder="Wallet address" placeholderTextColor="#CCC" autoCapitalize="none" />
          <TextInput style={styles.input} value={r.amount} onChangeText={t => updateRecipient(r.id, 'amount', t)} placeholder="Amount" placeholderTextColor="#CCC" keyboardType="decimal-pad" />
        </View>
      ))}

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Recipients</Text><Text style={styles.summaryValue}>{recipients.length}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total</Text><Text style={[styles.summaryValue, { fontSize: 18, fontWeight: '700' }]}>${totalAmount.toFixed(2)}</Text></View>
      </View>

      <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
        <Ionicons name="paper-plane" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.sendBtnText}>Send to {recipients.length} Recipients</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
  configCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  configLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase' },
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
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed', marginBottom: 16 },
  addBtnText: { fontSize: 14, color: '#000', fontWeight: '600' },
  recipientCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  recipientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recipientTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#000', marginBottom: 8 },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 18, borderRadius: 14 },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 100 },
});
