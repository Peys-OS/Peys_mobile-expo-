export interface SimulatedTransaction {
  id: string;
  type: 'send' | 'receive';
  to: string;
  amount: number;
  token: string;
  estimatedGas: number;
  success: boolean;
  error?: string;
}

export interface SimulationResult {
  transaction: SimulatedTransaction;
  executed: boolean;
  timestamp: number;
  blockNumber?: number;
  hash?: string;
}

export const TransactionSimulation = {
  simulate(
    type: 'send' | 'receive',
    to: string,
    amount: number,
    token: string = 'USDC'
  ): SimulatedTransaction {
    const gasEstimates: Record<string, number> = {
      USDC: 0.01,
      ETH: 0.005,
      BTC: 0.0001,
    };

    return {
      id: `sim_${Date.now()}`,
      type,
      to,
      amount,
      token,
      estimatedGas: gasEstimates[token] || 0.01,
      success: Math.random() > 0.05,
    };
  },

  async execute(tx: SimulatedTransaction): Promise<SimulationResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      transaction: tx,
      executed: true,
      timestamp: Date.now(),
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };
  },

  simulateBatch(
    transactions: Array<{ type: 'send' | 'receive'; to: string; amount: number; token: string }>
  ): SimulatedTransaction[] {
    return transactions.map(tx => this.simulate(tx.type, tx.to, tx.amount, tx.token));
  },

  estimateTotalGas(txs: SimulatedTransaction[]): number {
    return txs.reduce((sum, tx) => sum + tx.estimatedGas, 0);
  },
};

export const simulateTransaction = (type: 'send' | 'receive', to: string, amount: number, token?: string) =>
  TransactionSimulation.simulate(type, to, amount, token);

export const runSimulation = (txs: SimulatedTransaction[]) =>
  Promise.all(txs.map(tx => TransactionSimulation.execute(tx)));