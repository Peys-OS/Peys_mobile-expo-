import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { secureFetch } from './certificatePinning';

export interface DeepLinkConfig {
  allowedHosts: string[];
  allowedProtocols: string[];
  requireValidation: boolean;
  maxLinkAge: number;
}

const DEFAULT_CONFIG: DeepLinkConfig = {
  allowedHosts: ['peysos.app', 'pay.peysos.com', 'localhost', '127.0.0.1', '10.0.2.2'],
  allowedProtocols: ['peysos', 'https', 'http'],
  requireValidation: true,
  maxLinkAge: 3600000,
};

export interface ParsedDeepLink {
  valid: boolean;
  protocol?: string;
  host?: string;
  path?: string;
  queryParams: Record<string, string>;
  rawUrl: string;
  error?: string;
}

export interface DeepLinkValidation {
  isValid: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const LINK_TIMESTAMP_KEY = 'deep_link_timestamps';

export const SecureDeepLink = {
  config: { ...DEFAULT_CONFIG },
  processedLinks: new Set<string>(),

  configure(options: Partial<DeepLinkConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): DeepLinkConfig {
    return { ...this.config };
  },

  isValidProtocol(protocol: string): boolean {
    return this.config.allowedProtocols.includes(protocol.toLowerCase());
  },

  isValidHost(host: string): boolean {
    const lowerHost = host.toLowerCase();
    return this.config.allowedHosts.some(validHost => 
      lowerHost === validHost || lowerHost.endsWith(`.${validHost}`)
    );
  },

  validateUrl(url: string): DeepLinkValidation {
    try {
      const parsed = new URL(url);
      const protocol = parsed.protocol.replace(':', '');
      
      if (!this.isValidProtocol(protocol)) {
        return {
          isValid: false,
          reason: `Protocol '${protocol}' is not allowed`,
          riskLevel: 'high',
        };
      }

      if (protocol === 'http' || protocol === 'https') {
        if (!this.isValidHost(parsed.host)) {
          return {
            isValid: false,
            reason: `Host '${parsed.host}' is not allowed`,
            riskLevel: 'high',
          };
        }

        const isDevelopment = parsed.host.includes('localhost') || 
                            parsed.host.includes('127.0.0.1') ||
                            parsed.host.includes('10.0.2.2');
        
        if (!isDevelopment && this.config.requireValidation) {
          return { isValid: true, riskLevel: 'low' };
        }
      }

      return { isValid: true, riskLevel: 'low' };
    } catch (error) {
      return {
        isValid: false,
        reason: 'Invalid URL format',
        riskLevel: 'high',
      };
    }
  },

  parseDeepLink(url: string): ParsedDeepLink {
    try {
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        return {
          valid: false,
          queryParams: {},
          rawUrl: url,
          error: validation.reason,
        };
      }

      const parsed = Linking.parse(url);
      const urlObj = new URL(url);
      
      return {
        valid: true,
        protocol: parsed.scheme ?? undefined,
        host: urlObj.hostname ?? undefined,
        path: parsed.path ?? undefined,
        queryParams: parsed.queryParams as Record<string, string>,
        rawUrl: url,
      };
    } catch (error) {
      return {
        valid: false,
        queryParams: {},
        rawUrl: url,
        error: error instanceof Error ? error.message : 'Parse error',
      };
    }
  },

  async handleDeepLink(url: string): Promise<ParsedDeepLink> {
    const parsed = this.parseDeepLink(url);
    
    if (!parsed.valid) {
      console.warn('Invalid deep link rejected:', parsed.error);
      return parsed;
    }

    if (this.processedLinks.has(url)) {
      return { ...parsed, error: 'Link already processed' };
    }

    this.processedLinks.add(url);

    if (this.config.maxLinkAge > 0) {
      const timestamp = Date.now();
      const linkData = { url, timestamp };
      console.log('Deep link logged:', linkData);
    }

    return parsed;
  },

  getLinkType(parsed: ParsedDeepLink): string {
    if (!parsed.valid) return 'invalid';
    
    const path = parsed.path || '';
    
    if (path.startsWith('claim') || parsed.queryParams?.paymentId) {
      return 'payment_claim';
    }
    if (path.startsWith('send')) {
      return 'send_payment';
    }
    if (path.startsWith('receive')) {
      return 'receive_request';
    }
    if (path.startsWith('swap')) {
      return 'token_swap';
    }
    if (path.startsWith('escrow')) {
      return 'escrow_action';
    }
    
    return 'unknown';
  },

  createPaymentLink(paymentId: string, amount?: number, memo?: string): string {
    const baseUrl = Linking.createURL('claim');
    const params = new URLSearchParams({ paymentId });
    if (amount) params.append('amount', amount.toString());
    if (memo) params.append('memo', encodeURIComponent(memo));
    return `${baseUrl}?${params.toString()}`;
  },

  createSendLink(recipient: string, amount?: number, token?: string): string {
    const baseUrl = Linking.createURL('send');
    const params = new URLSearchParams({ to: recipient });
    if (amount) params.append('amount', amount.toString());
    if (token) params.append('token', token);
    return `${baseUrl}?${params.toString()}`;
  },

  validatePaymentClaim(parsed: ParsedDeepLink): { valid: boolean; paymentId?: string; amount?: number; error?: string } {
    const linkType = this.getLinkType(parsed);
    if (linkType !== 'payment_claim') {
      return { valid: false, error: 'Not a payment claim link' };
    }

    const paymentId = parsed.queryParams?.paymentId || parsed.path?.split('/')[1];
    if (!paymentId) {
      return { valid: false, error: 'Missing payment ID' };
    }

    const amount = parsed.queryParams?.amount ? parseFloat(parsed.queryParams.amount) : undefined;
    
    return { valid: true, paymentId, amount };
  },

  clearProcessedLinks(): void {
    this.processedLinks.clear();
  },

  getSupportedActions(): string[] {
    return ['claim', 'send', 'receive', 'swap', 'escrow', 'settings', 'security'];
  },
};

export const createSecureLink = (path: string, params?: Record<string, string | number>): string => {
  const baseUrl = Linking.createURL(path);
  if (!params) return baseUrl;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return `${baseUrl}?${searchParams.toString()}`;
};

export const parseSecureLink = (url: string): ParsedDeepLink => {
  return SecureDeepLink.parseDeepLink(url);
};

export const validateAndHandleLink = async (url: string): Promise<ParsedDeepLink> => {
  return SecureDeepLink.handleDeepLink(url);
};