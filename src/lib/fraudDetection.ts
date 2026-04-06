import { SecureStorage } from './secureStorage';

export interface FraudIndicator {
  type: 'velocity' | 'pattern' | 'anomaly' | 'blacklist' | 'geolocation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: Record<string, unknown>;
}

export interface TransactionContext {
  amount: number;
  recipientAddress: string;
  token: string;
  chainId?: number;
  timestamp: number;
  deviceId?: string;
  location?: { lat: number; lng: number };
}

export interface FraudCheckResult {
  isSuspicious: boolean;
  riskScore: number;
  indicators: FraudIndicator[];
  shouldBlock: boolean;
  recommendedAction: 'allow' | 'review' | 'block';
}

const FRAUD_STORAGE_KEY = 'fraud_detection_data';

interface FraudData {
  transactionCount: number;
  totalAmount: number;
  lastTransactionTime: number;
  recentRecipients: string[];
  dailyTransactionCount: number;
  dailyAmount: number;
  lastDailyReset: number;
}

const DEFAULT_FRAUD_CONFIG = {
  maxDailyTransactions: 50,
  maxDailyAmount: 100000,
  maxSingleTransaction: 50000,
  maxTransactionsPerHour: 10,
  maxRecipientsPerHour: 5,
  suspiciousAmountThreshold: 10000,
  velocityWindowMs: 3600000,
};

