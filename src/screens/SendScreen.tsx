import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { 
  checkUSDCAllowance, 
  formatUSDC,
  getTokenBalance,
  ESCROW_CONFIGS 
} from '../lib/escrow';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Token {
  symbol: string;
  name: string;
  decimals: number;
}

interface Network {
  id: string;
  name: string;
  chainId: number;
  color: string;
  explorer: string;
}

const NETWORKS: Network[] = [
  { id: 'base', name: 'Base Sepolia', chainId: 84532, color: '#0056FF', explorer: 'https://sepolia.basescan.org' },
  { id: 'celo', name: 'Celo Alfajores', chainId: 44787, color: '#35D07F', explorer: 'https://alfajores.celoscan.io' },
  { id: 'polygon', name: 'Polygon Amoy', chainId: 80002, color: '#8247E5', explorer: 'https://amoy.polygonscan.com' },
];

const TOKENS: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
];

export default function SendScreen({ navigation, route }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const { isDarkMode, refreshTransactions } = useApp();
  
  const theme = isDarkMode ? colors.dark : colors.light;
  
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(route.params?.recipient || '');
  const [memo, setMemo] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(NETWORKS[0]);
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [loading, setLoading] = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [recentRecipients, setRecentRecipients] = useState<any[]>([]);
  const [showRecentContacts, setShowRecentContacts] = useState(false);

  const presets = ['5', '10', '25', '50', '100', '250'];

  useEffect(() => {
    if (authenticated && walletAddress && selectedToken.symbol === 'USDC') {
      fetchTokenBalance();
      fetchRecentRecipients();
    }
  }, [authenticated, walletAddress, selectedNetwork.id, selectedToken.symbol]);

  const fetchTokenBalance = async () => {
    try {
      const balance = await getTokenBalance(selectedNetwork.id, walletAddress);
      setTokenBalance(formatUSDC(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setTokenBalance('0');
    }
  };

  const fetchRecentRecipients = async () => {
    if (!walletAddress) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('recipient_wallet, recipient_email')
        .or(`sender_wallet.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const recipients = new Map<string, any>();
        data.forEach((item: any) => {
          const key = item.recipient_wallet || item.recipient_email;
          if (key && !recipients.has(key)) {
            recipients.set(key, {
              address: key,
              label: item.recipient_email || key.slice(0, 6) + '...' + key.slice(-4),
            });
          }
        });
        setRecentRecipients(Array.from(recipients.values()).slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching recent recipients:', error);
    }
  };

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!recipient) {
      Alert.alert('Error', 'Please enter a recipient');
      return;
    }

    const isEmail = recipient.includes('@');
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient);

    if (!isEmail && !isValidAddress) {
      Alert.alert('Error', 'Please enter a valid email or wallet address');
      return;
    }

    setLoading(true);
    try {
      const amountUSDC = BigInt(Math.floor(parseFloat(amount) * 1e6));
      
      if (selectedToken.symbol === 'USDC' && !isEmail) {
        try {
          const allowance = await checkUSDCAllowance(selectedNetwork.id, walletAddress);
          console.log('USDC allowance:', allowance.toString());
          
          if (allowance < amountUSDC) {
            Alert.alert(
              'Note',
              'USDC approval needed before first transaction. Using Supabase for now.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.log('Could not check USDC allowance:', error);
        }
      }

      const paymentData: any = {
        sender_wallet: walletAddress.toLowerCase(),
        amount: parseFloat(amount),
        token: selectedToken.symbol,
        chain_id: selectedNetwork.chainId,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (isEmail) {
        paymentData.recipient_email = recipient.toLowerCase();
      } else {
        paymentData.recipient_wallet = recipient.toLowerCase();
      }

      if (memo.trim()) {
        paymentData.memo = memo.trim();
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Payment Created!',
        `Your payment of $${amount} ${selectedToken.symbol} has been created. ${isEmail ? `An email has been sent to ${recipient}` : 'Share the claim link with the recipient.'}`,
        [
          { text: 'View Escrow', onPress: () => navigation.navigate('Escrow') },
          { text: 'Done', style: 'cancel' },
        ]
      );
      
      setAmount('');
      setRecipient('');
      refreshTransactions();
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Connect wallet to send</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Send</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Escrow')}>
          <Ionicons name="wallet-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
        <View style={[styles.amountInput, { backgroundColor: theme.surface }]}>
          <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
          <TextInput
            style={[styles.amountField, { color: theme.text }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
          />
          <TouchableOpacity 
            style={[styles.tokenBadge, { backgroundColor: theme.background }]}
            onPress={() => setShowTokenPicker(!showTokenPicker)}
          >
            <Text style={[styles.tokenBadgeText, { color: theme.textSecondary }]}>{selectedToken.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {selectedToken.symbol === 'USDC' && (
          <Text style={[styles.balanceText, { color: theme.textTertiary }]}>
            Balance: {tokenBalance} USDC
          </Text>
        )}

        {showTokenPicker && (
          <View style={[styles.picker, { backgroundColor: theme.surface }]}>
            {TOKENS.map(token => (
              <TouchableOpacity
                key={token.symbol}
                style={[styles.pickerItem, selectedToken.symbol === token.symbol && { backgroundColor: theme.background }]}
                onPress={() => {
                  setSelectedToken(token);
                  setShowTokenPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: theme.text }]}>{token.symbol}</Text>
                <Text style={[styles.pickerSubtext, { color: theme.textSecondary }]}>{token.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.presets}>
          {presets.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.presetBtn,
                { backgroundColor: theme.surface },
                amount === p && { backgroundColor: theme.primary }
              ]}
              onPress={() => setAmount(p)}
            >
              <Text style={[
                styles.presetText,
                { color: amount === p ? theme.background : theme.textSecondary }
              ]}>${p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Recipient</Text>
        <View style={styles.recipientRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="email@example.com or 0x..."
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={[styles.scanBtn, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Ionicons name="qr-code" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {recentRecipients.length > 0 && !recipient && (
          <View style={styles.recentContacts}>
            <TouchableOpacity 
              style={styles.recentHeader}
              onPress={() => setShowRecentContacts(!showRecentContacts)}
            >
              <Text style={[styles.recentTitle, { color: theme.textSecondary }]}>Recent</Text>
              <Ionicons 
                name={showRecentContacts ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
            {showRecentContacts && (
              <FlatList
                horizontal
                data={recentRecipients}
                keyExtractor={(item) => item.address}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.recentChip, { backgroundColor: theme.surface }]}
                    onPress={() => {
                      setRecipient(item.address);
                      setShowRecentContacts(false);
                    }}
                  >
                    <Text style={[styles.recentChipText, { color: theme.text }]}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.recentList}
              />
            )}
          </View>
        )}

        <Text style={[styles.label, { color: theme.text }]}>Network</Text>
        <TouchableOpacity 
          style={[styles.networkSelector, { backgroundColor: theme.surface }]}
          onPress={() => setShowNetworkPicker(!showNetworkPicker)}
        >
          <View style={[styles.networkDot, { backgroundColor: selectedNetwork.color }]} />
          <Text style={[styles.networkName, { color: theme.text }]}>{selectedNetwork.name}</Text>
          <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {showNetworkPicker && (
          <View style={[styles.picker, { backgroundColor: theme.surface }]}>
            {NETWORKS.map(network => (
              <TouchableOpacity
                key={network.id}
                style={[
                  styles.pickerItem,
                  selectedNetwork.id === network.id && { backgroundColor: theme.background }
                ]}
                onPress={() => {
                  setSelectedNetwork(network);
                  setShowNetworkPicker(false);
                }}
              >
                <View style={[styles.networkDot, { backgroundColor: network.color }]} />
                <Text style={[styles.pickerText, { color: theme.text }]}>{network.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: theme.text }]}>Memo (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          value={memo}
          onChangeText={setMemo}
          placeholder="Add a note..."
          placeholderTextColor={theme.textTertiary}
          maxLength={100}
          multiline
        />

        <View style={[styles.feeInfo, { backgroundColor: theme.surface }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.feeText, { color: theme.textSecondary }]}>
            Transaction fees apply. Your recipient will need to claim the funds.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: theme.primary }]} 
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>
              {amount ? `Send ${amount} ${selectedToken.symbol}` : 'Enter Amount'}
            </Text>
          )}
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
  form: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md },
  currencySymbol: { fontSize: 28, fontWeight: '700', marginRight: spacing.xs },
  amountField: { flex: 1, fontSize: 28, fontWeight: '700' },
  tokenBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  tokenBadgeText: { fontSize: 14, fontWeight: '600', marginRight: 4 },
  balanceText: { fontSize: 12, marginTop: spacing.xs, marginLeft: spacing.xs },
  picker: { borderRadius: borderRadius.md, marginTop: spacing.xs, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  pickerText: { fontSize: 16, fontWeight: '600' },
  pickerSubtext: { fontSize: 12, marginLeft: spacing.sm },
  presets: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  presetBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  presetText: { fontSize: 14, fontWeight: '600' },
  recipientRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16 },
  scanBtn: { width: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  networkSelector: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md },
  networkDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  networkName: { flex: 1, fontSize: 16 },
  feeInfo: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  feeText: { flex: 1, fontSize: 12, marginLeft: spacing.sm },
  sendBtn: { padding: spacing.md + 2, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
  bottomPadding: { height: 100 },
  recentContacts: { marginTop: spacing.sm },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  recentTitle: { fontSize: 12, fontWeight: '600' },
  recentList: { paddingVertical: spacing.sm, gap: spacing.sm },
  recentChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm },
  recentChipText: { fontSize: 13 },
});