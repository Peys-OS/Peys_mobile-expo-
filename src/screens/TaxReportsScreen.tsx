import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';

interface Transaction {
  id: string;
  amount: number;
  token: string;
  status: string;
  type: 'send' | 'receive';
  created_at: string;
}

interface TaxReport {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netGain: number;
  transactions: number;
  estimatedTax: number;
}

const TAX_RATES = {
  shortTerm: 0.37,
  longTerm: 0.20,
};

export default function TaxReportsScreen() {
  const { transactions } = useApp();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const generateTaxReport = (year: number): TaxReport => {
    const yearTransactions = transactions.filter(t => {
      const txYear = new Date(t.created_at).getFullYear();
      return txYear === year;
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let count = 0;

    yearTransactions.forEach(tx => {
      if (tx.status === 'claimed' || tx.status === 'completed') {
        if (tx.type === 'receive') {
          totalIncome += tx.amount;
        } else {
          totalExpenses += tx.amount;
        }
        count++;
      }
    });

    const netGain = totalIncome - totalExpenses;
    const estimatedTax = netGain > 0 ? netGain * TAX_RATES.shortTerm : 0;

    return {
      year,
      totalIncome,
      totalExpenses,
      netGain,
      transactions: count,
      estimatedTax,
    };
  };

  const years = [2026, 2025, 2024, 2023];
  const currentReport = generateTaxReport(selectedYear);

  const renderReportSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Tax Year {selectedYear}</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Income</Text>
        <Text style={[styles.summaryValue, styles.incomeText]}>
          ${currentReport.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={[styles.summaryValue, styles.expenseText]}>
          ${currentReport.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
      
      <View style={[styles.summaryRow, styles.divider]}>
        <Text style={styles.summaryLabel}>Net Gain/Loss</Text>
        <Text style={[styles.summaryValue, currentReport.netGain >= 0 ? styles.incomeText : styles.expenseText]}>
          ${currentReport.netGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Transactions</Text>
        <Text style={styles.summaryValue}>{currentReport.transactions}</Text>
      </View>
      
      <View style={[styles.summaryRow, styles.taxRow]}>
        <Text style={styles.taxLabel}>Estimated Tax</Text>
        <Text style={styles.taxValue}>
          ${currentReport.estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );

  const renderYearSelector = () => (
    <View style={styles.yearSelector}>
      {years.map(year => (
        <TouchableOpacity
          key={year}
          style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]}
          onPress={() => setSelectedYear(year)}
        >
          <Text style={[styles.yearButtonText, selectedYear === year && styles.yearButtonTextActive]}>
            {year}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInfoCards = () => (
    <View style={styles.infoContainer}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Short-term Capital Gains</Text>
        <Text style={styles.infoText}>Assets held less than 1 year taxed as ordinary income</Text>
        <Text style={styles.infoRate}>Rate: {TAX_RATES.shortTerm * 100}%</Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Long-term Capital Gains</Text>
        <Text style={styles.infoText}>Assets held more than 1 year</Text>
        <Text style={styles.infoRate}>Rate: {TAX_RATES.longTerm * 100}%</Text>
      </View>
    </View>
  );

  const renderTransactionList = () => {
    const yearTransactions = transactions.filter(t => {
      const txYear = new Date(t.created_at).getFullYear();
      return txYear === selectedYear && (t.status === 'claimed' || t.status === 'completed');
    }).slice(0, 10);

    if (yearTransactions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions for {selectedYear}</Text>
        </View>
      );
    }

    return (
      <View style={styles.transactionList}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {yearTransactions.map(tx => (
          <View key={tx.id} style={styles.transactionItem}>
            <View style={styles.txLeft}>
              <Text style={styles.txType}>{tx.type === 'receive' ? 'Received' : 'Sent'}</Text>
              <Text style={styles.txDate}>
                {new Date(tx.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, tx.type === 'receive' ? styles.incomeText : styles.expenseText]}>
                {tx.type === 'receive' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
              <Text style={styles.txToken}>{tx.token}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const handleExport = () => {
    Alert.alert(
      'Export Tax Report',
      'Export as PDF or CSV?',
      [
        { text: 'PDF', onPress: () => console.log('Export PDF') },
        { text: 'CSV', onPress: () => console.log('Export CSV') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tax Reports</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {renderYearSelector()}
      {renderReportSummary()}
      {renderInfoCards()}
      {renderTransactionList()}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Disclaimer: This is for informational purposes only and does not constitute tax advice. 
          Please consult a tax professional for your specific situation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  yearButtonActive: {
    backgroundColor: '#007AFF',
  },
  yearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  yearButtonTextActive: {
    color: '#fff',
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  incomeText: {
    color: '#34C759',
  },
  expenseText: {
    color: '#FF3B30',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 4,
  },
  taxRow: {
    backgroundColor: '#f9f9f9',
    marginHorizontal: -20,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  taxLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  taxValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  transactionList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txLeft: {},
  txType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  txDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  txToken: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  disclaimer: {
    padding: 16,
    marginBottom: 40,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});