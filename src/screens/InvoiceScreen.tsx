import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface InvoiceItem { id: string; description: string; quantity: number; rate: number; }

export default function InvoiceScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const [showCreate, setShowCreate] = useState(false);
  const [client, setClient] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, rate: 0 }]);
  const [dueDate, setDueDate] = useState('');

  const total = items.reduce((s, i) => s + (i.quantity * i.rate), 0);
  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleCreate = async () => {
    if (!client || !dueDate) { Alert.alert('Error', 'Fill in client and due date'); return; }
    try {
      await supabase.from('payments').insert({
        sender_wallet: walletAddress, invoice_client: client, amount: total, token: 'USDC',
        status: 'draft', chain_id: 84532, expires_at: new Date(dueDate).toISOString(),
        is_invoice: true, invoice_items: JSON.stringify(items), invoice_due_date: new Date(dueDate).toISOString(),
      });
      Alert.alert('Success', 'Invoice created');
      setShowCreate(false); setClient(''); setDueDate(''); setItems([{ id: '1', description: '', quantity: 1, rate: 0 }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (!authenticated) return <View style={styles.container}><Text style={styles.emptyText}>Connect wallet</Text></View>;

  if (showCreate) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
          <Text style={styles.headerTitle}>New Invoice</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.form}>
          <TextInput style={styles.input} value={client} onChangeText={setClient} placeholder="Client name or email" placeholderTextColor="#CCC" />
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor="#CCC" />
          {items.map((item, i) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}><Text style={styles.itemTitle}>Item {i + 1}</Text>
                {items.length > 1 && <TouchableOpacity onPress={() => removeItem(item.id)}><Ionicons name="close-circle" size={18} color="#FF3B30" /></TouchableOpacity>}
              </View>
              <TextInput style={styles.itemInput} value={item.description} onChangeText={t => updateItem(item.id, 'description', t)} placeholder="Description" placeholderTextColor="#CCC" />
              <View style={styles.itemRow}>
                <View style={styles.itemCol}><Text style={styles.itemColLabel}>Qty</Text>
                  <TextInput style={styles.itemColInput} value={String(item.quantity)} onChangeText={t => updateItem(item.id, 'quantity', parseInt(t) || 0)} keyboardType="number-pad" /></View>
                <View style={styles.itemCol}><Text style={styles.itemColLabel}>Rate</Text>
                  <TextInput style={styles.itemColInput} value={String(item.rate)} onChangeText={t => updateItem(item.id, 'rate', parseFloat(t) || 0)} keyboardType="decimal-pad" /></View>
                <View style={styles.itemCol}><Text style={styles.itemColLabel}>Total</Text><Text style={styles.itemColValue}>${(item.quantity * item.rate).toFixed(2)}</Text></View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addItemBtn} onPress={addItem}><Ionicons name="add-circle-outline" size={16} color="#000" style={{ marginRight: 6 }} /><Text style={styles.addItemText}>Add Item</Text></TouchableOpacity>
          <View style={styles.invoiceTotal}><Text style={styles.invoiceTotalLabel}>Total</Text><Text style={styles.invoiceTotalValue}>${total.toFixed(2)}</Text></View>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}><Text style={styles.createBtnText}>Create Invoice</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.createCard} onPress={() => setShowCreate(true)}>
        <Ionicons name="document-text-outline" size={32} color="#000" />
        <Text style={styles.createTitle}>Create New Invoice</Text>
        <Text style={styles.createSubtext}>Generate professional invoices</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Your Invoices</Text>
      <View style={styles.emptyState}><Ionicons name="document-outline" size={48} color="#CCC" /><Text style={styles.emptyText}>No invoices yet</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  form: { padding: 20 },
  input: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 14, color: '#000', marginBottom: 12 },
  itemCard: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#000' },
  itemInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 13, color: '#000', marginBottom: 8, backgroundColor: '#FFF' },
  itemRow: { flexDirection: 'row', gap: 8 },
  itemCol: { flex: 1 },
  itemColLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  itemColInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 8, fontSize: 13, color: '#000', backgroundColor: '#FFF' },
  itemColValue: { fontSize: 13, fontWeight: '600', color: '#000', padding: 8 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, borderStyle: 'dashed', marginBottom: 16 },
  addItemText: { fontSize: 14, color: '#000', fontWeight: '500' },
  invoiceTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0', marginBottom: 16 },
  invoiceTotalLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  invoiceTotalValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  formActions: { flexDirection: 'row', gap: 12 },
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
});
