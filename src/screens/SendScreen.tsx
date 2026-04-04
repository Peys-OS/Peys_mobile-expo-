import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function SendScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('Base');
  const [selectedToken, setSelectedToken] = useState('USDC');

  const networks = [
    { id: 'Base', name: 'Base Sepolia', color: '#0056FF' },
    { id: 'Celo', name: 'Celo Alfajores', color: '#35D07F' },
    { id: 'Polygon', name: 'Polygon Amoy', color: '#8247E5' },
  ];

  const handleSend = async () => {
    if (!amount || !recipient) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('payments').insert({
        sender_wallet: walletAddress,
        recipient_email: recipient.includes('@') ? recipient : null,
        recipient_wallet: recipient.includes('@') ? null : recipient,
        amount: parseFloat(amount),
        token: selectedToken,
        chain_id: selectedNetwork === 'Base' ? 84532 : selectedNetwork === 'Celo' ? 44787 : 80002,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Payment created successfully!');
      setAmount('');
      setRecipient('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create payment');
    }
  };

  if (!authenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Connect wallet to send</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountField}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#CCC"
          />
          <Text style={styles.tokenBadge}>{selectedToken}</Text>
        </View>

        <View style={styles.presets}>
          {['5', '10', '25', '50', '100'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.presetBtn, amount === p && styles.presetBtnActive]}
              onPress={() => setAmount(p)}
            >
              <Text style={[styles.presetText, amount === p && styles.presetTextActive]}>${p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Recipient</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Email or wallet address"
          placeholderTextColor="#CCC"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Network</Text>
        <View style={styles.networkRow}>
          {networks.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[styles.networkChip, selectedNetwork === n.id && styles.networkChipActive]}
              onPress={() => setSelectedNetwork(n.id)}
            >
              <View style={[styles.networkDot, { backgroundColor: n.color }]} />
              <Text style={[styles.networkText, selectedNetwork === n.id && styles.networkTextActive]}>{n.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendBtnText}>Send {amount || '0'} {selectedToken}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 16 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  currencySymbol: { fontSize: 28, fontWeight: '700', color: '#000', marginRight: 8 },
  amountField: { flex: 1, fontSize: 28, fontWeight: '700', color: '#000' },
  tokenBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: 14, fontWeight: '600', color: '#666' },
  presets: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFF' },
  presetBtnActive: { backgroundColor: '#000' },
  presetText: { fontSize: 14, fontWeight: '600', color: '#666' },
  presetTextActive: { color: '#FFF' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 16, color: '#000' },
  networkRow: { gap: 8 },
  networkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  networkChipActive: { backgroundColor: '#000', borderColor: '#000' },
  networkDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  networkText: { fontSize: 14, color: '#666' },
  networkTextActive: { color: '#FFF' },
  sendBtn: { backgroundColor: '#000', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 32 },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, color: '#666', textAlign: 'center', marginTop: 100 },
});
