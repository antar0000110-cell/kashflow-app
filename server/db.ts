import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Agent, Wallet, Transaction, BankAccount, AgentDepositRequest, WalletTemplateConfig, DisputeReport } from '../src/types';
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
  walletTemplate: WalletTemplateConfig;
  disputes: DisputeReport[];
  botConfig: {
    enabled: boolean;
    frequencySeconds: number;
    minAmount: number;
    maxAmount: number;
    targetAgentId: string;
    targetProvider: string;
    errorRatePercent?: number;
  };
  lastUpdated: string;
}

const DEFAULT_DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'uzx_database.json');

const DEFAULT_WALLET_TEMPLATE: WalletTemplateConfig = {
  appName: 'FINTECH TERMINAL',
  brandTagline: 'Decentralized USDT Payment Gateway',
  primaryColor: '#0f172a',
  accentColor: '#10b981',
  depositTitle: 'Direct USDT Deposit',
  withdrawTitle: 'Direct USDT Withdrawal',
  depositAddress: 'TY7x902rT91ks892019482',
  depositNetwork: 'TRC20 Network',
  minDeposit: 10,
  maxDeposit: 10000,
  quickAmounts: [50, 100, 200, 500, 1000, 2500],
  supportUrl: 'https://t.me/support',
  announcementText: 'Fast automated settlement within 60 seconds.',
  showTransactionHistory: true,
  showQrCode: true,
  logoText: 'TRC20',
  lastUpdated: new Date().toISOString()
};

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
        const normalized = this.normalizeToUSDT(parsed);
        this.saveImmediate(normalized);
        return normalized;
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

    const zeroBalanceAgents = initialAgents.map(a => ({
      ...a,
      insuranceDeposit: 0,
      currentBalance: 0,
      profitBalance: 0,
      totalEarnedCommission: 0,
      processedVolume: 0,
      todayProcessedCount: 0,
      processedOrdersCount: 0,
      todayAssignedOrders: 0,
      todayAssignedVolumeUSDT: 0
    }));

    const zeroBalanceWallets = initialWallets.map(w => ({
      ...w,
      balance: 0,
      todaySent: 0,
      todayReceived: 0,
      monthTotal: 0
    }));

    const initialDb: DatabaseSchema = {
      users: initialUsers,
      agents: zeroBalanceAgents,
      wallets: zeroBalanceWallets,
      transactions: [],
      agentDepositRequests: [],
      agentPayouts: [],
      disputes: [],
      walletTemplate: {
        appName: 'Management OS',
        brandTagline: 'Decentralized TRC20 Financial Operations & Settlement Gateway',
        primaryColor: '#0F172A',
        accentColor: '#10B981',
        depositTitle: 'إيداع أموال (USDT)',
        withdrawTitle: 'سحب أموال (USDT)',
        depositAddress: 'TQjX9P2v7h78QvYvLpA69jTzM5wX84L3dK',
        depositNetwork: 'TRC20 (TRON)',
        minDeposit: 10,
        maxDeposit: 50000,
        quickAmounts: [100, 250, 500, 1000, 2500],
        supportUrl: 'https://t.me/management_os_support',
        announcementText: 'المنظومة تعمل بالكامل عبر شبكة TRC20 اللامركزية - يتم معالجة الطلبات لحظياً',
        showTransactionHistory: true,
        showQrCode: true,
        logoText: 'OS',
        lastUpdated: new Date().toISOString(),
      },
      notifications: [
        {
          id: 'NOTIF-01',
          title: 'System Initialized',
          message: 'UZX Enterprise Financial OS is running in secure production mode with a zero-balance state.',
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
        targetProvider: 'TRC20 Network'
      },
      lastUpdated: new Date().toISOString()
    };

    this.saveImmediate(initialDb);
    return this.normalizeToUSDT(initialDb);
  }

  private normalizeToUSDT(data: DatabaseSchema): DatabaseSchema {
    if (data.agents) {
      data.agents = data.agents.map((agent) => {
        const updated = { ...agent } as any;
        updated.currency = 'USDT';
        if (agent.todayAssignedVolumeUSDT === undefined) {
          updated.todayAssignedVolumeUSDT = (agent as any).todayAssignedVolumeEGP !== undefined 
            ? (agent as any).todayAssignedVolumeEGP 
            : ((agent as any).todayAssignedVolume || 0);
        }
        if (agent.dailyVolumeMinUSDT === undefined) {
          updated.dailyVolumeMinUSDT = (agent as any).dailyVolumeMinEGP !== undefined 
            ? (agent as any).dailyVolumeMinEGP 
            : ((agent as any).dailyVolumeMin || 0);
        }
        if (agent.dailyVolumeMaxUSDT === undefined) {
          updated.dailyVolumeMaxUSDT = (agent as any).dailyVolumeMaxEGP !== undefined 
            ? (agent as any).dailyVolumeMaxEGP 
            : ((agent as any).dailyVolumeMax || 50000);
        }
        
        // Clean up legacy keys
        delete updated.todayAssignedVolumeEGP;
        delete updated.todayAssignedVolume;
        delete updated.dailyVolumeMinEGP;
        delete updated.dailyVolumeMin;
        delete updated.dailyVolumeMaxEGP;
        delete updated.dailyVolumeMax;
        
        return updated;
      });
    }

    if (data.transactions) {
      data.transactions = data.transactions.map((tx) => ({
        ...tx,
        currency: 'USDT'
      }));
    }

    if (data.wallets) {
      data.wallets = data.wallets.map((w) => ({
        ...w,
        currency: 'USDT'
      }));
    }

    if (!data.walletTemplate) {
      data.walletTemplate = { ...DEFAULT_WALLET_TEMPLATE };
    }
    if (!data.disputes) {
      data.disputes = [];
    }
    if (!data.agentDepositRequests) {
      data.agentDepositRequests = [];
    }
    if (!data.agentPayouts) {
      data.agentPayouts = [];
    }
    if (data.botConfig && (data.botConfig.targetProvider === 'Vodafone Cash' || !data.botConfig.targetProvider)) {
      data.botConfig.targetProvider = 'TRC20 Network';
    }

    return data;
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
  public getNotifications(userRole?: string, agentId?: string): any[] {
    if (userRole === 'agent' && agentId) {
      return this.data.notifications.filter(
        (n) => !n.agentId && !n.targetAgentId || n.agentId === agentId || n.targetAgentId === agentId
      );
    }
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

  // Wallet Template
  public getWalletTemplate(): WalletTemplateConfig {
    if (!this.data.walletTemplate) {
      this.data.walletTemplate = { ...DEFAULT_WALLET_TEMPLATE };
    }
    return { ...this.data.walletTemplate };
  }

  public updateWalletTemplate(updates: Partial<WalletTemplateConfig>): WalletTemplateConfig {
    this.data.walletTemplate = {
      ...this.getWalletTemplate(),
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    this.saveDebounced();
    return { ...this.data.walletTemplate };
  }

  // Disputes & Complaints
  public getDisputes(filter?: { agentId?: string; status?: string }): DisputeReport[] {
    let list = this.data.disputes || [];
    if (filter?.agentId) {
      list = list.filter((d) => d.agentId === filter.agentId);
    }
    if (filter?.status) {
      list = list.filter((d) => d.status === filter.status);
    }
    return [...list];
  }

  public getDisputeById(id: string): DisputeReport | undefined {
    return (this.data.disputes || []).find((d) => d.id === id);
  }

  public createDispute(dispute: Omit<DisputeReport, 'id' | 'createdAt'>): DisputeReport {
    if (!this.data.disputes) this.data.disputes = [];
    const newDispute: DisputeReport = {
      ...dispute,
      id: `DSP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      status: dispute.status || 'Open'
    };
    this.data.disputes.unshift(newDispute);
    this.saveDebounced();
    return newDispute;
  }

  public updateDispute(id: string, updates: Partial<DisputeReport>): DisputeReport | undefined {
    if (!this.data.disputes) this.data.disputes = [];
    const index = this.data.disputes.findIndex((d) => d.id === id);
    if (index === -1) return undefined;
    this.data.disputes[index] = {
      ...this.data.disputes[index],
      ...updates
    };
    this.saveDebounced();
    return this.data.disputes[index];
  }

  // Agent Deposit Requests
  public getAgentDepositRequests(agentId?: string): AgentDepositRequest[] {
    let list = this.data.agentDepositRequests || [];
    if (agentId) {
      list = list.filter((r) => r.agentId === agentId);
    }
    return [...list];
  }

  public createAgentDepositRequest(request: AgentDepositRequest): AgentDepositRequest {
    if (!this.data.agentDepositRequests) this.data.agentDepositRequests = [];
    this.data.agentDepositRequests.unshift(request);
    this.saveDebounced();
    return request;
  }

  public updateAgentDepositRequest(id: string, updates: Partial<AgentDepositRequest>): AgentDepositRequest | undefined {
    if (!this.data.agentDepositRequests) this.data.agentDepositRequests = [];
    const index = this.data.agentDepositRequests.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    this.data.agentDepositRequests[index] = {
      ...this.data.agentDepositRequests[index],
      ...updates
    };
    this.saveDebounced();
    return this.data.agentDepositRequests[index];
  }

  // Agent Payouts
  public getAgentPayouts(agentId?: string): any[] {
    let list = this.data.agentPayouts || [];
    if (agentId) {
      list = list.filter((p) => p.agentId === agentId);
    }
    return [...list];
  }

  public createAgentPayout(payout: any): any {
    if (!this.data.agentPayouts) this.data.agentPayouts = [];
    const newPayout = {
      ...payout,
      id: payout.id || `PAY-${Date.now()}`,
      createdAt: payout.createdAt || new Date().toISOString()
    };
    this.data.agentPayouts.unshift(newPayout);
    this.saveDebounced();
    return newPayout;
  }

  // Zero-data system reset (retaining admin users)
  public resetToZeroData(): void {
    this.data.users = this.data.users.filter((u) => u.role === 'admin');
    this.data.agents = [];
    this.data.wallets = [];
    this.data.transactions = [];
    this.data.agentDepositRequests = [];
    this.data.agentPayouts = [];
    this.data.disputes = [];
    this.data.notifications = [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'System Reset to Zero-Data State',
        message: 'All transaction history, wallets, agent accounts, and collateral profiles have been purged and zeroed out.',
        timestamp: new Date().toISOString(),
        type: 'system',
        read: false
      }
    ];
    this.data.botConfig = {
      enabled: false,
      frequencySeconds: 15,
      minAmount: 100,
      maxAmount: 5000,
      targetAgentId: '',
      targetProvider: 'TRC20 Network'
    };
    this.data.walletTemplate = { ...DEFAULT_WALLET_TEMPLATE };
    this.saveImmediate(this.data);
  }

  // Full snapshot sync
  public getFullSnapshot(userRole: 'admin' | 'agent', agentId?: string) {
    const isAgent = userRole === 'agent';
    return {
      agents: isAgent ? this.data.agents.filter((a) => a.id === agentId) : this.data.agents,
      wallets: isAgent ? this.data.wallets.filter((w) => w.agentId === agentId || w.assignedAgentId === agentId) : this.data.wallets,
      transactions: isAgent ? this.data.transactions.filter((t) => t.subagentId === agentId) : this.data.transactions,
      agentDepositRequests: isAgent ? (this.data.agentDepositRequests || []).filter((r) => r.agentId === agentId) : (this.data.agentDepositRequests || []),
      agentPayouts: isAgent ? (this.data.agentPayouts || []).filter((p) => p.agentId === agentId) : (this.data.agentPayouts || []),
      disputes: isAgent ? (this.data.disputes || []).filter((d) => d.agentId === agentId) : (this.data.disputes || []),
      walletTemplate: this.data.walletTemplate || DEFAULT_WALLET_TEMPLATE,
      banks: this.data.banks,
      notifications: isAgent
        ? this.data.notifications.filter((n) => !n.agentId && !n.targetAgentId || n.agentId === agentId || n.targetAgentId === agentId)
        : this.data.notifications,
      botConfig: this.data.botConfig,
      serverTime: new Date().toISOString()
    };
  }
}

export const db = new DatabaseEngine();
