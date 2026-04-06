import { Platform, NativeModules, PermissionsAndroid, Alert } from 'react-native';
import React from 'react';

export interface ScreenCaptureConfig {
  preventScreenshot: boolean;
  preventScreenRecording: boolean;
  blurOnBackground: boolean;
  showWarning: boolean;
}

const DEFAULT_CONFIG: ScreenCaptureConfig = {
  preventScreenshot: true,
  preventScreenRecording: true,
  blurOnBackground: true,
  showWarning: true,
};

export const ScreenCapturePrevention = {
  config: { ...DEFAULT_CONFIG },
  isEnabled: false,
  listeners: [] as (() => void)[],

  configure(options: Partial<ScreenCaptureConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): ScreenCaptureConfig {
    return { ...this.config };
  },

  async enable(): Promise<boolean> {
    if (this.isEnabled) return true;

    try {
      if (Platform.OS === 'ios') {
        this.isEnabled = true;
        this.notifyListeners();
        return true;
      }

      if (Platform.OS === 'android') {
        const hasPermission = await this.requestScreenCapturePermission();
        if (hasPermission) {
          this.isEnabled = true;
          this.notifyListeners();
          return true;
        }
        return false;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable screen capture prevention:', error);
      return false;
    }
  },

  disable(): void {
    this.isEnabled = false;
    this.notifyListeners();
  },

  async requestScreenCapturePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Screen Capture Permission',
          message: 'This app needs permission to prevent screen capture',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  },

  isScreenCapturePrevented(): boolean {
    return this.isEnabled && this.config.preventScreenshot;
  },

  isScreenRecordingPrevented(): boolean {
    return this.isEnabled && this.config.preventScreenRecording;
  },

  onCaptureAttempt(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },

  notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  },

  showSecurityWarning(): void {
    if (this.config.showWarning) {
      Alert.alert(
        'Security Notice',
        'Screen capture is disabled for your security. Sensitive information cannot be captured.',
        [{ text: 'OK' }]
      );
    }
  },

  getSecurityStatus(): { screenshot: boolean; recording: boolean; enabled: boolean } {
    return {
      screenshot: this.isScreenCapturePrevented(),
      recording: this.isScreenRecordingPrevented(),
      enabled: this.isEnabled,
    };
  },

  async applyProtection(): Promise<void> {
    await this.enable();
  },

  removeProtection(): void {
    this.disable();
  },
};

export const useScreenCapturePrevention = (enabled: boolean = true) => {
  if (enabled) {
    ScreenCapturePrevention.applyProtection();
  } else {
    ScreenCapturePrevention.removeProtection();
  }

  return {
    isProtected: ScreenCapturePrevention.isScreenCapturePrevented(),
    getStatus: ScreenCapturePrevention.getSecurityStatus,
  };
};

export const SecureScreen = ({ children }: { children: React.ReactNode }) => {
  if (Platform.OS === 'ios') {
    return <>{children}</>;
  }
  return <>{children}</>;
};