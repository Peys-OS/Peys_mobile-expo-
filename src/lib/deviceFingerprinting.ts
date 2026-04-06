import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SecureRandom } from './secureRandom';

export interface DeviceFingerprint {
  id: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  model: string;
  brand: string;
  deviceId: string;
  timezone: string;
  locale: string;
  screenResolution?: string;
  cpuCores?: number;
  memory?: number;
  createdAt: number;
  lastSeen: number;
}

const FINGERPRINT_KEY = 'device_fingerprint';
const FINGERPRINT_ID_KEY = 'device_fingerprint_id';

export const DeviceFingerprinting = {
  fingerprint: null as DeviceFingerprint | null,

  async generateFingerprintId(): Promise<string> {
    let id = await SecureStore.getItemAsync(FINGERPRINT_ID_KEY);
    if (!id) {
      id = SecureRandom.generateUUID();
      await SecureStore.setItemAsync(FINGERPRINT_ID_KEY, id);
    }
    return id;
  },

  async createFingerprint(): Promise<DeviceFingerprint> {
    const fingerprintId = await this.generateFingerprintId();
    const timezone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || 'unknown';
    const locale = 'en-US';
    
    const deviceInfo = {
      osVersion: Platform.OS === 'ios' ? 'iOS' : 'Android',
      deviceName: 'Mobile Device',
      brand: 'Unknown',
      deviceId: fingerprintId,
    };
    
    const appVersion = '1.0.0';
    
    const fingerprint: DeviceFingerprint = {
      id: fingerprintId,
      platform: Platform.OS,
      osVersion: deviceInfo.osVersion,
      appVersion,
      model: deviceInfo.deviceName,
      brand: deviceInfo.brand,
      deviceId: deviceInfo.deviceId || fingerprintId,
      timezone,
      locale,
      screenResolution: undefined,
      cpuCores: undefined,
      memory: undefined,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };

    this.fingerprint = fingerprint;
    return fingerprint;
  },

  async getFingerprint(): Promise<DeviceFingerprint> {
    if (this.fingerprint) {
      this.fingerprint.lastSeen = Date.now();
      return this.fingerprint;
    }

    const stored = await SecureStore.getItemAsync(FINGERPRINT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DeviceFingerprint;
        parsed.lastSeen = Date.now();
        this.fingerprint = parsed;
        await this.saveFingerprint(parsed);
        return parsed;
      } catch {
        return this.createFingerprint();
      }
    }

    return this.createFingerprint();
  },

  async saveFingerprint(fingerprint: DeviceFingerprint): Promise<void> {
    await SecureStore.setItemAsync(FINGERPRINT_KEY, JSON.stringify(fingerprint));
  },

  generateSignature(): string {
    if (!this.fingerprint) return '';
    
    const data = [
      this.fingerprint.id,
      this.fingerprint.platform,
      this.fingerprint.deviceId,
      this.fingerprint.model,
      Date.now().toString(36),
    ].join('|');
    
    return SecureRandom.getSecureHex(32);
  },

  async verifyDevice(): Promise<{ isValid: boolean; fingerprint?: DeviceFingerprint }> {
    try {
      const current = await this.getFingerprint();
      const stored = await SecureStore.getItemAsync(FINGERPRINT_KEY);
      
      if (!stored) {
        return { isValid: true, fingerprint: current };
      }

      const parsed = JSON.parse(stored) as DeviceFingerprint;
      
      if (parsed.id !== current.id) {
        return { isValid: false };
      }

      return { isValid: true, fingerprint: current };
    } catch {
      return { isValid: false };
    }
  },

  async getDeviceAttributes(): Promise<Record<string, string>> {
    const fingerprint = await this.getFingerprint();
    return {
      id: fingerprint.id,
      platform: fingerprint.platform,
      osVersion: fingerprint.osVersion,
      appVersion: fingerprint.appVersion,
      model: fingerprint.model,
      brand: fingerprint.brand,
      deviceId: fingerprint.deviceId,
      timezone: fingerprint.timezone,
      locale: fingerprint.locale,
    };
  },

  async isEmulator(): Promise<boolean> {
    return Platform.OS !== 'ios' && Platform.OS !== 'android';
  },

  async getDeviceScore(): Promise<number> {
    const fingerprint = await this.getFingerprint();
    let score = 50;

    if (fingerprint.platform) score += 10;
    if (fingerprint.deviceId) score += 10;
    if (fingerprint.model) score += 10;
    if (fingerprint.timezone) score += 10;
    if (fingerprint.locale) score += 10;

    return Math.min(score, 100);
  },

  async resetFingerprint(): Promise<void> {
    await SecureStore.deleteItemAsync(FINGERPRINT_KEY);
    await SecureStore.deleteItemAsync(FINGERPRINT_ID_KEY);
    this.fingerprint = null;
  },
};

export const getDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
  return DeviceFingerprinting.getFingerprint();
};

export const verifyDeviceAuthenticity = async (): Promise<boolean> => {
  const result = await DeviceFingerprinting.verifyDevice();
  return result.isValid;
};

export const getDeviceSignature = (): string => {
  return DeviceFingerprinting.generateSignature();
};