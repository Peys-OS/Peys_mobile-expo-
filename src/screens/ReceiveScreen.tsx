import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ReceiveScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const { isDarkMode } = useApp();
  
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send me tokens to my wallet address: ${walletAddress}`,
        title: 'My Wallet Address',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Connect wallet to receive</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Receive</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.qrCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.qrContainer, { backgroundColor: theme.background }]}>
            {walletAddress ? (
              <QRCode
                value={walletAddress}
                size={180}
                color={theme.text}
                backgroundColor={theme.background}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="wallet-outline" size={40} color={theme.textTertiary} />
                <Text style={[styles.qrPlaceholderText, { color: theme.textTertiary }]}>
                  No wallet yet
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.qrLabel, { color: theme.text }]}>Your Wallet Address</Text>
          <Text style={[styles.address, { color: theme.textSecondary }]} selectable>
            {walletAddress || 'No wallet connected'}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={handleCopy}
            disabled={!walletAddress}
          >
            <Ionicons name="copy-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionText, { color: theme.text }]}>Copy Address</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleShare}
            disabled={!walletAddress}
          >
            <Ionicons name="share-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="information-circle" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {walletAddress 
              ? `Share your wallet address or QR code to receive payments. Only send ${walletAddress.slice(0, 2).toUpperCase()} compatible tokens to this address.`
              : 'Connect your wallet to receive payments.'
            }
          </Text>
        </View>

        <View style={styles.networksSection}>
          <Text style={[styles.networksTitle, { color: theme.textSecondary }]}>Supported Networks</Text>
          <View style={styles.networksList}>
            {['Base Sepolia', 'Celo Alfajores', 'Polygon Amoy'].map(network => (
              <View key={network} style={[styles.networkChip, { backgroundColor: theme.surface }]}>
                <Text style={[styles.networkChipText, { color: theme.textSecondary }]}>{network}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: spacing.lg },
  qrCard: { borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  qrContainer: { width: 180, height: 180, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, padding: spacing.sm },
  qrPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  qrPlaceholderText: { fontSize: 12, marginTop: spacing.xs },
  qrLabel: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  address: { fontSize: 12, fontFamily: 'monospace', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1 },
  actionText: { fontSize: 14, fontWeight: '600' },
  infoCard: { flexDirection: 'row', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  networksSection: { marginTop: spacing.sm },
  networksTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  networksList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  networkChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  networkChipText: { fontSize: 12 },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
});