import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  price: number;
}

const TOKENS: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', icon: '💵', price: 1.0 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 2500.0 },
  { symbol: 'PASS', name: 'Peys Pass', icon: '🎫', price: 0.5 },
  { symbol: 'CELO', name: 'Celo', icon: '🟢', price: 0.75 },
];

const SLIPPAGE_OPTIONS = ['0.5%', '1%', '3%', '5%'];

export default function SwapScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('1%');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const convertAmount = (amount: string, from: Token, to: Token) => {
    if (!amount) return '';
    const usdValue = parseFloat(amount) * from.price;
    const converted = usdValue / to.price;
    return converted.toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(convertAmount(value, fromToken, toToken));
  };

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    Alert.alert(
      'Confirm Swap',
      `Swap ${fromAmount} ${fromToken.symbol} for ~${toAmount} ${toToken.symbol}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Swap', onPress: () => {
          Alert.alert('Success', 'Swap initiated successfully');
          setFromAmount('');
          setToAmount('');
        }},
      ]
    );
  };

  const handleReverse = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const TokenPicker = ({ 
    selected, 
    onSelect, 
    visible, 
    onClose 
  }: { 
    selected: Token; 
    onSelect: (t: Token) => void; 
    visible: boolean; 
    onClose: () => void;
  }) => {
    if (!visible) return null;
    return (
      <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Token</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {TOKENS.map(token => (
              <TouchableOpacity
                key={token.symbol}
                style={[styles.pickerItem, selected.symbol === token.symbol && { backgroundColor: theme.background }]}
                onPress={() => { onSelect(token); onClose(); }}
              >
                <Text style={styles.pickerIcon}>{token.icon}</Text>
                <View style={styles.pickerInfo}>
                  <Text style={[styles.pickerSymbol, { color: theme.text }]}>{token.symbol}</Text>
                  <Text style={[styles.pickerName, { color: theme.textSecondary }]}>{token.name}</Text>
                </View>
                <Text style={[styles.pickerPrice, { color: theme.textTertiary }]}>${token.price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Swap</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.swapCard, { backgroundColor: theme.surface }]}>
        <View style={styles.fromSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>You Pay</Text>
          <TouchableOpacity 
            style={[styles.tokenButton, { backgroundColor: theme.background }]}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.tokenIcon}>{fromToken.icon}</Text>
            <Text style={[styles.tokenSymbol, { color: theme.text }]}>{fromToken.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textTertiary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            value={fromAmount}
            onChangeText={handleFromAmountChange}
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.usdValue, { color: theme.textTertiary }]}>
            ${fromAmount ? (parseFloat(fromAmount) * fromToken.price).toFixed(2) : '0.00'}
          </Text>
        </View>

        <View style={styles.swapButtonContainer}>
          <TouchableOpacity 
            style={[styles.swapButton, { backgroundColor: theme.primary }]}
            onPress={handleReverse}
          >
            <Ionicons name="swap-vertical" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.toSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>You Receive</Text>
          <TouchableOpacity 
            style={[styles.tokenButton, { backgroundColor: theme.background }]}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.tokenIcon}>{toToken.icon}</Text>
            <Text style={[styles.tokenSymbol, { color: theme.text }]}>{toToken.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textTertiary} />
          </TouchableOpacity>
          <Text style={[styles.toAmount, { color: theme.text }]}>{toAmount || '0.00'}</Text>
        </View>
      </View>

      <View style={[styles.detailsCard, { backgroundColor: theme.surface }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Rate</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>
            1 {fromToken.symbol} = {(toToken.price / fromToken.price).toFixed(6)} {toToken.symbol}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Slippage Tolerance</Text>
          <View style={styles.slippageOptions}>
            {SLIPPAGE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.slippageBtn,
                  { backgroundColor: theme.background },
                  slippage === option && { backgroundColor: theme.primary }
                ]}
                onPress={() => setSlippage(option)}
              >
                <Text style={[
                  styles.slippageText,
                  { color: slippage === option ? '#FFF' : theme.textSecondary }
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Network Fee</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>~0.001 ETH</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.swapBtn, { backgroundColor: theme.primary }]}
        onPress={handleSwap}
        disabled={!fromAmount || parseFloat(fromAmount) <= 0}
      >
        <Text style={styles.swapBtnText}>
          {!fromAmount ? 'Enter Amount' : `Swap ${fromToken.symbol} for ${toToken.symbol}`}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
        Prices are indicative and may vary at execution time
      </Text>

      <TokenPicker 
        selected={fromToken} 
        onSelect={setFromToken} 
        visible={showFromPicker} 
        onClose={() => setShowFromPicker(false)} 
      />
      <TokenPicker 
        selected={toToken} 
        onSelect={setToToken} 
        visible={showToPicker} 
        onClose={() => setShowToPicker(false)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  swapCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md },
  fromSection: { alignItems: 'center' },
  sectionLabel: { fontSize: 12, marginBottom: spacing.sm },
  tokenButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginBottom: spacing.md },
  tokenIcon: { fontSize: 20, marginRight: spacing.xs },
  tokenSymbol: { fontSize: 16, fontWeight: '600', marginRight: spacing.xs },
  amountInput: { fontSize: 36, fontWeight: '700', textAlign: 'center', marginVertical: spacing.sm },
  usdValue: { fontSize: 14 },
  swapButtonContainer: { alignItems: 'center', marginVertical: -spacing.sm },
  swapButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  toSection: { alignItems: 'center', marginTop: spacing.md },
  toAmount: { fontSize: 28, fontWeight: '600', marginTop: spacing.sm },
  detailsCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  slippageOptions: { flexDirection: 'row', gap: spacing.xs },
  slippageBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  slippageText: { fontSize: 12, fontWeight: '500' },
  swapBtn: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  swapBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 12, textAlign: 'center', marginTop: spacing.md, marginHorizontal: spacing.lg },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  pickerContainer: { maxHeight: '60%', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pickerTitle: { fontSize: 18, fontWeight: '600' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  pickerIcon: { fontSize: 24 },
  pickerInfo: { flex: 1, marginLeft: spacing.md },
  pickerSymbol: { fontSize: 16, fontWeight: '600' },
  pickerName: { fontSize: 12 },
  pickerPrice: { fontSize: 14 },
});