import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SendScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send</Text>
      <Text style={styles.subtitle}>Send crypto to anyone</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
});
