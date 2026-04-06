import { SecureStorage } from './secureStorage';
import { SecureRandom } from './secureRandom';

export interface RecoveryContact {
  id: string;
  name: string;
  walletAddress: string;
  relationship: 'family' | 'friend' | 'colleague';
  addedAt: number;
  trusted: boolean;
}

export interface RecoveryRequest {
  id: string;
  requesterWallet: string;
  contacts: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: number;
  expiresAt: number;
  approvalThreshold: number;
  approvals: string[];
  method: 'social' | 'device' | 'backup';
}

export interface RecoveryConfig {
  minContactsRequired: number;
  maxContactsAllowed: number;
  requestExpiryHours: number;
  autoApproveThreshold: number;
}

const DEFAULT_CONFIG: RecoveryConfig = {
  minContactsRequired: 2,
  maxContactsAllowed: 5,
  requestExpiryHours: 72,
  autoApproveThreshold: 3,
};

const STORAGE_KEY = 'recovery_contacts';
const REQUEST_KEY = 'recovery_requests';

export const AccountRecovery = {
  config: { ...DEFAULT_CONFIG },
  contacts: [] as RecoveryContact[],
  requests: [] as RecoveryRequest[],

  async loadContacts(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const contactsData = (stored as any)?.[STORAGE_KEY];
    if (contactsData) {
      try {
        this.contacts = JSON.parse(contactsData);
      } catch {
        this.contacts = [];
      }
    }
  },

  async saveContacts(): Promise<void> {
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [STORAGE_KEY]: JSON.stringify(this.contacts),
    });
  },

  async loadRequests(): Promise<void> {
    const stored = await SecureStorage.getUserPreferences();
    const requestsData = (stored as any)?.[REQUEST_KEY];
    if (requestsData) {
      try {
        this.requests = JSON.parse(requestsData);
      } catch {
        this.requests = [];
      }
    }
  },

  async saveRequests(): Promise<void> {
    const prefs = await SecureStorage.getUserPreferences() || {};
    await SecureStorage.saveUserPreferences({
      ...prefs,
      [REQUEST_KEY]: JSON.stringify(this.requests),
    });
  },

  configure(options: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): RecoveryConfig {
    return { ...this.config };
  },

  async addRecoveryContact(
    name: string,
    walletAddress: string,
    relationship: 'family' | 'friend' | 'colleague'
  ): Promise<{ success: boolean; contact?: RecoveryContact; error?: string }> {
    await this.loadContacts();

    if (this.contacts.length >= this.config.maxContactsAllowed) {
      return { success: false, error: `Maximum ${this.config.maxContactsAllowed} recovery contacts allowed` };
    }

    const existingContact = this.contacts.find(c => c.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    if (existingContact) {
      return { success: false, error: 'Contact already added' };
    }

    const contact: RecoveryContact = {
      id: SecureRandom.generateUUID(),
      name,
      walletAddress,
      relationship,
      addedAt: Date.now(),
      trusted: true,
    };

    this.contacts.push(contact);
    await this.saveContacts();

    return { success: true, contact };
  },

  async removeRecoveryContact(contactId: string): Promise<boolean> {
    await this.loadContacts();
    const index = this.contacts.findIndex(c => c.id === contactId);
    
    if (index === -1) return false;
    
    this.contacts.splice(index, 1);
    await this.saveContacts();
    
    return true;
  },

  async getRecoveryContacts(): Promise<RecoveryContact[]> {
    await this.loadContacts();
    return [...this.contacts];
  },

  async createRecoveryRequest(
    requesterWallet: string,
    contactIds: string[],
    method: 'social' | 'device' | 'backup' = 'social'
  ): Promise<{ success: boolean; request?: RecoveryRequest; error?: string }> {
    await this.loadContacts();
    await this.loadRequests();

    if (contactIds.length < this.config.minContactsRequired) {
      return { success: false, error: `At least ${this.config.minContactsRequired} contacts required` };
    }

    const validContacts = contactIds.filter(id => this.contacts.some(c => c.id === id));
    if (validContacts.length !== contactIds.length) {
      return { success: false, error: 'One or more contacts not found' };
    }

    const pendingRequests = this.requests.filter(r => r.status === 'pending' && r.requesterWallet === requesterWallet);
    if (pendingRequests.length > 0) {
      return { success: false, error: 'Pending recovery request already exists' };
    }

    const request: RecoveryRequest = {
      id: SecureRandom.generateUUID(),
      requesterWallet,
      contacts: contactIds,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.requestExpiryHours * 3600000),
      approvalThreshold: Math.min(contactIds.length, this.config.autoApproveThreshold),
      approvals: [],
      method,
    };

    this.requests.push(request);
    await this.saveRequests();

    return { success: true, request };
  },

  async approveRecoveryRequest(requestId: string, approverWallet: string): Promise<{ success: boolean; request?: RecoveryRequest; error?: string }> {
    await this.loadRequests();

    const request = this.requests.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Recovery request not found' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: `Request is ${request.status}` };
    }

    if (Date.now() > request.expiresAt) {
      request.status = 'expired';
      await this.saveRequests();
      return { success: false, error: 'Recovery request has expired' };
    }

    if (request.approvals.includes(approverWallet)) {
      return { success: false, error: 'Already approved' };
    }

    const isValidApprover = request.contacts.some(cId => {
      const contact = this.contacts.find(c => c.id === cId);
      return contact?.walletAddress.toLowerCase() === approverWallet.toLowerCase();
    });

    if (!isValidApprover) {
      return { success: false, error: 'Not authorized to approve this request' };
    }

    request.approvals.push(approverWallet);

    if (request.approvals.length >= request.approvalThreshold) {
      request.status = 'approved';
    }

    await this.saveRequests();

    return { success: true, request };
  },

  async rejectRecoveryRequest(requestId: string, rejecterWallet: string): Promise<{ success: boolean; request?: RecoveryRequest; error?: string }> {
    await this.loadRequests();

    const request = this.requests.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Recovery request not found' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: `Request is ${request.status}` };
    }

    request.status = 'rejected';
    await this.saveRequests();

    return { success: true, request };
  },

  async getPendingRequests(wallet?: string): Promise<RecoveryRequest[]> {
    await this.loadRequests();
    
    return this.requests
      .filter(r => r.status === 'pending')
      .filter(r => !wallet || r.requesterWallet === wallet);
  },

  async getRequestHistory(wallet?: string): Promise<RecoveryRequest[]> {
    await this.loadRequests();
    
    return this.requests
      .filter(r => r.status !== 'pending')
      .filter(r => !wallet || r.requesterWallet === wallet);
  },

  async cancelRecoveryRequest(requestId: string): Promise<boolean> {
    await this.loadRequests();

    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'rejected';
    await this.saveRequests();

    return true;
  },

  async canRecoverAccount(wallet: string): Promise<{ eligible: boolean; minRequired: number; currentContacts: number }> {
    await this.loadContacts();
    
    const eligible = this.contacts.length >= this.config.minContactsRequired;
    
    return {
      eligible,
      minRequired: this.config.minContactsRequired,
      currentContacts: this.contacts.length,
    };
  },

  getRecoveryMethodInfo(method: 'social' | 'device' | 'backup'): { name: string; description: string } {
    switch (method) {
      case 'social':
        return { name: 'Social Recovery', description: 'Recover using trusted contacts' };
      case 'device':
        return { name: 'Device Recovery', description: 'Recover using your device' };
      case 'backup':
        return { name: 'Backup Recovery', description: 'Recover using backup phrase' };
    }
  },
};

export const addRecoveryContact = async (
  name: string,
  walletAddress: string,
  relationship: 'family' | 'friend' | 'colleague'
) => {
  return AccountRecovery.addRecoveryContact(name, walletAddress, relationship);
};

export const initiateRecovery = async (
  requesterWallet: string,
  contactIds: string[],
  method?: 'social' | 'device' | 'backup'
) => {
  return AccountRecovery.createRecoveryRequest(requesterWallet, contactIds, method);
};

export const approveRecovery = async (requestId: string, approverWallet: string) => {
  return AccountRecovery.approveRecoveryRequest(requestId, approverWallet);
};