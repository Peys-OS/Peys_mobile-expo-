import { SecureRandom } from './secureRandom';

export interface MultiSigConfig {
  requiredSignatures: number;
  totalSigners: number;
}

export interface MultiSigWallet {
  id: string;
  name: string;
  threshold: number;
  signers: string[];
  createdAt: number;
  address: string;
}

export interface MultiSigTransaction {
  id: string;
  walletId: string;
  to: string;
  amount: number;
  token: string;
  data?: string;
  signatures: string[];
  status: 'pending' | 'signed' | 'executed' | 'cancelled';
  createdAt: number;
  executedAt?: number;
  expiresAt: number;
}

export interface CreateWalletParams {
  name: string;
  signers: string[];
  requiredSignatures: number;
}

const wallets = new Map<string, MultiSigWallet>();
const pendingTransactions = new Map<string, MultiSigTransaction>();

export const MultiSigSupport = {
  createWallet(params: CreateWalletParams): { success: boolean; wallet?: MultiSigWallet; error?: string } {
    try {
      if (params.requiredSignatures > params.signers.length) {
        return { success: false, error: 'Required signatures cannot exceed total signers' };
      }
      if (params.requiredSignatures < 1) {
        return { success: false, error: 'At least one signature required' };
      }
      if (params.signers.length < 2) {
        return { success: false, error: 'At least 2 signers required for multi-sig' };
      }

      const wallet: MultiSigWallet = {
        id: SecureRandom.generateUUID(),
        name: params.name,
        threshold: params.requiredSignatures,
        signers: params.signers,
        createdAt: Date.now(),
        address: `0x${SecureRandom.getSecureHex(40)}`,
      };

      wallets.set(wallet.id, wallet);
      return { success: true, wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Wallet creation failed' };
    }
  },

  getWallet(id: string): MultiSigWallet | null {
    return wallets.get(id) || null;
  },

  getAllWallets(): MultiSigWallet[] {
    return Array.from(wallets.values());
  },

  deleteWallet(id: string): { success: boolean; error?: string } {
    if (!wallets.has(id)) {
      return { success: false, error: 'Wallet not found' };
    }
    wallets.delete(id);
    return { success: true };
  },

  createTransaction(
    walletId: string,
    to: string,
    amount: number,
    token: string = 'USDC',
    expiresInHours: number = 24
  ): { success: boolean; transaction?: MultiSigTransaction; error?: string } {
    const wallet = wallets.get(walletId);
    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const transaction: MultiSigTransaction = {
      id: SecureRandom.generateUUID(),
      walletId,
      to,
      amount,
      token,
      signatures: [],
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (expiresInHours * 3600000),
    };

    pendingTransactions.set(transaction.id, transaction);
    return { success: true, transaction };
  },

  getTransaction(id: string): MultiSigTransaction | null {
    return pendingTransactions.get(id) || null;
  },

  signTransaction(transactionId: string, signer: string): { success: boolean; transaction?: MultiSigTransaction; error?: string } {
    const transaction = pendingTransactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.status !== 'pending') {
      return { success: false, error: `Cannot sign transaction with status: ${transaction.status}` };
    }

    if (Date.now() > transaction.expiresAt) {
      transaction.status = 'cancelled';
      return { success: false, error: 'Transaction has expired' };
    }

    const wallet = wallets.get(transaction.walletId);
    if (!wallet || !wallet.signers.includes(signer)) {
      return { success: false, error: 'Signer not authorized' };
    }

    if (transaction.signatures.includes(signer)) {
      return { success: false, error: 'Signer has already signed' };
    }

    const signature = SecureRandom.getSecureHex(64);
    transaction.signatures.push(signer);

    if (transaction.signatures.length >= wallet.threshold) {
      transaction.status = 'signed';
    }

    return { success: true, transaction };
  },

  executeTransaction(transactionId: string): { success: boolean; transaction?: MultiSigTransaction; error?: string } {
    const transaction = pendingTransactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.status !== 'signed') {
      return { success: false, error: 'Transaction requires more signatures' };
    }

    transaction.status = 'executed';
    transaction.executedAt = Date.now();
    
    return { success: true, transaction };
  },

  cancelTransaction(transactionId: string): { success: boolean; transaction?: MultiSigTransaction; error?: string } {
    const transaction = pendingTransactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.status === 'executed') {
      return { success: false, error: 'Cannot cancel executed transaction' };
    }

    transaction.status = 'cancelled';
    return { success: true, transaction };
  },

  getPendingTransactions(walletId?: string): MultiSigTransaction[] {
    return Array.from(pendingTransactions.values())
      .filter(t => walletId ? t.walletId === walletId : true)
      .filter(t => t.status === 'pending' || t.status === 'signed');
  },

  getTransactionHistory(walletId?: string): MultiSigTransaction[] {
    return Array.from(pendingTransactions.values())
      .filter(t => walletId ? t.walletId === walletId : true)
      .filter(t => t.status === 'executed' || t.status === 'cancelled');
  },

  canExecute(transactionId: string): { allowed: boolean; required: number; current: number } {
    const transaction = pendingTransactions.get(transactionId);
    if (!transaction) {
      return { allowed: false, required: 0, current: 0 };
    }

    const wallet = wallets.get(transaction.walletId);
    if (!wallet) {
      return { allowed: false, required: 0, current: 0 };
    }

    return {
      allowed: transaction.status === 'signed',
      required: wallet.threshold,
      current: transaction.signatures.length,
    };
  },

  getRequiredSignatures(walletId: string): number {
    const wallet = wallets.get(walletId);
    return wallet?.threshold || 0;
  },
};

export const createMultiSigWallet = (params: CreateWalletParams) => {
  return MultiSigSupport.createWallet(params);
};

export const submitMultiSigTransaction = (
  walletId: string,
  to: string,
  amount: number,
  token?: string
) => {
  return MultiSigSupport.createTransaction(walletId, to, amount, token);
};

export const signMultiSigTransaction = (transactionId: string, signer: string) => {
  return MultiSigSupport.signTransaction(transactionId, signer);
};

export const executeMultiSigTransaction = (transactionId: string) => {
  return MultiSigSupport.executeTransaction(transactionId);
};