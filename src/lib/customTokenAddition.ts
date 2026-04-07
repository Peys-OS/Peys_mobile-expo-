import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  addedAt: number;
}

const STORAGE_KEY = 'custom_tokens';

export const CustomTokenAddition = {
  async addToken(token: CustomToken): Promise<void> {
    const tokens = await this.getCustomTokens();
    if (!tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())) {
      tokens.push({ ...token, addedAt: Date.now() });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
  },

  async getCustomTokens(): Promise<CustomToken[]> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async removeToken(address: string): Promise<void> {
    const tokens = await this.getCustomTokens();
    const filtered = tokens.filter(t => t.address.toLowerCase() !== address.toLowerCase());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
};

export const addCustomToken = (token: CustomToken) => CustomTokenAddition.addToken(token);
export const getCustomTokens = () => CustomTokenAddition.getCustomTokens();