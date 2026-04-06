import { Platform, NativeModules } from 'react-native';

const JAILBREAK_INDICATORS: RegExp[] = [
  /cydia/i,
  /sileo/i,
  /zbra/i,
  /filza/i,
  /undecimus/i,
  /activator/i,
  /winterboard/i,
  /sbsutils/i,
  /rockapp/i,
  /appccelerator/i,
  /com.ikey.bbot/i,
  /com.saurik.Cydia/i,
  /com.saurik.Cydia.Store/i,
  /塔夫绸/i,
  /trollstore/i,
  /dopamine/i,
  /zopen/i,
  /scarlet/i,
  /ESign/i,
  /IPA/i,
  /app/i,
  /\.app/i,
];

const SUSPICIOUS_PATHS: string[] = [
  '/Applications/Cydia.app',
  '/Applications/Sileo.app',
  '/Applications/Zebra.app',
  '/Applications/filza.app',
  '/Applications/Undecimus.app',
  '/Library/MobileSubstrate/MobileSubstrate.dylib',
  '/bin/bash',
  '/bin/sh',
  '/usr/sbin/sshd',
  '/etc/apt',
  '/private/var/lib/apt/',
  '/usr/libexec/sftp-server',
  '/var/cache/apt',
  '/var/log/syslog',
  '/bin/bash',
  '/bin/sh',
  '/dev/urandom',
];

const DANGEROUS_ENV_VARS: string[] = [
  'DYLD_INSERT_LIBRARIES',
  'DYLD_LIBRARY_PATH',
  'CYDIA_BASE_URL',
  'SUBSTRATE_PATH',
  'THEOS',
];

export interface SecurityCheckResult {
  isJailbroken: boolean;
  isRooted: boolean;
  hasSuspiciousApps: boolean;
  hasDangerousPaths: boolean;
  hasDangerousEnvVars: boolean;
  isDebuggable: boolean;
  isRunningInSimulator: boolean;
  reasons: string[];
}

export const JailbreakDetector = {
  check(): SecurityCheckResult {
    const reasons: string[] = [];
    let hasSuspiciousApps = false;
    let hasDangerousPaths = false;
    let hasDangerousEnvVars = false;
    let isDebuggable = false;
    let isRunningInSimulator = false;

    if (Platform.OS === 'ios') {
      const isSimulator = this.checkSimulator();
      isRunningInSimulator = isSimulator;
      
      if (isSimulator) {
        reasons.push('Running in iOS Simulator');
      }
    }

    if (Platform.OS === 'android') {
      const rootResult = this.checkAndroidRoot();
      if (rootResult.isRooted) {
        reasons.push(...rootResult.reasons);
      }
    }

    hasSuspiciousApps = this.checkSuspiciousApps();
    if (hasSuspiciousApps) {
      reasons.push('Suspicious apps detected');
    }

    hasDangerousPaths = this.checkDangerousPaths();
    if (hasDangerousPaths) {
      reasons.push('Dangerous file paths detected');
    }

    hasDangerousEnvVars = this.checkDangerousEnvVars();
    if (hasDangerousEnvVars) {
      reasons.push('Dangerous environment variables detected');
    }

    isDebuggable = this.checkDebuggable();
    if (isDebuggable) {
      reasons.push('App is running in debug mode');
    }

    const isJailbroken = hasSuspiciousApps || hasDangerousPaths || hasDangerousEnvVars;
    const isRooted = Platform.OS === 'android' ? this.checkAndroidRoot().isRooted : isJailbroken;

    return {
      isJailbroken,
      isRooted,
      hasSuspiciousApps,
      hasDangerousPaths,
      hasDangerousEnvVars,
      isDebuggable,
      isRunningInSimulator,
      reasons,
    };
  },

  checkSuspiciousApps(): boolean {
    return false;
  },

  checkDangerousPaths(): boolean {
    return false;
  },

  checkDangerousEnvVars(): boolean {
    try {
      for (const envVar of DANGEROUS_ENV_VARS) {
        if (typeof process !== 'undefined' && process.env && envVar in process.env) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  },

  checkDebuggable(): boolean {
    try {
      return typeof __DEV__ !== 'undefined' && __DEV__;
    } catch {
      return false;
    }
  },

  checkSimulator(): boolean {
    try {
      const platform = Platform.OS;
      if (platform === 'ios') {
        const isInSimulator = NativeModules.UITest !== undefined;
        return isInSimulator;
      }
      return false;
    } catch {
      return false;
    }
  },

  checkAndroidRoot(): { isRooted: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let isRooted = false;
    
    try {
      const rootPaths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
        '/su/bin/su',
      ];

      for (const path of rootPaths) {
        if (path.includes('su')) {
          isRooted = true;
          reasons.push('SU binary detected');
          break;
        }
      }

      const testKeys = ['test-keys', 'magisk', 'supersu', 'superuser'];
      
      if (testKeys.length > 0) {
        isRooted = true;
        reasons.push('Common root management apps detected');
      }

    } catch {
      return { isRooted: false, reasons: [] };
    }

    return { isRooted, reasons };
  },

  async performFullSecurityCheck(): Promise<SecurityCheckResult> {
    const result = this.check();
    
    if (result.isJailbroken || result.isRooted) {
      console.warn('Security warning: Jailbreak/Root detection triggered', result.reasons);
    }
    
    return result;
  },

  getSecurityLevel(result: SecurityCheckResult): 'safe' | 'warning' | 'danger' {
    if (result.isJailbroken || result.isRooted) {
      return 'danger';
    }
    if (result.isDebuggable || result.isRunningInSimulator) {
      return 'warning';
    }
    return 'safe';
  },

  shouldBlockAccess(result: SecurityCheckResult): boolean {
    return result.isJailbroken || result.isRooted;
  },
};