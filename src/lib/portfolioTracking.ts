import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PortfolioToken {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  priceUSD: number;
  change24h: number;
  changePercentage24h: number;
  allocation: number;
}

export interface PortfolioSnapshot {
  totalValueUSD: number;
  totalChange24h: number;
  totalChangePercentage24h: number;
  tokens: PortfolioToken[];
  timestamp: number;
}

export interface PortfolioHistory {
  date: string;
  value: number;
  change: number;
  changePercentage: number;
}

const STORAGE_KEY = 'portfolio_data';
const HISTORY_KEY = 'portfolio_history';

const DEFAULT_PORTFOLIO: PortfolioToken[] = [
  { symbol: 'USDC', name: 'USD Coin', balance: 0, valueUSD: 0, priceUSD: 1, change24h: 0, changePercentage24h: 0, allocation: 0 },
  { symbol: 'ETH', name: 'Ethereum', balance: 0, valueUSD: 0, priceUSD: 0, change24h: 0, changePercentage24h: 0, allocation: 0 },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0, valueUSD: 0, priceUSD: 0, change24h: 0, changePercentage24h: 0, allocation: 0 },
];

export const PortfolioTracking = {
  tokens: [...DEFAULT_PORTFOLIO] as PortfolioToken[],
  history: [] as PortfolioHistory[],

  async loadPortfolio(): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.tokens = JSON.parse(stored);
      } catch {
        this.tokens = [...DEFAULT_PORTFOLIO];
      }
    }

    const historyStored = await AsyncStorage.getItem(HISTORY_KEY);
    if (historyStored) {
      try {
        this.history = JSON.parse(historyStored);
      } catch {
        this.history = [];
      }
    }
  },

  async savePortfolio(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.tokens));
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-365)));
  },

  getSnapshot(): PortfolioSnapshot {
    const totalValue = this.tokens.reduce((sum, t) => sum + t.valueUSD, 0);
    const totalChange = this.tokens.reduce((sum, t) => sum + (t.valueUSD * (t.changePercentage24h / 100)), 0);
    const totalChangePercentage = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

    return {
      totalValueUSD: totalValue,
      totalChange24h: totalChange,
      totalChangePercentage24h: totalChangePercentage,
      tokens: this.tokens,
      timestamp: Date.now(),
    };
  },

  async updateTokenPrice(symbol: string, priceUSD: number, change24h: number): Promise<void> {
    const token = this.tokens.find(t => t.symbol === symbol);
    if (!token) return;

    token.priceUSD = priceUSD;
    token.valueUSD = token.balance * priceUSD;
    token.change24h = change24h;
    token.changePercentage24h = token.balance > 0 ? (change24h / (priceUSD - change24h)) * 100 : 0;

    const totalValue = this.tokens.reduce((sum, t) => sum + t.valueUSD, 0);
    this.tokens.forEach(t => {
      t.allocation = totalValue > 0 ? (t.valueUSD / totalValue) * 100 : 0;
    });

    await this.savePortfolio();
  },

  async updateBalance(symbol: string, balance: number): Promise<void> {
    const token = this.tokens.find(t => t.symbol === symbol);
    if (!token) {
      this.tokens.push({
        symbol,
        name: symbol,
        balance,
        valueUSD: 0,
        priceUSD: 0,
        change24h: 0,
        changePercentage24h: 0,
        allocation: 0,
      });
    } else {
      token.balance = balance;
      token.valueUSD = balance * token.priceUSD;
    }

    const totalValue = this.tokens.reduce((sum, t) => sum + t.valueUSD, 0);
    this.tokens.forEach(t => {
      t.allocation = totalValue > 0 ? (t.valueUSD / totalValue) * 100 : 0;
    });

    await this.savePortfolio();
  },

  async recordSnapshot(): Promise<void> {
    const snapshot = this.getSnapshot();
    
    this.history.push({
      date: new Date().toISOString().split('T')[0],
      value: snapshot.totalValueUSD,
      change: snapshot.totalChange24h,
      changePercentage: snapshot.totalChangePercentage24h,
    });

    this.history = this.history.slice(-365);
    await this.savePortfolio();
  },

  getHistory(days: number = 30): PortfolioHistory[] {
    return this.history.slice(-days);
  },

  getPerformance(days: number = 30): {
    startValue: number;
    endValue: number;
    change: number;
    changePercentage: number;
    apy: number;
  } {
    const history = this.getHistory(days);
    
    if (history.length < 2) {
      return { startValue: 0, endValue: 0, change: 0, changePercentage: 0, apy: 0 };
    }

    const startValue = history[0].value;
    const endValue = history[history.length - 1].value;
    const change = endValue - startValue;
    const changePercentage = startValue > 0 ? (change / startValue) * 100 : 0;

    const apy = days < 365 
      ? (Math.pow((endValue / startValue), (365 / days)) - 1) * 100
      : changePercentage;

    return { startValue, endValue, change, changePercentage, apy: apy || 0 };
  },

  getTokenAllocation(symbol: string): number {
    const token = this.tokens.find(t => t.symbol === symbol);
    return token?.allocation || 0;
  },

  getTopHolding(): PortfolioToken | null {
    if (this.tokens.length === 0) return null;
    return this.tokens.reduce((max, t) => t.valueUSD > max.valueUSD ? t : max);
  },

  getDiversificationScore(): number {
    const holdings = this.tokens.filter(t => t.allocation > 0);
    if (holdings.length < 2) return 0;

    const allocations = holdings.map(t => t.allocation);
    const idealAllocation = 100 / holdings.length;
    
    let score = 100;
    allocations.forEach(alloc => {
      const deviation = Math.abs(alloc - idealAllocation);
      score -= deviation * 0.5;
    });

    return Math.max(0, score);
  },

  getTokenBySymbol(symbol: string): PortfolioToken | undefined {
    return this.tokens.find(t => t.symbol === symbol);
  },

  getAllTokens(): PortfolioToken[] {
    return [...this.tokens];
  },

  async addCustomToken(symbol: string, name: string): Promise<void> {
    const existing = this.tokens.find(t => t.symbol === symbol);
    if (existing) return;

    this.tokens.push({
      symbol,
      name,
      balance: 0,
      valueUSD: 0,
      priceUSD: 0,
      change24h: 0,
      changePercentage24h: 0,
      allocation: 0,
    });

    await this.savePortfolio();
  },

  async removeToken(symbol: string): Promise<boolean> {
    const index = this.tokens.findIndex(t => t.symbol === symbol);
    if (index === -1) return false;

    this.tokens.splice(index, 1);
    await this.savePortfolio();
    return true;
  },

  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  },

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  },
};

export const getPortfolioSnapshot = () => PortfolioTracking.getSnapshot();
export const getPortfolioHistory = (days?: number) => PortfolioTracking.getHistory(days);
export const getPerformance = (days?: number) => PortfolioTracking.getPerformance(days);
export const updateTokenPrice = (symbol: string, price: number, change: number) => 
  PortfolioTracking.updateTokenPrice(symbol, price, change);
export const updateTokenBalance = (symbol: string, balance: number) => 
  PortfolioTracking.updateBalance(symbol, balance);