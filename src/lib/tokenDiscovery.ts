export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  address: string;
  logoUrl?: string;
  price?: number;
  change24h?: number;
}

const POPULAR_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 1, address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 1, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  { symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 1, address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  { symbol: 'BTC', name: 'Bitcoin', decimals: 8, chainId: 1, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, chainId: 1, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, chainId: 1, address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
  { symbol: 'MATIC', name: 'Polygon', decimals: 18, chainId: 137, address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'LINK', name: 'Chainlink', decimals: 18, chainId: 1, address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
];

export const TokenDiscovery = {
  searchTokens(query: string, chainId?: number): Token[] {
    const q = query.toLowerCase();
    return POPULAR_TOKENS.filter(t => {
      const matchesChain = !chainId || t.chainId === chainId;
      const matchesQuery = t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
      return matchesChain && matchesQuery;
    });
  },

  getTokensByChain(chainId: number): Token[] {
    return POPULAR_TOKENS.filter(t => t.chainId === chainId);
  },

  getAllTokens(): Token[] {
    return [...POPULAR_TOKENS];
  },

  getTokenBySymbol(symbol: string): Token | undefined {
    return POPULAR_TOKENS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
  },

  getTrendingTokens(): Token[] {
    return POPULAR_TOKENS.slice(0, 5);
  },

  async searchExternal(_query: string): Promise<Token[]> {
    return POPULAR_TOKENS;
  },
};

export const discoverTokens = (query: string, chainId?: number) => TokenDiscovery.searchTokens(query, chainId);
export const getTrendingTokens = () => TokenDiscovery.getTrendingTokens();