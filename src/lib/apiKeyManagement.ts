import { SecureStorage } from './secureStorage';
import { SecureRandom } from './secureRandom';

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: number;
  lastUsed: number | null;
  expiresAt: number | null;
  permissions: string[];
  isActive: boolean;
  environment: 'development' | 'staging' | 'production';
}

export interface APIKeyConfig {
  keyPrefix: string;
  keyLength: number;
  defaultExpirationDays: number;
  maxKeysPerUser: number;
  requirePermissions: boolean;
}

const DEFAULT_CONFIG: APIKeyConfig = {
  keyPrefix: 'peysos_',
  keyLength: 32,
  defaultExpirationDays: 90,
  maxKeysPerUser: 10,
  requirePermissions: true,
};

const STORAGE_KEY = 'api_keys';

export const APIKeyManagement = {
  config: { ...DEFAULT_CONFIG },
  keys: [] as APIKey[],

  async loadKeys(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const keysData = (stored as any)?.[STORAGE_KEY];
    if (keysData) {
      try {
        this.keys = JSON.parse(keysData);
      } catch {
        this.keys = [];
      }
    }
    this.cleanupExpiredKeys();
  },

  async saveKeys(): Promise<void> {
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [STORAGE_KEY]: JSON.stringify(this.keys),
    });
  },

  configure(options: Partial<APIKeyConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): APIKeyConfig {
    return { ...this.config };
  },

  cleanupExpiredKeys(): void {
    const now = Date.now();
    this.keys = this.keys.filter(k => !k.expiresAt || k.expiresAt > now);
  },

  generateKey(): string {
    const random = SecureRandom.getSecureHex(this.config.keyLength);
    return `${this.config.keyPrefix}${random}`;
  },

  maskKey(fullKey: string): string {
    if (fullKey.length <= 8) return '****';
    return `${fullKey.substring(0, 8)}...${fullKey.substring(fullKey.length - 4)}`;
  },

  async createKey(
    name: string,
    permissions: string[],
    options: {
      expiresInDays?: number;
      environment?: 'development' | 'staging' | 'production';
    } = {}
  ): Promise<{ success: boolean; apiKey?: APIKey; rawKey?: string; error?: string }> {
    await this.loadKeys();

    if (this.keys.length >= this.config.maxKeysPerUser) {
      return { success: false, error: `Maximum ${this.config.maxKeysPerUser} API keys allowed` };
    }

    const rawKey = this.generateKey();
    const keyPrefix = this.maskKey(rawKey);

    const expiresAt = options.expiresInDays 
      ? Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000)
      : Date.now() + (this.config.defaultExpirationDays * 24 * 60 * 60 * 1000);

    const apiKey: APIKey = {
      id: SecureRandom.generateUUID(),
      name,
      keyPrefix,
      createdAt: Date.now(),
      lastUsed: null,
      expiresAt,
      permissions,
      isActive: true,
      environment: options.environment || 'development',
    };

    this.keys.push(apiKey);
    await this.saveKeys();

    return { success: true, apiKey, rawKey };
  },

  async getKeys(): Promise<APIKey[]> {
    await this.loadKeys();
    return [...this.keys];
  },

  async getKey(keyId: string): Promise<APIKey | null> {
    await this.loadKeys();
    return this.keys.find(k => k.id === keyId) || null;
  },

  async validateKey(rawKey: string): Promise<{ valid: boolean; key?: APIKey; error?: string }> {
    await this.loadKeys();

    if (!rawKey.startsWith(this.config.keyPrefix)) {
      return { valid: false, error: 'Invalid key format' };
    }

    const matchedKey = this.keys.find(k => 
      rawKey.includes(k.keyPrefix.substring(k.keyPrefix.length - 8))
    );

    if (!matchedKey) {
      return { valid: false, error: 'API key not found' };
    }

    if (!matchedKey.isActive) {
      return { valid: false, error: 'API key is disabled' };
    }

    if (matchedKey.expiresAt && Date.now() > matchedKey.expiresAt) {
      return { valid: false, error: 'API key has expired' };
    }

    matchedKey.lastUsed = Date.now();
    await this.saveKeys();

    return { valid: true, key: matchedKey };
  },

  async updateKey(
    keyId: string,
    updates: {
      name?: string;
      permissions?: string[];
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; key?: APIKey; error?: string }> {
    await this.loadKeys();

    const key = this.keys.find(k => k.id === keyId);
    if (!key) {
      return { success: false, error: 'API key not found' };
    }

    if (updates.name) key.name = updates.name;
    if (updates.permissions) key.permissions = updates.permissions;
    if (updates.isActive !== undefined) key.isActive = updates.isActive;

    await this.saveKeys();

    return { success: true, key };
  },

  async revokeKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    await this.loadKeys();

    const key = this.keys.find(k => k.id === keyId);
    if (!key) {
      return { success: false, error: 'API key not found' };
    }

    key.isActive = false;
    await this.saveKeys();

    return { success: true };
  },

  async deleteKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    await this.loadKeys();

    const index = this.keys.findIndex(k => k.id === keyId);
    if (index === -1) {
      return { success: false, error: 'API key not found' };
    }

    this.keys.splice(index, 1);
    await this.saveKeys();

    return { success: true };
  },

  async rotateKey(keyId: string): Promise<{ success: boolean; newRawKey?: string; error?: string }> {
    const existingKey = await this.getKey(keyId);
    if (!existingKey) {
      return { success: false, error: 'API key not found' };
    }

    const result = await this.createKey(
      `${existingKey.name} (rotated)`,
      existingKey.permissions,
      {
        expiresInDays: existingKey.expiresAt 
          ? Math.ceil((existingKey.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
          : undefined,
        environment: existingKey.environment,
      }
    );

    if (result.success) {
      await this.revokeKey(keyId);
    }

    return { success: !!result.rawKey, newRawKey: result.rawKey };
  },

  checkPermissions(key: APIKey, requiredPermissions: string[]): boolean {
    if (key.permissions.includes('*')) return true;
    return requiredPermissions.every(p => key.permissions.includes(p));
  },

  getPermissionOptions(): { value: string; label: string }[] {
    return [
      { value: 'read:transactions', label: 'Read Transactions' },
      { value: 'write:transactions', label: 'Write Transactions' },
      { value: 'read:balance', label: 'Read Balance' },
      { value: 'write:payments', label: 'Make Payments' },
      { value: 'read:contacts', label: 'Read Contacts' },
      { value: 'write:contacts', label: 'Manage Contacts' },
      { value: 'read:settings', label: 'Read Settings' },
      { value: 'write:settings', label: 'Modify Settings' },
      { value: '*', label: 'Full Access (Admin Only)' },
    ];
  },
};

export const createAPIKey = async (
  name: string,
  permissions: string[],
  options?: { expiresInDays?: number; environment?: 'development' | 'staging' | 'production' }
) => {
  return APIKeyManagement.createKey(name, permissions, options);
};

export const validateAPIKey = async (rawKey: string) => {
  return APIKeyManagement.validateKey(rawKey);
};

export const getAPIKeys = async () => {
  return APIKeyManagement.getKeys();
};

export const revokeAPIKey = async (keyId: string) => {
  return APIKeyManagement.revokeKey(keyId);
};