export const Validation = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
  },

  isValidAmount(amount: string, maxDecimals: number = 8): boolean {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return false;
    const parts = amount.split('.');
    if (parts.length > 1 && parts[1].length > maxDecimals) return false;
    return true;
  },

  isValidMemo(memo: string, maxLength: number = 100): boolean {
    return memo.length <= maxLength;
  },

  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  },

  validateRecipient(recipient: string): { valid: boolean; error?: string } {
    if (!recipient || recipient.trim().length === 0) {
      return { valid: false, error: 'Recipient is required' };
    }
    
    const sanitized = this.sanitizeInput(recipient);
    
    if (this.isValidEmail(sanitized)) {
      return { valid: true };
    }
    
    if (this.isValidWalletAddress(sanitized)) {
      return { valid: true };
    }
    
    if (this.isValidPhone(sanitized)) {
      return { valid: true };
    }
    
    return { valid: false, error: 'Invalid recipient format' };
  },

  validateAmount(amount: string): { valid: boolean; error?: string; value?: number } {
    if (!amount || amount.trim().length === 0) {
      return { valid: false, error: 'Amount is required' };
    }
    
    const num = parseFloat(amount);
    if (isNaN(num)) {
      return { valid: false, error: 'Invalid amount' };
    }
    
    if (num <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
    
    if (num > 1000000) {
      return { valid: false, error: 'Amount exceeds maximum limit' };
    }
    
    return { valid: true, value: num };
  },

  validateMemo(memo: string): { valid: boolean; error?: string } {
    if (memo && memo.length > 100) {
      return { valid: false, error: 'Memo too long (max 100 characters)' };
    }
    return { valid: true };
  },

  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return phone;
  },

  truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address || address.length < startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  },

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return { valid: errors.length === 0, errors };
  },

  validatePin(pin: string): { valid: boolean; error?: string } {
    if (!pin || pin.length < 4) {
      return { valid: false, error: 'PIN must be at least 4 digits' };
    }
    if (!/^\d+$/.test(pin)) {
      return { valid: false, error: 'PIN must contain only numbers' };
    }
    return { valid: true };
  },
};

export const InputConstraints = {
  MAX_AMOUNT: 1000000,
  MAX_MEMO_LENGTH: 100,
  MIN_PIN_LENGTH: 4,
  MAX_PIN_LENGTH: 6,
  PASSWORD_MIN_LENGTH: 8,
  WALLET_ADDRESS_LENGTH: 42,
};