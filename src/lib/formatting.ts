export const formatNumber = (value: number, locale: string = 'en-US', decimals: number = 2): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCrypto = (value: number, symbol: string = '', decimals: number = 6): string => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return symbol ? `${formatted} ${symbol}` : formatted;
};

export const formatCompactNumber = (value: number, locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const parseLocalizedNumber = (value: string, locale: string = 'en-US'): number => {
  const cleaned = value.replace(/[^0-9.,-]/g, '');
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
};

export const formatWalletAddress = (address: string, startChars: number = 6, endChars: number = 4): string => {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const formatDate = (date: Date | string, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string, locale: string = 'en-US'): string => {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
};

export const getLocaleSymbol = (locale: string): string => {
  const symbols: Record<string, string> = {
    'en-US': '$',
    'en-GB': '£',
    'en-EU': '€',
    'ja-JP': '¥',
    'ng-NG': '₦',
    'de-DE': '€',
    'fr-FR': '€',
    'es-ES': '€',
  };
  return symbols[locale] || '$';
};

export const SUPPORTED_LOCALES = [
  { code: 'en-US', name: 'English (US)', symbol: '$' },
  { code: 'en-GB', name: 'English (UK)', symbol: '£' },
  { code: 'de-DE', name: 'German', symbol: '€' },
  { code: 'fr-FR', name: 'French', symbol: '€' },
  { code: 'es-ES', name: 'Spanish', symbol: '€' },
  { code: 'ja-JP', name: 'Japanese', symbol: '¥' },
  { code: 'ng-NG', name: 'Nigerian Naira', symbol: '₦' },
];

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];