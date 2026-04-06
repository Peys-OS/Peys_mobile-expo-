const MAX_UINT32 = 0xFFFFFFFF;

interface RandomOptions {
  min?: number;
  max?: number;
  inclusive?: boolean;
}

export const SecureRandom = {
  getRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  },

  getRandomUint32(): number {
    const bytes = this.getRandomBytes(4);
    return bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
  },

  getRandomFloat(): number {
    return Math.random();
  },

  getRandomInt(options: RandomOptions = {}): number {
    const { min = 0, max = MAX_UINT32, inclusive = true } = options;
    
    if (min > max) {
      throw new Error('Min cannot be greater than max');
    }

    const range = inclusive ? max - min + 1 : max - min;
    const randomValue = this.getRandomUint32();
    const result = min + (randomValue % range);
    
    return result;
  },

  getRandomBigInt(bits: number): bigint {
    const bytes = Math.ceil(bits / 8);
    const randomBytes = this.getRandomBytes(bytes);
    let result = 0n;
    
    for (let i = 0; i < bytes; i++) {
      result = (result << 8n) | BigInt(randomBytes[i]);
    }
    
    const excessBits = (bytes * 8) - bits;
    if (excessBits > 0) {
      result = result >> BigInt(excessBits);
    }
    
    return result;
  },

  getSecureToken(length: number = 32): string {
    const bytes = this.getRandomBytes(length);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }
    
    return result;
  },

  getSecureHex(length: number = 32): string {
    const bytes = this.getRandomBytes(length);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    const n = result.length;
    
    for (let i = n - 1; i > 0; i--) {
      const j = this.getRandomInt({ min: 0, max: i });
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  },

  getRandomItem<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Array cannot be empty');
    }
    const index = this.getRandomInt({ min: 0, max: array.length - 1 });
    return array[index];
  },

  getRandomItems<T>(array: T[], count: number): T[] {
    if (count > array.length) {
      throw new Error('Count cannot exceed array length');
    }
    
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, count);
  },

  generateUUID(): string {
    const bytes = this.getRandomBytes(16);
    
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  },

  generateSecurePassword(length: number = 16, options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}): string {
    const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
    
    let chars = '';
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (chars.length === 0) {
      chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = this.getRandomInt({ min: 0, max: chars.length - 1 });
      password += chars[randomIndex];
    }
    
    return password;
  },

  getRandomBoolean(probability: number = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    
    return this.getRandomFloat() < probability;
  },

  getSecureTimestamp(): number {
    const random = this.getRandomUint32();
    const base = Date.now();
    const variation = random % 1000;
    return base + variation;
  },
};

export const generateSecureToken = (length?: number): string => {
  return SecureRandom.getSecureToken(length);
};

export const generateUUID = (): string => {
  return SecureRandom.generateUUID();
};

export const generateSecurePassword = (length?: number, options?: {
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}): string => {
  return SecureRandom.generateSecurePassword(length, options);
};

export const getRandomInt = (min?: number, max?: number): number => {
  return SecureRandom.getRandomInt({ min, max });
};

export const shuffleArray = <T>(array: T[]): T[] => {
  return SecureRandom.shuffle(array);
};