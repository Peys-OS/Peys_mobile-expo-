import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  created_at: string;
}

export default function AddressLabelsScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const fetchAddresses = async () => {
    if (!walletAddress) return;
    try {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_wallet', walletAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (!error && data) setAddresses(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAddresses(); }, [walletAddress]);

  const addAddress = async () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      Alert.alert('Error', 'Please enter both label and address');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
      Alert.alert('Error', 'Invalid wallet address');
      return;
    }

    try {
      const { error } = await supabase.from('saved_addresses').insert({
        user_wallet: walletAddress.toLowerCase(),
        label: newLabel.trim(),
        address: newAddress.trim().toLowerCase(),
      });

      if (error) throw error;
      setShowAddModal(false);
      setNewLabel('');
      setNewAddress('');
      fetchAddresses();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const deleteAddress = async (id: string) => {
    Alert.alert('Delete', 'Remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('saved_addresses').delete().eq('id', id);
        fetchAddresses();
      }},
    ]);
  };

  const useAddress = (address: string) => {
    navigation.navigate('Send', { recipient: address });
  };

  const renderItem = ({ item }: { item: SavedAddress }) => (
    <TouchableOpacity 
      style={[styles.addressCard, { backgroundColor: theme.surface }]}
      onPress={() => useAddress(item.address)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Ionicons name="wallet" size={18} color="#FFF" />
      </View>
      <View style={styles.addressInfo}>
        <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>
        <Text style={[styles.address, { color: theme.textTertiary }]} numberOfLines={1}>
          {item.address.slice(0, 6)}...{item.address.slice(-4)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteAddress(item.id)}>
        <Ionicons name="trash-outline" size={18} color={theme.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Addresses</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No saved addresses</Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
            Save frequently used addresses for quick access
          </Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Label (e.g., Mom, Rent)"
              placeholderTextColor={theme.textTertiary}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="0x..."
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: theme.background }]}
                onPress={() => { setShowAddModal(false); setNewLabel(''); setNewAddress(''); }}
              >
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={addAddress}
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
  addressCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  addressInfo: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600' },
  address: { fontSize: 12, marginTop: 2 },
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