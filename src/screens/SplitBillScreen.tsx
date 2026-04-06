import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Participant {
  id: string;
  name: string;
  email?: string;
  paid: boolean;
  amount: number;
}

export default function SplitBillScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

  const addParticipant = () => {
    if (!newName.trim()) return;
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: newName.trim(),
      paid: false,
      amount: 0,
    };
    setParticipants([...participants, newParticipant]);
    setNewName('');
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const calculateSplit = () => {
    const amount = parseFloat(totalAmount) || 0;
    if (participants.length === 0) return;
    
    if (splitType === 'equal') {
      const share = amount / participants.length;
      setParticipants(participants.map(p => ({ ...p, amount: share })));
    }
  };

  const handleCreatePayment = async () => {
    if (!totalAmount || participants.length < 2) {
      Alert.alert('Error', 'Please enter an amount and add at least 2 participants');
      return;
    }

    Alert.alert(
      'Split Bill Created',
      `A payment request for $${totalAmount} has been created. Each participant owes $${(parseFloat(totalAmount) / participants.length).toFixed(2)}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const shareAmount = parseFloat(totalAmount) || 0;
  const perPerson = participants.length > 0 ? shareAmount / participants.length : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Split Bill</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.text }]}>Total Amount</Text>
        <View style={[styles.amountInput, { backgroundColor: theme.surface }]}>
          <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
          <TextInput
            style={[styles.amountField, { color: theme.text }]}
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
            onChange={calculateSplit}
          />
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Dinner, Rent, Trip..."
          placeholderTextColor={theme.textTertiary}
        />

        <View style={styles.splitTypeRow}>
          <TouchableOpacity
            style={[
              styles.splitTypeBtn,
              { backgroundColor: theme.surface },
              splitType === 'equal' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSplitType('equal')}
          >
            <Text style={[
              styles.splitTypeText,
              { color: splitType === 'equal' ? '#FFF' : theme.textSecondary }
            ]}>Equal Split</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.splitTypeBtn,
              { backgroundColor: theme.surface },
              splitType === 'custom' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSplitType('custom')}
          >
            <Text style={[
              styles.splitTypeText,
              { color: splitType === 'custom' ? '#FFF' : theme.textSecondary }
            ]}>Custom</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Participants</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, flex: 1 }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Add name or email"
            placeholderTextColor={theme.textTertiary}
            onSubmitEditing={addParticipant}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={addParticipant}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {participants.length > 0 && (
          <View style={[styles.participantsList, { backgroundColor: theme.surface }]}>
            {participants.map((p, index) => (
              <View key={p.id} style={styles.participantRow}>
                <View style={styles.participantInfo}>
                  <Text style={[styles.participantName, { color: theme.text }]}>{p.name}</Text>
                  <Text style={[styles.participantAmount, { color: theme.textSecondary }]}>
                    ${splitType === 'equal' ? perPerson.toFixed(2) : p.amount.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeParticipant(p.id)}>
                  <Ionicons name="close-circle" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {participants.length >= 2 && (
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>${totalAmount || '0.00'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Participants</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{participants.length}</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 12 }]}>
              <Text style={[styles.summaryLabel, { color: theme.text, fontWeight: '600' }]}>Each Pays</Text>
              <Text style={[styles.summaryValue, { color: theme.primary, fontWeight: '700', fontSize: 18 }]}>
                ${perPerson.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme.primary }]}
          onPress={handleCreatePayment}
          disabled={participants.length < 2}
        >
          <Text style={styles.createBtnText}>Create Payment Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md },
  currencySymbol: { fontSize: 28, fontWeight: '700', marginRight: spacing.xs },
  amountField: { flex: 1, fontSize: 28, fontWeight: '700' },
  input: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16 },
  splitTypeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  splitTypeBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  splitTypeText: { fontSize: 14, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addBtn: { width: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  participantsList: { borderRadius: borderRadius.md, marginTop: spacing.sm, padding: spacing.sm },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 14, fontWeight: '500' },
  participantAmount: { fontSize: 12, marginTop: 2 },
  summaryCard: { borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.lg },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  createBtn: { padding: spacing.md + 2, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  bottomPadding: { height: 100 },
});