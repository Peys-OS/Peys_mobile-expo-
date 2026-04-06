import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';

interface StatementPeriod {
  id: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  transactionCount: number;
}

export default function FinancialStatementsScreen() {
  const { transactions, totalBalanceUSD } = useApp();

  const generateStatement = (period: 'monthly' | 'quarterly' | 'yearly'): StatementPeriod => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const periodTransactions = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return txDate >= startDate && txDate <= endDate;
    });

    let income = 0;
    let expenses = 0;

    periodTransactions.forEach(tx => {
      if (tx.status === 'claimed' || tx.status === 'completed') {
        if (tx.type === 'receive') income += tx.amount;
        else expenses += tx.amount;
      }
    });

    return {
      id: `${period}-${startDate.getTime()}`,
      type: period,
      startDate,
      endDate,
      totalIncome: income,
      totalExpenses: expenses,
      netChange: income - expenses,
      transactionCount: periodTransactions.length,
    };
  };

  const monthly = generateStatement('monthly');
  const quarterly = generateStatement('quarterly');
  const yearly = generateStatement('yearly');

  const [selectedPeriod, setSelectedPeriod] = React.useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const currentStatement = selectedPeriod === 'monthly' ? monthly : selectedPeriod === 'quarterly' ? quarterly : yearly;

  const renderPeriodSummary = () => (
    <View style={styles.summaryCard}>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>${totalBalanceUSD.toLocaleString()}</Text>
      </View>
      
      <View style={styles.periodTabs}>
        {(['monthly', 'quarterly', 'yearly'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, selectedPeriod === p && styles.periodTabActive]}
            onPress={() => setSelectedPeriod(p)}
          >
            <Text style={[styles.periodTabText, selectedPeriod === p && styles.periodTabTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderIncomeExpense = () => (
    <View style={styles.incomeExpenseCard}>
      <View style={styles.incomeSection}>
        <Text style={styles.sectionLabel}>Total Income</Text>
        <Text style={styles.incomeValue}>+${currentStatement.totalIncome.toLocaleString()}</Text>
      </View>
      
      <View style={styles.expenseSection}>
        <Text style={styles.sectionLabel}>Total Expenses</Text>
        <Text style={styles.expenseValue}>-${currentStatement.totalExpenses.toLocaleString()}</Text>
      </View>
      
      <View style={[styles.netSection, currentStatement.netChange >= 0 ? styles.positive : styles.negative]}>
        <Text style={styles.netLabel}>Net Change</Text>
        <Text style={styles.netValue}>
          {currentStatement.netChange >= 0 ? '+' : ''}${currentStatement.netChange.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{currentStatement.transactionCount}</Text>
          <Text style={styles.metricLabel}>Transactions</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            ${currentStatement.transactionCount > 0 
              ? (currentStatement.totalIncome / currentStatement.transactionCount).toFixed(2) 
              : '0.00'}
          </Text>
          <Text style={styles.metricLabel}>Avg Transaction</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {currentStatement.totalIncome > 0 
              ? ((currentStatement.netChange / currentStatement.totalIncome) * 100).toFixed(1) 
              : '0'}%
          </Text>
          <Text style={styles.metricLabel}>Savings Rate</Text>
        </View>
      </View>
    </View>
  );

  const renderTransactionBreakdown = () => {
    const incomeTxs = transactions.filter(t => t.type === 'receive').slice(0, 5);
    const expenseTxs = transactions.filter(t => t.type === 'send').slice(0, 5);

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Transaction Breakdown</Text>
        
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Income Sources</Text>
          {incomeTxs.map(tx => (
            <View key={tx.id} style={styles.breakdownItem}>
              <Text style={styles.breakdownDate}>
                {new Date(tx.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.breakdownAmount}>+${tx.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Expense Categories</Text>
          {expenseTxs.map(tx => (
            <View key={tx.id} style={styles.breakdownItem}>
              <Text style={styles.breakdownDate}>
                {new Date(tx.created_at).toLocaleDateString()}
              </Text>
              <Text style={[styles.breakdownAmount, styles.expenseAmount]}>
                -${tx.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Statements</Text>
      </View>

      {renderPeriodSummary()}
      {renderIncomeExpense()}
      {renderMetrics()}
      {renderTransactionBreakdown()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodTabActive: {
    backgroundColor: '#007AFF',
  },
  periodTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  incomeExpenseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  incomeSection: {
    marginBottom: 16,
  },
  expenseSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#34C759',
  },
  expenseValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF3B30',
  },
  netSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  positive: {},
  negative: {},
  netLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  netValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  metricsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
  },
  breakdownContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  breakdownSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownDate: {
    fontSize: 14,
    color: '#666',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  expenseAmount: {
    color: '#FF3B30',
  },
});