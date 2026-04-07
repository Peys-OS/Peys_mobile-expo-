export interface ENSRecord {
  name: string;
  address: string;
  resolver: string;
  ttl: number;
}

export const ENSResolution = {
  resolve(name: string): Promise<ENSRecord | null> {
    if (!name.endsWith('.eth')) return Promise.resolve(null);
    return Promise.resolve({
      name,
      address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      resolver: '0x4976Fb03C32e5B8cfe2b6c2A7ae93BA17C74A4CB',
      ttl: 3600,
    });
  },

  reverseResolve(address: string): Promise<string | null> {
    if (!address.startsWith('0x') || address.length !== 42) return Promise.resolve(null);
    return Promise.resolve(`${address.slice(2, 8)}.eth`);
  },

  isValidENSName(name: string): boolean {
    return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)?eth$/.test(name.toLowerCase());
  },

  getDomainParts(name: string): string[] {
    return name.toLowerCase().split('.');
  },
};

export const resolveENS = (name: string) => ENSResolution.resolve(name);
export const reverseResolve = (address: string) => ENSResolution.reverseResolve(address);