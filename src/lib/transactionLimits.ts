import { SecureStorage } from './secureStorage';

export interface TransactionLimit {
  daily: number;
  weekly: number;
  monthly: number;
  perTransaction: number;
}

export interface LimitConfig {
  enabled: boolean;
  limits: TransactionLimit;
  requireConfirmationAbove: number;
  blockAbove: number;
}

const DEFAULT_LIMITS: TransactionLimit = {
  daily: 10000,
  weekly: 50000,
  monthly: 200000,
  perTransaction: 5000,
};

const DEFAULT_CONFIG: LimitConfig = {
  enabled: true,
  limits: DEFAULT_LIMITS,
  requireConfirmationAbove: 1000,
  blockAbove: 50000,
};

const STORAGE_KEY = 'transaction_limits_data';

interface LimitData {
  dailySpent: number;
  weeklySpent: number;
  monthlySpent: number;
  dailyReset: number;
  weeklyReset: number;
  monthlyReset: number;
  lastTransactionTime: number;
}

export const TransactionLimits = {
  config: { ...DEFAULT_CONFIG },
  data: {
    dailySpent: 0,
    weeklySpent: 0,
    monthlySpent: 0,
    dailyReset: Date.now(),
    weeklyReset: Date.now(),
    monthlyReset: Date.now(),
    lastTransactionTime: 0,
  } as LimitData,

  async loadData(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const limitData = (stored as any)?.[STORAGE_KEY];
    if (limitData) {
      try {
        this.data = JSON.parse(limitData);
      } catch {
        this.resetPeriods();
      }
    }
    this.checkResets();
  },

  async saveData(): Promise<void> {
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [STORAGE_KEY]: JSON.stringify(this.data),
    });
  },

  checkResets(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    if (now - this.data.dailyReset > dayMs) {
      this.data.dailySpent = 0;
      this.data.dailyReset = now;
    }
    if (now - this.data.weeklyReset > weekMs) {
      this.data.weeklySpent = 0;
      this.data.weeklyReset = now;
    }
    if (now - this.data.monthlyReset > monthMs) {
      this.data.monthlySpent = 0;
      this.data.monthlyReset = now;
    }
  },

  resetPeriods(): void {
    const now = Date.now();
    this.data = {
      dailySpent: 0,
      weeklySpent: 0,
      monthlySpent: 0,
      dailyReset: now,
      weeklyReset: now,
      monthlyReset: now,
      lastTransactionTime: 0,
    };
  },

  configure(options: Partial<LimitConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): LimitConfig {
    return { ...this.config };
  },

  setLimits(limits: Partial<TransactionLimit>): void {
    this.config.limits = { ...this.config.limits, ...limits };
  },

  getLimits(): TransactionLimit {
    return { ...this.config.limits };
  },

  async checkLimit(amount: number): Promise<{
    allowed: boolean;
    reason?: string;
    requiresConfirmation: boolean;
    limitType?: 'daily' | 'weekly' | 'monthly' | 'perTransaction';
  }> {
    if (!this.config.enabled) {
      return { allowed: true, requiresConfirmation: false };
    }

    await this.loadData();

    if (amount > this.config.blockAbove) {
      return {
        allowed: false,
        reason: `Amount exceeds maximum allowed ($${this.config.blockAbove})`,
        requiresConfirmation: false,
      };
    }

    if (amount > this.config.limits.perTransaction) {
      return {
        allowed: false,
        reason: `Per-transaction limit exceeded ($${this.config.limits.perTransaction})`,
        requiresConfirmation: false,
        limitType: 'perTransaction',
      };
    }

    if (this.data.dailySpent + amount > this.config.limits.daily) {
      return {
        allowed: false,
        reason: `Daily limit would be exceeded ($${this.config.limits.daily})`,
        requiresConfirmation: false,
        limitType: 'daily',
      };
    }

    if (this.data.weeklySpent + amount > this.config.limits.weekly) {
      return {
        allowed: false,
        reason: `Weekly limit would be exceeded ($${this.config.limits.weekly})`,
        requiresConfirmation: false,
        limitType: 'weekly',
      };
    }

    if (this.data.monthlySpent + amount > this.config.limits.monthly) {
      return {
        allowed: false,
        reason: `Monthly limit would be exceeded ($${this.config.limits.monthly})`,
        requiresConfirmation: false,
        limitType: 'monthly',
      };
    }

    const requiresConfirmation = amount >= this.config.requireConfirmationAbove;
    
    if (requiresConfirmation) {
      return {
        allowed: true,
        requiresConfirmation: true,
      };
    }

    return { allowed: true, requiresConfirmation: false };
  },

  async recordTransaction(amount: number): Promise<void> {
    await this.loadData();
    
    this.data.dailySpent += amount;
    this.data.weeklySpent += amount;
    this.data.monthlySpent += amount;
    this.data.lastTransactionTime = Date.now();
    
    await this.saveData();
  },

  async getRemainingLimits(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    perTransaction: number;
  }> {
    await this.loadData();
    
    return {
      daily: Math.max(0, this.config.limits.daily - this.data.dailySpent),
      weekly: Math.max(0, this.config.limits.weekly - this.data.weeklySpent),
      monthly: Math.max(0, this.config.limits.monthly - this.data.monthlySpent),
      perTransaction: this.config.limits.perTransaction,
    };
  },

  async getUsageStats(): Promise<{
    daily: { used: number; limit: number; percentage: number };
    weekly: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
  }> {
    await this.loadData();
    
    const calcPercentage = (used: number, limit: number) => 
      Math.round((used / limit) * 100);

    return {
      daily: {
        used: this.data.dailySpent,
        limit: this.config.limits.daily,
        percentage: calcPercentage(this.data.dailySpent, this.config.limits.daily),
      },
      weekly: {
        used: this.data.weeklySpent,
        limit: this.config.limits.weekly,
        percentage: calcPercentage(this.data.weeklySpent, this.config.limits.weekly),
      },
      monthly: {
        used: this.data.monthlySpent,
        limit: this.config.limits.monthly,
        percentage: calcPercentage(this.data.monthlySpent, this.config.limits.monthly),
      },
    };
  },

  async resetLimits(): Promise<void> {
    this.resetPeriods();
    await this.saveData();
  },

  enableLimits(): void {
    this.config.enabled = true;
  },

  disableLimits(): void {
    this.config.enabled = false;
  },

  isEnabled(): boolean {
    return this.config.enabled;
  },

  formatAmount(amount: number): string {
    return `$${amount.toLocaleString()}`;
  },
};

export const checkTransactionLimit = async (amount: number) => {
  return TransactionLimits.checkLimit(amount);
};

export const getRemainingLimits = async () => {
  return TransactionLimits.getRemainingLimits();
};

export const getLimitUsage = async () => {
  return TransactionLimits.getUsageStats();
};