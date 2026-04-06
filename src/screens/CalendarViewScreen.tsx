import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { usePrivyContext } from '../contexts/PrivyContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: string;
  amount: number;
  token: string;
  status: string;
  created_at: string;
  sender_wallet: string;
  recipient_wallet: string;
  recipient_email: string;
}

export default function CalendarViewScreen({ navigation }: any) {
  const { walletAddress, authenticated } = usePrivyContext();
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (authenticated) fetchTransactions();
  }, [walletAddress, authenticated]);

  const fetchTransactions = async () => {
    if (!walletAddress) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`sender_wallet.eq.${walletAddress},recipient_wallet.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) setTransactions(data);
    } catch (e) { console.error(e); }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getTransactionsForDate = (date: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return transactions.filter(t => t.created_at.startsWith(dateStr));
  };

  const getTotalForDate = (date: number) => {
    const txs = getTransactionsForDate(date);
    return txs.reduce((sum, t) => sum + t.amount, 0);
  };

  const hasTransactionOnDate = (date: number) => getTransactionsForDate(date).length > 0;

  const selectedDateTransactions = getTransactionsForDate(selectedDate.getDate());
  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isSend = item.sender_wallet?.toLowerCase() === walletAddress?.toLowerCase();
    return (
      <View style={[styles.transactionItem, { backgroundColor: theme.surface }]}>
        <View style={[styles.txIcon, { backgroundColor: isSend ? '#FFF0F0' : '#F0FFF0' }]}>
          <Ionicons name={isSend ? 'arrow-up' : 'arrow-down'} size={16} color={isSend ? '#FF3B30' : '#34C759'} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txType, { color: theme.text }]}>{isSend ? 'Sent' : 'Received'}</Text>
          <Text style={[styles.txCounterparty, { color: theme.textTertiary }]} numberOfLines={1}>
            {item.recipient_email || item.recipient_wallet?.slice(0, 8) + '...'}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: isSend ? theme.error : theme.success }]}>
          {isSend ? '-' : '+'}${item.amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.monthSelector, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={[styles.dayLabel, { color: theme.textTertiary }]}>{day}</Text>
        ))}
        {days.map((day, index) => {
          const hasTx = day !== null && hasTransactionOnDate(day);
          return (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day === selectedDate.getDate() && { backgroundColor: theme.primary },
              hasTx && { borderColor: theme.primary, borderWidth: 1 },
            ]}
            onPress={() => day && setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
            disabled={!day}
          >
            {day && (
              <>
                <Text style={[
                  styles.dayNumber,
                  { color: day === selectedDate.getDate() ? '#FFF' : theme.text }
                ]}>{day}</Text>
                {hasTransactionOnDate(day) && (
                  <Text style={[
                    styles.dayAmount,
                    { color: day === selectedDate.getDate() ? '#FFF' : theme.textSecondary }
                  ]}>${getTotalForDate(day).toFixed(0)}</Text>
                )}
              </>
            )}
          </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.selectedDateSection}>
        <Text style={[styles.selectedDateText, { color: theme.text }]}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        {selectedDateTransactions.length > 0 ? (
          <FlatList
            data={selectedDateTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            style={styles.transactionList}
          />
        ) : (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={32} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No transactions</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, marginHorizontal: spacing.lg, borderRadius: borderRadius.md },
  monthText: { fontSize: 16, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, marginTop: spacing.md },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', paddingVertical: spacing.sm },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.sm },
  dayNumber: { fontSize: 14, fontWeight: '500' },
  dayAmount: { fontSize: 9, marginTop: 2 },
  selectedDateSection: { flex: 1, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  selectedDateText: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  transactionList: { flex: 1 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  txIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '500' },
  txCounterparty: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '600' },
  emptyDay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: spacing.sm },
});