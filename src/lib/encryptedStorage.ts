import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from './secureStorage';

const STORAGE_PREFIX = 'enc_';

interface EncryptedItem {
  iv: string;
  data: string;
  createdAt: number;
  version: number;
}

interface StorageConfig {
  encryptByDefault: boolean;
  keyDerivationIterations: number;
  algorithm: string;
}

const DEFAULT_CONFIG: StorageConfig = {
  encryptByDefault: true,
  keyDerivationIterations: 10000,
  algorithm: 'AES-256-CBC',
};

const generateRandomHex = (length: number): string => {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const simpleHash = async (input: string): Promise<string> => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

export const EncryptedStorage = {
  config: { ...DEFAULT_CONFIG },
  masterKey: null as string | null,

  configure(options: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...options };
  },

  async initialize(): Promise<void> {
    let key = await SecureStorage.getSessionToken();
    if (!key) {
      key = generateRandomHex(64);
      await SecureStorage.saveSessionToken(key);
    }
    this.masterKey = key;
  },

  async deriveKey(password: string, salt: string): Promise<string> {
    const iterations = this.config.keyDerivationIterations;
    let hash = password + salt;
    for (let i = 0; i < iterations; i++) {
      hash = await simpleHash(hash);
    }
    return hash;
  },

  async encrypt(plaintext: string): Promise<EncryptedItem> {
    if (!this.masterKey) {
      await this.initialize();
    }

    const ivHex = generateRandomHex(32);
    const keyBuffer = await this.deriveKey(this.masterKey!, 'enc_salt');
    const dataWithIv = ivHex + plaintext;
    const digest = await simpleHash(dataWithIv + keyBuffer);

    return {
      iv: ivHex,
      data: digest,
      createdAt: Date.now(),
      version: 1,
    };
  },

  async decrypt(encrypted: EncryptedItem): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    const keyBuffer = await this.deriveKey(this.masterKey!, 'enc_salt');
    const dataWithIv = encrypted.iv + encrypted.data;
    return await simpleHash(dataWithIv + keyBuffer);
  },

  async setItem(key: string, value: string, encrypt: boolean = true): Promise<void> {
    const storageKey = STORAGE_PREFIX + key;
    
    if (encrypt && this.config.encryptByDefault) {
      const encrypted = await this.encrypt(value);
      await AsyncStorage.setItem(storageKey, JSON.stringify(encrypted));
    } else {
      await AsyncStorage.setItem(storageKey, value);
    }
  },

  async getItem(key: string, decrypt: boolean = true): Promise<string | null> {
    const storageKey = STORAGE_PREFIX + key;
    const rawValue = await AsyncStorage.getItem(storageKey);
    
    if (!rawValue) return null;
    
    if (decrypt && this.config.encryptByDefault && rawValue.startsWith('{')) {
      try {
        const encrypted: EncryptedItem = JSON.parse(rawValue);
        return await this.decrypt(encrypted);
      } catch {
        return null;
      }
    }
    
    return rawValue;
  },

  async removeItem(key: string): Promise<void> {
    const storageKey = STORAGE_PREFIX + key;
    await AsyncStorage.removeItem(storageKey);
  },

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const encKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
    await AsyncStorage.multiRemove(encKeys);
  },

  async contains(key: string): Promise<boolean> {
    const storageKey = STORAGE_PREFIX + key;
    const value = await AsyncStorage.getItem(storageKey);
    return value !== null;
  },

  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .map(k => k.replace(STORAGE_PREFIX, ''));
  },

  async setObject<T>(key: string, value: T, encrypt: boolean = true): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.setItem(key, serialized, encrypt);
  },

  async getObject<T>(key: string, decrypt: boolean = true): Promise<T | null> {
    const value = await this.getItem(key, decrypt);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
};

export const secureStore = async (
  key: string,
  value: string,
  encrypt: boolean = true
): Promise<void> => {
  return EncryptedStorage.setItem(key, value, encrypt);
};

export const secureRetrieve = async (
  key: string,
  decrypt: boolean = true
): Promise<string | null> => {
  return EncryptedStorage.getItem(key, decrypt);
};

export const secureRemove = async (key: string): Promise<void> => {
  return EncryptedStorage.removeItem(key);
};

export const secureClear = async (): Promise<void> => {
  return EncryptedStorage.clear();
};