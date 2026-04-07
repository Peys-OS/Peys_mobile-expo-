import { usePrivyContext } from '../contexts/PrivyContext';

export interface WalletConnectSession {
  id: string;
  peerId: string;
  peerMeta: { name: string; url: string; icons: string[] };
  accounts: string[];
  chainId: number;
  connected: boolean;
  createdAt: number;
}

export interface WalletConnectRequest {
  id: string;
  method: string;
  params: any[];
  peerId: string;
}

export interface ConnectionConfig {
  bridgeUrl: string;
  relayerUrl: string;
  storageKey: string;
}

const DEFAULT_CONFIG: ConnectionConfig = {
  bridgeUrl: 'https://bridge.walletconnect.org',
  relayerUrl: 'https://relay.walletconnect.org',
  storageKey: 'walletconnect_sessions',
};

const sessions: Map<string, WalletConnectSession> = new Map();
const pendingRequests: Map<string, WalletConnectRequest> = new Map();

export const WalletConnectV2 = {
  config: { ...DEFAULT_CONFIG },
  listeners: new Map<string, Function[]>(),

  configure(options: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...options };
  },

  async connect(appMeta: { name: string; url: string; icons?: string[] }): Promise<{ uri: string; approval: () => void }> {
    const sessionId = `wc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const uri = `wc:${sessionId}@2?bridge=${encodeURIComponent(this.config.bridgeUrl)}&relayer=${encodeURIComponent(this.config.relayerUrl)}`;
    
    return {
      uri,
      approval: () => this.approveConnection(sessionId, appMeta),
    };
  },

  async approveConnection(id: string, peerMeta: { name: string; url: string; icons?: string[] }): Promise<WalletConnectSession> {
    const session: WalletConnectSession = {
      id,
      peerId: `peer_${Date.now()}`,
      peerMeta: { name: peerMeta.name, url: peerMeta.url, icons: peerMeta.icons || [] },
      accounts: [],
      chainId: 1,
      connected: true,
      createdAt: Date.now(),
    };

    sessions.set(id, session);
    this.emit('connect', session);
    
    return session;
  },

  async disconnect(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.connected = false;
      sessions.delete(sessionId);
      this.emit('disconnect', session);
    }
  },

  getSession(id: string): WalletConnectSession | undefined {
    return sessions.get(id);
  },

  getAllSessions(): WalletConnectSession[] {
    return Array.from(sessions.values()).filter(s => s.connected);
  },

  async request(sessionId: string, method: string, params: any[] = []): Promise<WalletConnectRequest> {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session not connected');

    const request: WalletConnectRequest = {
      id: `req_${Date.now()}`,
      method,
      params,
      peerId: session.peerId,
    };

    pendingRequests.set(request.id, request);
    this.emit('request', request);

    return request;
  },

  async sendResponse(requestId: string, result: any): Promise<void> {
    pendingRequests.delete(requestId);
    this.emit('response', { requestId, result });
  },

  on(event: 'connect' | 'disconnect' | 'request' | 'response', callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  },

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  },

  async switchChain(sessionId: string, chainId: number): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.chainId = chainId;
      await this.request(sessionId, 'wallet_switchEthereumChain', [{ chainId }]);
    }
  },

  async getAccounts(sessionId: string): Promise<string[]> {
    const result = await this.request(sessionId, 'eth_accounts', []);
    return result.params?.[0] || [];
  },

  async signMessage(sessionId: string, message: string): Promise<string> {
    const result = await this.request(sessionId, 'personal_sign', [message]);
    return result.params?.[0] || '';
  },

  async sendTransaction(sessionId: string, tx: { to: string; value: string; data: string }): Promise<string> {
    const result = await this.request(sessionId, 'eth_sendTransaction', [tx]);
    return result.params?.[0] || '';
  },
};

export const useWalletConnect = () => {
  return {
    connect: WalletConnectV2.connect.bind(WalletConnectV2),
    disconnect: WalletConnectV2.disconnect.bind(WalletConnectV2),
    request: WalletConnectV2.request.bind(WalletConnectV2),
    sessions: WalletConnectV2.getAllSessions(),
    on: WalletConnectV2.on.bind(WalletConnectV2),
  };
};

export const createConnection = async (appMeta: { name: string; url: string }) => 
  WalletConnectV2.connect(appMeta);

export const disconnectSession = async (sessionId: string) => 
  WalletConnectV2.disconnect(sessionId);

export const sendRequest = async (sessionId: string, method: string, params?: any[]) => 
  WalletConnectV2.request(sessionId, method, params);