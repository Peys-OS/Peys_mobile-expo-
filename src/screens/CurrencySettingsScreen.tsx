import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES } from '../lib/formatting';

export default function CurrencySettingsScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [selectedLocale, setSelectedLocale] = useState('en-US');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Language & Currency</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Language</Text>
        <View style={[styles.optionsCard, { backgroundColor: theme.surface }]}>
          {SUPPORTED_LOCALES.map((locale, index) => (
            <TouchableOpacity
              key={locale.code}
              style={[
                styles.optionRow,
                index < SUPPORTED_LOCALES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
              onPress={() => setSelectedLocale(locale.code)}
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>{locale.name}</Text>
                <Text style={[styles.optionCode, { color: theme.textTertiary }]}>{locale.code}</Text>
              </View>
              {selectedLocale === locale.code && (
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Default Currency</Text>
        <View style={[styles.optionsCard, { backgroundColor: theme.surface }]}>
          {SUPPORTED_CURRENCIES.map((currency, index) => (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.optionRow,
                index < SUPPORTED_CURRENCIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
              onPress={() => setSelectedCurrency(currency.code)}
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  {currency.symbol} {currency.name}
                </Text>
                <Text style={[styles.optionCode, { color: theme.textTertiary }]}>{currency.code}</Text>
              </View>
              {selectedCurrency === currency.code && (
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
        <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Large Number</Text>
            <Text style={[styles.previewValue, { color: theme.text }]}>1,234,567.89</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Currency</Text>
            <Text style={[styles.previewValue, { color: theme.text }]}>$1,234.56</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Percentage</Text>
            <Text style={[styles.previewValue, { color: theme.success }]}>+12.34%</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Date</Text>
            <Text style={[styles.previewValue, { color: theme.text }]}>Apr 6, 2026</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  optionsCard: { borderRadius: borderRadius.md, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 16 },
  optionCode: { fontSize: 12, marginTop: 2 },
  previewCard: { borderRadius: borderRadius.md, padding: spacing.md },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  previewLabel: { fontSize: 14 },
  previewValue: { fontSize: 14, fontWeight: '600' },
  bottomPadding: { height: 100 },
});