import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FF9500', keywords: ['restaurant', 'food', 'cafe', 'coffee', 'uber eats', 'doordash'] },
  { id: 'transport', name: 'Transportation', icon: 'car', color: '#007AFF', keywords: ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit'] },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#FF2D55', keywords: ['amazon', 'ebay', 'walmart', 'target', 'shop'] },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#5856D6', keywords: ['netflix', 'spotify', 'hulu', 'disney', 'game'] },
  { id: 'utilities', name: 'Utilities', icon: 'flash', color: '#34C759', keywords: ['electric', 'water', 'internet', 'phone', 'utility'] },
  { id: 'income', name: 'Income', icon: 'arrow-down', color: '#00C7BE', keywords: ['salary', 'payment', 'deposit', 'received'] },
  { id: 'crypto', name: 'Crypto', icon: 'logo-bitcoin', color: '#F7931A', keywords: ['crypto', 'eth', 'btc', 'transfer'] },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#8E8E93', keywords: [] },
];

interface TransactionCategory {
  transactionId: string;
  categoryId: string;
}

export default function TransactionCategoriesScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [transactions, setTransactions] = useState<TransactionCategory[]>([
    { transactionId: 'tx1', categoryId: 'food' },
    { transactionId: 'tx2', categoryId: 'transport' },
    { transactionId: 'tx3', categoryId: 'shopping' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryById = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  const getCategoryCount = (categoryId: string) => 
    transactions.filter(t => t.categoryId === categoryId).length;

  const getTotalByCategory = (categoryId: string) => {
    const count = getCategoryCount(categoryId);
    const category = getCategoryById(categoryId);
    return { count, category };
  };

  const totalTransactions = transactions.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.overviewTitle, { color: theme.text }]}>Spending by Category</Text>
        <View style={styles.overviewStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{totalTransactions}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.success }]}>{CATEGORIES.length - 1}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Categories</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>All Categories</Text>
        {CATEGORIES.map(category => {
          const stats = getTotalByCategory(category.id);
          const percentage = totalTransactions > 0 ? (stats.count / totalTransactions) * 100 : 0;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: theme.surface }]}
              onPress={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={20} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
                <View style={styles.categoryStats}>
                  <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
                    {stats.count} transactions
                  </Text>
                  <Text style={[styles.categoryPercent, { color: category.color }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${percentage}%`, backgroundColor: category.color }
                    ]} 
                  />
                </View>
              </View>
              <Ionicons 
                name={selectedCategory === category.id ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.textTertiary} 
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Custom Category</Text>
        <TouchableOpacity style={[styles.addCategoryBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          <Text style={[styles.addCategoryText, { color: theme.primary }]}>Create New Category</Text>
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
  overviewCard: { margin: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg },
  overviewTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  overviewStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  categoryCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  categoryStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  categoryCount: { fontSize: 12 },
  categoryPercent: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 3, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  addCategoryBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, justifyContent: 'center', gap: spacing.sm },
  addCategoryText: { fontSize: 14, fontWeight: '600' },
  bottomPadding: { height: 100 },
});