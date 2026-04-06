import { createPublicClient, http } from 'viem';
import { baseSepolia, celoAlfajores, polygonAmoy } from 'viem/chains';

export interface EscrowConfig {
  chainId: number;
  chainName: string;
  escrowAddress: string;
  usdcAddress: string;
  rpcUrl: string;
  explorer: string;
}

export const ESCROW_CONFIGS: Record<string, EscrowConfig> = {
  base: {
    chainId: 84532,
    chainName: 'Base Sepolia',
    escrowAddress: process.env.EXPO_PUBLIC_ESCROW_BASE || '0x7bcf32C1ef45aFfd38e2A11E48b6d373bDdfb7af',
    usdcAddress: process.env.EXPO_PUBLIC_USDC_BASE || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_BASE || '',
    explorer: 'https://sepolia.basescan.org',
  },
  celo: {
    chainId: 44787,
    chainName: 'Celo Alfajores',
    escrowAddress: process.env.EXPO_PUBLIC_ESCROW_CELO || '0x0b4e459faa79a52a28e9776bc5a0402fc0328544480b4ca4257f7f10973e5562',
    usdcAddress: process.env.EXPO_PUBLIC_USDC_CELO || '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_CELO || '',
    explorer: 'https://alfajores.celoscan.io',
  },
  polygon: {
    chainId: 80002,
    chainName: 'Polygon Amoy',
    escrowAddress: process.env.EXPO_PUBLIC_ESCROW_POLYGON || '0xbe3ace4f8ce1ded010123d927a752c7ade17eaba1da07bdc078c5eba494478b7',
    usdcAddress: process.env.EXPO_PUBLIC_USDC_POLYGON || '0x41E94EB09554da6d1dE6384F89b8c2C5B2c7F3f7',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_POLYGON || '',
    explorer: 'https://amoy.polygonscan.com',
  },
};

const ESCROW_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiration', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getPaymentDetails',
    type: 'function',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiration', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
] as const;

const USDC_ABI = [
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export function getChainConfig(networkId: string) {
  const config = ESCROW_CONFIGS[networkId];
  if (!config) {
    throw new Error(`Unsupported network: ${networkId}`);
  }
  return config;
}

function getViemChain(chainId: number) {
  switch (chainId) {
    case 84532:
      return baseSepolia;
    case 44787:
      return celoAlfajores;
    case 80002:
      return polygonAmoy;
    default:
      return baseSepolia;
  }
}

export async function createPublicClientForNetwork(networkId: string) {
  const config = getChainConfig(networkId);
  const chain = getViemChain(config.chainId);
  
  return createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
}

export async function checkUSDCAllowance(
  networkId: string,
  ownerAddress: string
): Promise<bigint> {
  const config = getChainConfig(networkId);
  const client = await createPublicClientForNetwork(networkId);
  
  return client.readContract({
    address: config.usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [ownerAddress as `0x${string}`, config.escrowAddress as `0x${string}`],
  });
}

export async function getTokenBalance(
  networkId: string,
  address: string
): Promise<bigint> {
  const config = getChainConfig(networkId);
  const client = await createPublicClientForNetwork(networkId);
  
  return client.readContract({
    address: config.usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
}

export async function getPaymentDetails(
  networkId: string,
  paymentId: bigint
): Promise<{
  sender: string;
  recipient: string;
  token: string;
  amount: bigint;
  expiration: bigint;
  status: number;
} | null> {
  try {
    const config = getChainConfig(networkId);
    const client = await createPublicClientForNetwork(networkId);
    
    const details = await client.readContract({
      address: config.escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'getPaymentDetails',
      args: [paymentId],
    });
    
    return {
      sender: details[0],
      recipient: details[1],
      token: details[2],
      amount: details[3],
      expiration: details[4],
      status: Number(details[5]),
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return null;
  }
}

export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}

export function parseUSDC(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e6));
}

export function getExplorerUrl(networkId: string, txHash: string): string {
  const config = getChainConfig(networkId);
  return `${config.explorer}/tx/${txHash}`;
}

export function getNetworkByChainId(chainId: number): string | null {
  for (const [id, config] of Object.entries(ESCROW_CONFIGS)) {
    if (config.chainId === chainId) {
      return id;
    }
  }
  return null;
}