import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Image } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { usePrivyContext } from '../contexts/PrivyContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface GiftCard {
  id: string;
  brand: string;
  brandLogo: string;
  denomination: number;
  price: number;
  discount: number;
}

const GIFT_CARDS: GiftCard[] = [
  { id: '1', brand: 'Amazon', brandLogo: '🛒', denomination: 25, price: 22.50, discount: 10 },
  { id: '2', brand: 'Apple', brandLogo: '🍎', denomination: 50, price: 45, discount: 10 },
  { id: '3', brand: 'Google Play', brandLogo: '▶️', denomination: 25, price: 23, discount: 8 },
  { id: '4', brand: 'Steam', brandLogo: '🎮', denomination: 50, price: 45, discount: 10 },
  { id: '5', brand: 'Spotify', brandLogo: '🎵', denomination: 30, price: 27, discount: 10 },
  { id: '6', brand: 'Netflix', brandLogo: '🎬', denomination: 30, price: 27, discount: 10 },
  { id: '7', brand: 'Walmart', brandLogo: '🛍️', denomination: 50, price: 45, discount: 10 },
  { id: '8', brand: 'Target', brandLogo: '🎯', denomination: 25, price: 22.50, discount: 10 },
];

export default function GiftCardsScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const { walletAddress, authenticated } = usePrivyContext();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'food', name: 'Food' },
  ];

  const filteredCards = GIFT_CARDS.filter(card => {
    const matchesSearch = card.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePurchase = (card: GiftCard) => {
    if (!authenticated) {
      Alert.alert('Connect Wallet', 'Please connect your wallet to purchase gift cards');
      return;
    }
    Alert.alert(
      'Purchase Gift Card',
      `Buy $${card.denomination} ${card.brand} card for $${card.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Now', onPress: () => Alert.alert('Success', 'Gift card purchased!') },
      ]
    );
  };

  const renderGiftCard = ({ item }: { item: GiftCard }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={() => handlePurchase(item)}
    >
      <View style={styles.cardLogo}>
        <Text style={styles.brandEmoji}>{item.brandLogo}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardBrand, { color: theme.text }]}>{item.brand}</Text>
        <Text style={[styles.cardDenomination, { color: theme.textSecondary }]}>
          ${item.denomination} value
        </Text>
      </View>
      <View style={styles.cardPrice}>
        <Text style={[styles.priceText, { color: theme.primary }]}>${item.price.toFixed(2)}</Text>
        <View style={[styles.discountBadge, { backgroundColor: theme.success + '20' }]}>
          <Text style={[styles.discountText, { color: theme.success }]}>{item.discount}% off</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gift Cards</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search brands..."
            placeholderTextColor={theme.textTertiary}
          />
        </View>
      </View>

      <View style={styles.categories}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              { backgroundColor: theme.surface },
              selectedCategory === cat.id && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === cat.id ? '#FFF' : theme.textSecondary }
            ]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCards}
        keyExtractor={(item) => item.id}
        renderItem={renderGiftCard}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />

      <View style={[styles.promoBanner, { backgroundColor: theme.primary }]}>
        <Ionicons name="gift" size={24} color="#FFF" />
        <View style={styles.promoText}>
          <Text style={styles.promoTitle}>Give the Gift of Crypto</Text>
          <Text style={styles.promoSubtitle}>Send digital gift cards to anyone, anywhere</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md },
  searchInput: { flex: 1, fontSize: 16, marginLeft: spacing.sm },
  categories: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  categoryChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  categoryText: { fontSize: 12, fontWeight: '600' },
  grid: { paddingHorizontal: spacing.lg },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  cardLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  brandEmoji: { fontSize: 24 },
  cardInfo: { marginBottom: spacing.sm },
  cardBrand: { fontSize: 14, fontWeight: '600' },
  cardDenomination: { fontSize: 12, marginTop: 2 },
  cardPrice: { alignItems: 'flex-start' },
  priceText: { fontSize: 18, fontWeight: '700' },
  discountBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  discountText: { fontSize: 10, fontWeight: '600' },
  promoBanner: { flexDirection: 'row', alignItems: 'center', margin: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md },
  promoText: { marginLeft: spacing.md, flex: 1 },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  promoSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});