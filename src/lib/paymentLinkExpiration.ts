import { SecureRandom } from './secureRandom';

export interface PaymentLinkConfig {
  defaultTTL: number;
  minTTL: number;
  maxTTL: number;
}

const DEFAULT_CONFIG: PaymentLinkConfig = {
  defaultTTL: 3600000,
  minTTL: 300000,
  maxTTL: 604800000,
};

export interface PaymentLink {
  id: string;
  amount: number;
  token: string;
  recipient?: string;
  memo?: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  maxClaims?: number;
  claimCount: number;
}

export interface CreatePaymentLinkOptions {
  amount: number;
  token?: string;
  recipient?: string;
  memo?: string;
  ttl?: number;
  maxClaims?: number;
}

export interface PaymentLinkResult {
  success: boolean;
  link?: PaymentLink;
  url?: string;
  error?: string;
}

const activeLinks = new Map<string, PaymentLink>();

export const PaymentLinkExpiration = {
  config: { ...DEFAULT_CONFIG },

  configure(options: Partial<PaymentLinkConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): PaymentLinkConfig {
    return { ...this.config };
  },

  validateTTL(ttl: number): number {
    if (ttl < this.config.minTTL) {
      return this.config.minTTL;
    }
    if (ttl > this.config.maxTTL) {
      return this.config.maxTTL;
    }
    return ttl;
  },

  createPaymentLink(options: CreatePaymentLinkOptions): PaymentLinkResult {
    try {
      const ttl = options.ttl 
        ? this.validateTTL(options.ttl) 
        : this.config.defaultTTL;

      const link: PaymentLink = {
        id: SecureRandom.generateUUID(),
        amount: options.amount,
        token: options.token || 'USDC',
        recipient: options.recipient,
        memo: options.memo,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl,
        isActive: true,
        maxClaims: options.maxClaims,
        claimCount: 0,
      };

      activeLinks.set(link.id, link);
      
      const url = `peysos://claim/${link.id}?amount=${link.amount}&token=${link.token}`;

      return { success: true, link, url };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment link' 
      };
    }
  },

  getPaymentLink(id: string): PaymentLink | null {
    return activeLinks.get(id) || null;
  },

  isExpired(link: PaymentLink): boolean {
    return Date.now() > link.expiresAt;
  },

  canClaim(link: PaymentLink): { allowed: boolean; reason?: string } {
    if (!link.isActive) {
      return { allowed: false, reason: 'Payment link is inactive' };
    }

    if (this.isExpired(link)) {
      return { allowed: false, reason: 'Payment link has expired' };
    }

    if (link.maxClaims !== undefined && link.claimCount >= link.maxClaims) {
      return { allowed: false, reason: 'Maximum claims reached' };
    }

    return { allowed: true };
  },

  claimPayment(id: string): { success: boolean; link?: PaymentLink; error?: string } {
    const link = this.getPaymentLink(id);
    
    if (!link) {
      return { success: false, error: 'Payment link not found' };
    }

    const canClaim = this.canClaim(link);
    if (!canClaim.allowed) {
      return { success: false, error: canClaim.reason };
    }

    link.claimCount++;
    
    if (link.maxClaims !== undefined && link.claimCount >= link.maxClaims) {
      link.isActive = false;
    }

    return { success: true, link };
  },

  cancelPayment(id: string): { success: boolean; error?: string } {
    const link = this.getPaymentLink(id);
    
    if (!link) {
      return { success: false, error: 'Payment link not found' };
    }

    link.isActive = false;
    return { success: true };
  },

  extendExpiration(id: string, additionalMs: number): { success: boolean; newExpiry?: number; error?: string } {
    const link = this.getPaymentLink(id);
    
    if (!link) {
      return { success: false, error: 'Payment link not found' };
    }

    const newExpiry = Math.min(
      link.expiresAt + additionalMs,
      Date.now() + this.config.maxTTL
    );
    
    link.expiresAt = newExpiry;
    
    return { success: true, newExpiry };
  },

  getTimeRemaining(link: PaymentLink): number {
    return Math.max(0, link.expiresAt - Date.now());
  },

  formatTimeRemaining(link: PaymentLink): string {
    const remaining = this.getTimeRemaining(link);
    
    if (remaining <= 0) return 'Expired';
    
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  },

  cleanupExpired(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [id, link] of activeLinks.entries()) {
      if (link.expiresAt < now) {
        activeLinks.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  },

  getActiveLinks(): PaymentLink[] {
    return Array.from(activeLinks.values()).filter(l => l.isActive && !this.isExpired(l));
  },

  getLinkStats(id: string): { 
    valid: boolean; 
    isActive: boolean; 
    isExpired: boolean; 
    timeRemaining: string; 
    claimsRemaining?: number;
  } | null {
    const link = this.getPaymentLink(id);
    if (!link) return null;

    return {
      valid: true,
      isActive: link.isActive,
      isExpired: this.isExpired(link),
      timeRemaining: this.formatTimeRemaining(link),
      claimsRemaining: link.maxClaims !== undefined 
        ? Math.max(0, link.maxClaims - link.claimCount)
        : undefined,
    };
  },

  getDefaultTTL(): number {
    return this.config.defaultTTL;
  },

  getTTLOptions(): { label: string; value: number }[] {
    return [
      { label: '5 minutes', value: 300000 },
      { label: '15 minutes', value: 900000 },
      { label: '30 minutes', value: 1800000 },
      { label: '1 hour', value: 3600000 },
      { label: '6 hours', value: 21600000 },
      { label: '24 hours', value: 86400000 },
      { label: '3 days', value: 259200000 },
      { label: '7 days', value: 604800000 },
    ];
  },
};

export const createPaymentLink = (options: CreatePaymentLinkOptions): PaymentLinkResult => {
  return PaymentLinkExpiration.createPaymentLink(options);
};

export const getPaymentLink = (id: string): PaymentLink | null => {
  return PaymentLinkExpiration.getPaymentLink(id);
};

export const claimPayment = (id: string) => {
  return PaymentLinkExpiration.claimPayment(id);
};