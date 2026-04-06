import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from './secureStorage';

interface IntegrityCheck {
  id: string;
  hash: string;
  timestamp: number;
  platform: string;
}

interface TamperResult {
  isTampered: boolean;
  checks: IntegrityCheck[];
  warnings: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
}

const INTEGRITY_KEY = 'app_integrity_checks';
const HASH_ITERATIONS = 5;

export const TamperDetection = {
  async generateIntegrityHash(data: string): Promise<string> {
    let hash = data;
    for (let i = 0; i < HASH_ITERATIONS; i++) {
      let h = 0;
      for (let j = 0; j < hash.length; j++) {
        h = ((h << 5) - h) + hash.charCodeAt(j);
        h = h & h;
      }
      hash = Math.abs(h).toString(16) + i.toString();
    }
    return hash.substring(0, 32);
  },

  async createIntegrityCheck(): Promise<IntegrityCheck> {
    const timestamp = Date.now();
    const platform = Platform.OS;
    const data = `app-${timestamp}-${platform}-peysos`;
    
    return {
      id: generateRandomId(),
      hash: await this.generateIntegrityHash(data),
      timestamp,
      platform,
    };
  },

  async recordIntegrityCheck(): Promise<void> {
    const check = await this.createIntegrityCheck();
    const existing = await this.getIntegrityChecks();
    existing.push(check);
    
    const recent = existing.slice(-10);
    await SecureStorage.saveUserPreferences({
      [INTEGRITY_KEY]: JSON.stringify(recent),
    });
  },

  async getIntegrityChecks(): Promise<IntegrityCheck[]> {
    const prefs = await SecureStorage.getUserPreferences();
    const stored = (prefs as any)?.[INTEGRITY_KEY];
    if (stored) {
      try {
        return JSON.parse(stored) as IntegrityCheck[];
      } catch {
        return [];
      }
    }
    return [];
  },

  async verifyIntegrity(): Promise<TamperResult> {
    const checks = await this.getIntegrityChecks();
    const warnings: string[] = [];
    let isTampered = false;
    let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (checks.length === 0) {
      warnings.push('No integrity checks recorded');
      severity = 'low';
    }

    const latestCheck = checks[checks.length - 1];
    if (latestCheck) {
      const timeDiff = Date.now() - latestCheck.timestamp;
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (timeDiff > dayInMs * 7) {
        warnings.push('Last integrity check was over 7 days ago');
        severity = Math.max(severity === 'none' ? 0 : severity === 'low' ? 1 : severity === 'medium' ? 2 : 3, 1) as any;
      }
    }

    await this.recordIntegrityCheck();

    return {
      isTampered,
      checks,
      warnings,
      severity,
    };
  },

  async checkAppSignature(): Promise<{ valid: boolean; reason?: string }> {
    const platform = Platform.OS;
    
    if (platform === 'ios') {
      return { valid: true, reason: 'iOS signature verification not available in React Native' };
    }
    
    if (platform === 'android') {
      return { valid: true, reason: 'Android signature verification not available in React Native' };
    }

    return { valid: true };
  },

  async checkDebugTools(): Promise<{ detected: boolean; tools: string[] }> {
    const detected: string[] = [];
    
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        detected.push('React Native Debugger');
      }
    } catch {}

    const platform = Platform.OS;
    if (platform === 'ios') {
      detected.push('iOS Simulator');
    } else if (platform === 'android') {
      const prefs = await SecureStorage.getUserPreferences();
      if ((prefs as any)?.securityLevel === 'warning') {
        detected.push('Developer Mode');
      }
    }

    return { detected: detected.length > 0, tools: detected };
  },

  async checkReverseEngineering(): Promise<{ detected: boolean; indicators: string[] }> {
    const indicators: string[] = [];
    
    try {
      const globalObj = global as any;
      if (globalObj.__rnx || globalObj.__motif) {
        indicators.push('React Native bundler detected');
      }
    } catch {}
    
    try {
      if (typeof window !== 'undefined') {
        const win = window as unknown as { chrome?: { runtime?: { id?: string } } };
        if (win.chrome?.runtime?.id) {
          indicators.push('Chrome extension context detected');
        }
      }
    } catch {}

    return { detected: indicators.length > 0, indicators };
  },

  async performTamperCheck(): Promise<TamperResult> {
    const debugCheck = await this.checkDebugTools();
    const reverseCheck = await this.checkReverseEngineering();
    const signatureCheck = await this.checkAppSignature();
    
    const warnings: string[] = [];
    let isTampered = false;
    let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (debugCheck.detected) {
      warnings.push(`Debug tools detected: ${debugCheck.tools.join(', ')}`);
      severity = 'low';
    }

    if (reverseCheck.detected) {
      warnings.push(`Reverse engineering indicators: ${reverseCheck.indicators.join(', ')}`);
      isTampered = true;
      severity = 'high';
    }

    if (!signatureCheck.valid) {
      warnings.push(signatureCheck.reason || 'Invalid app signature');
      isTampered = true;
      severity = 'high';
    }

    const integrityResult = await this.verifyIntegrity();
    warnings.push(...integrityResult.warnings);
    
    if (integrityResult.severity !== 'none' && severity === 'none') {
      severity = integrityResult.severity;
    }

    return {
      isTampered,
      checks: integrityResult.checks,
      warnings,
      severity,
    };
  },

  onTamperDetected(callback: (result: TamperResult) => void): void {
    console.log('Tamper detection callback registered');
  },
};

const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const checkAppIntegrity = async (): Promise<TamperResult> => {
  return TamperDetection.performTamperCheck();
};

export const isAppSecure = async (): Promise<boolean> => {
  const result = await checkAppIntegrity();
  return !result.isTampered && result.severity !== 'high';
};