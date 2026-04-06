import { useApp } from '../contexts/AppContext';

export interface TransactionAnalytics {
  totalVolume: number;
  averageTransaction: number;
  largestTransaction: number;
  smallestTransaction: number;
  transactionCount: number;
  sendCount: number;
  receiveCount: number;
  byToken: Record<string, { count: number; volume: number }>;
  byDay: Record<string, { count: number; volume: number }>;
  byHour: Record<number, { count: number; volume: number }>;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  count: number;
}

export const TransactionAnalytics = {
  analyze(transactions: any[]): TransactionAnalytics {
    if (transactions.length === 0) {
      return {
        totalVolume: 0,
        averageTransaction: 0,
        largestTransaction: 0,
        smallestTransaction: 0,
        transactionCount: 0,
        sendCount: 0,
        receiveCount: 0,
        byToken: {},
        byDay: {},
        byHour: {},
      };
    }

    const completedTxs = transactions.filter(t => 
      t.status === 'claimed' || t.status === 'completed'
    );

    const amounts = completedTxs.map(t => t.amount);
    const totalVolume = amounts.reduce((sum, a) => sum + a, 0);
    const averageTransaction = totalVolume / completedTxs.length;
    const largestTransaction = Math.max(...amounts);
    const smallestTransaction = Math.min(...amounts);
    const sendCount = completedTxs.filter(t => t.type === 'send').length;
    const receiveCount = completedTxs.filter(t => t.type === 'receive').length;

    const byToken: Record<string, { count: number; volume: number }> = {};
    completedTxs.forEach(tx => {
      if (!byToken[tx.token]) {
        byToken[tx.token] = { count: 0, volume: 0 };
      }
      byToken[tx.token].count++;
      byToken[tx.token].volume += tx.amount;
    });

    const byDay: Record<string, { count: number; volume: number }> = {};
    completedTxs.forEach(tx => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (!byDay[date]) {
        byDay[date] = { count: 0, volume: 0 };
      }
      byDay[date].count++;
      byDay[date].volume += tx.amount;
    });

    const byHour: Record<number, { count: number; volume: number }> = {};
    for (let i = 0; i < 24; i++) {
      byHour[i] = { count: 0, volume: 0 };
    }
    completedTxs.forEach(tx => {
      const hour = new Date(tx.created_at).getHours();
      byHour[hour].count++;
      byHour[hour].volume += tx.amount;
    });

    return {
      totalVolume,
      averageTransaction,
      largestTransaction,
      smallestTransaction,
      transactionCount: completedTxs.length,
      sendCount,
      receiveCount,
      byToken,
      byDay,
      byHour,
    };
  },

  getTopTokens(transactions: any[], limit: number = 5): { token: string; volume: number; count: number }[] {
    const analytics = this.analyze(transactions);
    
    return Object.entries(analytics.byToken)
      .map(([token, data]) => ({ token, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  },

  getTimeSeriesData(
    transactions: any[], 
    period: 'day' | 'week' | 'month' = 'day'
  ): TimeSeriesPoint[] {
    const analytics = this.analyze(transactions);
    const dailyData = analytics.byDay;
    
    const sortedDates = Object.keys(dailyData).sort();
    
    if (period === 'day') {
      return sortedDates.map(date => ({
        date,
        value: dailyData[date].volume,
        count: dailyData[date].count,
      }));
    }
    
    if (period === 'week') {
      const weekly: Record<string, { volume: number; count: number }> = {};
      sortedDates.forEach(date => {
        const d = new Date(date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekly[weekKey]) {
          weekly[weekKey] = { volume: 0, count: 0 };
        }
        weekly[weekKey].volume += dailyData[date].volume;
        weekly[weekKey].count += dailyData[date].count;
      });
      
      return Object.entries(weekly)
        .map(([date, data]) => ({ date, value: data.volume, count: data.count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    
    const monthly: Record<string, { volume: number; count: number }> = {};
    sortedDates.forEach(date => {
      const monthKey = date.substring(0, 7);
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = { volume: 0, count: 0 };
      }
      monthly[monthKey].volume += dailyData[date].volume;
      monthly[monthKey].count += dailyData[date].count;
    });
    
    return Object.entries(monthly)
      .map(([date, data]) => ({ date, value: data.volume, count: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getPeakHours(transactions: any[]): { hour: number; count: number; volume: number }[] {
    const analytics = this.analyze(transactions);
    
    return Object.entries(analytics.byHour)
      .map(([hour, data]) => ({ hour: parseInt(hour), ...data }))
      .sort((a, b) => b.count - a.count);
  },

  getTransactionVelocity(transactions: any[], windowMinutes: number = 60): {
    avgVelocity: number;
    maxVelocity: number;
    peakPeriod: { start: Date; end: Date; count: number };
  } {
    if (transactions.length < 2) {
      return { avgVelocity: 0, maxVelocity: 0, peakPeriod: { start: new Date(), end: new Date(), count: 0 } };
    }

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const windowMs = windowMinutes * 60 * 1000;
    let maxVelocity = 0;
    let peakCount = 0;
    let peakStart = new Date();
    let peakEnd = new Date();

    for (let i = 0; i < sorted.length; i++) {
      const windowStart = new Date(sorted[i].created_at).getTime();
      const windowEnd = windowStart + windowMs;
      
      let count = 0;
      for (let j = i; j < sorted.length; j++) {
        const txTime = new Date(sorted[j].created_at).getTime();
        if (txTime <= windowEnd) {
          count++;
        } else {
          break;
        }
      }
      
      if (count > maxVelocity) {
        maxVelocity = count;
        peakCount = count;
        peakStart = new Date(windowStart);
        peakEnd = new Date(windowStart + windowMs);
      }
    }

    const avgVelocity = transactions.length / ((sorted[sorted.length - 1].created_at - sorted[0].created_at) / (1000 * 60 * 60));

    return {
      avgVelocity: avgVelocity || 0,
      maxVelocity,
      peakPeriod: { start: peakStart, end: peakEnd, count: peakCount },
    };
  },

  getSpendingCategories(transactions: any[]): SpendingCategory[] {
    const sentTxs = transactions.filter(t => t.type === 'send');
    const totalSent = sentTxs.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    sentTxs.forEach(tx => {
      const category = (tx as any).category || 'uncategorized';
      const existing = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: existing.amount + tx.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalSent > 0 ? (data.amount / totalSent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  getGrowthRate(transactions: any[], periods: number = 3): { period: string; rate: number }[] {
    const timeSeries = this.getTimeSeriesData(transactions, 'month');
    
    if (timeSeries.length < 2) {
      return [];
    }

    const recentMonths = timeSeries.slice(-periods);
    const rates: { period: string; rate: number }[] = [];

    for (let i = 1; i < recentMonths.length; i++) {
      const prev = recentMonths[i - 1].value;
      const curr = recentMonths[i].value;
      const rate = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      rates.push({ period: recentMonths[i].date, rate });
    }

    return rates;
  },

  calculateNetWorthChange(transactions: any[], days: number = 30): {
    change: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  } {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentTxs = transactions.filter(t => 
      new Date(t.created_at) >= cutoff
    );

    const income = recentTxs
      .filter(t => t.type === 'receive')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = recentTxs
      .filter(t => t.type === 'send')
      .reduce((sum, t) => sum + t.amount, 0);

    const change = income - expenses;
    const percentage = expenses > 0 ? ((income - expenses) / expenses) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 0) trend = 'up';
    else if (change < 0) trend = 'down';

    return { change, percentage, trend };
  },
};

export const useTransactionAnalytics = () => {
  const { transactions } = useApp();
  
  return {
    analytics: TransactionAnalytics.analyze(transactions),
    topTokens: TransactionAnalytics.getTopTokens(transactions),
    timeSeries: TransactionAnalytics.getTimeSeriesData(transactions),
    spendingCategories: TransactionAnalytics.getSpendingCategories(transactions),
    velocity: TransactionAnalytics.getTransactionVelocity(transactions),
    growthRate: TransactionAnalytics.getGrowthRate(transactions),
    netWorthChange: TransactionAnalytics.calculateNetWorthChange(transactions),
  };
};

export const getTransactionAnalytics = (transactions: any[]) => {
  return TransactionAnalytics.analyze(transactions);
};

export const getSpendingBreakdown = (transactions: any[]) => {
  return TransactionAnalytics.getSpendingCategories(transactions);
};

export const getTimeSeries = (transactions: any[], period?: 'day' | 'week' | 'month') => {
  return TransactionAnalytics.getTimeSeriesData(transactions, period);
};