import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Contact {
  id: string;
  name: string;
  address: string;
  type: 'wallet' | 'email' | 'phone';
}

export default function ContactsScreen({ navigation }: any) {
  const { authenticated } = usePrivyContext();
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'John Doe', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8eB1E', type: 'wallet' },
    { id: '2', name: 'Jane Smith', address: 'jane@example.com', type: 'email' },
    { id: '3', name: 'Bob Wilson', address: '+1234567890', type: 'phone' },
  ]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyAddress = async (address: string) => {
    await Clipboard.setStringAsync(address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const handleSendToContact = (contact: Contact) => {
    navigation.navigate('Send', { recipient: contact.address });
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'email': return 'mail-outline';
      case 'phone': return 'call-outline';
      default: return 'wallet-outline';
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[styles.contactItem, { backgroundColor: theme.surface }]}
      onPress={() => handleSendToContact(item)}
    >
      <View style={[styles.contactAvatar, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="person" size={20} color={theme.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.contactAddress, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.background }]}
          onPress={() => handleCopyAddress(item.address)}
        >
          <Ionicons name="copy-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          onPress={() => handleSendToContact(item)}
        >
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Connect wallet to view contacts</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contacts</Text>
        <TouchableOpacity>
          <Ionicons name="person-add-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Ionicons name="search" size={20} color={theme.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search contacts..."
          placeholderTextColor={theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              {searchQuery ? 'Try a different search' : 'Add your first contact'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginVertical: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600' },
  contactAddress: { fontSize: 12, marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: spacing.md },
  emptySubtext: { fontSize: 14, marginTop: spacing.xs },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
});