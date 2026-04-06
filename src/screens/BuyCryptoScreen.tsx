import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Linking } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface CryptoAsset {
  symbol: string;
  name: string;
  icon: string;
  price: number;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 67000 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 3500 },
  { symbol: 'USDT', name: 'Tether', icon: '₮', price: 1.0 },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵', price: 1.0 },
  { symbol: 'BNB', name: 'BNB', icon: '🔶', price: 600 },
  { symbol: 'SOL', name: 'Solana', icon: '◎', price: 170 },
];

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

export default function BuyCryptoScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset>(CRYPTO_ASSETS[0]);
  const [selectedFiat, setSelectedFiat] = useState(FIAT_CURRENCIES[0]);
  const [fiatAmount, setFiatAmount] = useState('');
  const [showCryptoPicker, setShowCryptoPicker] = useState(false);
  const [showFiatPicker, setShowFiatPicker] = useState(false);

  const cryptoAmount = fiatAmount ? (parseFloat(fiatAmount) / selectedCrypto.price).toFixed(8) : '0';

  const handleBuy = () => {
    if (!fiatAmount || parseFloat(fiatAmount) <= 0) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    Alert.alert(
      'Continue to Flutterwave',
      `You'll be redirected to Flutterwave to complete your purchase of ${cryptoAmount} ${selectedCrypto.symbol}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            const flutterwaveUrl = `https://checkout.flutterwave.com/buy?currency=${selectedFiat.code}&amount=${fiatAmount}`;
            Linking.openURL(flutterwaveUrl).catch(() => {
              Alert.alert('Note', 'Flutterwave integration would open their checkout flow here');
            });
          }
        },
      ]
    );
  };

  const CryptoPicker = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    if (!visible) return null;
    return (
      <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Cryptocurrency</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {CRYPTO_ASSETS.map(asset => (
              <TouchableOpacity
                key={asset.symbol}
                style={[
                  styles.pickerItem, 
                  selectedCrypto.symbol === asset.symbol && { backgroundColor: theme.background }
                ]}
                onPress={() => { setSelectedCrypto(asset); onClose(); }}
              >
                <Text style={styles.pickerIcon}>{asset.icon}</Text>
                <View style={styles.pickerInfo}>
                  <Text style={[styles.pickerSymbol, { color: theme.text }]}>{asset.symbol}</Text>
                  <Text style={[styles.pickerName, { color: theme.textSecondary }]}>{asset.name}</Text>
                </View>
                <Text style={[styles.pickerPrice, { color: theme.textTertiary }]}>${asset.price.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const FiatPicker = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    if (!visible) return null;
    return (
      <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {FIAT_CURRENCIES.map(currency => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.pickerItem, 
                  selectedFiat.code === currency.code && { backgroundColor: theme.background }
                ]}
                onPress={() => { setSelectedFiat(currency); onClose(); }}
              >
                <Text style={[styles.fiatSymbol, { color: theme.text }]}>{currency.symbol}</Text>
                <View style={styles.pickerInfo}>
                  <Text style={[styles.pickerSymbol, { color: theme.text }]}>{currency.code}</Text>
                  <Text style={[styles.pickerName, { color: theme.textSecondary }]}>{currency.name}</Text>
                </View>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Buy Crypto</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
        <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Powered by Flutterwave - Secure and instant crypto purchases
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>You Pay</Text>
        
        <TouchableOpacity 
          style={[styles.currencyButton, { backgroundColor: theme.background }]}
          onPress={() => setShowFiatPicker(true)}
        >
          <Text style={[styles.currencySymbol, { color: theme.text }]}>{selectedFiat.symbol}</Text>
          <Text style={[styles.currencyCode, { color: theme.text }]}>{selectedFiat.code}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.textTertiary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.amountInput, { color: theme.text, borderColor: theme.border }]}
          value={fiatAmount}
          onChangeText={setFiatAmount}
          placeholder="0.00"
          placeholderTextColor={theme.textTertiary}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={[styles.arrowContainer, { backgroundColor: theme.surface }]}>
        <Ionicons name="arrow-down" size={20} color={theme.primary} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>You Receive</Text>
        
        <TouchableOpacity 
          style={[styles.currencyButton, { backgroundColor: theme.background }]}
          onPress={() => setShowCryptoPicker(true)}
        >
          <Text style={styles.cryptoIcon}>{selectedCrypto.icon}</Text>
          <Text style={[styles.currencyCode, { color: theme.text }]}>{selectedCrypto.symbol}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.textTertiary} />
        </TouchableOpacity>

        <Text style={[styles.cryptoAmount, { color: theme.text }]}>
          {cryptoAmount} {selectedCrypto.symbol}
        </Text>
        
        <Text style={[styles.cryptoValue, { color: theme.textTertiary }]}>
          ≈ ${fiatAmount || '0.00'} USD
        </Text>
      </View>

      <View style={[styles.rateCard, { backgroundColor: theme.surface }]}>
        <View style={styles.rateRow}>
          <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Exchange Rate</Text>
          <Text style={[styles.rateValue, { color: theme.text }]}>
            1 {selectedCrypto.symbol} = {selectedFiat.symbol}{(selectedCrypto.price).toFixed(2)}
          </Text>
        </View>
        <View style={styles.rateRow}>
          <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Network</Text>
          <Text style={[styles.rateValue, { color: theme.text }]}>Base Sepolia</Text>
        </View>
        <View style={[styles.rateRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Provider</Text>
          <Text style={[styles.rateValue, { color: theme.primary }]}>Flutterwave</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.buyBtn, { backgroundColor: theme.primary }]}
        onPress={handleBuy}
        disabled={!fiatAmount || parseFloat(fiatAmount) <= 0}
      >
        <Text style={styles.buyBtnText}>
          {!fiatAmount ? 'Enter Amount' : `Buy ${cryptoAmount.slice(0, 8)} ${selectedCrypto.symbol}`}
        </Text>
      </TouchableOpacity>

      <View style={[styles.limitsCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.limitsTitle, { color: theme.text }]}>Daily Limits</Text>
        <View style={styles.limitRow}>
          <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Min</Text>
          <Text style={[styles.limitValue, { color: theme.text }]}>$10.00</Text>
        </View>
        <View style={styles.limitRow}>
          <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Max</Text>
          <Text style={[styles.limitValue, { color: theme.text }]}>$50,000.00</Text>
        </View>
      </View>

      <CryptoPicker visible={showCryptoPicker} onClose={() => setShowCryptoPicker(false)} />
      <FiatPicker visible={showFiatPicker} onClose={() => setShowFiatPicker(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.md },
  infoText: { flex: 1, fontSize: 13, marginLeft: spacing.sm },
  card: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md },
  cardLabel: { fontSize: 12, marginBottom: spacing.sm },
  currencyButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginBottom: spacing.md },
  currencySymbol: { fontSize: 18, fontWeight: '600' },
  currencyCode: { fontSize: 14, fontWeight: '500', marginLeft: spacing.xs, marginRight: spacing.xs },
  amountInput: { fontSize: 32, fontWeight: '700', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, textAlign: 'center' },
  cryptoIcon: { fontSize: 20, marginRight: spacing.xs },
  cryptoAmount: { fontSize: 28, fontWeight: '700', marginTop: spacing.md },
  cryptoValue: { fontSize: 14, marginTop: spacing.xs },
  arrowContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: -spacing.sm },
  rateCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rateLabel: { fontSize: 14 },
  rateValue: { fontSize: 14, fontWeight: '500' },
  buyBtn: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  limitsCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xl },
  limitsTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  limitLabel: { fontSize: 13 },
  limitValue: { fontSize: 13 },
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
  fiatSymbol: { fontSize: 20, fontWeight: '600', width: 30 },
});