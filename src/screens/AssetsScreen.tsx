import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { getTokenBalance, ESCROW_CONFIGS } from '../lib/escrow';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  USDValue: string;
  network: string;
  icon: string;
}

const MOCK_ASSETS: Asset[] = [
  { symbol: 'USDC', name: 'USD Coin', balance: '0.00', USDValue: '0.00', network: 'Base', icon: '💵' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', USDValue: '0.00', network: 'Base', icon: 'Ξ' },
  { symbol: 'PASS', name: 'Peys Pass', balance: '0.00', USDValue: '0.00', network: 'Base', icon: '🎫' },
];

export default function AssetsScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const { isDarkMode, refreshTransactions } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');

  useEffect(() => {
    if (authenticated && walletAddress) {
      fetchBalances();
    }
  }, [authenticated, walletAddress]);

  const fetchBalances = async () => {
    if (!walletAddress) return;
    
    try {
      const networks = ['base', 'celo', 'polygon'];
      const updatedAssets = [...assets];
      
      for (const network of networks) {
        try {
          const balance = await getTokenBalance(network, walletAddress);
          const balanceStr = (Number(balance) / 1e6).toFixed(2);
          
          const assetIndex = updatedAssets.findIndex(a => a.symbol === 'USDC' && a.network === ESCROW_CONFIGS[network]?.chainName);
          if (assetIndex >= 0) {
            updatedAssets[assetIndex] = {
              ...updatedAssets[assetIndex],
              balance: balanceStr,
              USDValue: balanceStr,
            };
          }
        } catch (error) {
          console.log(`Error fetching ${network} balance:`, error);
        }
      }
      
      setAssets(updatedAssets);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalances();
    await refreshTransactions();
    setRefreshing(false);
  };

  const filteredAssets = selectedNetwork === 'all' 
    ? assets 
    : assets.filter(a => a.network.toLowerCase() === selectedNetwork.toLowerCase());

  const totalValue = filteredAssets.reduce((sum, asset) => sum + parseFloat(asset.USDValue), 0);

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity 
      style={[styles.assetItem, { backgroundColor: theme.surface }]}
      onPress={() => Alert.alert(item.name, `Balance: ${item.balance} ${item.symbol}`)}
    >
      <View style={[styles.assetIcon, { backgroundColor: theme.primary + '20' }]}>
        <Text style={styles.assetIconText}>{item.icon}</Text>
      </View>
      <View style={styles.assetInfo}>
        <Text style={[styles.assetName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.assetSymbol, { color: theme.textTertiary }]}>{item.symbol} • {item.network}</Text>
      </View>
      <View style={styles.assetValues}>
        <Text style={[styles.assetBalance, { color: theme.text }]}>{item.balance}</Text>
        <Text style={[styles.assetUSD, { color: theme.textSecondary }]}>${item.USDValue}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Connect wallet to view assets</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Assets</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.totalCard, { backgroundColor: theme.primary }]}>
        <Text style={[styles.totalLabel, { color: theme.textTertiary }]}>Total Balance</Text>
        <Text style={[styles.totalAmount, { color: theme.background === '#000000' ? '#FFF' : '#FFF' }]}>
          ${totalValue.toFixed(2)}
        </Text>
        <View style={styles.totalActions}>
          <TouchableOpacity 
            style={[styles.totalActionBtn, { backgroundColor: isDarkMode ? '#333' : 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.navigate('Send')}
          >
            <Ionicons name="arrow-up" size={16} color="#FFF" />
            <Text style={styles.totalActionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.totalActionBtn, { backgroundColor: isDarkMode ? '#333' : 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.navigate('Receive')}
          >
            <Ionicons name="arrow-down" size={16} color="#FFF" />
            <Text style={styles.totalActionText}>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterTabs}>
        {['all', 'base', 'celo', 'polygon'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { backgroundColor: theme.surface },
              selectedNetwork === filter && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSelectedNetwork(filter)}
          >
            <Text style={[
              styles.filterTabText,
              { color: selectedNetwork === filter ? '#FFF' : theme.textSecondary }
            ]}>
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAssets}
        keyExtractor={(item, index) => `${item.symbol}-${item.network}-${index}`}
        renderItem={renderAsset}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No assets found</Text>
          </View>
        }
      />

      <View style={[styles.addTokenBtn, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={styles.addTokenContent} onPress={() => Alert.alert('Add Token', 'Custom token addition coming soon')}>
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.addTokenText, { color: theme.text }]}>Add Custom Token</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  totalCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.md },
  totalLabel: { fontSize: 14 },
  totalAmount: { fontSize: 36, fontWeight: '700', marginVertical: spacing.sm },
  totalActions: { flexDirection: 'row', gap: spacing.sm },
  totalActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.sm },
  totalActionText: { color: '#FFF', fontSize: 14, fontWeight: '600', marginLeft: spacing.xs },
  filterTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  filterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  filterTabText: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  assetItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  assetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  assetIconText: { fontSize: 20 },
  assetInfo: { flex: 1, marginLeft: spacing.md },
  assetName: { fontSize: 16, fontWeight: '600' },
  assetSymbol: { fontSize: 12, marginTop: 2 },
  assetValues: { alignItems: 'flex-end' },
  assetBalance: { fontSize: 16, fontWeight: '600' },
  assetUSD: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: spacing.md },
  addTokenBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg },
  addTokenContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addTokenText: { fontSize: 16, fontWeight: '500', marginLeft: spacing.sm },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
});