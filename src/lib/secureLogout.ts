import { SecureStorage } from './secureStorage';
import { SessionManager } from './sessionManager';

export interface LogoutOptions {
  clearSession: boolean;
  clearStorage: boolean;
  clearClipboard: boolean;
  clearBiometric: boolean;
  clearUserData: boolean;
}

const DEFAULT_OPTIONS: LogoutOptions = {
  clearSession: true,
  clearStorage: true,
  clearClipboard: true,
  clearBiometric: true,
  clearUserData: true,
};

export interface LogoutResult {
  success: boolean;
  clearedItems: string[];
  errors: string[];
}

export const SecureLogout = {
  async logout(options: Partial<LogoutOptions> = {}): Promise<LogoutResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const clearedItems: string[] = [];
    const errors: string[] = [];

    try {
      if (opts.clearSession) {
        await SessionManager.clearSession();
        clearedItems.push('session');
      }
    } catch (error) {
      errors.push(`Session clear failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      if (opts.clearClipboard) {
        await this.clearClipboard();
        clearedItems.push('clipboard');
      }
    } catch (error) {
      errors.push(`Clipboard clear failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      if (opts.clearBiometric) {
        await this.clearBiometricData();
        clearedItems.push('biometric');
      }
    } catch (error) {
      errors.push(`Biometric clear failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      if (opts.clearUserData) {
        await this.clearUserData();
        clearedItems.push('user_data');
      }
    } catch (error) {
      errors.push(`User data clear failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    try {
      if (opts.clearStorage) {
        await this.clearAllSecureStorage();
        clearedItems.push('secure_storage');
      }
    } catch (error) {
      errors.push(`Storage clear failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    this.logoutEvent();

    return {
      success: errors.length === 0,
      clearedItems,
      errors,
    };
  },

  async clearClipboard(): Promise<void> {
    try {
      const { SecureClipboard } = await import('./secureStorage');
      await SecureClipboard.clear();
    } catch {
      // Clipboard may not be available
    }
  },

  async clearBiometricData(): Promise<void> {
    await SecureStorage.saveUserPreferences({
      biometric_enabled: false,
      biometric_enrolled: false,
    });
  },

  async clearUserData(): Promise<void> {
    const userDataKeys = [
      'user_profile',
      'user_preferences_backup',
      'contacts_cache',
      'transaction_cache',
      'wallet_data',
    ];

    for (const key of userDataKeys) {
      await SecureStorage.delete(key);
    }
  },

  async clearAllSecureStorage(): Promise<void> {
    const storageKeys = [
      'session_token',
      'user_preferences',
      'pin_hash',
      'private_key',
      'encrypted_data',
    ];

    for (const key of storageKeys) {
      await SecureStorage.delete(key);
    }
  },

  logoutEvent(): void {
    console.log('Secure logout completed at:', new Date().toISOString());
  },

  async verifyLogout(): Promise<boolean> {
    const sessionValid = await SessionManager.isSessionValid();
    return !sessionValid;
  },

  async prepareLogout(): Promise<LogoutOptions> {
    const prefs = await SecureStorage.getUserPreferences() as Record<string, unknown> | null;
    return {
      clearSession: true,
      clearStorage: true,
      clearClipboard: !!(prefs as any)?.security?.clipboardProtection,
      clearBiometric: !!(prefs as any)?.biometric_enabled,
      clearUserData: true,
    };
  },
};

export const performSecureLogout = async (
  options?: Partial<LogoutOptions>
): Promise<LogoutResult> => {
  return SecureLogout.logout(options);
};

export const withSecureLogout = async <T>(
  operation: () => Promise<T>,
  options?: Partial<LogoutOptions>
): Promise<{ success: boolean; result?: T; error?: string }> => {
  try {
    const result = await operation();
    return { success: true, result };
  } catch (error) {
    await SecureLogout.logout(options);
    return { success: false, error: error instanceof Error ? error.message : 'Operation failed' };
  }
};