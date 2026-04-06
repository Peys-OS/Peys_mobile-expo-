import { SecureStorage } from './secureStorage';

export interface SuspiciousActivity {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  acknowledged: boolean;
}

export interface AlertConfig {
  enabled: boolean;
  notifyOnHighSeverity: boolean;
  notifyOnMediumSeverity: boolean;
  storeHistory: boolean;
  maxHistorySize: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  notifyOnHighSeverity: true,
  notifyOnMediumSeverity: false,
  storeHistory: true,
  maxHistorySize: 100,
};

const STORAGE_KEY = 'suspicious_activity_alerts';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const SuspiciousActivityAlerts = {
  config: { ...DEFAULT_CONFIG },
  alerts: [] as SuspiciousActivity[],

  async loadAlerts(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const alertsData = (stored as any)?.[STORAGE_KEY];
    if (alertsData) {
      try {
        this.alerts = JSON.parse(alertsData);
      } catch {
        this.alerts = [];
      }
    }
  },

  async saveAlerts(): Promise<void> {
    const limitedAlerts = this.alerts.slice(-this.config.maxHistorySize);
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [STORAGE_KEY]: JSON.stringify(limitedAlerts),
    });
  },

  configure(options: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): AlertConfig {
    return { ...this.config };
  },

  createAlert(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    details?: Record<string, unknown>
  ): SuspiciousActivity {
    return {
      id: generateId(),
      type,
      severity,
      message,
      details,
      timestamp: Date.now(),
      acknowledged: false,
    };
  },

  async addAlert(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    details?: Record<string, unknown>
  ): Promise<SuspiciousActivity> {
    const alert = this.createAlert(type, severity, message, details);
    
    this.alerts.push(alert);
    await this.saveAlerts();
    
    console.warn(`[SECURITY ALERT] ${severity.toUpperCase()}: ${message}`);
    
    return alert;
  },

  async getAlerts(filter?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    acknowledged?: boolean;
    since?: number;
  }): Promise<SuspiciousActivity[]> {
    await this.loadAlerts();
    
    return this.alerts.filter(alert => {
      if (filter?.severity && alert.severity !== filter.severity) return false;
      if (filter?.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged) return false;
      if (filter?.since && alert.timestamp < filter.since) return false;
      return true;
    });
  },

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    await this.loadAlerts();
    
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    await this.saveAlerts();
    
    return true;
  },

  async acknowledgeAll(): Promise<number> {
    await this.loadAlerts();
    
    const count = this.alerts.filter(a => !a.acknowledged).length;
    this.alerts.forEach(a => a.acknowledged = true);
    
    await this.saveAlerts();
    
    return count;
  },

  async getUnacknowledgedCount(): Promise<number> {
    await this.loadAlerts();
    return this.alerts.filter(a => !a.acknowledged).length;
  },

  async getHighSeverityAlerts(): Promise<SuspiciousActivity[]> {
    return this.getAlerts({ severity: 'high' });
  },

  async clearAlerts(): Promise<void> {
    this.alerts = [];
    await this.saveAlerts();
  },

  async getAlertStats(): Promise<{
    total: number;
    unacknowledged: number;
    bySeverity: Record<string, number>;
  }> {
    await this.loadAlerts();
    
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    this.alerts.forEach(a => bySeverity[a.severity]++);
    
    return {
      total: this.alerts.length,
      unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
      bySeverity,
    };
  },

  async logTransactionAttempt(
    recipient: string,
    amount: number,
    result: 'success' | 'blocked' | 'flagged'
  ): Promise<void> {
    if (result === 'blocked') {
      await this.addAlert(
        'transaction_blocked',
        'high',
        `Transaction blocked: $${amount} to ${recipient.substring(0, 8)}...`,
        { recipient, amount, result }
      );
    } else if (result === 'flagged') {
      await this.addAlert(
        'transaction_flagged',
        'medium',
        `Transaction flagged for review: $${amount} to ${recipient.substring(0, 8)}...`,
        { recipient, amount, result }
      );
    }
  },

  async logLoginAttempt(
    walletAddress: string,
    method: string,
    success: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!success) {
      await this.addAlert(
        'login_failed',
        'medium',
        `Failed login attempt via ${method} for ${walletAddress.substring(0, 8)}...`,
        { walletAddress, method, ...details }
      );
    }
  },

  async logDeviceChange(
    previousDevice: string,
    newDevice: string
  ): Promise<void> {
    await this.addAlert(
      'device_change',
      'high',
      `Device change detected: ${previousDevice} -> ${newDevice}`,
      { previousDevice, newDevice }
    );
  },

  async logRateLimitExceeded(
    action: string,
    limit: number
  ): Promise<void> {
    await this.addAlert(
      'rate_limit_exceeded',
      'low',
      `Rate limit exceeded for action: ${action} (limit: ${limit})`,
      { action, limit }
    );
  },
};

export const createSecurityAlert = async (
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  details?: Record<string, unknown>
) => {
  return SuspiciousActivityAlerts.addAlert(type, severity, message, details);
};

export const getUnacknowledgedAlerts = async () => {
  return SuspiciousActivityAlerts.getAlerts({ acknowledged: false });
};

export const acknowledgeAlert = async (alertId: string) => {
  return SuspiciousActivityAlerts.acknowledgeAlert(alertId);
};