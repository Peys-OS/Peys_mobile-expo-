import { CertificatePinning } from './certificatePinning';

export type WebSocketEventType = 
  | 'open'
  | 'close'
  | 'message'
  | 'error'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  pongTimeout: number;
  useSSL: boolean;
  validateCertificate: boolean;
  headers?: Record<string, string>;
}

const DEFAULT_CONFIG: Partial<WebSocketConfig> = {
  reconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  pingInterval: 30000,
  pongTimeout: 10000,
  useSSL: true,
  validateCertificate: true,
};

export interface SecureWebSocket {
  connect(): Promise<void>;
  disconnect(): void;
  send(message: WebSocketMessage | string): boolean;
  isConnected(): boolean;
  on(event: WebSocketEventType, callback: (data?: unknown) => void): void;
  off(event: WebSocketEventType, callback?: (data?: unknown) => void): void;
}

class WebSocketManager implements SecureWebSocket {
  private config: WebSocketConfig;
  private socket: WebSocket | null = null;
  private listeners: Map<WebSocketEventType, Set<(data?: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;
  private messageQueue: (WebSocketMessage | string)[] = [];

  constructor(config: Partial<WebSocketConfig> & { url: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as WebSocketConfig;
    this.initListeners();
  }

  private initListeners(): void {
    const events: WebSocketEventType[] = ['open', 'close', 'message', 'error', 'ping', 'pong'];
    events.forEach(event => this.listeners.set(event, new Set()));
  }

  private shouldUseSSL(url: string): boolean {
    return this.config.useSSL || url.startsWith('wss://') || (!url.startsWith('ws://') && this.config.useSSL);
  }

  private getConnectionURL(): string {
    let url = this.config.url;
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      const protocol = this.shouldUseSSL(url) ? 'wss://' : 'ws://';
      url = protocol + url;
    }
    return url;
  }

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    const url = this.getConnectionURL();

    return new Promise((resolve, reject) => {
      try {
        const wsConfig: WebSocketInit = {
          headers: this.config.headers,
        };

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('open');
          this.startPing();
          this.flushMessageQueue();
          resolve();
        };

        this.socket.onclose = (event) => {
          this.stopPing();
          this.emit('close', event);

          if (!this.isIntentionallyClosed && this.config.reconnect) {
            this.attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            
            if (data.type === 'pong') {
              this.handlePong();
              this.emit('pong', data);
            } else {
              this.emit('message', data);
            }
          } catch {
            this.emit('message', event.data);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPing();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: WebSocketMessage | string): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.queueMessage(message);
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (error) {
      console.error('WebSocket send error:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  on(event: WebSocketEventType, callback: (data?: unknown) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.add(callback);
    }
  }

  off(event: WebSocketEventType, callback?: (data?: unknown) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      if (callback) {
        callbacks.delete(callback);
      } else {
        callbacks.clear();
      }
    }
  }

  private emit(event: WebSocketEventType, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  private queueMessage(message: WebSocketMessage | string): void {
    if (this.messageQueue.length < 100) {
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) this.send(message);
    }
  }

  private startPing(): void {
    this.pingIntervalId = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', payload: {}, timestamp: Date.now() });
        
        this.pongTimeoutId = setTimeout(() => {
          console.warn('Pong timeout, reconnecting...');
          this.disconnect();
          this.attemptReconnect();
        }, this.config.pongTimeout);
      }
    }, this.config.pingInterval);
  }

  private stopPing(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  private handlePong(): void {
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('error', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect().catch(err => {
        console.error('Reconnection failed:', err);
      });
    }, this.config.reconnectInterval * this.reconnectAttempts);
  }
}

export const createSecureWebSocket = (config: Partial<WebSocketConfig> & { url: string }): SecureWebSocket => {
  return new WebSocketManager(config);
};

export const createTransactionMonitor = (
  walletAddress: string,
  onTransaction: (tx: unknown) => void
): SecureWebSocket => {
  const ws = createSecureWebSocket({
    url: `api.supabase.ws/realtime/v1/websocket?wallet=${walletAddress}`,
    reconnect: true,
    maxReconnectAttempts: 10,
  });

  ws.on('message', (data) => {
    if ((data as WebSocketMessage).type === 'transaction') {
      onTransaction((data as WebSocketMessage).payload);
    }
  });

  return ws;
};

export const createPriceFeed = (
  tokens: string[],
  onPriceUpdate: (prices: Record<string, number>) => void
): SecureWebSocket => {
  const ws = createSecureWebSocket({
    url: 'price-feed.exchange/ws',
    reconnect: true,
    pingInterval: 15000,
  });

  ws.on('open', () => {
    ws.send({
      type: 'subscribe',
      payload: { tokens },
      timestamp: Date.now(),
    });
  });

  ws.on('message', (data) => {
    const msg = data as WebSocketMessage;
    if (msg.type === 'price_update') {
      onPriceUpdate(msg.payload as Record<string, number>);
    }
  });

  return ws;
};

export const createNotificationChannel = (
  userId: string
): SecureWebSocket => {
  return createSecureWebSocket({
    url: `notifications.peysos.com/ws/${userId}`,
    reconnect: true,
    maxReconnectAttempts: 5,
  });
};