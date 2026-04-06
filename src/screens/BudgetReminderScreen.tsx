import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
}

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'transport', name: 'Transportation', icon: 'car' },
  { id: 'shopping', name: 'Shopping', icon: 'bag' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller' },
  { id: 'utilities', name: 'Utilities', icon: 'flash' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

export default function BudgetReminderScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [budgets, setBudgets] = useState<Budget[]>([
    { id: '1', category: 'food', limit: 200, spent: 85, period: 'monthly' },
    { id: '2', category: 'transport', limit: 100, spent: 45, period: 'monthly' },
    { id: '3', category: 'shopping', limit: 300, spent: 180, period: 'monthly' },
  ]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('monthly');

  const addBudget = () => {
    if (!newCategory || !newLimit) {
      Alert.alert('Error', 'Please select a category and enter a limit');
      return;
    }
    const budget: Budget = {
      id: Date.now().toString(),
      category: newCategory,
      limit: parseFloat(newLimit),
      spent: 0,
      period: selectedPeriod,
    };
    setBudgets([...budgets, budget]);
    setShowAddBudget(false);
    setNewCategory('');
    setNewLimit('');
  };

  const getCategoryInfo = (catId: string) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];

  const getTotalSpent = () => budgets.reduce((sum, b) => sum + b.spent, 0);
  const getTotalLimit = () => budgets.reduce((sum, b) => sum + b.limit, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Budget & Reminders</Text>
        <TouchableOpacity onPress={() => setShowAddBudget(true)}>
          <Ionicons name="add" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.overviewCard, { backgroundColor: theme.primary }]}>
        <Text style={[styles.overviewLabel, { color: '#888' }]}>Total Spent This Month</Text>
        <Text style={styles.overviewAmount}>${getTotalSpent().toFixed(2)}</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min((getTotalSpent() / getTotalLimit()) * 100, 100)}%` }
            ]} 
          />
        </View>
        <Text style={[styles.overviewSubtext, { color: '#888' }]}>
          ${(getTotalLimit() - getTotalSpent()).toFixed(2)} remaining of ${getTotalLimit()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Budgets</Text>
        {budgets.map(budget => {
          const cat = getCategoryInfo(budget.category);
          const percent = (budget.spent / budget.limit) * 100;
          return (
            <View key={budget.id} style={[styles.budgetCard, { backgroundColor: theme.surface }]}>
              <View style={styles.budgetHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: theme.background }]}>
                  <Ionicons name={cat.icon as any} size={18} color={theme.primary} />
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                  <Text style={[styles.periodText, { color: theme.textTertiary }]}>
                    {budget.period === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Text>
                </View>
                <Text style={[styles.budgetAmount, { color: theme.text }]}>
                  ${budget.spent.toFixed(0)} / ${budget.limit}
                </Text>
              </View>
              <View style={styles.budgetProgress}>
                <View 
                  style={[
                    styles.budgetProgressFill, 
                    { 
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: percent > 90 ? theme.error : percent > 75 ? theme.warning : theme.success
                    }
                  ]} 
                />
              </View>
              {percent > 90 && (
                <View style={[styles.warningBadge, { backgroundColor: theme.error + '20' }]}>
                  <Ionicons name="warning" size={12} color={theme.error} />
                  <Text style={[styles.warningText, { color: theme.error }]}>Near limit</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminders</Text>
        <TouchableOpacity style={[styles.reminderCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.reminderIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="notifications" size={18} color="#34C759" />
          </View>
          <View style={styles.reminderInfo}>
            <Text style={[styles.reminderTitle, { color: theme.text }]}>Weekly spending report</Text>
            <Text style={[styles.reminderSubtitle, { color: theme.textTertiary }]}>Every Sunday at 9am</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.reminderCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.reminderIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="alert-circle" size={18} color="#FF9500" />
          </View>
          <View style={styles.reminderInfo}>
            <Text style={[styles.reminderTitle, { color: theme.text }]}>Budget exceeded alert</Text>
            <Text style={[styles.reminderSubtitle, { color: theme.textTertiary }]}>When spending exceeds 90%</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      {showAddBudget && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Budget</Text>
            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.background },
                    newCategory === cat.id && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setNewCategory(cat.id)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: newCategory === cat.id ? '#FFF' : theme.text }
                  ]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: theme.text }]}>Limit</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={newLimit}
              onChangeText={setNewLimit}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
            <View style={styles.periodToggle}>
              <TouchableOpacity
                style={[styles.periodBtn, selectedPeriod === 'weekly' && { backgroundColor: theme.primary }]}
                onPress={() => setSelectedPeriod('weekly')}
              >
                <Text style={[styles.periodText, { color: selectedPeriod === 'weekly' ? '#FFF' : theme.textSecondary }]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, selectedPeriod === 'monthly' && { backgroundColor: theme.primary }]}
                onPress={() => setSelectedPeriod('monthly')}
              >
                <Text style={[styles.periodText, { color: selectedPeriod === 'monthly' ? '#FFF' : theme.textSecondary }]}>Monthly</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: theme.background }]}
                onPress={() => { setShowAddBudget(false); setNewCategory(''); setNewLimit(''); }}
              >
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={addBudget}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  overviewCard: { margin: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg },
  overviewLabel: { fontSize: 12 },
  overviewAmount: { fontSize: 36, fontWeight: '700', color: '#FFF', marginVertical: spacing.xs },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  overviewSubtext: { fontSize: 12, marginTop: spacing.sm },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  budgetCard: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  budgetHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  budgetInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  periodText: { fontSize: 11, marginTop: 2 },
  budgetAmount: { fontSize: 14, fontWeight: '600' },
  budgetProgress: { height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 2 },
  warningBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start', marginTop: spacing.sm },
  warningText: { fontSize: 10, fontWeight: '600', marginLeft: 4 },
  reminderCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  reminderIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600' },
  reminderSubtitle: { fontSize: 12, marginTop: 2 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modal: { borderRadius: borderRadius.lg, padding: spacing.lg, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  categoryPicker: { marginBottom: spacing.md },
  categoryChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  input: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, marginBottom: spacing.md },
  periodToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  periodBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  bottomPadding: { height: 100 },
});