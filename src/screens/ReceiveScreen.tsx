import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReceiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receive</Text>
      <Text style={styles.subtitle}>Receive crypto from anyone</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
});
