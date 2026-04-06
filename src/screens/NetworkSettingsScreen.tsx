import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { ESCROW_CONFIGS } from '../lib/escrow';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Network {
  id: string;
  name: string;
  chainId: number;
  color: string;
  explorer: string;
  enabled: boolean;
}

const NETWORKS: Network[] = [
  { id: 'base', name: 'Base Sepolia', chainId: 84532, color: '#0056FF', explorer: 'https://sepolia.basescan.org', enabled: true },
  { id: 'celo', name: 'Celo Alfajores', chainId: 44787, color: '#35D07F', explorer: 'https://alfajores.celoscan.io', enabled: true },
  { id: 'polygon', name: 'Polygon Amoy', chainId: 80002, color: '#8247E5', explorer: 'https://amoy.polygonscan.com', enabled: true },
];

export default function NetworkSettingsScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [networks, setNetworks] = useState<Network[]>(NETWORKS);
  const [defaultNetwork, setDefaultNetwork] = useState<string>('base');
  const [customGasEnabled, setCustomGasEnabled] = useState(false);
  const [gasSpeed, setGasSpeed] = useState<'slow' | 'standard' | 'fast'>('standard');

  const toggleNetwork = (id: string) => {
    const enabledCount = networks.filter(n => n.enabled).length;
    setNetworks(networks.map(n => {
      if (n.id === id) {
        if (!n.enabled && enabledCount === 1) {
          Alert.alert('Error', 'At least one network must remain enabled');
          return n;
        }
        return { ...n, enabled: !n.enabled };
      }
      return n;
    }));
  };

  const setAsDefault = (id: string) => {
    setDefaultNetwork(id);
    Alert.alert('Success', `${networks.find(n => n.id === id)?.name} set as default network`);
  };

  const NetworkItem = ({ network }: { network: Network }) => (
    <View style={[styles.networkCard, { backgroundColor: theme.surface }]}>
      <View style={styles.networkHeader}>
        <View style={[styles.networkDot, { backgroundColor: network.color }]} />
        <View style={styles.networkInfo}>
          <Text style={[styles.networkName, { color: theme.text }]}>{network.name}</Text>
          <Text style={[styles.networkChain, { color: theme.textTertiary }]}>Chain ID: {network.chainId}</Text>
        </View>
        <Switch
          value={network.enabled}
          onValueChange={() => toggleNetwork(network.id)}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFF"
        />
      </View>
      <View style={styles.networkActions}>
        <TouchableOpacity 
          style={[
            styles.defaultBtn, 
            { backgroundColor: defaultNetwork === network.id ? theme.primary : theme.background }
          ]}
          onPress={() => setAsDefault(network.id)}
        >
          <Text style={[
            styles.defaultBtnText, 
            { color: defaultNetwork === network.id ? '#FFF' : theme.textSecondary }
          ]}>
            {defaultNetwork === network.id ? 'Default' : 'Set Default'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.explorerBtn, { borderColor: theme.border }]}
          onPress={() => Alert.alert('Explorer', `Would open ${network.explorer}`)}
        >
          <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Network & Gas</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Networks</Text>
        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
          Enable or disable networks for transactions
        </Text>
        {networks.map(network => (
          <NetworkItem key={network.id} network={network} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Gas Settings</Text>
        
        <View style={[styles.gasCard, { backgroundColor: theme.surface }]}>
          <View style={styles.gasHeader}>
            <Ionicons name="speedometer-outline" size={20} color={theme.primary} />
            <Text style={[styles.gasLabel, { color: theme.text }]}>Custom Gas Price</Text>
            <Switch
              value={customGasEnabled}
              onValueChange={setCustomGasEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
            />
          </View>
          <Text style={[styles.gasDesc, { color: theme.textSecondary }]}>
            Manually set gas price for transactions
          </Text>
        </View>

        {customGasEnabled && (
          <View style={[styles.speedCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.speedTitle, { color: theme.text }]}>Transaction Speed</Text>
            <View style={styles.speedButtons}>
              {(['slow', 'standard', 'fast'] as const).map(speed => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedBtn,
                    { backgroundColor: gasSpeed === speed ? theme.primary : theme.background },
                    gasSpeed !== speed && { borderColor: theme.border }
                  ]}
                  onPress={() => setGasSpeed(speed)}
                >
                  <Text style={[
                    styles.speedBtnText,
                    { color: gasSpeed === speed ? '#FFF' : theme.textSecondary }
                  ]}>
                    {speed.charAt(0).toUpperCase() + speed.slice(1)}
                  </Text>
                  <Text style={[
                    styles.speedBtnDesc,
                    { color: gasSpeed === speed ? '#FFF' : theme.textTertiary }
                  ]}>
                    {speed === 'slow' ? 'Cheapest' : speed === 'fast' ? 'Fastest' : 'Normal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Current Gas Prices</Text>
        <View style={[styles.gasPricesCard, { backgroundColor: theme.surface }]}>
          <View style={styles.gasPriceRow}>
            <Text style={[styles.gasPriceLabel, { color: theme.textSecondary }]}>Base Fee</Text>
            <Text style={[styles.gasPriceValue, { color: theme.text }]}>~0.001 Gwei</Text>
          </View>
          <View style={styles.gasPriceRow}>
            <Text style={[styles.gasPriceLabel, { color: theme.textSecondary }]}>Priority Fee</Text>
            <Text style={[styles.gasPriceValue, { color: theme.text }]}>~0.001 Gwei</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.gasPriceRow}>
            <Text style={[styles.gasPriceLabel, { color: theme.text }]}>Estimated Gas</Text>
            <Text style={[styles.gasPriceValue, { color: theme.primary }]}>~21,000 gas</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>RPC Endpoints</Text>
        <TouchableOpacity style={[styles.rpcCard, { backgroundColor: theme.surface }]}>
          <View style={styles.rpcInfo}>
            <Ionicons name="server-outline" size={20} color={theme.primary} />
            <View style={styles.rpcDetails}>
              <Text style={[styles.rpcLabel, { color: theme.text }]}>Base Sepolia RPC</Text>
              <Text style={[styles.rpcUrl, { color: theme.textTertiary }]} numberOfLines={1}>
                {ESCROW_CONFIGS.base.rpcUrl || 'Not configured'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rpcCard, { backgroundColor: theme.surface }]}>
          <View style={styles.rpcInfo}>
            <Ionicons name="server-outline" size={20} color={theme.primary} />
            <View style={styles.rpcDetails}>
              <Text style={[styles.rpcLabel, { color: theme.text }]}>Celo Alfajores RPC</Text>
              <Text style={[styles.rpcUrl, { color: theme.textTertiary }]} numberOfLines={1}>
                {ESCROW_CONFIGS.celo.rpcUrl || 'Not configured'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rpcCard, { backgroundColor: theme.surface }]}>
          <View style={styles.rpcInfo}>
            <Ionicons name="server-outline" size={20} color={theme.primary} />
            <View style={styles.rpcDetails}>
              <Text style={[styles.rpcLabel, { color: theme.text }]}>Polygon Amoy RPC</Text>
              <Text style={[styles.rpcUrl, { color: theme.textTertiary }]} numberOfLines={1}>
                {ESCROW_CONFIGS.polygon.rpcUrl || 'Not configured'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: theme.textTertiary }]}>PeysOS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.xs },
  sectionDesc: { fontSize: 14, marginBottom: spacing.md },
  networkCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  networkHeader: { flexDirection: 'row', alignItems: 'center' },
  networkDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.md },
  networkInfo: { flex: 1 },
  networkName: { fontSize: 16, fontWeight: '600' },
  networkChain: { fontSize: 12, marginTop: 2 },
  networkActions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  defaultBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  defaultBtnText: { fontSize: 14, fontWeight: '500' },
  explorerBtn: { width: 36, height: 36, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  gasCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  gasHeader: { flexDirection: 'row', alignItems: 'center' },
  gasLabel: { flex: 1, fontSize: 16, fontWeight: '600', marginLeft: spacing.md },
  gasDesc: { fontSize: 12, marginTop: spacing.xs, marginLeft: 36 },
  speedCard: { borderRadius: borderRadius.md, padding: spacing.md },
  speedTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.md },
  speedButtons: { flexDirection: 'row', gap: spacing.sm },
  speedBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1 },
  speedBtnText: { fontSize: 14, fontWeight: '600' },
  speedBtnDesc: { fontSize: 11, marginTop: 2 },
  gasPricesCard: { borderRadius: borderRadius.md, padding: spacing.md },
  gasPriceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  gasPriceLabel: { fontSize: 14 },
  gasPriceValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, marginVertical: spacing.sm },
  rpcCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  rpcInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rpcDetails: { marginLeft: spacing.md, flex: 1 },
  rpcLabel: { fontSize: 14, fontWeight: '600' },
  rpcUrl: { fontSize: 12, marginTop: 2 },
  version: { textAlign: 'center', fontSize: 12, padding: spacing.xl, paddingBottom: 40 },
});