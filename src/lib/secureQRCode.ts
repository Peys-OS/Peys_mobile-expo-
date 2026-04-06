import * as QRCode from 'react-native-qrcode-svg';
import { SecureRandom } from './secureRandom';

export interface QRCodeConfig {
  size: number;
  backgroundColor: string;
  color: string;
  includeLogo?: boolean;
  logoUri?: string;
  logoSize?: number;
}

const DEFAULT_CONFIG: QRCodeConfig = {
  size: 256,
  backgroundColor: 'white',
  color: 'black',
  includeLogo: false,
  logoSize: 40,
};

export interface SecureQRPayload {
  type: 'payment' | 'receive' | 'swap' | 'escrow' | 'generic';
  data: Record<string, string | number | boolean>;
  timestamp: number;
  signature?: string;
  expiresAt?: number;
  version: string;
}

export const SecureQRCode = {
  config: { ...DEFAULT_CONFIG },

  configure(options: Partial<QRCodeConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): QRCodeConfig {
    return { ...this.config };
  },

  createPaymentPayload(
    recipientAddress: string,
    amount: number,
    token: string = 'USDC',
    memo?: string
  ): SecureQRPayload {
    return {
      type: 'payment',
      data: {
        recipient: recipientAddress,
        amount: amount.toString(),
        token,
        ...(memo && { memo }),
      },
      timestamp: Date.now(),
      version: '1.0',
    };
  },

  createReceivePayload(
    senderAddress: string,
    requestedAmount?: number,
    token?: string
  ): SecureQRPayload {
    return {
      type: 'receive',
      data: {
        sender: senderAddress,
        ...(requestedAmount && { amount: requestedAmount.toString() }),
        ...(token && { token }),
      },
      timestamp: Date.now(),
      version: '1.0',
    };
  },

  createSwapPayload(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    minReceive?: number
  ): SecureQRPayload {
    return {
      type: 'swap',
      data: {
        fromToken,
        toToken,
        fromAmount: fromAmount.toString(),
        ...(minReceive && { minReceive: minReceive.toString() }),
      },
      timestamp: Date.now(),
      version: '1.0',
    };
  },

  createEscrowPayload(
    escrowId: string,
    amount: number,
    chainId: number,
    conditions?: string
  ): SecureQRPayload {
    return {
      type: 'escrow',
      data: {
        escrowId,
        amount: amount.toString(),
        chainId: chainId.toString(),
        ...(conditions && { conditions }),
      },
      timestamp: Date.now(),
      version: '1.0',
    };
  },

  signPayload(payload: SecureQRPayload): SecureQRPayload {
    const signatureData = `${payload.type}:${payload.timestamp}:${JSON.stringify(payload.data)}`;
    const signature = SecureRandom.getSecureHex(32);
    
    return {
      ...payload,
      signature,
    };
  },

  addExpiration(payload: SecureQRPayload, ttlMs: number = 3600000): SecureQRPayload {
    return {
      ...payload,
      expiresAt: Date.now() + ttlMs,
    };
  },

  isExpired(payload: SecureQRPayload): boolean {
    if (!payload.expiresAt) return false;
    return Date.now() > payload.expiresAt;
  },

  validatePayload(payload: SecureQRPayload): { valid: boolean; error?: string } {
    if (!payload.type || !payload.data || !payload.timestamp) {
      return { valid: false, error: 'Invalid payload structure' };
    }

    const validTypes = ['payment', 'receive', 'swap', 'escrow', 'generic'];
    if (!validTypes.includes(payload.type)) {
      return { valid: false, error: 'Invalid payload type' };
    }

    if (this.isExpired(payload)) {
      return { valid: false, error: 'QR code has expired' };
    }

    const age = Date.now() - payload.timestamp;
    const maxAge = 24 * 60 * 60 * 1000;
    if (age > maxAge) {
      return { valid: false, error: 'QR code is too old' };
    }

    return { valid: true };
  },

  encodePayload(payload: SecureQRPayload): string {
    const encoded = btoa(JSON.stringify(payload));
    return `peysos://${encoded}`;
  },

  decodePayload(encoded: string): SecureQRPayload | null {
    try {
      if (encoded.startsWith('peysos://')) {
        const base64 = encoded.slice(8);
        const decoded = atob(base64);
        return JSON.parse(decoded) as SecureQRPayload;
      }
      return JSON.parse(encoded) as SecureQRPayload;
    } catch (error) {
      console.error('QR decode error:', error);
      return null;
    }
  },

  parseQRCode(qrString: string): { valid: boolean; payload?: SecureQRPayload; error?: string } {
    const payload = this.decodePayload(qrString);
    
    if (!payload) {
      return { valid: false, error: 'Failed to decode QR code' };
    }

    const validation = this.validatePayload(payload);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    return { valid: true, payload };
  },

  createSecurePaymentQR(
    recipientAddress: string,
    amount: number,
    token: string = 'USDC',
    options: { includeSignature?: boolean; ttlMs?: number; memo?: string } = {}
  ): string {
    let payload = this.createPaymentPayload(recipientAddress, amount, token, options.memo);
    
    if (options.includeSignature) {
      payload = this.signPayload(payload);
    }
    
    if (options.ttlMs) {
      payload = this.addExpiration(payload, options.ttlMs);
    }
    
    return this.encodePayload(payload);
  },

  generateSecureId(): string {
    return SecureRandom.generateUUID();
  },
};

export const createSecurePaymentQR = (
  recipient: string,
  amount: number,
  token?: string,
  options?: { includeSignature?: boolean; ttlMs?: number; memo?: string }
): string => {
  return SecureQRCode.createSecurePaymentQR(recipient, amount, token, options);
};

export const parseSecureQR = (qrString: string) => {
  return SecureQRCode.parseQRCode(qrString);
};