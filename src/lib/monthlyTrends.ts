import { TransactionAnalytics } from './transactionAnalytics';

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  netChange: number;
  transactionCount: number;
  avgTransaction: number;
}

export interface TrendAnalysis {
  currentMonth: MonthlyTrend;
  previousMonth: MonthlyTrend;
  monthOverMonthChange: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface YearOverYearData {
  currentYear: number;
  previousYear: number;
  yoyChange: number;
  yoyPercentage: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthlyTrends = {
  generateMonthlyTrend(
    transactions: any[],
    year: number,
    month: number
  ): MonthlyTrend {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    const income = monthTransactions
      .filter(t => t.type === 'receive' && (t.status === 'claimed' || t.status === 'completed'))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'send' && (t.status === 'claimed' || t.status === 'completed'))
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionCount = monthTransactions.filter(
      t => t.status === 'claimed' || t.status === 'completed'
    ).length;

    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      monthLabel: `${MONTH_NAMES[month]} ${year}`,
      income,
      expenses,
      netChange: income - expenses,
      transactionCount,
      avgTransaction: transactionCount > 0 ? (income + expenses) / transactionCount : 0,
    };
  },

  getAllMonthlyTrends(
    transactions: any[],
    months: number = 12
  ): MonthlyTrend[] {
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const trend = this.generateMonthlyTrend(
        transactions,
        date.getFullYear(),
        date.getMonth()
      );
      trends.unshift(trend);
    }

    return trends;
  },

  analyzeTrend(transactions: any[]): TrendAnalysis {
    const now = new Date();
    
    const current = this.generateMonthlyTrend(
      transactions,
      now.getFullYear(),
      now.getMonth()
    );

    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const previous = this.generateMonthlyTrend(
      transactions,
      previousYear,
      previousMonth
    );

    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previous.netChange !== 0) {
      trendPercentage = ((current.netChange - previous.netChange) / Math.abs(previous.netChange)) * 100;
      
      if (trendPercentage > 5) trendDirection = 'up';
      else if (trendPercentage < -5) trendDirection = 'down';
    }

    const monthOverMonthChange = current.netChange - previous.netChange;

    return {
      currentMonth: current,
      previousMonth: previous,
      monthOverMonthChange,
      trendDirection,
      trendPercentage,
    };
  },

  getYearOverYear(transactions: any[]): YearOverYearData | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;

    const currentData = this.generateMonthlyTrend(
      transactions,
      currentYear,
      now.getMonth()
    );

    const previousData = this.generateMonthlyTrend(
      transactions,
      previousYear,
      now.getMonth()
    );

    const yoyChange = currentData.netChange - previousData.netChange;
    const yoyPercentage = previousData.netChange !== 0
      ? (yoyChange / Math.abs(previousData.netChange)) * 100
      : 0;

    return {
      currentYear,
      previousYear,
      yoyChange,
      yoyPercentage,
    };
  },

  getMonthlyAverage(
    transactions: any[],
    metric: 'income' | 'expenses' | 'netChange' = 'expenses'
  ): number {
    const trends = this.getAllMonthlyTrends(transactions, 6);
    
    const validTrends = trends.filter(t => t.transactionCount > 0);
    if (validTrends.length === 0) return 0;

    const sum = validTrends.reduce((acc, t) => acc + t[metric], 0);
    return sum / validTrends.length;
  },

  getSpendingVelocity(transactions: any[]): {
    current: number;
    average: number;
    projected: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const trends = this.getAllMonthlyTrends(transactions, 3);
    
    const recentAvg = this.getMonthlyAverage(transactions.slice(0, 30), 'expenses');
    
    const older = trends.slice(0, 2).reduce((sum, t) => sum + t.expenses, 0) / 2;
    const newer = trends.slice(1).reduce((sum, t) => sum + t.expenses, 0) / 2;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (newer > older * 1.1) trend = 'increasing';
    else if (newer < older * 0.9) trend = 'decreasing';

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projected = (recentAvg / dayOfMonth) * daysInMonth;

    return {
      current: recentAvg,
      average: older,
      projected,
      trend,
    };
  },

  getPeakSpendingDay(transactions: any[]): {
    dayOfWeek: number;
    dayName: string;
    avgAmount: number;
  } {
    const dayTotals: Record<number, { total: number; count: number }> = {
      0: { total: 0, count: 0 },
      1: { total: 0, count: 0 },
      2: { total: 0, count: 0 },
      3: { total: 0, count: 0 },
      4: { total: 0, count: 0 },
      5: { total: 0, count: 0 },
      6: { total: 0, count: 0 },
    };

    const sendTxs = transactions.filter(t => t.type === 'send');
    sendTxs.forEach(tx => {
      const day = new Date(tx.created_at).getDay();
      dayTotals[day].total += tx.amount;
      dayTotals[day].count++;
    });

    let maxDay = 0;
    let maxAvg = 0;

    Object.entries(dayTotals).forEach(([day, data]) => {
      const avg = data.count > 0 ? data.total / data.count : 0;
      if (avg > maxAvg) {
        maxAvg = avg;
        maxDay = parseInt(day);
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      dayOfWeek: maxDay,
      dayName: dayNames[maxDay],
      avgAmount: maxAvg,
    };
  },

  getForecast(
    transactions: any[],
    months: number = 3
  ): { month: string; predicted: number; confidence: number }[] {
    const history = this.getAllMonthlyTrends(transactions, 6);
    
    const validHistory = history.filter(t => t.transactionCount > 0);
    if (validHistory.length < 2) {
      return [];
    }

    const n = validHistory.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = validHistory.reduce((sum, t) => sum + t.expenses, 0);
    const sumXY = validHistory.reduce(
      (sum, t, i) => sum + i * t.expenses,
      0
    );
    const sumX2 = (n - 1) * n * (2 * n - 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast: { month: string; predicted: number; confidence: number }[] = [];
    const now = new Date();

    for (let i = 1; i <= months; i++) {
      const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const x = n + i - 1;
      const predicted = Math.max(0, slope * x + intercept);
      const confidence = Math.max(0, Math.min(100, 100 - (i * 20)));

      forecast.push({
        month: `${MONTH_NAMES[forecastMonth.getMonth()].substring(0, 3)} ${forecastMonth.getFullYear()}`,
        predicted,
        confidence,
      });
    }

    return forecast;
  },

  compareWithPeers(
    transactions: any[],
    peerAverage: number
  ): {
    comparison: 'above' | 'below' | 'average';
    difference: number;
    percentageDiff: number;
  } {
    const myAverage = this.getMonthlyAverage(transactions, 'expenses');
    
    if (peerAverage === 0) {
      return { comparison: 'average', difference: 0, percentageDiff: 0 };
    }

    const percentageDiff = ((myAverage - peerAverage) / peerAverage) * 100;
    const difference = myAverage - peerAverage;

    let comparison: 'above' | 'below' | 'average' = 'average';
    if (percentageDiff > 10) comparison = 'above';
    else if (percentageDiff < -10) comparison = 'below';

    return { comparison, difference, percentageDiff };
  },
};

export const getMonthlyTrends = (transactions: any[], months?: number) => 
  MonthlyTrends.getAllMonthlyTrends(transactions, months);

export const analyzeMonthlyTrend = (transactions: any[]) => 
  MonthlyTrends.analyzeTrend(transactions);

export const getSpendingForecast = (transactions: any[], months?: number) => 
  MonthlyTrends.getForecast(transactions, months);

export const getYearOverYear = (transactions: any[]) => 
  MonthlyTrends.getYearOverYear(transactions);