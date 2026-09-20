import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Agent, Wallet, Transaction, BankAccount, AgentDepositRequest } from '../src/types';
import {
  initialAgents,
  initialWallets,
  initialBanks,
  initialPendingDeposits,
  initialPendingWithdrawals,
  initialHistoricalTransactions,
  initialAgentDepositRequests
} from '../src/services/mockData';

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'agent';
  agentId?: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  agents: Agent[];
  wallets: Wallet[];
  transactions: Transaction[];
  agentDepositRequests: AgentDepositRequest[];
  agentPayouts: any[];
  notifications: any[];
  banks: BankAccount[];
  botConfig: {
    enabled: boolean;
    frequencySeconds: number;
    minAmount: number;
    maxAmount: number;
    targetAgentId: string;
    targetProvider: string;
  };
  lastUpdated: string;
}

const DEFAULT_DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'uzx_database.json');

class DatabaseEngine {
  private dbPath: string;
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(filePath?: string) {
    this.dbPath = filePath || DEFAULT_DB_PATH;
    this.ensureDirectoryExists();
    this.data = this.loadOrInitialize();
  }

  private ensureDirectoryExists() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadOrInitialize(): DatabaseSchema {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log(`[Database] Loaded persistent data from ${this.dbPath}`);
        return parsed;
      } catch (err) {
        console.error(`[Database] Error reading existing database file at ${this.dbPath}. Creating fresh state:`, err);
      }
    }

    // Initialize fresh database with secure bcrypt hashed credentials
    console.log(`[Database] Initializing fresh database with seeded credentials at ${this.dbPath}`);
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const agentDefaultPass = process.env.DEFAULT_AGENT_PASSWORD || 'agent123';

    const adminHash = bcrypt.hashSync(adminPass, 10);
    const agentHash = bcrypt.hashSync(agentDefaultPass, 10);

    const initialUsers: UserRecord[] = [
      {
        id: 'USR-ADMIN-01',
        username: 'admin',
        passwordHash: adminHash,
        role: 'admin',
        name: 'Master Admin',
        email: 'ops.master@uzx-finance.io',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USR-AGENT-01',
        username: 'ahmed_ops',
        passwordHash: agentHash,
        role: 'agent',
        agentId: 'AGT-01',
        name: 'Agent Ahmed (Operations)',
        phone: '01031860138',
        email: 'ahmed.ops@webmanagement.io',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USR-AGENT-02',
        username: 'sara_ops',
        passwordHash: agentHash,
        role: 'agent',
        agentId: 'AGT-02',
        name: 'Agent Sara (Cairo Ops)',
        phone: '01031860139',
        email: 'sara.ops@webmanagement.io',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USR-AGENT-03',
        username: 'omar_cairo',
        passwordHash: agentHash,
        role: 'agent',
        agentId: 'AGT-03',
        name: 'Agent Omar (Fast Pay)',
        phone: '01031860140',
        email: 'omar.cairo@webmanagement.io',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USR-AGENT-04',
        username: 'tarek_alex',
        passwordHash: agentHash,
        role: 'agent',
        agentId: 'AGT-04',
        name: 'Agent Tarek (Alexandria)',
        phone: '01031860141',
        email: 'tarek.alex@webmanagement.io',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];

    const initialTransactions: Transaction[] = [
      ...initialPendingDeposits,
      ...initialPendingWithdrawals,
      ...initialHistoricalTransactions
    ];

    const initialDb: DatabaseSchema = {
      users: initialUsers,
      agents: initialAgents,
      wallets: initialWallets,
      transactions: initialTransactions,
      agentDepositRequests: initialAgentDepositRequests || [],
      agentPayouts: [],
      notifications: [
        {
          id: 'NOTIF-01',
          title: 'System Initialized',
          message: 'UZX Enterprise Financial OS is running in secure production mode.',
          timestamp: new Date().toISOString(),
          type: 'system',
          read: false
        }
      ],
      banks: initialBanks,
      botConfig: {
        enabled: false,
        frequencySeconds: 15,
        minAmount: 100,
        maxAmount: 5000,
        targetAgentId: 'AGT-01',
        targetProvider: 'Vodafone Cash'
      },
      lastUpdated: new Date().toISOString()
    };

    this.saveImmediate(initialDb);
    return initialDb;
  }

  private saveImmediate(data: DatabaseSchema) {
    this.ensureDirectoryExists();
    data.lastUpdated = new Date().toISOString();
    const tempPath = `${this.dbPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.dbPath);
  }

  public saveDebounced() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        this.saveImmediate(this.data);
      } catch (err) {
        console.error('[Database] Failed to write database state:', err);
      }
    }, 200);
  }

  // User Operations
  public findUserByUsername(username: string): UserRecord | undefined {
    const clean = username.trim().toLowerCase();
    return this.data.users.find((u) => u.username.toLowerCase() === clean);
  }

  public findUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const newUser: UserRecord = {
      ...user,
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveDebounced();
    return newUser;
  }

  public updateUserPassword(userId: string, newPassword: string): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    this.saveDebounced();
    return true;
  }

  // Transactions
  public getTransactions(filter?: { agentId?: string; status?: string }): Transaction[] {
    let list = [...this.data.transactions];
    if (filter?.agentId) {
      list = list.filter((t) => t.subagentId === filter.agentId);
    }
    if (filter?.status) {
      list = list.filter((t) => t.status === filter.status);
    }
    return list;
  }

  public getTransactionById(id: string): Transaction | undefined {
    return this.data.transactions.find((t) => t.id === id);
  }

  public createTransaction(tx: Transaction): Transaction {
    this.data.transactions.unshift(tx);
    this.saveDebounced();
    return tx;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
    const index = this.data.transactions.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    this.data.transactions[index] = {
      ...this.data.transactions[index],
      ...updates
    };
    this.saveDebounced();
    return this.data.transactions[index];
  }

  // Agents
  public getAgents(): Agent[] {
    return [...this.data.agents];
  }

  public getAgentById(id: string): Agent | undefined {
    return this.data.agents.find((a) => a.id === id);
  }

  public updateAgent(id: string, updates: Partial<Agent>): Agent | undefined {
    const index = this.data.agents.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    this.data.agents[index] = {
      ...this.data.agents[index],
      ...updates
    };
    this.saveDebounced();
    return this.data.agents[index];
  }

  public createAgent(agent: Agent): Agent {
    this.data.agents.push(agent);
    this.saveDebounced();
    return agent;
  }

  // Wallets
  public getWallets(): Wallet[] {
    return [...this.data.wallets];
  }

  public getWalletById(id: string): Wallet | undefined {
    return this.data.wallets.find((w) => w.id === id);
  }

  public updateWallet(id: string, updates: Partial<Wallet>): Wallet | undefined {
    const index = this.data.wallets.findIndex((w) => w.id === id);
    if (index === -1) return undefined;
    this.data.wallets[index] = {
      ...this.data.wallets[index],
      ...updates
    };
    this.saveDebounced();
    return this.data.wallets[index];
  }

  public createWallet(wallet: Wallet): Wallet {
    this.data.wallets.push(wallet);
    this.saveDebounced();
    return wallet;
  }

  // Notifications
  public getNotifications(userId?: string): any[] {
    return [...this.data.notifications];
  }

  public addNotification(notification: any): any {
    const newNotif = {
      ...notification,
      id: notification.id || `NOTIF-${Date.now()}`,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };
    this.data.notifications.unshift(newNotif);
    this.saveDebounced();
    return newNotif;
  }

  // Banks
  public getBanks(): BankAccount[] {
    return [...this.data.banks];
  }

  // Bot Config
  public getBotConfig() {
    return { ...this.data.botConfig };
  }

  public updateBotConfig(updates: Partial<DatabaseSchema['botConfig']>) {
    this.data.botConfig = {
      ...this.data.botConfig,
      ...updates
    };
    this.saveDebounced();
    return this.data.botConfig;
  }

  // Full snapshot sync
  public getFullSnapshot(userRole: 'admin' | 'agent', agentId?: string) {
    const isAgent = userRole === 'agent';
    return {
      agents: isAgent ? this.data.agents.filter((a) => a.id === agentId) : this.data.agents,
      wallets: isAgent ? this.data.wallets.filter((w) => w.agentId === agentId) : this.data.wallets,
      transactions: isAgent ? this.data.transactions.filter((t) => t.subagentId === agentId) : this.data.transactions,
      banks: this.data.banks,
      notifications: this.data.notifications,
      botConfig: this.data.botConfig,
      serverTime: new Date().toISOString()
    };
  }
}

export const db = new DatabaseEngine();
