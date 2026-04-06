import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ENCRYPTED_WALLET: 'encrypted_wallet',
  USER_PREFERENCES: 'user_preferences',
  PIN_HASH: 'pin_hash',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  SESSION_TOKEN: 'session_token',
  ENCRYPTION_KEY: 'encryption_key',
};

export const SecureStorage = {
  async save(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('SecureStorage.save error:', error);
      throw new Error('Failed to save to secure storage');
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStorage.get error:', error);
      return null;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStorage.delete error:', error);
      throw new Error('Failed to delete from secure storage');
    }
  },

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  },

  async clearAll(): Promise<void> {
    const keys = Object.values(KEYS);
    await Promise.all(keys.map(key => this.delete(key).catch(() => {})));
  },

  async saveEncryptedWallet(walletData: string): Promise<void> {
    await this.save(KEYS.ENCRYPTED_WALLET, walletData);
  },

  async getEncryptedWallet(): Promise<string | null> {
    return this.get(KEYS.ENCRYPTED_WALLET);
  },

  async savePinHash(pinHash: string): Promise<void> {
    await this.save(KEYS.PIN_HASH, pinHash);
  },

  async getPinHash(): Promise<string | null> {
    return this.get(KEYS.PIN_HASH);
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.save(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  },

  async isBiometricEnabled(): Promise<boolean> {
    const value = await this.get(KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  async saveSessionToken(token: string): Promise<void> {
    await this.save(KEYS.SESSION_TOKEN, token);
  },

  async getSessionToken(): Promise<string | null> {
    return this.get(KEYS.SESSION_TOKEN);
  },

  async saveUserPreferences(prefs: object): Promise<void> {
    await this.save(KEYS.USER_PREFERENCES, JSON.stringify(prefs));
  },

  async getUserPreferences(): Promise<object | null> {
    const value = await this.get(KEYS.USER_PREFERENCES);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  },
};

export const generateSecureKey = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let key = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    key += chars[array[i] % chars.length];
  }
  return key;
};

export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (pin: string, storedHash: string): Promise<boolean> => {
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
};