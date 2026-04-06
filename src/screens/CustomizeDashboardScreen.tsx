import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface DashboardItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
  color: string;
  enabled: boolean;
}

const DEFAULT_ITEMS: DashboardItem[] = [
  { id: 'send', label: 'Send', icon: 'send', screen: 'Send', color: '#000000', enabled: true },
  { id: 'receive', label: 'Receive', icon: 'arrow-down', screen: 'Receive', color: '#000000', enabled: true },
  { id: 'swap', label: 'Swap', icon: 'swap-horizontal', screen: 'Swap', color: '#5856D6', enabled: true },
  { id: 'escrow', label: 'Escrow', icon: 'document-text', screen: 'Escrow', color: '#35D07F', enabled: true },
  { id: 'bulk', label: 'Bulk', icon: 'layers', screen: 'BulkSend', color: '#FF9500', enabled: true },
  { id: 'assets', label: 'Assets', icon: 'wallet', screen: 'Assets', color: '#007AFF', enabled: true },
  { id: 'buy', label: 'Buy', icon: 'cart', screen: 'BuyCrypto', color: '#FF2D55', enabled: true },
  { id: 'split', label: 'Split', icon: 'people', screen: 'SplitBill', color: '#AF52DE', enabled: true },
  { id: 'gifts', label: 'Gifts', icon: 'gift', screen: 'GiftCards', color: '#FF9500', enabled: false },
  { id: 'nfc', label: 'NFC', icon: 'wifi', screen: 'NFCPayments', color: '#34C759', enabled: false },
  { id: 'contacts', label: 'Contacts', icon: 'people-circle', screen: 'Contacts', color: '#007AFF', enabled: false },
  { id: 'history', label: 'History', icon: 'time', screen: 'History', color: '#8E8E93', enabled: false },
];

export default function CustomizeDashboardScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [items, setItems] = useState<DashboardItem[]>(DEFAULT_ITEMS);

  const toggleItem = (id: string) => {
    const enabledCount = items.filter(i => i.enabled).length;
    setItems(items.map(item => {
      if (item.id === id) {
        if (!item.enabled && enabledCount >= 8) {
          Alert.alert('Limit Reached', 'You can only have up to 8 quick actions enabled');
          return item;
        }
        return { ...item, enabled: !item.enabled };
      }
      return item;
    }));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  };

  const enabledItems = items.filter(i => i.enabled);
  const disabledItems = items.filter(i => !i.enabled);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Customize Dashboard</Text>
        <TouchableOpacity onPress={() => Alert.alert('Saved', 'Your dashboard preferences have been saved')}>
          <Ionicons name="checkmark" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
        <Ionicons name="information-circle" size={20} color={theme.textSecondary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Enable up to 8 quick actions that will appear on your home screen
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Enabled ({enabledItems.length}/8)
        </Text>
        <View style={styles.itemsGrid}>
          {enabledItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, { backgroundColor: theme.surface }]}
              onPress={() => toggleItem(item.id)}
            >
              <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.itemLabel, { color: theme.text }]}>{item.label}</Text>
              <View style={[styles.enabledBadge, { backgroundColor: theme.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Available to Add
        </Text>
        <View style={styles.itemsGrid}>
          {disabledItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, { backgroundColor: theme.surface, opacity: 0.6 }]}
              onPress={() => toggleItem(item.id)}
            >
              <View style={[styles.itemIcon, { backgroundColor: theme.border }]}>
                <Ionicons name={item.icon as any} size={24} color={theme.textTertiary} />
              </View>
              <Text style={[styles.itemLabel, { color: theme.textTertiary }]}>{item.label}</Text>
              <Ionicons name="add-circle-outline" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
        <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
            {enabledItems.map((item) => (
              <View key={item.id} style={styles.previewItem}>
                <View style={[styles.previewIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={[styles.resetBtn, { backgroundColor: theme.error + '10' }]}>
        <TouchableOpacity onPress={() => { setItems(DEFAULT_ITEMS); Alert.alert('Reset', 'Dashboard reset to defaults'); }}>
          <Text style={[styles.resetText, { color: theme.error }]}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: borderRadius.md },
  infoText: { flex: 1, fontSize: 13, marginLeft: spacing.sm, lineHeight: 18 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.md },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  itemCard: { width: '30%', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', position: 'relative' },
  itemIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  itemLabel: { fontSize: 12, fontWeight: '500' },
  enabledBadge: { position: 'absolute', top: 8, right: 8, borderRadius: 10 },
  previewCard: { borderRadius: borderRadius.md, padding: spacing.md },
  previewScroll: { gap: spacing.md },
  previewItem: { alignItems: 'center', marginRight: spacing.md },
  previewIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  previewLabel: { fontSize: 10 },
  resetBtn: { marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  resetText: { fontSize: 14, fontWeight: '600' },
  bottomPadding: { height: 100 },
});