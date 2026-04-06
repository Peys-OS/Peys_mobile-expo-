import { SecureStorage } from './secureStorage';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  default: { maxAttempts: 5, windowMs: 60000, blockDurationMs: 300000 },
  auth: { maxAttempts: 3, windowMs: 300000, blockDurationMs: 900000 },
  transaction: { maxAttempts: 10, windowMs: 60000, blockDurationMs: 600000 },
  api: { maxAttempts: 100, windowMs: 60000, blockDurationMs: 60000 },
};

const inMemoryStore = new Map<string, RateLimitEntry>();

export const RateLimiter = {
  configs: { ...DEFAULT_CONFIGS },

  configure(name: string, config: Partial<RateLimitConfig>): void {
    this.configs[name] = { ...DEFAULT_CONFIGS.default, ...this.configs[name], ...config };
  },

  getConfig(name: string = 'default'): RateLimitConfig {
    return this.configs[name] || DEFAULT_CONFIGS.default;
  },

  async checkLimit(key: string, limitName: string = 'default'): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    blocked: boolean;
  }> {
    const config = this.getConfig(limitName);
    const now = Date.now();

    let entry = inMemoryStore.get(key);
    if (!entry) {
      entry = { attempts: 0, firstAttempt: now, blockedUntil: null };
      inMemoryStore.set(key, entry);
    }

    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        blocked: true,
      };
    }

    if (entry.blockedUntil && now >= entry.blockedUntil) {
      entry.attempts = 0;
      entry.firstAttempt = now;
      entry.blockedUntil = null;
    }

    const windowStart = entry.firstAttempt;
    const windowEnd = windowStart + config.windowMs;

    if (now > windowEnd) {
      entry.attempts = 1;
      entry.firstAttempt = now;
    } else {
      entry.attempts++;
    }

    const allowed = entry.attempts <= config.maxAttempts;
    const remaining = Math.max(0, config.maxAttempts - entry.attempts);
    const resetAt = windowEnd;

    if (!allowed) {
      entry.blockedUntil = now + config.blockDurationMs;
      await SecureStorage.saveUserPreferences({
        rateLimitBlocked: true,
        rateLimitKey: key,
        blockedUntil: entry.blockedUntil,
      });
    }

    return { allowed, remaining, resetAt, blocked: false };
  },

  async recordAttempt(key: string, limitName: string = 'default'): Promise<void> {
    const entry = inMemoryStore.get(key);
    if (entry) {
      entry.attempts++;
      if (entry.attempts > this.getConfig(limitName).maxAttempts) {
        const config = this.getConfig(limitName);
        entry.blockedUntil = Date.now() + config.blockDurationMs;
      }
    }
  },

  async resetLimit(key: string): Promise<void> {
    inMemoryStore.delete(key);
    await SecureStorage.saveUserPreferences({
      rateLimitBlocked: false,
      rateLimitKey: null,
      blockedUntil: null,
    });
  },

  getRemainingAttempts(key: string, limitName: string = 'default'): number {
    const entry = inMemoryStore.get(key);
    if (!entry) return this.getConfig(limitName).maxAttempts;
    
    const config = this.getConfig(limitName);
    return Math.max(0, config.maxAttempts - entry.attempts);
  },

  isBlocked(key: string): boolean {
    const entry = inMemoryStore.get(key);
    if (!entry || !entry.blockedUntil) return false;
    return Date.now() < entry.blockedUntil;
  },

  getBlockDuration(key: string): number {
    const entry = inMemoryStore.get(key);
    if (!entry?.blockedUntil) return 0;
    const remaining = entry.blockedUntil - Date.now();
    return Math.max(0, remaining);
  },

  clearAll(): void {
    inMemoryStore.clear();
  },

  async pruneExpired(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.blockedUntil && now > entry.blockedUntil) {
        inMemoryStore.delete(key);
      }
    }
  },
};

export const withRateLimit = async <T>(
  key: string,
  limitName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const check = await RateLimiter.checkLimit(key, limitName);
  if (!check.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(check.resetAt / 1000)} seconds.`);
  }
  return operation();
};

export const createRateLimitKey = (action: string, identifier: string): string => {
  return `ratelimit:${action}:${identifier}`;
};