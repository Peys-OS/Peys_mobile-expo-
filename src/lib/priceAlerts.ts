import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface PriceAlert {
  id: string;
  tokenSymbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  triggered: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface AlertConfig {
  enabled: boolean;
  checkInterval: number;
  notifyOnTrigger: boolean;
}

const STORAGE_KEY = 'price_alerts';
const DEFAULT_CONFIG: AlertConfig = { enabled: true, checkInterval: 60000, notifyOnTrigger: true };

export const PriceAlertNotifications = {
  alerts: [] as PriceAlert[],
  config: { ...DEFAULT_CONFIG },

  async load(): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { this.alerts = JSON.parse(stored); } catch {}
    }
  },

  async save(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
  },

  configure(options: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...options };
  },

  async createAlert(tokenSymbol: string, condition: 'above' | 'below', targetPrice: number): Promise<PriceAlert> {
    const alert: PriceAlert = {
      id: `${Date.now()}_${tokenSymbol}`,
      tokenSymbol,
      condition,
      targetPrice,
      currentPrice: 0,
      isActive: true,
      triggered: false,
      createdAt: Date.now(),
    };
    this.alerts.push(alert);
    await this.save();
    return alert;
  },

  async checkAlerts(prices: Record<string, number>): Promise<PriceAlert[]> {
    const triggered: PriceAlert[] = [];
    
    for (const alert of this.alerts) {
      if (!alert.isActive || alert.triggered) continue;
      
      const currentPrice = prices[alert.tokenSymbol];
      if (!currentPrice) continue;

      alert.currentPrice = currentPrice;
      
      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = Date.now();
        triggered.push(alert);
        
        if (this.config.notifyOnTrigger) {
          await this.sendNotification(alert);
        }
      }
    }

    if (triggered.length > 0) await this.save();
    return triggered;
  },

  async sendNotification(alert: PriceAlert): Promise<void> {
    const direction = alert.condition === 'above' ? 'risen above' : 'fallen below';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${alert.tokenSymbol} Price Alert`,
        body: `${alert.tokenSymbol} has ${direction} $${alert.targetPrice.toFixed(2)}. Current: $${alert.currentPrice.toFixed(2)}`,
      },
      trigger: null,
    });
  },

  async getAlerts(): Promise<PriceAlert[]> {
    return [...this.alerts];
  },

  async deleteAlert(id: string): Promise<boolean> {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.alerts.splice(index, 1);
    await this.save();
    return true;
  },

  async toggleAlert(id: string, isActive: boolean): Promise<void> {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.isActive = isActive;
      await this.save();
    }
  },
};

export const createPriceAlert = (symbol: string, condition: 'above' | 'below', price: number) =>
  PriceAlertNotifications.createAlert(symbol, condition, price);

export const checkPriceAlerts = (prices: Record<string, number>) =>
  PriceAlertNotifications.checkAlerts(prices);