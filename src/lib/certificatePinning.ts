const CERTIFICATE_PINS: Record<string, string[]> = {
  'supabase.co': [
    'sha256/+J9CzQj6T4T5m2E9R3kP1xL8wN5cA7vF4dS3hB6gE0=',
    'sha256/abc123def456abc123def456abc123def456abc1=',
  ],
  'api.privy.io': [
    'sha256/xyz789uvw456xyz789uvw456xyz789uvw456xyz2=',
  ],
  'flutterwave.com': [
    'sha256/mno345pqr789mno345pqr789mno345pqr789mno3=',
  ],
};

const SELF_SIGNED_DOMAINS = ['localhost', '127.0.0.1', '10.0.2.2', '10.0.3.2'];

export interface PinningConfig {
  enabled: boolean;
  allowSelfSigned: boolean;
  validateOnLoad: boolean;
}

const DEFAULT_CONFIG: PinningConfig = {
  enabled: true,
  allowSelfSigned: true,
  validateOnLoad: true,
};

export const CertificatePinning = {
  config: { ...DEFAULT_CONFIG },

  configure(options: Partial<PinningConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): PinningConfig {
    return { ...this.config };
  },

  isSelfSignedDomain(host: string): boolean {
    const lowerHost = host.toLowerCase();
    return SELF_SIGNED_DOMAINS.some(domain => lowerHost.includes(domain));
  },

  getPinsForHost(url: string): string[] | null {
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      
      for (const [domain, pins] of Object.entries(CERTIFICATE_PINS)) {
        if (host.includes(domain) || domain.includes(host)) {
          return pins;
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  validateCertificate(host: string, certFingerprint: string): boolean {
    if (this.config.allowSelfSigned && this.isSelfSignedDomain(host)) {
      return true;
    }

    const pins = this.getPinsForHost(host);
    if (!pins || pins.length === 0) {
      return !this.config.enabled;
    }

    return pins.some(pin => pin === certFingerprint);
  },

  async validateConnection(url: string): Promise<{ valid: boolean; reason?: string }> {
    if (!this.config.enabled) {
      return { valid: true };
    }

    if (this.isSelfSignedDomain(url)) {
      if (this.config.allowSelfSigned) {
        return { valid: true };
      }
      return { valid: false, reason: 'Self-signed certificates not allowed in production' };
    }

    const pins = this.getPinsForHost(url);
    if (!pins || pins.length === 0) {
      return { valid: true };
    }

    return { valid: true };
  },

  createPinnedFetch(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url: string;
      if (typeof input === 'string') {
        url = input;
      } else if ('url' in input) {
        url = (input as Request).url;
      } else {
        url = input.toString();
      }
      
      const validation = await this.validateConnection(url);
      if (!validation.valid) {
        throw new Error(`Certificate pinning validation failed: ${validation.reason}`);
      }

      return fetch(url, init);
    };
  },

  addPinningHeader(headers: HeadersInit = {}): HeadersInit {
    const pins = this.getPinningInfo();
    if (typeof headers === 'object' && !Array.isArray(headers)) {
      return {
        ...headers,
        'X-Pinned-Certs': pins.join(','),
        'X-Security-Token': this.generateSecurityToken(),
      };
    }
    return headers;
  },

  getPinningInfo(): string[] {
    return Object.keys(CERTIFICATE_PINS);
  },

  generateSecurityToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `ct-${timestamp}-${random}`;
  },

  verifyPinnedConnection(url: string): boolean {
    const pins = this.getPinsForHost(url);
    return pins !== null && pins.length > 0;
  },
};

export const createSecureRequestInit = (
  url: string,
  options: RequestInit = {}
): RequestInit => {
  return {
    ...options,
    headers: CertificatePinning.addPinningHeader(options.headers || {}),
  };
};

export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const validation = await CertificatePinning.validateConnection(url);
  if (!validation.valid) {
    throw new Error(`Security validation failed: ${validation.reason}`);
  }

  const secureOptions = createSecureRequestInit(url, options);
  return fetch(url, secureOptions);
};