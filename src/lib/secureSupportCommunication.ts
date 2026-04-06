import { SecureStorage } from './secureStorage';
import { SecureRandom } from './secureRandom';
import { EncryptedStorage } from './encryptedStorage';

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'technical' | 'billing' | 'security' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: number;
  updatedAt: number;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'support';
  content: string;
  timestamp: number;
  read: boolean;
  attachments?: { name: string; type: string; size: number }[];
}

export interface SupportConfig {
  maxAttachments: number;
  maxAttachmentSize: number;
  allowedFileTypes: string[];
  autoCloseDays: number;
  encryptionEnabled: boolean;
}

const DEFAULT_CONFIG: SupportConfig = {
  maxAttachments: 5,
  maxAttachmentSize: 5242880,
  allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
  autoCloseDays: 14,
  encryptionEnabled: true,
};

const STORAGE_KEY = 'support_tickets';

export const SecureSupportCommunication = {
  config: { ...DEFAULT_CONFIG },
  tickets: [] as SupportTicket[],

  async loadTickets(): Promise<void> {
    if (this.config.encryptionEnabled) {
      const tickets = await EncryptedStorage.getObject<SupportTicket[]>(STORAGE_KEY, true);
      this.tickets = tickets || [];
    } else {
      const stored = await SecureStorage.getUserPreferences();
      const ticketsData = (stored as any)?.[STORAGE_KEY];
      if (ticketsData) {
        try {
          this.tickets = JSON.parse(ticketsData);
        } catch {
          this.tickets = [];
        }
      }
    }
  },

  async saveTickets(): Promise<void> {
    if (this.config.encryptionEnabled) {
      await EncryptedStorage.setObject(STORAGE_KEY, this.tickets, true);
    } else {
      const prefs = await SecureStorage.getUserPreferences() || {};
      await SecureStorage.saveUserPreferences({
        ...prefs,
        [STORAGE_KEY]: JSON.stringify(this.tickets),
      });
    }
  },

  configure(options: Partial<SupportConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getConfig(): SupportConfig {
    return { ...this.config };
  },

  async createTicket(
    subject: string,
    category: SupportTicket['category'],
    initialMessage: string,
    priority?: SupportTicket['priority']
  ): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
    await this.loadTickets();

    const ticketId = SecureRandom.generateUUID();

    const ticket: SupportTicket = {
      id: ticketId,
      subject,
      category,
      priority: priority || this.determinePriority(category),
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: SecureRandom.generateUUID(),
          ticketId,
          sender: 'user',
          content: initialMessage,
          timestamp: Date.now(),
          read: true,
        },
      ],
    };

    this.tickets.push(ticket);
    await this.saveTickets();

    return { success: true, ticket };
  },

  determinePriority(category: SupportTicket['category']): SupportTicket['priority'] {
    switch (category) {
      case 'security':
        return 'urgent';
      case 'technical':
        return 'high';
      case 'billing':
        return 'medium';
      default:
        return 'low';
    }
  },

  async addMessage(
    ticketId: string,
    content: string,
    attachments?: { name: string; type: string; size: number }[]
  ): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
    await this.loadTickets();

    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return { success: false, error: 'Cannot add message to closed ticket' };
    }

    if (attachments && attachments.length > this.config.maxAttachments) {
      return { success: false, error: `Maximum ${this.config.maxAttachments} attachments allowed` };
    }

    const message: SupportMessage = {
      id: SecureRandom.generateUUID(),
      ticketId,
      sender: 'user',
      content,
      timestamp: Date.now(),
      read: true,
      attachments,
    };

    ticket.messages.push(message);
    ticket.updatedAt = Date.now();
    ticket.status = 'in_progress';

    await this.saveTickets();

    return { success: true, message };
  },

  async getTickets(filter?: {
    status?: SupportTicket['status'];
    category?: SupportTicket['category'];
    priority?: SupportTicket['priority'];
  }): Promise<SupportTicket[]> {
    await this.loadTickets();

    return this.tickets.filter(ticket => {
      if (filter?.status && ticket.status !== filter.status) return false;
      if (filter?.category && ticket.category !== filter.category) return false;
      if (filter?.priority && ticket.priority !== filter.priority) return false;
      return true;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    await this.loadTickets();
    return this.tickets.find(t => t.id === ticketId) || null;
  },

  async closeTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    await this.loadTickets();

    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    ticket.status = 'closed';
    ticket.updatedAt = Date.now();
    await this.saveTickets();

    return { success: true };
  },

  async reopenTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    await this.loadTickets();

    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
      return { success: false, error: 'Ticket is not closed' };
    }

    ticket.status = 'open';
    ticket.updatedAt = Date.now();
    await this.saveTickets();

    return { success: true };
  },

  async deleteTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    await this.loadTickets();

    const index = this.tickets.findIndex(t => t.id === ticketId);
    if (index === -1) {
      return { success: false, error: 'Ticket not found' };
    }

    this.tickets.splice(index, 1);
    await this.saveTickets();

    return { success: true };
  },

  async getUnreadCount(): Promise<number> {
    await this.loadTickets();
    return this.tickets.filter(t => 
      t.status !== 'closed' && 
      t.status !== 'resolved' &&
      t.messages.some(m => !m.read && m.sender === 'support')
    ).length;
  },

  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    await this.loadTickets();

    return {
      total: this.tickets.length,
      open: this.tickets.filter(t => t.status === 'open').length,
      inProgress: this.tickets.filter(t => t.status === 'in_progress').length,
      resolved: this.tickets.filter(t => t.status === 'resolved').length,
      closed: this.tickets.filter(t => t.status === 'closed').length,
    };
  },

  validateAttachment(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
    if (file.size > this.config.maxAttachmentSize) {
      return { valid: false, error: `File size exceeds ${this.config.maxAttachmentSize / 1048576}MB limit` };
    }

    if (!this.config.allowedFileTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  },

  getCategories(): { value: SupportTicket['category']; label: string }[] {
    return [
      { value: 'technical', label: 'Technical Issue' },
      { value: 'billing', label: 'Billing & Payments' },
      { value: 'security', label: 'Security Concern' },
      { value: 'account', label: 'Account Management' },
      { value: 'general', label: 'General Inquiry' },
    ];
  },

  getPriorities(): { value: SupportTicket['priority']; label: string }[] {
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ];
  },
};

export const createSupportTicket = async (
  subject: string,
  category: SupportTicket['category'],
  initialMessage: string,
  priority?: SupportTicket['priority']
) => {
  return SecureSupportCommunication.createTicket(subject, category, initialMessage, priority);
};

export const addSupportMessage = async (
  ticketId: string,
  content: string,
  attachments?: { name: string; type: string; size: number }[]
) => {
  return SecureSupportCommunication.addMessage(ticketId, content, attachments);
};

export const getSupportTickets = async (filter?: {
  status?: SupportTicket['status'];
  category?: SupportTicket['category'];
}) => {
  return SecureSupportCommunication.getTickets(filter);
};