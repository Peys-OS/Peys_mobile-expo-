import { SecureStorage } from './secureStorage';
import { SecureRandom } from './secureRandom';

export type AuditEventType = 
  | 'user_login'
  | 'user_logout'
  | 'transaction_initiated'
  | 'transaction_signed'
  | 'transaction_executed'
  | 'transaction_failed'
  | 'settings_changed'
  | 'security_settings_changed'
  | 'recovery_contact_added'
  | 'recovery_contact_removed'
  | 'recovery_request_created'
  | 'recovery_request_approved'
  | 'backup_created'
  | 'backup_restored'
  | 'biometric_enabled'
  | 'biometric_disabled'
  | 'pin_changed'
  | 'device_changed'
  | 'permission_granted'
  | 'permission_revoked';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  message: string;
  userId?: string;
  walletAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  deviceInfo?: {
    platform: string;
    model: string;
    osVersion: string;
  };
  ipAddress?: string;
}

export interface AuditLogConfig {
  enabled: boolean;
  maxEvents: number;
  retentionDays: number;
  includeMetadata: boolean;
  logToConsole: boolean;
  sendToServer: boolean;
  serverEndpoint?: string;
}

const DEFAULT_CONFIG: AuditLogConfig = {
  enabled: true,
  maxEvents: 1000,
  retentionDays: 90,
  includeMetadata: true,
  logToConsole: true,
  sendToServer: false,
};

const STORAGE_KEY = 'audit_log_events';

export const AuditLogging = {
  config: { ...DEFAULT_CONFIG },
  events: [] as AuditEvent[],

  async loadEvents(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const eventsData = (stored as any)?.[STORAGE_KEY];
    if (eventsData) {
      try {
        this.events = JSON.parse(eventsData);
      } catch {
        this.events = [];
      }
    }
    this.pruneOldEvents();
  },

  async saveEvents(): Promise<void> {
    const limitedEvents = this.events.slice(-this.config.maxEvents);
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [STORAGE_KEY]: JSON.stringify(limitedEvents),
    });
  },

  configure(options: Partial<AuditLogConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): AuditLogConfig {
    return { ...this.config };
  },

  pruneOldEvents(): void {
    const now = Date.now();
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    this.events = this.events.filter(e => now - e.timestamp < retentionMs);
  },

  log(
    type: AuditEventType,
    message: string,
    options: {
      severity?: AuditSeverity;
      userId?: string;
      walletAddress?: string;
      metadata?: Record<string, unknown>;
      deviceInfo?: AuditEvent['deviceInfo'];
      ipAddress?: string;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    const event: AuditEvent = {
      id: SecureRandom.generateUUID(),
      type,
      severity: options.severity || this.determineSeverity(type),
      message,
      userId: options.userId,
      walletAddress: options.walletAddress,
      metadata: this.config.includeMetadata ? options.metadata : undefined,
      timestamp: Date.now(),
      deviceInfo: options.deviceInfo,
      ipAddress: options.ipAddress,
    };

    this.events.push(event);
    
    if (this.config.logToConsole) {
      this.logToConsole(event);
    }

    this.saveEvents().catch(console.error);

    if (this.config.sendToServer && this.config.serverEndpoint) {
      this.sendToServer(event).catch(console.error);
    }
  },

  determineSeverity(type: AuditEventType): AuditSeverity {
    const severityMap: Partial<Record<AuditEventType, AuditSeverity>> = {
      transaction_failed: 'warning',
      security_settings_changed: 'warning',
      recovery_contact_removed: 'warning',
      device_changed: 'error',
      backup_restored: 'info',
      biometric_disabled: 'warning',
      user_logout: 'info',
      transaction_executed: 'info',
      user_login: 'info',
    };
    return severityMap[type] || 'info';
  },

  logToConsole(event: AuditEvent): void {
    const prefix = `[AUDIT:${event.severity.toUpperCase()}]`;
    console.log(prefix, event.type, '-', event.message);
  },

  async sendToServer(_event: AuditEvent): Promise<void> {
    console.log('Would send to server:', this.config.serverEndpoint);
  },

  async getEvents(filter?: {
    type?: AuditEventType;
    severity?: AuditSeverity;
    since?: number;
    until?: number;
    walletAddress?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    await this.loadEvents();

    let filtered = [...this.events];

    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }
    if (filter?.since !== undefined) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!);
    }
    if (filter?.until !== undefined) {
      filtered = filtered.filter(e => e.timestamp <= filter.until!);
    }
    if (filter?.walletAddress) {
      filtered = filtered.filter(e => e.walletAddress === filter.walletAddress);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  },

  async getEventStats(): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  }> {
    await this.loadEvents();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.events.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      byType,
      bySeverity,
      last24Hours: this.events.filter(e => now - e.timestamp < dayMs).length,
      last7Days: this.events.filter(e => now - e.timestamp < 7 * dayMs).length,
      last30Days: this.events.filter(e => now - e.timestamp < 30 * dayMs).length,
    };
  },

  async clearOldEvents(daysToKeep: number = 30): Promise<number> {
    await this.loadEvents();
    
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const before = this.events.length;
    
    this.events = this.events.filter(e => e.timestamp >= cutoff);
    
    await this.saveEvents();
    
    return before - this.events.length;
  },

  async exportEvents(format: 'json' | 'csv' = 'json'): Promise<string> {
    await this.loadEvents();

    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    }

    const headers = ['ID', 'Type', 'Severity', 'Message', 'Timestamp', 'Wallet'];
    const rows = this.events.map(e => [
      e.id,
      e.type,
      e.severity,
      e.message,
      new Date(e.timestamp).toISOString(),
      e.walletAddress || '',
    ]);

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  },

  logUserLogin(walletAddress: string, metadata?: Record<string, unknown>): void {
    this.log('user_login', 'User logged in', { walletAddress, metadata });
  },

  logUserLogout(walletAddress: string): void {
    this.log('user_logout', 'User logged out', { walletAddress });
  },

  logTransactionInitiated(walletAddress: string, amount: number, token: string): void {
    this.log('transaction_initiated', `Transaction initiated: ${amount} ${token}`, {
      walletAddress,
      metadata: { amount, token },
    });
  },

  logTransactionSigned(walletAddress: string, txId: string): void {
    this.log('transaction_signed', `Transaction signed: ${txId.substring(0, 8)}...`, {
      walletAddress,
      metadata: { txId },
    });
  },

  logSecuritySettingChange(walletAddress: string, setting: string, oldValue: string, newValue: string): void {
    this.log('security_settings_changed', `Security setting changed: ${setting}`, {
      severity: 'warning',
      walletAddress,
      metadata: { setting, oldValue, newValue },
    });
  },
};

export const logAuditEvent = (
  type: AuditEventType,
  message: string,
  options?: {
    severity?: AuditSeverity;
    userId?: string;
    walletAddress?: string;
    metadata?: Record<string, unknown>;
  }
) => {
  AuditLogging.log(type, message, options);
};

export const getAuditLogs = async (filter?: {
  type?: AuditEventType;
  severity?: AuditSeverity;
  since?: number;
  limit?: number;
}) => {
  return AuditLogging.getEvents(filter);
};

export const getAuditStats = async () => {
  return AuditLogging.getEventStats();
};