import { SecureStorage } from './secureStorage';

interface Session {
  token: string;
  createdAt: number;
  expiresAt: number;
  userId: string;
}

const SESSION_TIMEOUT = 30 * 60 * 1000;
const SESSION_KEY = 'user_session';

export const SessionManager = {
  async createSession(userId: string, token: string): Promise<void> {
    const session: Session = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TIMEOUT,
    };
    await SecureStorage.saveSessionToken(JSON.stringify(session));
  },

  async getSession(): Promise<Session | null> {
    const sessionData = await SecureStorage.getSessionToken();
    if (!sessionData) return null;
    
    try {
      const session = JSON.parse(sessionData) as Session;
      
      if (Date.now() > session.expiresAt) {
        await this.clearSession();
        return null;
      }
      
      return session;
    } catch {
      return null;
    }
  },

  async isSessionValid(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  },

  async refreshSession(): Promise<boolean> {
    const session = await this.getSession();
    if (!session) return false;
    
    session.expiresAt = Date.now() + SESSION_TIMEOUT;
    await SecureStorage.saveSessionToken(JSON.stringify(session));
    return true;
  },

  async clearSession(): Promise<void> {
    await SecureStorage.delete('session_token');
    await SecureStorage.delete('user_preferences');
  },

  async extendSession(): Promise<void> {
    const session = await this.getSession();
    if (session) {
      session.expiresAt = Date.now() + SESSION_TIMEOUT;
      await SecureStorage.saveSessionToken(JSON.stringify(session));
    }
  },

  getSessionTimeout(): number {
    return SESSION_TIMEOUT;
  },

  async getLastActivity(): Promise<number> {
    const prefs = await SecureStorage.getUserPreferences();
    if (prefs && typeof prefs === 'object' && 'lastActivity' in prefs) {
      return (prefs as any).lastActivity;
    }
    return Date.now();
  },

  async updateLastActivity(): Promise<void> {
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...(typeof prefs === 'object' ? prefs : {}),
      lastActivity: Date.now(),
    });
  },

  async checkInactive(timeoutMs: number = SESSION_TIMEOUT): Promise<boolean> {
    const lastActivity = await this.getLastActivity();
    const inactive = Date.now() - lastActivity > timeoutMs;
    
    if (inactive) {
      await this.clearSession();
    }
    
    return inactive;
  },
};

export const ActivityTracker = {
  listeners: [] as (() => void)[],

  startTracking(): void {
    this.updateActivity();
    setInterval(() => this.updateActivity(), 60000);
  },

  async updateActivity(): Promise<void> {
    await SessionManager.updateLastActivity();
    this.listeners.forEach(listener => listener());
  },

  onActivityChange(listener: () => void): void {
    this.listeners.push(listener);
  },

  removeListener(listener: () => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  },
};