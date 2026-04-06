import { SecureRandom } from './secureRandom';

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxConsecutiveRepeats: number;
  checkCommonPasswords: boolean;
}

export interface PINPolicy {
  minLength: number;
  maxLength: number;
  allowSequential: boolean;
  allowRepeating: boolean;
}

export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxConsecutiveRepeats: 3,
  checkCommonPasswords: true,
};

const DEFAULT_PIN_POLICY: PINPolicy = {
  minLength: 4,
  maxLength: 8,
  allowSequential: false,
  allowRepeating: false,
};

const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123', 'welcome',
];

export const SecurePasswordPolicy = {
  passwordPolicy: { ...DEFAULT_PASSWORD_POLICY },
  pinPolicy: { ...DEFAULT_PIN_POLICY },

  configurePasswordPolicy(options: Partial<PasswordPolicy>): void {
    this.passwordPolicy = { ...this.passwordPolicy, ...options };
  },

  configurePINPolicy(options: Partial<PINPolicy>): void {
    this.pinPolicy = { ...this.pinPolicy, ...options };
  },

  getPasswordPolicy(): PasswordPolicy {
    return { ...this.passwordPolicy };
  },

  getPINPolicy(): PINPolicy {
    return { ...this.pinPolicy };
  },

  validatePassword(password: string): PolicyValidationResult {
    const errors: string[] = [];
    const policy = this.passwordPolicy;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (policy.maxConsecutiveRepeats > 0) {
      const repeatMatch = password.match(new RegExp(`(.)\\1{${policy.maxConsecutiveRepeats},}`));
      if (repeatMatch) {
        errors.push(`Password cannot have more than ${policy.maxConsecutiveRepeats} consecutive repeated characters`);
      }
    }

    if (policy.checkCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.includes(lowerPassword)) {
        errors.push('Password is too common. Please choose a stronger password');
      }
    }

    const strength = this.calculatePasswordStrength(password, policy);
    
    return {
      valid: errors.length === 0,
      errors,
      strength: strength.label,
      score: strength.score,
    };
  },

  validatePIN(pin: string): PolicyValidationResult {
    const errors: string[] = [];
    const policy = this.pinPolicy;

    if (pin.length < policy.minLength) {
      errors.push(`PIN must be at least ${policy.minLength} digits`);
    }

    if (pin.length > policy.maxLength) {
      errors.push(`PIN must not exceed ${policy.maxLength} digits`);
    }

    if (!/^\d+$/.test(pin)) {
      errors.push('PIN must contain only numbers');
    }

    if (!policy.allowRepeating) {
      const uniqueDigits = new Set(pin.split(''));
      if (uniqueDigits.size === 1 || (uniqueDigits.size === 2 && pin.length > 3)) {
        const repeatMatch = pin.match(new RegExp('(\\d)\\1{2,}'));
        if (repeatMatch) {
          errors.push('PIN cannot have repeating digits');
        }
      }
    }

    if (!policy.allowSequential) {
      const sequentialPatterns = ['012', '123', '234', '345', '456', '567', '678', '789', '890'];
      const reversedPatterns = ['210', '321', '432', '543', '654', '765', '876', '987', '098'];
      
      const lowerPin = pin;
      if (sequentialPatterns.some(p => lowerPin.includes(p)) || reversedPatterns.some(p => lowerPin.includes(p))) {
        errors.push('PIN cannot contain sequential numbers');
      }
    }

    const strength = this.calculatePINStrength(pin, policy);

    return {
      valid: errors.length === 0,
      errors,
      strength: strength.label,
      score: strength.score,
    };
  },

  calculatePasswordStrength(password: string, policy: PasswordPolicy): { score: number; label: 'weak' | 'medium' | 'strong' | 'very_strong' } {
    let score = 0;

    if (password.length >= policy.minLength) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 15;

    const uniqueChars = new Set(password.split('')).size;
    if (uniqueChars >= password.length * 0.7) score += 15;

    const lowerPassword = password.toLowerCase();
    const hasCommon = COMMON_PASSWORDS.some(p => lowerPassword.includes(p));
    if (!hasCommon) score += 10;

    let label: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';
    if (score >= 80) label = 'very_strong';
    else if (score >= 60) label = 'strong';
    else if (score >= 40) label = 'medium';

    return { score: Math.min(score, 100), label };
  },

  calculatePINStrength(pin: string, policy: PINPolicy): { score: number; label: 'weak' | 'medium' | 'strong' | 'very_strong' } {
    let score = 20;

    score += (pin.length - policy.minLength + 1) * 10;

    const uniqueDigits = new Set(pin.split('')).size;
    score += uniqueDigits * 5;

    if (!policy.allowRepeating) score += 10;
    if (!policy.allowSequential) score += 10;

    let label: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';
    if (score >= 60) label = 'very_strong';
    else if (score >= 45) label = 'strong';
    else if (score >= 30) label = 'medium';

    return { score: Math.min(score, 100), label };
  },

  generateSecurePassword(length: number = 16): string {
    return SecureRandom.generateSecurePassword(length, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
  },

  generateSecurePIN(length: number = 6): string {
    let pin: string;
    do {
      const bytes = SecureRandom.getRandomBytes(length);
      pin = Array.from(bytes).map(b => (b % 10).toString()).join('');
    } while (!this.validatePIN(pin).valid);
    
    return pin;
  },

  hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + 
           SecureRandom.getSecureHex(16);
  },

  comparePasswords(password: string, hash: string): boolean {
    const inputHash = this.hashPassword(password);
    return inputHash === hash;
  },

  getStrengthRequirements(): { minLength: number; mustHave: string[] } {
    const mustHave: string[] = [];
    const policy = this.passwordPolicy;

    mustHave.push(`${policy.minLength}+ chars`);
    if (policy.requireUppercase) mustHave.push('uppercase');
    if (policy.requireLowercase) mustHave.push('lowercase');
    if (policy.requireNumbers) mustHave.push('number');
    if (policy.requireSymbols) mustHave.push('symbol');

    return { minLength: policy.minLength, mustHave };
  },
};

export const validatePassword = (password: string) => {
  return SecurePasswordPolicy.validatePassword(password);
};

export const validatePIN = (pin: string) => {
  return SecurePasswordPolicy.validatePIN(pin);
};

export const generatePassword = (length?: number) => {
  return SecurePasswordPolicy.generateSecurePassword(length);
};

export const generatePIN = (length?: number) => {
  return SecurePasswordPolicy.generateSecurePIN(length);
};