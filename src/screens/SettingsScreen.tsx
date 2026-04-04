import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }: any) {
  const { walletAddress, logout, authenticated } = usePrivyContext();

  const MenuItem = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#000" style={{ marginRight: 12 }} />
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {authenticated && (
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Connected Wallet</Text>
          <Text style={styles.walletAddress}>{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuItem icon="person-outline" title="Profile" onPress={() => {}} />
        <MenuItem icon="people-outline" title="Contacts" onPress={() => {}} />
        <MenuItem icon="lock-closed-outline" title="Security" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <MenuItem icon="language-outline" title="Language" subtitle="English" onPress={() => {}} />
        <MenuItem icon="swap-horizontal-outline" title="Currency" subtitle="USD" onPress={() => {}} />
        <MenuItem icon="notifications-outline" title="Notifications" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Networks</Text>
        <MenuItem icon="swap-horizontal-outline" title="Networks" subtitle="3 networks" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <MenuItem icon="help-circle-outline" title="Help Center" onPress={() => {}} />
        <MenuItem icon="document-text-outline" title="Terms of Service" onPress={() => {}} />
      </View>

      {authenticated && (
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Disconnect Wallet</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.version}>PeysOS v1.0.0 (Expo)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  walletCard: { backgroundColor: '#000', margin: 20, borderRadius: 16, padding: 20 },
  walletLabel: { color: '#888', fontSize: 12 },
  walletAddress: { color: '#FFF', fontSize: 14, fontFamily: 'monospace', marginTop: 4 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: '#FFF', paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, color: '#000' },
  menuSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  logoutBtn: { margin: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, padding: 20, paddingBottom: 40 },
});
