import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReceiptScreenProps {
  navigation: any;
  route: any;
}

export default function ReceiptScreen({ navigation, route }: ReceiptScreenProps) {
  const { transaction } = route.params || {};
  
  const handleShare = async () => {
    if (!transaction) return;
    try {
      const message = `Payment Receipt\n\nAmount: $${transaction.amount} ${transaction.token || 'USDC'}\nTo: ${transaction.recipient_email || transaction.recipient_wallet}\nFrom: ${transaction.sender_wallet}\nStatus: ${transaction.status}\nDate: ${new Date(transaction.created_at).toLocaleString()}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return '#34C759';
      case 'pending': return '#FF9500';
      case 'expired': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No transaction data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.successCard}>
        <View style={[styles.statusIcon, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
          <Ionicons 
            name={transaction.status === 'claimed' ? 'checkmark-circle' : 'time'} 
            size={40} 
            color={getStatusColor(transaction.status)} 
          />
        </View>
        <Text style={styles.amountText}>${transaction.amount}</Text>
        <Text style={styles.tokenText}>{transaction.token || 'USDC'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{transaction.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{new Date(transaction.created_at).toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Network</Text>
          <Text style={styles.detailValue}>
            {transaction.chain_id === 84532 ? 'Base' : transaction.chain_id === 44787 ? 'Celo' : 'Polygon'}
          </Text>
        </View>
        {transaction.recipient_email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient Email</Text>
            <Text style={styles.detailValue}>{transaction.recipient_email}</Text>
          </View>
        )}
        {transaction.recipient_wallet && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient Wallet</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{transaction.recipient_wallet}</Text>
          </View>
        )}
        {transaction.memo && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Memo</Text>
            <Text style={styles.detailValue}>{transaction.memo}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 100 },
  successCard: { backgroundColor: '#000', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20 },
  statusIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  amountText: { fontSize: 40, fontWeight: '700', color: '#FFF' },
  tokenText: { fontSize: 16, color: '#888', marginTop: 4 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 16 },
  statusText: { fontSize: 14, fontWeight: '600' },
  detailsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20 },
  detailRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#000', fontWeight: '500' },
  doneBtn: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});