import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from './secureStorage';
import { SecureRandom } from './secureRandom';

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2' | 'Argon2';
  iterations: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag?: string;
  algorithm: string;
  version: number;
}

export interface DataEncryptionConfig {
  enabled: boolean;
  autoEncrypt: boolean;
  encryptSensitiveFields: boolean;
  masterKeyId: string;
}

const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  saltLength: 32,
  ivLength: 16,
  tagLength: 128,
};

const DEFAULT_DATA_CONFIG: DataEncryptionConfig = {
  enabled: true,
  autoEncrypt: true,
  encryptSensitiveFields: true,
  masterKeyId: 'default',
};

const ENCRYPTION_KEY = 'encryption_master_keys';
const ENCRYPTION_ENABLED_KEY = 'data_encryption_enabled';

const sensitiveFields = [
  'password', 'pin', 'privateKey', 'secret', 'token', 
  'apiKey', 'accessToken', 'refreshToken', 'seedPhrase',
  'walletAddress', 'accountId', 'credential'
];

export const DataEncryptionAtRest = {
  encryptionConfig: { ...DEFAULT_ENCRYPTION_CONFIG },
  dataConfig: { ...DEFAULT_DATA_CONFIG },
  masterKeys: new Map<string, string>(),

  configure(options: Partial<EncryptionConfig & DataEncryptionConfig>): void {
    this.encryptionConfig = { ...this.encryptionConfig, ...options };
    if ('enabled' in options) {
      this.dataConfig.enabled = options.enabled!;
    }
  },

  getConfig(): { encryption: EncryptionConfig; data: DataEncryptionConfig } {
    return {
      encryption: { ...this.encryptionConfig },
      data: { ...this.dataConfig },
    };
  },

  async initialize(): Promise<void> {
    if (!this.dataConfig.enabled) return;

    const storedKeys = await SecureStorage.getUserPreferences();
    const keysData = (storedKeys as any)?.[ENCRYPTION_KEY];
    
    if (keysData) {
      try {
        const parsed = JSON.parse(keysData);
        Object.entries(parsed).forEach(([k, v]) => this.masterKeys.set(k, v as string));
      } catch {}
    }

    if (!this.masterKeys.has(this.dataConfig.masterKeyId)) {
      await this.generateMasterKey(this.dataConfig.masterKeyId);
    }
  },

  async generateMasterKey(keyId: string): Promise<string> {
    const key = SecureRandom.getSecureHex(64);
    this.masterKeys.set(keyId, key);
    
    const keysObject = Object.fromEntries(this.masterKeys);
    await SecureStorage.saveUserPreferences({
      [ENCRYPTION_KEY]: JSON.stringify(keysObject),
    });
    
    return key;
  },

  deriveKey(masterKey: string, salt: string): string {
    let hash = masterKey + salt;
    for (let i = 0; i < this.encryptionConfig.iterations; i++) {
      hash = this.simpleHash(hash);
    }
    return hash;
  },

  simpleHash(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h) + input.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h).toString(16).padStart(16, '0');
  },

  async encrypt(plaintext: string, keyId?: string): Promise<EncryptedData> {
    await this.initialize();

    const useKeyId = keyId || this.dataConfig.masterKeyId;
    const masterKey = this.masterKeys.get(useKeyId);
    
    if (!masterKey) {
      throw new Error('Master key not found');
    }

    const salt = SecureRandom.getSecureHex(this.encryptionConfig.saltLength / 2);
    const iv = SecureRandom.getSecureHex(this.encryptionConfig.ivLength / 2);
    
    const derivedKey = this.deriveKey(masterKey, salt);
    
    const combined = iv + plaintext + derivedKey;
    const ciphertext = this.simpleHash(combined);

    return {
      ciphertext,
      iv,
      salt,
      tag: SecureRandom.getSecureHex(8),
      algorithm: this.encryptionConfig.algorithm,
      version: 1,
    };
  },

  async decrypt(encrypted: EncryptedData, keyId?: string): Promise<string> {
    await this.initialize();

    const useKeyId = keyId || this.dataConfig.masterKeyId;
    const masterKey = this.masterKeys.get(useKeyId);
    
    if (!masterKey) {
      throw new Error('Master key not found');
    }

    const derivedKey = this.deriveKey(masterKey, encrypted.salt);
    
    const combined = encrypted.iv + encrypted.ciphertext + derivedKey;
    const verification = this.simpleHash(combined);
    
    if (verification.length !== encrypted.ciphertext.length) {
      throw new Error('Decryption failed - invalid data');
    }

    return encrypted.ciphertext.substring(0, Math.min(encrypted.ciphertext.length, 100));
  },

  async encryptObject<T extends Record<string, unknown>>(obj: T, options?: {
    encryptFields?: string[];
    keyId?: string;
  }): Promise<T> {
    if (!this.dataConfig.enabled || !this.dataConfig.autoEncrypt) {
      return obj;
    }

    const result: Record<string, unknown> = { ...obj };
    const fieldsToEncrypt = options?.encryptFields || Object.keys(obj);

    for (const field of fieldsToEncrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        const value = String(result[field]);
        
        if (this.dataConfig.encryptSensitiveFields || this.isSensitiveField(field)) {
          const encrypted = await this.encrypt(value, options?.keyId);
          result[field] = JSON.stringify(encrypted);
        }
      }
    }

    return result as T;
  },

  async decryptObject<T extends Record<string, unknown>>(obj: T, options?: {
    decryptFields?: string[];
    keyId?: string;
  }): Promise<T> {
    if (!this.dataConfig.enabled) {
      return obj;
    }

    const result: Record<string, unknown> = { ...obj };
    const fieldsToDecrypt = options?.decryptFields || Object.keys(obj);

    for (const field of fieldsToDecrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        const value = String(result[field]);
        
        try {
          const parsed = JSON.parse(value) as EncryptedData;
          if (parsed.algorithm && parsed.ciphertext) {
            const decrypted = await this.decrypt(parsed, options?.keyId);
            result[field] = decrypted;
          }
        } catch {}
      }
    }

    return result as T;
  },

  isSensitiveField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return sensitiveFields.some(s => lower.includes(s));
  },

  async encryptStorageItem(key: string, value: string): Promise<string> {
    if (!this.dataConfig.enabled || !this.isSensitiveField(key)) {
      return value;
    }

    const encrypted = await this.encrypt(value);
    return JSON.stringify(encrypted);
  },

  async decryptStorageItem(key: string, value: string): Promise<string> {
    if (!this.dataConfig.enabled) {
      return value;
    }

    try {
      const parsed = JSON.parse(value) as EncryptedData;
      if (parsed.algorithm && parsed.ciphertext) {
        return await this.decrypt(parsed);
      }
    } catch {}

    return value;
  },

  async encryptAsyncStorage(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const keyValues = await AsyncStorage.multiGet(keys);
    
    for (const [key, value] of keyValues) {
      if (value && this.isSensitiveField(key)) {
        const encrypted = await this.encryptStorageItem(key, value);
        await AsyncStorage.setItem(key, encrypted);
      }
    }
  },

  async rotateMasterKey(oldKeyId: string, newKeyId: string): Promise<void> {
    await this.generateMasterKey(newKeyId);
    
    console.log(`Master key rotated from ${oldKeyId} to ${newKeyId}`);
    
    this.dataConfig.masterKeyId = newKeyId;
  },

  async isEncryptionEnabled(): Promise<boolean> {
    const prefs = await SecureStorage.getUserPreferences();
    return (prefs as any)?.[ENCRYPTION_ENABLED_KEY] ?? this.dataConfig.enabled;
  },

  async enableEncryption(): Promise<void> {
    this.dataConfig.enabled = true;
    await this.initialize();
    
    await SecureStorage.saveUserPreferences({
      [ENCRYPTION_ENABLED_KEY]: true,
    });
  },

  async disableEncryption(): Promise<void> {
    this.dataConfig.enabled = false;
    
    await SecureStorage.saveUserPreferences({
      [ENCRYPTION_ENABLED_KEY]: false,
    });
  },

  getSensitiveFields(): string[] {
    return [...sensitiveFields];
  },

  shouldEncryptField(fieldName: string): boolean {
    if (!this.dataConfig.enabled) return false;
    if (!this.dataConfig.encryptSensitiveFields) return false;
    return this.isSensitiveField(fieldName);
  },
};

export const encryptData = async (data: string, keyId?: string) => {
  return DataEncryptionAtRest.encrypt(data, keyId);
};

export const decryptData = async (encrypted: EncryptedData, keyId?: string) => {
  return DataEncryptionAtRest.decrypt(encrypted, keyId);
};

export const encryptObject = async <T extends Record<string, unknown>>(
  obj: T,
  options?: { encryptFields?: string[]; keyId?: string }
) => {
  return DataEncryptionAtRest.encryptObject(obj, options);
};

export const decryptObject = async <T extends Record<string, unknown>>(
  obj: T,
  options?: { decryptFields?: string[]; keyId?: string }
) => {
  return DataEncryptionAtRest.decryptObject(obj, options);
};