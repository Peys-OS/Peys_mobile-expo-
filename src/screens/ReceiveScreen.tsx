import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { Ionicons } from '@expo/vector-icons';

export default function ReceiveScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();

  if (!authenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Connect wallet to receive</Text>
      </View>
    );
  }

  const handleCopy = () => {
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrCard}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color="#000" />
          </View>
          <Text style={styles.qrLabel}>Your Wallet Address</Text>
          <Text style={styles.address}>{walletAddress}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.actionText}>Copy Address</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#666" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Share your wallet address or QR code to receive payments. Only send {walletAddress.slice(0, 2)}... compatible tokens to this address.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 20 },
  qrPlaceholder: { width: 160, height: 160, backgroundColor: '#F5F5F5', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  qrLabel: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  address: { fontSize: 12, color: '#666', fontFamily: 'monospace', textAlign: 'center' },
  actions: { gap: 12, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#000' },
  infoCard: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  title: { fontSize: 18, color: '#666', textAlign: 'center', marginTop: 100 },
});
