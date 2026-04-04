import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface BillCategory { id: string; name: string; icon: any; color: string; providers: { id: string; name: string; minAmount: number }[]; }

const billCategories: BillCategory[] = [
  { id: 'phone', name: 'Phone', icon: 'phone-portrait', color: '#007AFF', providers: [{ id: 'mtn', name: 'MTN', minAmount: 1 }, { id: 'airtel', name: 'Airtel', minAmount: 1 }] },
  { id: 'tv', name: 'TV', icon: 'tv', color: '#FF9500', providers: [{ id: 'dstv', name: 'DSTV', minAmount: 10 }, { id: 'gotv', name: 'GOtv', minAmount: 5 }] },
  { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#FFD60A', providers: [{ id: 'ikeja', name: 'Ikeja Electric', minAmount: 5 }] },
  { id: 'internet', name: 'Internet', icon: 'wifi', color: '#34C759', providers: [{ id: 'spectranet', name: 'Spectranet', minAmount: 10 }] },
  { id: 'water', name: 'Water', icon: 'water', color: '#5AC8FA', providers: [{ id: 'lagos', name: 'Lagos Water', minAmount: 3 }] },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller', color: '#AF52DE', providers: [{ id: 'psn', name: 'PlayStation', minAmount: 5 }, { id: 'steam', name: 'Steam', minAmount: 5 }] },
];

export default function BillsScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [meterNumber, setMeterNumber] = useState('');

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    try {
      await supabase.from('payments').insert({
        sender_wallet: walletAddress, amount: parseFloat(amount), token: 'USDC',
        status: 'pending', chain_id: 84532, is_bill: true,
        bill_category: selectedCategory?.name, bill_provider: selectedProvider?.name,
        bill_meter_number: meterNumber, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      Alert.alert('Success', `Paid ${amount} to ${selectedProvider?.name}`);
      setSelectedCategory(null); setSelectedProvider(null); setAmount(''); setMeterNumber('');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (!authenticated) return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet to pay bills</Text></View>;

  if (selectedCategory && selectedProvider) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedProvider(null)}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Pay {selectedCategory.name}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.payCard}>
          <View style={[styles.providerIcon, { backgroundColor: selectedCategory.color + '20' }]}>
            <Ionicons name={selectedCategory.icon as any} size={32} color={selectedCategory.color} />
          </View>
          <Text style={styles.providerName}>{selectedProvider.name}</Text>
          <Text style={styles.providerCategory}>{selectedCategory.name}</Text>
        </View>
        {['electricity', 'water'].includes(selectedCategory.id) && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meter Number</Text>
            <TextInput style={styles.input} value={meterNumber} onChangeText={setMeterNumber} placeholder="Enter meter number" placeholderTextColor="#CCC" keyboardType="number-pad" />
          </View>
        )}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput style={styles.amountField} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#CCC" keyboardType="decimal-pad" />
          </View>
          <Text style={styles.minAmount}>Minimum: ${selectedProvider.minAmount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Amount</Text><Text style={styles.summaryValue}>${amount || '0.00'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Fee</Text><Text style={styles.summaryValue}>$0.50</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>${(parseFloat(amount) || 0) + 0.50}</Text></View>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
          <Ionicons name="card-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.payBtnText}>Pay ${(parseFloat(amount) || 0) + 0.50}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (selectedCategory) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategory.name}</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.sectionTitle}>Select Provider</Text>
        {selectedCategory.providers.map(provider => (
          <TouchableOpacity key={provider.id} style={styles.providerCard} onPress={() => setSelectedProvider(provider)}>
            <View style={[styles.providerIconSmall, { backgroundColor: selectedCategory.color + '20' }]}>
              <Ionicons name={selectedCategory.icon as any} size={24} color={selectedCategory.color} />
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerMin}>Min: ${provider.minAmount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Bills</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.sectionTitle}>Select Category</Text>
      <View style={styles.grid}>
        {billCategories.map(category => (
          <TouchableOpacity key={category.id} style={styles.categoryCard} onPress={() => setSelectedCategory(category)}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon as any} size={28} color={category.color} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: 16, paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  categoryCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 20, alignItems: 'center' },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#000' },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 8 },
  providerIconSmall: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '600', color: '#000' },
  providerMin: { fontSize: 12, color: '#666', marginTop: 2 },
  payCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', margin: 20 },
  providerIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#000' },
  providerCategory: { fontSize: 14, color: '#666', marginTop: 2 },
  inputGroup: { marginBottom: 16, paddingHorizontal: 20 },
  inputLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#000' },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12 },
  currencySymbol: { fontSize: 28, fontWeight: '700', color: '#000', marginRight: 8 },
  amountField: { flex: 1, fontSize: 28, fontWeight: '700', color: '#000' },
  minAmount: { fontSize: 12, color: '#999', marginTop: 4 },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 18, borderRadius: 14, marginHorizontal: 20 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 100 },
});
