import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface PaymentTemplate {
  id: string;
  name: string;
  amount: number;
  token: string;
  recipient: string;
  network: string;
  chain_id: number;
  memo?: string;
  created_at: string;
}

const NETWORKS = [
  { id: 'base', name: 'Base', chainId: 84532 },
  { id: 'celo', name: 'Celo', chainId: 44787 },
  { id: 'polygon', name: 'Polygon', chainId: 80002 },
];

export default function PaymentTemplatesScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [templates, setTemplates] = useState<PaymentTemplate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    amount: '',
    token: 'USDC',
    recipient: '',
    network: 'base',
    memo: '',
  });

  const fetchTemplates = async () => {
    if (!walletAddress) return;
    try {
      const { data, error } = await supabase
        .from('payment_templates')
        .select('*')
        .eq('user_wallet', walletAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (!error && data) setTemplates(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTemplates(); }, [walletAddress]);

  const addTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.amount || !newTemplate.recipient.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const network = NETWORKS.find(n => n.id === newTemplate.network);

    try {
      await supabase.from('payment_templates').insert({
        user_wallet: walletAddress.toLowerCase(),
        name: newTemplate.name.trim(),
        amount: parseFloat(newTemplate.amount),
        token: newTemplate.token,
        recipient: newTemplate.recipient.trim().toLowerCase(),
        network: newTemplate.network,
        chain_id: network?.chainId || 84532,
        memo: newTemplate.memo.trim() || null,
      });

      setShowAddModal(false);
      setNewTemplate({ name: '', amount: '', token: 'USDC', recipient: '', network: 'base', memo: '' });
      fetchTemplates();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const deleteTemplate = async (id: string) => {
    Alert.alert('Delete', 'Remove this template?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('payment_templates').delete().eq('id', id);
        fetchTemplates();
      }},
    ]);
  };

  const useTemplate = (template: PaymentTemplate) => {
    navigation.navigate('Send', { 
      recipient: template.recipient,
      amount: template.amount.toString(),
      network: template.network,
      memo: template.memo,
    });
  };

  const renderItem = ({ item }: { item: PaymentTemplate }) => {
    const network = NETWORKS.find(n => n.id === item.network);
    return (
      <TouchableOpacity 
        style={[styles.templateCard, { backgroundColor: theme.surface }]}
        onPress={() => useTemplate(item)}
      >
        <View style={styles.templateHeader}>
          <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
          <TouchableOpacity onPress={() => deleteTemplate(item.id)}>
            <Ionicons name="trash-outline" size={18} color={theme.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.templateDetails}>
          <Text style={[styles.templateAmount, { color: theme.primary }]}>${item.amount} {item.token}</Text>
          <Text style={[styles.templateRecipient, { color: theme.textTertiary }]} numberOfLines={1}>
            {item.recipient.slice(0, 6)}...{item.recipient.slice(-4)}
          </Text>
        </View>
        <View style={[styles.networkBadge, { backgroundColor: theme.background }]}>
          <Text style={[styles.networkText, { color: theme.textSecondary }]}>{network?.name || item.network}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Payment Templates</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No templates</Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
            Save frequently used payment configurations
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Template</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newTemplate.name}
              onChangeText={(t) => setNewTemplate({ ...newTemplate, name: t })}
              placeholder="Template Name *"
              placeholderTextColor={theme.textTertiary}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newTemplate.amount}
              onChangeText={(t) => setNewTemplate({ ...newTemplate, amount: t })}
              placeholder="Amount *"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newTemplate.recipient}
              onChangeText={(t) => setNewTemplate({ ...newTemplate, recipient: t })}
              placeholder="Recipient Address *"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newTemplate.memo}
              onChangeText={(t) => setNewTemplate({ ...newTemplate, memo: t })}
              placeholder="Memo (Optional)"
              placeholderTextColor={theme.textTertiary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: theme.background }]}
                onPress={() => { setShowAddModal(false); setNewTemplate({ name: '', amount: '', token: 'USDC', recipient: '', network: 'base', memo: '' }); }}
              >
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={addTemplate}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  list: { padding: spacing.lg },
  templateCard: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  templateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  templateName: { fontSize: 16, fontWeight: '600' },
  templateDetails: { marginTop: spacing.sm },
  templateAmount: { fontSize: 18, fontWeight: '700' },
  templateRecipient: { fontSize: 12, marginTop: 2 },
  networkBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, marginTop: spacing.sm },
  networkText: { fontSize: 10, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modal: { borderRadius: borderRadius.lg, padding: spacing.lg, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  input: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});