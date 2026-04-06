import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
  const { user, walletAddress, authenticated, logout } = usePrivyContext();
  const { isDarkMode, totalBalanceUSD, transactions } = useApp();
  
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  };

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

  const linkedAccounts = user?.linked_accounts || [];
  const emailAccount = linkedAccounts.find((a: any) => a.type === 'email');
  const phoneAccount = linkedAccounts.find((a: any) => a.type === 'phone');
  const emailAddress = (emailAccount as any)?.address || 'Not connected';
  const phoneNumber = (phoneAccount as any)?.address || 'Not connected';

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Connect wallet to view profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.primary }]}>
        <View style={[styles.avatarContainer, { backgroundColor: isDarkMode ? '#333' : 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="person" size={40} color="#FFF" />
        </View>
        <Text style={[styles.walletAddress, { color: theme.background === '#000000' ? '#FFF' : '#FFF' }]}>
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </Text>
        <TouchableOpacity onPress={handleCopyAddress} style={styles.copyBtn}>
          <Ionicons name="copy-outline" size={16} color="#FFF" />
          <Text style={styles.copyBtnText}>Copy</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Total Balance</Text>
        <Text style={[styles.balanceAmount, { color: theme.text }]}>${totalBalanceUSD.toFixed(2)}</Text>
        <Text style={[styles.txCount, { color: theme.textTertiary }]}>{transactions.length} transactions</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Account Info</Text>
        <View style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="mail-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Email</Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
              {emailAddress}
            </Text>
          </View>
        </View>
        <View style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="call-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Phone</Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
              {phoneNumber}
            </Text>
          </View>
        </View>
        <View style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="wallet-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Wallet Type</Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>Embedded Wallet</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Preferences</Text>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="notifications-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="language-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Language</Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>English</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="cash-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Currency</Text>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>USD</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#FF3B30' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Disconnect Wallet</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.textTertiary }]}>PeysOS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  profileCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  walletAddress: { fontSize: 16, fontWeight: '600', fontFamily: 'monospace', marginBottom: spacing.xs },
  copyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.full },
  copyBtnText: { color: '#FFF', fontSize: 12, marginLeft: 4 },
  balanceCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 28, fontWeight: '700', marginVertical: spacing.xs },
  txCount: { fontSize: 12 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16 },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  logoutBtn: { margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
});