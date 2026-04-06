import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface NotificationItem {
  id: string;
  type: 'payment' | 'escrow' | 'security' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'payment', title: 'Payment Received', message: 'You received 10 USDC from john@example.com', time: '2 min ago', read: false },
  { id: '2', type: 'escrow', title: 'Escrow Claimed', message: 'Your escrow of 50 USDC has been claimed', time: '1 hour ago', read: false },
  { id: '3', type: 'security', title: 'Login Alert', message: 'New login from iPhone 15 Pro', time: '3 hours ago', read: true },
  { id: '4', type: 'payment', title: 'Payment Sent', message: 'You sent 5 USDC to 0x742d...', time: 'Yesterday', read: true },
  { id: '5', type: 'system', title: 'App Update', message: 'PeysOS v1.0.1 is now available', time: 'Yesterday', read: true },
];

export default function NotificationsScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return 'arrow-down-circle';
      case 'escrow': return 'shield-checkmark';
      case 'security': return 'lock-closed';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'payment': return '#34C759';
      case 'escrow': return '#35D07F';
      case 'security': return '#FF9500';
      case 'system': return '#007AFF';
      default: return theme.primary;
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, { backgroundColor: theme.surface }, !item.read && { borderLeftColor: theme.primary, borderLeftWidth: 3 }]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
        <Ionicons name={getIcon(item.type) as any} size={20} color={getIconColor(item.type)} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.notificationTime, { color: theme.textTertiary }]}>{item.time}</Text>
        </View>
        <Text style={[styles.notificationMessage, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => deleteNotification(item.id)}
      >
        <Ionicons name="close" size={16} color={theme.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Push Notifications</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Email Notifications</Text>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Unread ({unreadCount})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications</Text>
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
  markAllText: { fontSize: 14, fontWeight: '500' },
  settingsCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  settingInfo: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontSize: 16, marginLeft: spacing.md },
  divider: { height: 1, marginVertical: spacing.xs },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
  activeTab: { backgroundColor: '#000', borderRadius: borderRadius.full },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#FFF', fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  notificationItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notificationTitle: { fontSize: 14, fontWeight: '600' },
  notificationTime: { fontSize: 12 },
  notificationMessage: { fontSize: 13, marginTop: 4 },
  deleteBtn: { padding: spacing.xs },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: spacing.md },
});