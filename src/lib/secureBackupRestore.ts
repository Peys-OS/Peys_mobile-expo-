import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from './secureStorage';
import { EncryptedStorage } from './encryptedStorage';

export interface BackupData {
  version: string;
  timestamp: number;
  data: Record<string, unknown>;
  checksum: string;
}

export interface BackupOptions {
  encrypt: boolean;
  includeWalletData: boolean;
  includePreferences: boolean;
  includeContacts: boolean;
  includeTransactionHistory: boolean;
}

const DEFAULT_OPTIONS: BackupOptions = {
  encrypt: true,
  includeWalletData: false,
  includePreferences: true,
  includeContacts: true,
  includeTransactionHistory: false,
};

const BACKUP_VERSION = '1.0.0';
const BACKUP_KEY = 'app_backup_data';
const checksum = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

export const SecureBackup = {
  async createBackup(options: Partial<BackupOptions> = {}): Promise<{ success: boolean; backup?: BackupData; error?: string }> {
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const backupData: Record<string, unknown> = {};

      if (opts.includePreferences) {
        const prefs = await SecureStorage.getUserPreferences();
        if (prefs) backupData.preferences = prefs;
      }

      if (opts.includeContacts) {
        const contacts = await AsyncStorage.getItem('contacts');
        if (contacts) backupData.contacts = JSON.parse(contacts);
      }

      if (opts.includeTransactionHistory) {
        const transactions = await AsyncStorage.getItem('transactions');
        if (transactions) backupData.transactions = JSON.parse(transactions);
      }

      if (opts.includeWalletData) {
        const walletData = await AsyncStorage.getItem('wallet_data');
        if (walletData) backupData.walletData = JSON.parse(walletData);
      }

      const serialized = JSON.stringify(backupData);
      const dataChecksum = checksum(serialized);

      const backup: BackupData = {
        version: BACKUP_VERSION,
        timestamp: Date.now(),
        data: backupData,
        checksum: dataChecksum,
      };

      const storageKey = opts.encrypt ? 'encrypted_backup' : 'backup';
      if (opts.encrypt) {
        await EncryptedStorage.setObject(storageKey, backup, true);
      } else {
        await AsyncStorage.setItem(storageKey, JSON.stringify(backup));
      }

      return { success: true, backup };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Backup failed' };
    }
  },

  async restoreBackup(backupData?: BackupData, options: Partial<BackupOptions> = {}): Promise<{ success: boolean; restored: string[]; errors: string[] }> {
    const restored: string[] = [];
    const errors: string[] = [];

    try {
      let backup: BackupData | undefined = backupData;

      if (!backup) {
        const encryptedBackup = await EncryptedStorage.getObject<BackupData>('encrypted_backup', true);
        const plainBackup = await AsyncStorage.getItem('backup');
        
        if (encryptedBackup) {
          backup = encryptedBackup;
        } else if (plainBackup) {
          backup = JSON.parse(plainBackup);
        }
      }

      if (!backup) {
        return { success: false, restored: [], errors: ['No backup found'] };
      }

      const serialized = JSON.stringify(backup.data);
      const calculatedChecksum = checksum(serialized);
      
      if (calculatedChecksum !== backup.checksum) {
        return { success: false, restored: [], errors: ['Backup checksum verification failed'] };
      }

      const opts = { ...DEFAULT_OPTIONS, ...options };

      if (opts.includePreferences && backup.data.preferences) {
        try {
          await SecureStorage.saveUserPreferences(backup.data.preferences as any);
          restored.push('preferences');
        } catch (e) {
          errors.push(`Preferences restore failed: ${e}`);
        }
      }

      if (opts.includeContacts && backup.data.contacts) {
        try {
          await AsyncStorage.setItem('contacts', JSON.stringify(backup.data.contacts));
          restored.push('contacts');
        } catch (e) {
          errors.push(`Contacts restore failed: ${e}`);
        }
      }

      if (opts.includeTransactionHistory && backup.data.transactions) {
        try {
          await AsyncStorage.setItem('transactions', JSON.stringify(backup.data.transactions));
          restored.push('transactions');
        } catch (e) {
          errors.push(`Transactions restore failed: ${e}`);
        }
      }

      return {
        success: errors.length === 0,
        restored,
        errors,
      };
    } catch (error) {
      return { success: false, restored: [], errors: [error instanceof Error ? error.message : 'Restore failed'] };
    }
  },

  async exportToFile(): Promise<{ success: boolean; uri?: string; error?: string }> {
    return { success: false, error: 'File export requires expo-file-system. Use createBackup() instead.' };
  },

  async importFromFile(_uri: string): Promise<{ success: boolean; backup?: BackupData; error?: string }> {
    return { success: false, error: 'File import requires expo-file-system. Use restoreBackup() instead.' };
  },

  async hasBackup(): Promise<boolean> {
    const encrypted = await EncryptedStorage.contains('encrypted_backup');
    const plain = await AsyncStorage.getItem('backup');
    return encrypted || !!plain;
  },

  async deleteBackup(): Promise<void> {
    await AsyncStorage.removeItem('backup');
    await EncryptedStorage.removeItem('encrypted_backup');
  },

  async getBackupInfo(): Promise<{ exists: boolean; timestamp?: number; version?: string; encrypted: boolean }> {
    const encrypted = await EncryptedStorage.getObject<BackupData>('encrypted_backup', true);
    const plain = await AsyncStorage.getItem('backup');
    
    if (encrypted) {
      return { exists: true, timestamp: encrypted.timestamp, version: encrypted.version, encrypted: true };
    }
    
    if (plain) {
      try {
        const parsed = JSON.parse(plain) as BackupData;
        return { exists: true, timestamp: parsed.timestamp, version: parsed.version, encrypted: false };
      } catch {
        return { exists: false, encrypted: false };
      }
    }
    
    return { exists: false, encrypted: false };
  },
};

export const createBackup = async (options?: Partial<BackupOptions>) => {
  return SecureBackup.createBackup(options);
};

export const restoreBackup = async (data?: BackupData, options?: Partial<BackupOptions>) => {
  return SecureBackup.restoreBackup(data, options);
};

export const exportBackup = async () => {
  return SecureBackup.exportToFile();
};

export const importBackup = async (uri: string) => {
  return SecureBackup.importFromFile(uri);
};