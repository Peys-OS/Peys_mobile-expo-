import { TransactionAnalytics } from './transactionAnalytics';

export interface IncomeVsExpenses {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  savingsRate: number;
  expenseRatio: number;
  incomeCount: number;
  expenseCount: number;
}

export interface MonthlyComparison {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export const IncomeVsExpenses = {
  analyze(transactions: any[]): IncomeVsExpenses {
    const income = transactions
      .filter(t => t.type === 'receive' && (t.status === 'claimed' || t.status === 'completed'))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'send' && (t.status === 'claimed' || t.status === 'completed'))
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeCount = transactions.filter(
      t => t.type === 'receive' && (t.status === 'claimed' || t.status === 'completed')
    ).length;

    const expenseCount = transactions.filter(
      t => t.type === 'send' && (t.status === 'claimed' || t.status === 'completed')
    ).length;

    const netFlow = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netFlow,
      savingsRate,
      expenseRatio,
      incomeCount,
      expenseCount,
    };
  },

  getMonthlyComparison(transactions: any[], months: number = 6): MonthlyComparison[] {
    const comparison: MonthlyComparison[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTxs = transactions.filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const income = monthTxs
        .filter(t => t.type === 'receive')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTxs
        .filter(t => t.type === 'send')
        .reduce((sum, t) => sum + t.amount, 0);

      comparison.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        net: income - expenses,
      });
    }

    return comparison;
  },

  getCategoryBreakdown(transactions: any[]): CategoryBreakdown[] {
    const expenses = transactions.filter(t => t.type === 'send');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    expenses.forEach(tx => {
      const category = (tx as any).category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + tx.amount;
    });

    const categories = [
      { id: 'food', name: 'Food & Dining', color: '#FF9500' },
      { id: 'transport', name: 'Transportation', color: '#007AFF' },
      { id: 'shopping', name: 'Shopping', color: '#FF2D55' },
      { id: 'bills', name: 'Bills', color: '#5856D6' },
      { id: 'entertainment', name: 'Entertainment', color: '#FF3B30' },
      { id: 'health', name: 'Health', color: '#34C759' },
      { id: 'travel', name: 'Travel', color: '#00C7BE' },
      { id: 'other', name: 'Other', color: '#8E8E93' },
    ];

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId) || categories[categories.length - 1];
        return {
          categoryId,
          categoryName: category.name,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: category.color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  },

  getHealthScore(transactions: any[]): {
    score: number;
    rating: string;
    feedback: string[];
  } {
    const analysis = this.analyze(transactions);
    const feedback: string[] = [];
    let score = 100;

    if (analysis.savingsRate < 0) {
      score -= 40;
      feedback.push('You are spending more than you earn');
    } else if (analysis.savingsRate < 10) {
      score -= 20;
      feedback.push('Aim to save at least 10% of income');
    } else if (analysis.savingsRate >= 20) {
      feedback.push('Great savings rate!');
    }

    if (analysis.expenseRatio > 90) {
      score -= 30;
      feedback.push('High expense ratio - consider reducing costs');
    }

    if (analysis.expenseCount > analysis.incomeCount * 3) {
      score -= 15;
      feedback.push('Many small transactions add up');
    }

    let rating = 'Poor';
    if (score >= 80) rating = 'Excellent';
    else if (score >= 60) rating = 'Good';
    else if (score >= 40) rating = 'Fair';

    return { score: Math.max(0, score), rating, feedback };
  },

  getIncomeSources(transactions: any[]): { address: string; total: number; count: number }[] {
    const receiveTxs = transactions.filter(t => t.type === 'receive');
    
    const sources: Record<string, { total: number; count: number }> = {};
    receiveTxs.forEach(tx => {
      const source = tx.counterparty || 'Unknown';
      if (!sources[source]) {
        sources[source] = { total: 0, count: 0 };
      }
      sources[source].total += tx.amount;
      sources[source].count++;
    });

    return Object.entries(sources)
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  },

  getExpenseStreams(transactions: any[]): { recipient: string; total: number; count: number }[] {
    const sendTxs = transactions.filter(t => t.type === 'send');
    
    const recipients: Record<string, { total: number; count: number }> = {};
    sendTxs.forEach(tx => {
      const recipient = tx.counterparty || 'Unknown';
      if (!recipients[recipient]) {
        recipients[recipient] = { total: 0, count: 0 };
      }
      recipients[recipient].total += tx.amount;
      recipients[recipient].count++;
    });

    return Object.entries(recipients)
      .map(([recipient, data]) => ({ recipient, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  },

  getBurnRate(transactions: any[]): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    const expenses = transactions
      .filter(t => t.type === 'send')
      .reduce((sum, t) => sum + t.amount, 0);

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (sorted.length < 2) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }

    const firstTx = new Date(sorted[0].created_at);
    const lastTx = new Date(sorted[sorted.length - 1].created_at);
    const days = Math.max(1, (lastTx.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24));

    const daily = expenses / days;
    const weekly = daily * 7;
    const monthly = daily * 30;

    return { daily, weekly, monthly };
  },
};

export const getIncomeVsExpenses = (transactions: any[]) => 
  IncomeVsExpenses.analyze(transactions);

export const getMonthlyComparison = (transactions: any[], months?: number) => 
  IncomeVsExpenses.getMonthlyComparison(transactions, months);

export const getFinancialHealth = (transactions: any[]) => 
  IncomeVsExpenses.getHealthScore(transactions);