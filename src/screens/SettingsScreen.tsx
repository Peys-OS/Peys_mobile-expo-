import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';

export default function SettingsScreen() {
  const { logout, walletAddress } = usePrivyContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.address}>{walletAddress}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Disconnect Wallet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 16 },
  address: { fontSize: 12, color: '#666', fontFamily: 'monospace', marginBottom: 32 },
  logoutBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF3B30', padding: 16, borderRadius: 12 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