export const FraudDetection = {
  config: { ...DEFAULT_FRAUD_CONFIG },
  data: {
    transactionCount: 0,
    totalAmount: 0,
    lastTransactionTime: 0,
    recentRecipients: [] as string[],
    dailyTransactionCount: 0,
    dailyAmount: 0,
    lastDailyReset: Date.now(),
  } as FraudData,

  async loadData(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const fraudData = (stored as any)?.[FRAUD_STORAGE_KEY];
    if (fraudData) {
      try {
        this.data = JSON.parse(fraudData);
      } catch {
        this.resetDailyData();
      }
    }
    this.checkDailyReset();
  },

  async saveData(): Promise<void> {
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [FRAUD_STORAGE_KEY]: JSON.stringify(this.data),
    });
  },

  checkDailyReset(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (now - this.data.lastDailyReset > dayMs) {
      this.resetDailyData();
    }
  },

  resetDailyData(): void {
    this.data.dailyTransactionCount = 0;
    this.data.dailyAmount = 0;
    this.data.lastDailyReset = Date.now();
  },

  configure(options: Partial<typeof DEFAULT_FRAUD_CONFIG>): void {
    this.config = { ...this.config, ...options };
  },

  checkVelocityLimits(context: TransactionContext): FraudIndicator[] {
    const indicators: FraudIndicator[] = [];
    const now = Date.now();

    if (this.data.dailyTransactionCount >= this.config.maxDailyTransactions) {
      indicators.push({
        type: 'velocity',
        severity: 'high',
        description: 'Daily transaction limit exceeded',
        details: { count: this.data.dailyTransactionCount, limit: this.config.maxDailyTransactions },
      });
    }

    if (this.data.dailyAmount + context.amount > this.config.maxDailyAmount) {
      indicators.push({
        type: 'velocity',
        severity: 'high',
        description: 'Daily amount limit would be exceeded',
        details: { amount: this.data.dailyAmount + context.amount, limit: this.config.maxDailyAmount },
      });
    }

    if (context.amount > this.config.maxSingleTransaction) {
      indicators.push({
        type: 'velocity',
        severity: 'medium',
        description: 'Single transaction exceeds typical limit',
        details: { amount: context.amount, limit: this.config.maxSingleTransaction },
      });
    }

    const recentCount = this.data.recentRecipients.filter(
      r => now - this.data.lastTransactionTime < this.config.velocityWindowMs
    ).length;

    if (recentCount >= this.config.maxRecipientsPerHour) {
      indicators.push({
        type: 'velocity',
        severity: 'medium',
        description: 'Too many different recipients in short time',
        details: { count: recentCount, limit: this.config.maxRecipientsPerHour },
      });
    }

    return indicators;
  },

  checkPatternAnomalies(context: TransactionContext): FraudIndicator[] {
    const indicators: FraudIndicator[] = [];

    if (context.amount >= this.config.suspiciousAmountThreshold) {
      indicators.push({
        type: 'anomaly',
        severity: 'medium',
        description: 'Transaction amount is unusually high',
        details: { amount: context.amount, threshold: this.config.suspiciousAmountThreshold },
      });
    }

    const recentRecipients = this.data.recentRecipients.slice(-5);
    if (recentRecipients.includes(context.recipientAddress)) {
      indicators.push({
        type: 'pattern',
        severity: 'low',
        description: 'Previously used recipient',
      });
    } else if (recentRecipients.length > 0) {
      indicators.push({
        type: 'pattern',
        severity: 'low',
        description: 'New recipient address',
      });
    }

    const hourAgo = Date.now() - 3600000;
    const hourlyCount = this.data.transactionCount > 0 ? 1 : 0;
    if (this.data.lastTransactionTime > hourAgo) {
      indicators.push({
        type: 'velocity',
        severity: 'low',
        description: 'Multiple transactions in short period',
      });
    }

    return indicators;
  },

  async checkBlacklist(address: string): Promise<FraudIndicator[]> {
    const indicators: FraudIndicator[] = [];
    const lowercaseAddress = address.toLowerCase();
    
    const knownScamPatterns = [
      '0xdead',
      '0xbadd',
      '0xf00d',
    ];

    for (const pattern of knownScamPatterns) {
      if (lowercaseAddress.includes(pattern)) {
        indicators.push({
          type: 'blacklist',
          severity: 'critical',
          description: 'Address matches known scam pattern',
          details: { address, pattern },
        });
      }
    }

    return indicators;
  },

  calculateRiskScore(indicators: FraudIndicator[]): number {
    let score = 0;
    const severityWeights = {
      low: 10,
      medium: 30,
      high: 60,
      critical: 100,
    };

    for (const indicator of indicators) {
      score += severityWeights[indicator.severity];
    }

    return Math.min(score, 100);
  },

  determineAction(score: number, indicators: FraudIndicator[]): { shouldBlock: boolean; action: 'allow' | 'review' | 'block' } {
    const hasCritical = indicators.some(i => i.severity === 'critical');
    const hasHigh = indicators.some(i => i.severity === 'high');
    
    if (hasCritical || score >= 80) {
      return { shouldBlock: true, action: 'block' };
    }
    if (hasHigh || score >= 50) {
      return { shouldBlock: false, action: 'review' };
    }
    return { shouldBlock: false, action: 'allow' };
  },

  async analyzeTransaction(context: TransactionContext): Promise<FraudCheckResult> {
    await this.loadData();

    const indicators: FraudIndicator[] = [
      ...this.checkVelocityLimits(context),
      ...this.checkPatternAnomalies(context),
    ];

    const blacklistIndicators = await this.checkBlacklist(context.recipientAddress);
    indicators.push(...blacklistIndicators);

    const riskScore = this.calculateRiskScore(indicators);
    const { shouldBlock, action } = this.determineAction(riskScore, indicators);

    await this.recordTransaction(context);

    return {
      isSuspicious: indicators.length > 0,
      riskScore,
      indicators,
      shouldBlock,
      recommendedAction: action,
    };
  },

  async recordTransaction(context: TransactionContext): Promise<void> {
    this.data.transactionCount++;
    this.data.totalAmount += context.amount;
    this.data.lastTransactionTime = context.timestamp;
    this.data.dailyTransactionCount++;
    this.data.dailyAmount += context.amount;

    if (!this.data.recentRecipients.includes(context.recipientAddress)) {
      this.data.recentRecipients.push(context.recipientAddress);
      if (this.data.recentRecipients.length > 10) {
        this.data.recentRecipients.shift();
      }
    }

    await this.saveData();
  },

  async getStatistics(): Promise<{
    totalTransactions: number;
    totalAmount: number;
    dailyCount: number;
    dailyAmount: number;
  }> {
    await this.loadData();
    return {
      totalTransactions: this.data.transactionCount,
      totalAmount: this.data.totalAmount,
      dailyCount: this.data.dailyTransactionCount,
      dailyAmount: this.data.dailyAmount,
    };
  },

  resetStatistics(): void {
    this.data = {
      transactionCount: 0,
      totalAmount: 0,
      lastTransactionTime: 0,
      recentRecipients: [],
      dailyTransactionCount: 0,
      dailyAmount: 0,
      lastDailyReset: Date.now(),
    };
  },
};

export const checkTransactionFraud = async (context: TransactionContext): Promise<FraudCheckResult> => {
  return FraudDetection.analyzeTransaction(context);
};

export const getFraudStatistics = async () => {
  return FraudDetection.getStatistics();
};