import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }: any) {
  const { walletAddress, logout, authenticated } = usePrivyContext();
  const { isDarkMode, setDarkMode } = useApp();
  
  const theme = isDarkMode ? colors.dark : colors.light;

  const MenuItem = ({ icon, title, subtitle, onPress, rightElement }: any) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.surface }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={theme.primary} style={{ marginRight: 12 }} />
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />}
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      {authenticated && (
        <View style={[styles.walletCard, { backgroundColor: theme.primary }]}>
          <Text style={[styles.walletLabel, { color: theme.textTertiary }]}>Connected Wallet</Text>
          <Text style={[styles.walletAddress, { color: theme.background === '#000000' ? '#FFF' : '#FFF' }]}>
            {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Appearance</Text>
        <View style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="moon-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>Use dark theme</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Account</Text>
        <MenuItem icon="person-outline" title="Profile" onPress={() => navigation.navigate('Profile')} />
        <MenuItem icon="people-outline" title="Contacts" onPress={() => {}} />
        <MenuItem icon="shield-checkmark-outline" title="Security" subtitle="Biometrics, PIN" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Preferences</Text>
        <MenuItem icon="language-outline" title="Language" subtitle="English" onPress={() => {}} />
        <MenuItem icon="cash-outline" title="Currency" subtitle="USD" onPress={() => {}} />
        <MenuItem icon="notifications-outline" title="Notifications" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Networks</Text>
        <MenuItem icon="wifi-outline" title="Networks" subtitle="Base, Celo, Polygon" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Support</Text>
        <MenuItem icon="help-circle-outline" title="Help Center" onPress={() => {}} />
        <MenuItem icon="document-text-outline" title="Terms of Service" onPress={() => {}} />
        <MenuItem icon="shield-outline" title="Privacy Policy" onPress={() => {}} />
      </View>

      {authenticated && (
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#FF3B30' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Disconnect Wallet</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.version, { color: theme.textTertiary }]}>PeysOS v1.0.0 (Expo)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: 60, paddingBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  walletCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg },
  walletLabel: { fontSize: 12 },
  walletAddress: { fontSize: 14, fontFamily: 'monospace', marginTop: spacing.xs },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16 },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  logoutBtn: { margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, padding: spacing.lg, paddingBottom: 40 },
});