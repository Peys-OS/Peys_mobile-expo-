import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import { SecureStorage } from './secureStorage';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'facial' | 'iris';
}

export interface BiometricEnrollmentStatus {
  isEnrolled: boolean;
  availableHardware: string[];
  supportedTypes: string[];
  hasFingerprint: boolean;
  hasFacialRecognition: boolean;
}

const BIOMETRIC_STORAGE_KEY = 'biometric_enrolled';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const BiometricVerification = {
  async checkEnrollment(): Promise<BiometricEnrollmentStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const availableHardware: string[] = [];
      if (hasHardware) {
        if (Platform.OS === 'ios') {
          availableHardware.push('Touch ID', 'Face ID');
        } else {
          availableHardware.push('Fingerprint', 'Face Recognition');
        }
      }

      return {
        isEnrolled: isEnrolled && hasHardware,
        availableHardware,
        supportedTypes: supportedTypes.map(t => {
          switch (t) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
              return 'fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
              return 'facial';
            case LocalAuthentication.AuthenticationType.IRIS:
              return 'iris';
            default:
              return 'unknown';
          }
        }),
        hasFingerprint: supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
        hasFacialRecognition: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
      };
    } catch (error) {
      console.error('Biometric check failed:', error);
      return {
        isEnrolled: false,
        availableHardware: [],
        supportedTypes: [],
        hasFingerprint: false,
        hasFacialRecognition: false,
      };
    }
  },

  async isBiometricAvailable(): Promise<boolean> {
    const status = await this.checkEnrollment();
    return status.isEnrolled;
  },

  async authenticate(reason: string = 'Verify your identity'): Promise<BiometricResult> {
    try {
      const status = await this.checkEnrollment();
      if (!status.isEnrolled) {
        return {
          success: false,
          error: 'No biometric credentials enrolled. Please set up biometrics in your device settings.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        await this.updateLastVerification();
        const authType = (result as any).authenticationType;
        return {
          success: true,
          biometricType: authType ? this.mapBiometricType(authType) : undefined,
        };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  mapBiometricType(authType: number): 'fingerprint' | 'facial' | 'iris' | undefined {
    switch (authType) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'facial';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'iris';
      default:
        return undefined;
    }
  },

  async enroll(): Promise<boolean> {
    try {
      const status = await this.checkEnrollment();
      if (!status.availableHardware.length) {
        Alert.alert(
          'Biometrics Unavailable',
          'This device does not support biometric authentication.'
        );
        return false;
      }

      const result = await this.authenticate('Enroll in biometric authentication');
      
      if (result.success) {
        await SecureStorage.saveUserPreferences({
          [BIOMETRIC_STORAGE_KEY]: true,
          [BIOMETRIC_ENABLED_KEY]: true,
          biometricEnrolledAt: Date.now(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      return false;
    }
  },

  async unenroll(): Promise<void> {
    await SecureStorage.saveUserPreferences({
      [BIOMETRIC_STORAGE_KEY]: false,
      [BIOMETRIC_ENABLED_KEY]: false,
    });
  },

  async isEnabled(): Promise<boolean> {
    const prefs = await SecureStorage.getUserPreferences();
    if (prefs && typeof prefs === 'object' && BIOMETRIC_ENABLED_KEY in prefs) {
      return (prefs as any)[BIOMETRIC_ENABLED_KEY] === true;
    }
    return false;
  },

  async updateLastVerification(): Promise<void> {
    await SecureStorage.saveUserPreferences({
      lastBiometricVerification: Date.now(),
    });
  },

  async getLastVerificationTime(): Promise<number | null> {
    const prefs = await SecureStorage.getUserPreferences();
    if (prefs && typeof prefs === 'object' && 'lastBiometricVerification' in prefs) {
      return (prefs as any).lastBiometricVerification;
    }
    return null;
  },

  async verifyAndExecute<T>(
    action: string,
    operation: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    const isEnabled = await this.isEnabled();
    if (!isEnabled) {
      try {
        const result = await operation();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Operation failed' };
      }
    }

    const authResult = await this.authenticate(`Confirm ${action}`);
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Operation failed' };
    }
  },
};

export const withBiometricAuth = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  const result = await BiometricVerification.authenticate('Authenticate to continue');
  if (!result.success) {
    throw new Error(result.error || 'Biometric authentication failed');
  }
  return operation();
};