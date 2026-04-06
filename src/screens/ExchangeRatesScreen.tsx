import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface ExchangeRate {
  pair: string;
  rate: number;
  change24h: number;
}

const EXCHANGE_RATES: ExchangeRate[] = [
  { pair: 'ETH/USD', rate: 3245.67, change24h: 2.34 },
  { pair: 'BTC/USD', rate: 67234.89, change24h: 1.23 },
  { pair: 'USDC/USD', rate: 1.0, change24h: 0.01 },
  { pair: 'EUR/USD', rate: 1.08, change24h: -0.15 },
  { pair: 'GBP/USD', rate: 1.26, change24h: -0.22 },
  { pair: 'NGN/USD', rate: 0.00065, change24h: 0.05 },
  { pair: 'CELO/USD', rate: 0.78, change24h: -1.45 },
  { pair: 'MATIC/USD', rate: 0.58, change24h: 3.21 },
];

const CRYPTO_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '💎' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'CELO', name: 'Celo', icon: '🟢' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡' },
];

export default function ExchangeRatesScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [convertFrom, setConvertFrom] = useState('ETH');
  const [convertTo, setConvertTo] = useState('USD');
  const [amount, setAmount] = useState('');

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    const fromRate = EXCHANGE_RATES.find(r => r.pair.startsWith(from))?.rate || 1;
    const toRate = EXCHANGE_RATES.find(r => r.pair.startsWith(to))?.rate || 1;
    return fromRate / toRate;
  };

  const convertedAmount = amount ? parseFloat(amount) * getRate(convertFrom, convertTo) : 0;

  const swapCurrencies = () => {
    const temp = convertFrom;
    setConvertFrom(convertTo);
    setConvertTo(temp);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Exchange Rates</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.converterCard, { backgroundColor: theme.primary }]}>
        <Text style={[styles.converterTitle, { color: '#FFF' }]}>Currency Converter</Text>
        
        <View style={styles.converterRow}>
          <View style={styles.converterInput}>
            <Text style={[styles.converterLabel, { color: '#AAA' }]}>From</Text>
            <TextInput
              style={[styles.converterAmount, { color: '#FFF' }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#666"
            />
            <View style={styles.currencySelector}>
              {CRYPTO_TOKENS.slice(0, 3).map(token => (
                <TouchableOpacity
                  key={token.symbol}
                  style={[
                    styles.currencyChip,
                    convertFrom === token.symbol && { backgroundColor: 'rgba(255,255,255,0.2)' }
                  ]}
                  onPress={() => setConvertFrom(token.symbol)}
                >
                  <Text style={{ color: '#FFF', fontSize: 12 }}>{token.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.swapBtn} onPress={swapCurrencies}>
          <Ionicons name="swap-vertical" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.converterRow}>
          <View style={styles.converterInput}>
            <Text style={[styles.converterLabel, { color: '#AAA' }]}>To</Text>
            <Text style={[styles.converterResult, { color: '#FFF' }]}>
              {convertedAmount.toFixed(2)} {convertTo}
            </Text>
            <View style={styles.currencySelector}>
              {['USD', 'EUR', 'GBP'].map(curr => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyChip,
                    convertTo === curr && { backgroundColor: 'rgba(255,255,255,0.2)' }
                  ]}
                  onPress={() => setConvertTo(curr)}
                >
                  <Text style={{ color: '#FFF', fontSize: 12 }}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Rates</Text>
        <View style={[styles.ratesCard, { backgroundColor: theme.surface }]}>
          {EXCHANGE_RATES.map((rate, index) => (
            <View key={rate.pair} style={[
              styles.rateRow,
              index < EXCHANGE_RATES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
            ]}>
              <View style={styles.rateInfo}>
                <Text style={[styles.ratePair, { color: theme.text }]}>{rate.pair}</Text>
                <Text style={[styles.rateValue, { color: theme.textSecondary }]}>
                  {rate.rate.toLocaleString()}
                </Text>
              </View>
              <View style={[
                styles.changeBadge,
                { backgroundColor: rate.change24h >= 0 ? theme.success + '20' : theme.error + '20' }
              ]}>
                <Ionicons 
                  name={rate.change24h >= 0 ? 'arrow-up' : 'arrow-down'} 
                  size={12} 
                  color={rate.change24h >= 0 ? theme.success : theme.error} 
                />
                <Text style={[
                  styles.changeText,
                  { color: rate.change24h >= 0 ? theme.success : theme.error }
                ]}>
                  {Math.abs(rate.change24h).toFixed(2)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Crypto Prices</Text>
        <View style={styles.cryptoGrid}>
          {CRYPTO_TOKENS.map(token => {
            const rate = EXCHANGE_RATES.find(r => r.pair.startsWith(token.symbol));
            return (
              <View key={token.symbol} style={[styles.cryptoCard, { backgroundColor: theme.surface }]}>
                <Text style={styles.cryptoIcon}>{token.icon}</Text>
                <Text style={[styles.cryptoSymbol, { color: theme.text }]}>{token.symbol}</Text>
                <Text style={[styles.cryptoName, { color: theme.textTertiary }]}>{token.name}</Text>
                <Text style={[styles.cryptoPrice, { color: theme.primary }]}>
                  ${rate?.rate.toLocaleString() || 'N/A'}
                </Text>
              </View>
            );
          })}
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
  converterCard: { margin: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg },
  converterTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  converterRow: { marginVertical: spacing.sm },
  converterInput: {},
  converterLabel: { fontSize: 12, marginBottom: spacing.xs },
  converterAmount: { fontSize: 28, fontWeight: '700' },
  converterResult: { fontSize: 28, fontWeight: '700' },
  currencySelector: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  currencyChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  swapBtn: { alignSelf: 'center', padding: spacing.sm },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  ratesCard: { borderRadius: borderRadius.md, overflow: 'hidden' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  rateInfo: { flex: 1 },
  ratePair: { fontSize: 14, fontWeight: '600' },
  rateValue: { fontSize: 12, marginTop: 2 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  changeText: { fontSize: 12, fontWeight: '600', marginLeft: 2 },
  cryptoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cryptoCard: { width: '30%', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  cryptoIcon: { fontSize: 24, marginBottom: spacing.xs },
  cryptoSymbol: { fontSize: 14, fontWeight: '600' },
  cryptoName: { fontSize: 10, marginTop: 2 },
  cryptoPrice: { fontSize: 12, fontWeight: '700', marginTop: spacing.xs },
  bottomPadding: { height: 100 },
});