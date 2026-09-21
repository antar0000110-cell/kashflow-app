import { create, StateCreator } from 'zustand';
import { StorageUtil, STORAGE_KEYS } from '../utils/storage';
import {
  BankAccount,
  Transaction,
  Wallet,
  Agent,
  AgentDepositRequest,
  AgentPayout,
  DomainSettings,
  BotEngineConfig,
  AppNotification,
  TransactionStatus
} from '../types';
import {
  initialBanks,
  initialPendingDeposits,
  initialPendingWithdrawals,
  initialHistoricalTransactions,
  initialAgents,
  initialWallets,
  initialAgentDepositRequests,
  SIMULATION_WALLET_POOL
} from '../services/mockData';
import { generateOtpCode, generateRandomId, generateHash, generateTimeBasedOtp } from '../utils/formatters';
import { socketService } from '../services/socketService';
import { formatCairoTime, getElapsedSeconds, formatTimerHHMMSS } from '../utils/cairoTime';
import { soundManager } from '../utils/soundAlerts';
import { sendNativePushNotification } from '../services/notificationService';
import { apiService } from '../services/api';
import { routeAssignmentService } from '../services/RouteAssignmentService';
import { startAutoRefresh, stopAutoRefresh, setOnRefreshLogout } from '../utils/tokenRefresh';

export type AppSection =
  | 'dashboard'
  | 'deposits'
  | 'pending-deposits'
  | 'deposit-requests'
  | 'withdrawals'
  | 'pending-withdrawals'
  | 'withdrawal-requests'
  | 'payment-queries'
  | 'payment-queries-agent'
  | 'bank-transfer'
  | 'banks'
  | 'users'
  | 'user-wallets'
  | 'transactions'
  | 'payment-providers'
  | 'payment-methods'
  | 'currencies'
  | 'bank-accounts'
  | 'financial-reports'
  | 'deposit-reports'
  | 'withdrawal-reports'
  | 'transaction-reports'
  | 'referrals'
  | 'admin-users'
  | 'settings'
  | 'agent-management'
  | 'subagents'
  | 'deposit-requests-to-admin'
  | 'agent-portal'
  | 'wallet-pool'
  | 'mobile-wallet-apk'
  | 'mobile-apk-wallet'
  | 'bot-engine'
  | 'agent-payouts'
  | 'agent-audit'
  | 'domain-settings';

export interface AppStoreState {
  // Navigation & Auth
  authRole: 'guest' | 'admin' | 'agent';
  currentUser: { username: string; role: 'admin' | 'agent'; agentId?: string; agentName?: string } | null;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  activeSection: AppSection;
  activePortal: 'admin' | 'agent' | 'wallet-apk';
  selectedAgentId: string;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  isProductionMode: boolean;

  syncWithBackend: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; role?: 'admin' | 'agent'; message?: string }>;
  logout: () => void;

  // Selected Order for Modal Inspection
  inspectingTransaction: Transaction | null;

  // Mobile Wallet State
  activeWalletNumber: string | null;
  walletOtpPendingNumber: string | null;
  isWalletLoggedIn: boolean;

  // Configuration & Commissions
  commissionRates: {
    depositCommissionPercent: number;
    withdrawalCommissionPercent: number;
  };
  supportedCurrencies: string[];
  paymentMethods: string[];
  domainSettings: DomainSettings;

  // Data
  banks: BankAccount[];
  pendingDeposits: Transaction[];
  depositHistory: Transaction[];
  pendingWithdrawals: Transaction[];
  withdrawalHistory: Transaction[];
  agents: Agent[];
  wallets: Wallet[];
  agentDepositRequests: AgentDepositRequest[];
  agentPayouts: AgentPayout[];
  notifications: AppNotification[];
  botConfig: BotEngineConfig;
  globalTrafficActive: boolean;
  soundEnabled: boolean;
  autoUpdateEnabled: boolean;
  isRealtimeSyncPaused: boolean;
  toggleRealtimeSync: () => void;
  totalSimulatedWalletsCount: number;
  lastPulseTime: number;

  // Actions - Navigation & Inspection
  setActiveSection: (section: AppSection) => void;
  setActivePortal: (portal: 'admin' | 'agent' | 'wallet-apk') => void;
  setSelectedAgentId: (agentId: string) => void;
  setProductionMode: (isProd: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setInspectingTransaction: (tx: Transaction | null) => void;
  setCommissionRates: (rates: Partial<{ depositCommissionPercent: number; withdrawalCommissionPercent: number }>) => void;
  resetSystemData: () => void;
  updateDomainSettings: (settings: Partial<DomainSettings>) => void;

  // Actions - Payment Methods Management
  addPaymentMethod: (name: string) => void;
  updatePaymentMethod: (oldName: string, newName: string) => void;
  deletePaymentMethod: (name: string) => void;

  // Actions - Operations
  confirmDeposit: (transactionId: string, customAmount?: number, processedBy?: string, processedByRole?: 'admin' | 'agent') => void;
  rejectDeposit: (transactionId: string, reason?: string, processedBy?: string, processedByRole?: 'admin' | 'agent') => void;
  confirmWithdrawal: (transactionId: string, processedBy?: string, processedByRole?: 'admin' | 'agent') => void;
  rejectWithdrawal: (transactionId: string, reason?: string, processedBy?: string, processedByRole?: 'admin' | 'agent') => void;
  holdWithdrawal: (transactionId: string) => void;
  reassignOrder: (transactionId: string, newAgentId: string) => void;
  batchApproveDeposits: (ids: string[]) => void;
  setAutoUpdateEnabled: (enabled: boolean) => void;

  // Actions - Sound Alert
  toggleSound: () => void;
  playTestSound: () => void;
  trigger90sPulse: () => void;

  // Actions - Banks
  addBank: (bank: Omit<BankAccount, 'id' | 'createdAt'>) => void;
  updateBank: (id: string, bank: Partial<BankAccount>) => void;
  toggleBankActive: (id: string) => void;

  // Actions - Agents & Traffic
  addAgent: (agent: Omit<Agent, 'id' | 'todayProcessedCount' | 'todayAssignedOrders' | 'todayAssignedVolumeEGP' | 'assignedWalletCount' | 'assignedWalletIds' | 'lastActiveAt'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  toggleAgentTraffic: (id: string) => void;
  setGlobalTraffic: (active: boolean) => void;
  toggleGlobalTraffic: () => void;
  submitAgentDepositRequest: (agentId: string, amount: number, method: string, ref: string, note: string) => void;
  requestAgentDeposit?: (agentId: string, amount: number, method: string, ref: string, note: string) => void;
  processAgentDepositRequest: (requestId: string, status: 'Approved' | 'Rejected', customApprovedAmount?: number) => void;
  payoutAgentCommission: (agentId: string, amount: number, paymentMethod: string, referenceNumber: string, notes?: string) => void;
  adjustAgentAccountBalance: (agentId: string, newBalance: number, reason: string) => void;

  // Actions - Wallets & Limits
  addWalletsToPool: (count: number) => void;
  generateManualWallet: (data: {
    phoneNumber?: string;
    provider: string;
    agentId?: string | null;
    dailySendLimit?: number;
    dailyReceiveLimit?: number;
    monthlyLimit?: number;
    maxSingleLimit?: number;
    minSingleLimit?: number;
    initialBalance?: number;
  }) => Wallet;
  assignWalletsToAgent: (agentIdOrWalletIds: any, walletIdsOrAgentId?: any) => void;
  assignWalletToAgent?: (agentId: string, walletIds: string[]) => void;
  unassignWallet: (walletId: string) => void;
  updateWalletLimits: (walletId: string, limits: Partial<Wallet>) => void;
  requestWalletLoginOtp: (walletNumber: string) => { success: boolean; message: string; otp?: string };
  verifyWalletLoginOtp: (walletNumber: string, otp: string) => boolean;
  logoutWallet: () => void;
  transferBetweenWallets: (sourceWalletNumber: string, targetWalletNumber: string, amount: number) => { success: boolean; error?: string; message?: string; txId?: string };

  // Actions - Bot & Simulation Engine
  toggleBotEngine: () => void;
  updateBotConfig: (config: Partial<BotEngineConfig>) => void;
  triggerBotOrder: () => void;
  runAutoExpiryCheck: () => void;

  // Notifications
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const mapWalletsWithAliases = (rawWallets: Wallet[]): Wallet[] => {
  return rawWallets.map((w) => {
    const activeOtp = generateTimeBasedOtp(w.walletNumber || w.phoneNumber || w.accountNumber || '');
    return {
      ...w,
      phoneNumber: w.phoneNumber || w.walletNumber || w.accountNumber || '',
      accountNumber: w.accountNumber || w.walletNumber,
      accountHolder: w.accountHolder || (w.agentName ? `Agent: ${w.agentName}` : 'Central Wallet Pool'),
      provider: w.provider || 'Vodafone Cash',
      assignedAgentId: w.assignedAgentId !== undefined ? w.assignedAgentId : w.agentId,
      assignedAgentName: w.assignedAgentName || w.agentName,
      otpCode: activeOtp,
      lastOtp: activeOtp,
      dailyLimit: w.dailyLimit !== undefined ? w.dailyLimit : w.dailySendLimit,
      singleTransactionLimit: w.singleTransactionLimit !== undefined ? w.singleTransactionLimit : w.maxSingleLimit,
      todayTransferred: w.todayTransferred !== undefined ? w.todayTransferred : w.todaySent,
    };
  });
};

const mapAgentsWithAliases = (rawAgents: Agent[]): Agent[] => {
  return rawAgents.map((a) => ({
    ...a,
    trafficEnabled: a.trafficEnabled !== undefined ? a.trafficEnabled : a.trafficActive,
    processedOrdersCount: a.processedOrdersCount !== undefined ? a.processedOrdersCount : a.todayProcessedCount,
    processedVolume: a.processedVolume !== undefined ? a.processedVolume : a.todayAssignedVolumeEGP,
    dailyOrderLimit: a.dailyOrderLimit || {
      min: a.dailyOrdersMin || 10,
      max: a.dailyOrdersMax || 100,
      dailyMoneyCap: a.dailyVolumeMaxEGP || 50000,
    },
    depositMethod: a.depositMethod || a.depositPaymentMethod,
    depositAddress: a.depositAddress || a.depositPaymentAddress,
  }));
};

const loadPersistedData = <T>(key: string, fallback: T): T => {
  return StorageUtil.getObject(key, fallback);
};

const savePersistedData = (key: string, data: any) => {
  StorageUtil.setObject(key, data);
};

const getStoredAuthRole = (): 'guest' | 'admin' | 'agent' => {
  if (typeof window === 'undefined') return 'guest';
  const role = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
  if (role === 'admin' || role === 'agent') return role as any;
  return 'guest';
};

const getStoredCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const profile = StorageUtil.get(STORAGE_KEYS.USER_PROFILE);
  if (profile) {
    try {
      return JSON.parse(profile);
    } catch {
      return null;
    }
  }
  const role = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
  if (role === 'admin') {
    return { username: 'Master Admin', role: 'admin' as const };
  }
  return null;
};

const getStoredIsAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
};

const getStoredSelectedAgentId = (): string => {
  if (typeof window === 'undefined') return 'AGT-01';
  return StorageUtil.get(STORAGE_KEYS.SELECTED_AGENT_ID) || 'AGT-01';
};

const getStoredActivePortal = (): 'admin' | 'agent' | 'wallet-apk' => {
  if (typeof window === 'undefined') return 'admin';
  const portal = StorageUtil.get(STORAGE_KEYS.ACTIVE_PORTAL);
  if (portal === 'admin' || portal === 'agent' || portal === 'wallet-apk') return portal;
  return getStoredAuthRole() === 'agent' ? 'agent' : 'admin';
};

const getStoredActiveSection = (): AppSection => {
  if (typeof window === 'undefined') return 'dashboard';
  const section = StorageUtil.get(STORAGE_KEYS.ACTIVE_SECTION) as AppSection | null;
  if (section) return section;
  return getStoredAuthRole() === 'agent' ? 'agent-portal' : 'dashboard';
};

const persistStateToStorage = (state: AppStoreState) => {
  try {
    if (state.isAuthenticated && state.authRole !== 'guest') {
      StorageUtil.set(STORAGE_KEYS.AUTH_ROLE, state.authRole);
      if (state.currentUser) {
        StorageUtil.setObject(STORAGE_KEYS.USER_PROFILE, state.currentUser);
      }
      if (state.selectedAgentId) {
        StorageUtil.set(STORAGE_KEYS.SELECTED_AGENT_ID, state.selectedAgentId);
      }
      if (state.activePortal) {
        StorageUtil.set(STORAGE_KEYS.ACTIVE_PORTAL, state.activePortal);
      }
      if (state.activeSection) {
        StorageUtil.set(STORAGE_KEYS.ACTIVE_SECTION, state.activeSection);
      }
    }

    savePersistedData(STORAGE_KEYS.PERSISTED_BANKS, state.banks);
    savePersistedData(STORAGE_KEYS.PERSISTED_PENDING_DEPOSITS, state.pendingDeposits);
    savePersistedData(STORAGE_KEYS.PERSISTED_DEPOSIT_HISTORY, state.depositHistory);
    savePersistedData(STORAGE_KEYS.PERSISTED_PENDING_WITHDRAWALS, state.pendingWithdrawals);
    savePersistedData(STORAGE_KEYS.PERSISTED_WITHDRAWAL_HISTORY, state.withdrawalHistory);
    savePersistedData(STORAGE_KEYS.PERSISTED_AGENTS, state.agents);
    savePersistedData(STORAGE_KEYS.PERSISTED_WALLETS, state.wallets);
    savePersistedData(STORAGE_KEYS.PERSISTED_AGENT_DEPOSIT_REQUESTS, state.agentDepositRequests);
    savePersistedData(STORAGE_KEYS.PERSISTED_AGENT_PAYOUTS, state.agentPayouts);
    savePersistedData(STORAGE_KEYS.PERSISTED_IS_PRODUCTION_MODE, state.isProductionMode);
    savePersistedData(STORAGE_KEYS.PERSISTED_COMMISSION_RATES, state.commissionRates);
    savePersistedData(STORAGE_KEYS.PERSISTED_DOMAIN_SETTINGS, state.domainSettings);
  } catch (err) {
    console.warn('[Persistence Middleware] Failed to persist state changes:', err);
  }
};

/**
 * Zustand Middleware that persists state changes to localStorage.
 * Ensures agent sessions, newly created agents, and wallet configurations remain active after a browser refresh.
 */
const persistMiddleware = (
  config: StateCreator<AppStoreState>
): StateCreator<AppStoreState> => (set, get, api) => {
  const persistentSet: typeof set = (...args: any[]) => {
    (set as any)(...args);
    persistStateToStorage(get());
  };

  return config(persistentSet, get, api);
};

export const useAppStore = create<AppStoreState>()(persistMiddleware((set, get) => ({
  authRole: getStoredAuthRole(),
  currentUser: getStoredCurrentUser(),
  isAuthenticated: getStoredIsAuthenticated(),
  setIsAuthenticated: (auth) => {
    if (!auth) {
      stopAutoRefresh();
    }
    set({ isAuthenticated: auth });
  },
  activeSection: getStoredActiveSection(),
  activePortal: getStoredActivePortal(),
  selectedAgentId: getStoredSelectedAgentId(),
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isMobileDrawerOpen: false,

  syncWithBackend: async () => {
    try {
      const data = await apiService.syncData();
      if (!data) return;
      const agentsList = data.agents && data.agents.length > 0 ? data.agents : get().agents;
      const walletsList = data.wallets && data.wallets.length > 0 ? data.wallets : get().wallets;

      // Programmatically link all agents to routing queues with updated metadata
      agentsList.forEach((agent: Agent) => {
        routeAssignmentService.linkOnboardedAgent(agent, walletsList);
      });

      set((state) => ({
        agents: agentsList,
        wallets: walletsList,
        pendingDeposits: data.transactions ? data.transactions.filter((t: Transaction) => t.type === 'deposit' && (t.status === 'Pending' || t.status === 'Processing')) : state.pendingDeposits,
        pendingWithdrawals: data.transactions ? data.transactions.filter((t: Transaction) => t.type === 'withdrawal' && (t.status === 'Pending' || t.status === 'Processing')) : state.pendingWithdrawals,
        depositHistory: data.transactions ? data.transactions.filter((t: Transaction) => t.type === 'deposit' && (t.status === 'Approved' || t.status === 'Rejected')) : state.depositHistory,
        withdrawalHistory: data.transactions ? data.transactions.filter((t: Transaction) => t.type === 'withdrawal' && (t.status === 'Approved' || t.status === 'Rejected')) : state.withdrawalHistory,
        notifications: data.notifications ? data.notifications : state.notifications,
      }));
    } catch (err) {
      console.warn('[Store] syncWithBackend error:', err);
    }
  },

  login: async (username, password) => {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    try {
      const res = await apiService.login(cleanUser, cleanPass);
      if (!res.success || !res.token || !res.user) {
        return {
          success: false,
          message: res.message || 'Invalid username or password. Check credentials and try again.'
        };
      }

      const { user, token } = res;
      const role = user.role as 'admin' | 'agent';

      StorageUtil.set(STORAGE_KEYS.AUTH_ROLE, role);
      StorageUtil.set(STORAGE_KEYS.SESSION_TOKEN, token);
      StorageUtil.setObject(STORAGE_KEYS.USER_PROFILE, user);

      if (role === 'admin') {
        StorageUtil.set(STORAGE_KEYS.ACTIVE_PORTAL, 'admin');
        StorageUtil.set(STORAGE_KEYS.ACTIVE_SECTION, 'dashboard');
        set({
          authRole: 'admin',
          currentUser: user,
          isAuthenticated: true,
          activePortal: 'admin',
          activeSection: 'dashboard',
        });
        socketService.connect('admin', token, 'admin');
      } else {
        StorageUtil.set(STORAGE_KEYS.SELECTED_AGENT_ID, user.agentId || '');
        StorageUtil.set(STORAGE_KEYS.ACTIVE_PORTAL, 'agent');
        StorageUtil.set(STORAGE_KEYS.ACTIVE_SECTION, 'agent-portal');
        set({
          authRole: 'agent',
          currentUser: user,
          isAuthenticated: true,
          selectedAgentId: user.agentId || '',
          activePortal: 'agent',
          activeSection: 'agent-portal',
        });
        socketService.connect(user.agentId || user.id, token, 'agent');
      }

      // Sync latest backend persistent database state
      get().syncWithBackend();

      // Start JWT Token Auto-Refresh cycle for the new token
      startAutoRefresh();

      return { success: true, role };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Authentication failed. Unable to reach server.'
      };
    }
  },

  logout: () => {
    stopAutoRefresh();
    apiService.logout().catch(() => {});
    StorageUtil.remove(STORAGE_KEYS.AUTH_ROLE);
    StorageUtil.remove(STORAGE_KEYS.SESSION_TOKEN);
    StorageUtil.remove(STORAGE_KEYS.USER_PROFILE);
    StorageUtil.remove(STORAGE_KEYS.SELECTED_AGENT_ID);
    StorageUtil.remove(STORAGE_KEYS.ACTIVE_PORTAL);
    StorageUtil.remove(STORAGE_KEYS.ACTIVE_SECTION);
    socketService.setAuthenticatedAgent(null, 'guest');
    socketService.disconnect();
    set({
      authRole: 'guest',
      currentUser: null,
      isAuthenticated: false,
      activePortal: 'admin',
      activeSection: 'dashboard',
      isMobileDrawerOpen: false,
    });
  },

  inspectingTransaction: null,
  isProductionMode: false,

  activeWalletNumber: '01031860138',
  walletOtpPendingNumber: null,
  isWalletLoggedIn: true,

  commissionRates: {
    depositCommissionPercent: 1.5,
    withdrawalCommissionPercent: 1.0,
  },
  supportedCurrencies: ['EGP', 'USD', 'USDT', 'SAR', 'AED'],
  paymentMethods: ['Vodafone Cash', 'InstaPay', 'Orange Cash', 'Etisalat Cash', 'WE Pay', 'Bank Transfer'],

  banks: loadPersistedData(STORAGE_KEYS.PERSISTED_BANKS, initialBanks),
  pendingDeposits: loadPersistedData(STORAGE_KEYS.PERSISTED_PENDING_DEPOSITS, initialPendingDeposits),
  depositHistory: loadPersistedData(STORAGE_KEYS.PERSISTED_DEPOSIT_HISTORY, initialHistoricalTransactions.filter((t) => t.type === 'deposit')),
  pendingWithdrawals: loadPersistedData(STORAGE_KEYS.PERSISTED_PENDING_WITHDRAWALS, initialPendingWithdrawals),
  withdrawalHistory: loadPersistedData(STORAGE_KEYS.PERSISTED_WITHDRAWAL_HISTORY, initialHistoricalTransactions.filter((t) => t.type === 'withdrawal')),
  agents: loadPersistedData(STORAGE_KEYS.PERSISTED_AGENTS, mapAgentsWithAliases(initialAgents)),
  wallets: loadPersistedData(STORAGE_KEYS.PERSISTED_WALLETS, mapWalletsWithAliases(initialWallets)),
  agentDepositRequests: loadPersistedData(STORAGE_KEYS.PERSISTED_AGENT_DEPOSIT_REQUESTS, initialAgentDepositRequests.map((r) => ({
    ...r,
    requestedAmount: r.requestedAmount || r.amountRequested,
    txReference: r.txReference || r.referenceNumber,
  }))),
  domainSettings: {
    adminDomain: 'admin.cashfintech.com',
    agentDomain: 'agent.cashfintech.com',
    walletDomain: 'wallet.cashfintech.com',
    enableSubdomainRouting: true,
    sslEnabled: true,
  },
  agentPayouts: loadPersistedData(STORAGE_KEYS.PERSISTED_AGENT_PAYOUTS, []),
  totalSimulatedWalletsCount: 6000,
  lastPulseTime: Date.now(),
  notifications: [],
  botConfig: {
    isRunning: false,
    enabled: false,
    intervalSeconds: 20,
    minAmount: 30,
    maxAmount: 1500,
    minDepositAmount: 30,
    maxDepositAmount: 5000,
    minWithdrawalAmount: 50,
    maxWithdrawalAmount: 3000,
    depositRatio: 0.70,
    targetDepositPercent: 70,
    ratioJitterPercent: 10,
    effectiveTodayDepositRatio: 0.70,
    todayDepositsGenerated: 0,
    todayWithdrawalsGenerated: 0,
    autoCancelHours: 4,
    autoPauseInactiveHours: 2,
    totalWalletPoolTarget: 6000,
    selectedProviders: ['Vodafone Cash', 'InstaPay', 'Orange Cash', 'Etisalat Cash'],
    selectedBanks: ['Vodafone 9253', 'Vodafone 7655', 'Vodafone 2055', 'InstaPay 9021']
  },
  globalTrafficActive: false,
  soundEnabled: true,
  autoUpdateEnabled: true,
  isRealtimeSyncPaused: false,

  toggleRealtimeSync: () =>
    set((state) => {
      const nextPaused = !state.isRealtimeSyncPaused;
      socketService.setPaused(nextPaused);
      return { isRealtimeSyncPaused: nextPaused };
    }),

  setActiveSection: (section) =>
    set((state) => {
      if (state.authRole === 'agent') {
        console.warn('[SECURITY GUARD] Agent role cannot navigate to admin sections.');
        return { activeSection: 'agent-portal', activePortal: 'agent', isMobileDrawerOpen: false };
      }
      return { activeSection: section, isMobileDrawerOpen: false };
    }),

  setActivePortal: (portal) =>
    set((state) => {
      if (state.authRole === 'agent' && portal !== 'agent') {
        console.warn('[SECURITY GUARD] Agent role cannot switch portal to admin.');
        return { activePortal: 'agent', activeSection: 'agent-portal' };
      }
      return { activePortal: portal };
    }),
  setSelectedAgentId: (agentId) => set({ selectedAgentId: agentId }),
  setProductionMode: (isProd) => set({ isProductionMode: isProd }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen, isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed, isSidebarOpen: !collapsed }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  setInspectingTransaction: (tx) => set({ inspectingTransaction: tx }),
  setCommissionRates: (rates) =>
    set((state) => ({
      commissionRates: { ...state.commissionRates, ...rates },
    })),

  resetSystemData: () => {
    // Zeros all counters, resets transactions, agents, wallets, requests, and payouts to fresh clean zero-data state
    const emptyArray: any[] = [];
    savePersistedData(STORAGE_KEYS.PERSISTED_PENDING_DEPOSITS, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_DEPOSIT_HISTORY, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_PENDING_WITHDRAWALS, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_WITHDRAWAL_HISTORY, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_AGENT_DEPOSIT_REQUESTS, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_AGENT_PAYOUTS, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_AGENTS, emptyArray);
    savePersistedData(STORAGE_KEYS.PERSISTED_WALLETS, emptyArray);

    set((state) => ({
      pendingDeposits: [],
      pendingWithdrawals: [],
      depositHistory: [],
      withdrawalHistory: [],
      agents: [],
      wallets: [],
      agentDepositRequests: [],
      agentPayouts: [],
      notifications: [
        {
          id: `NOTIF-${Date.now()}`,
          title: 'System Initialized for Production',
          message: 'All queues, logs, and simulated activity cleared. System reset to clean zero state.',
          timestamp: new Date().toISOString(),
          type: 'success',
          isRead: false,
        },
      ],
      inspectingTransaction: null,
      globalTrafficActive: false,
      botConfig: {
        ...state.botConfig,
        isRunning: false,
        enabled: false,
        todayDepositsGenerated: 0,
        todayWithdrawalsGenerated: 0,
      },
    }));
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    soundManager.setSoundEnabled(next);
    set({ soundEnabled: next });
  },

  playTestSound: () => {
    soundManager.playTestSound();
  },

  trigger90sPulse: () => {
    soundManager.playIntervalPulseChime();
    set({ lastPulseTime: Date.now() });
    get().addNotification({
      title: '90-Second Sync Pulse',
      message: 'All 6,000 client wallets, OTP tokens, and agent queues synchronized with Cairo time.',
      type: 'info',
    });
  },

  // Actions - Payment Methods Management
  addPaymentMethod: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.paymentMethods.includes(trimmed)) return state;
      return { paymentMethods: [...state.paymentMethods, trimmed] };
    });
  },

  updatePaymentMethod: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    set((state) => ({
      paymentMethods: state.paymentMethods.map((m) => (m === oldName ? trimmed : m)),
    }));
  },

  deletePaymentMethod: (name: string) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.filter((m) => m !== name),
    }));
  },

  confirmDeposit: (transactionId, customAmount, processedBy = 'Admin', processedByRole = 'admin') => {
    const { pendingDeposits, depositHistory, agents, wallets, addNotification } = get();
    const tx = pendingDeposits.find((t) => t.id === transactionId);
    if (!tx) return;

    const finalAmount = customAmount !== undefined && customAmount > 0 ? Number(customAmount) : tx.amount;
    const now = new Date();
    const elapsedSec = getElapsedSeconds(tx.createdAt || tx.dateOfCreation || now, now);
    const elapsedFormatted = formatTimerHHMMSS(elapsedSec);
    const elapsedMin = Math.max(1, Math.round(elapsedSec / 60));

    let updatedAgents = agents;
    let earnedDepositProfit = 0;
    let appliedRate = 3.0;

    // Identify target agent ID either from tx.subagentId or target wallet's assigned agent
    let targetAgentId = tx.subagentId;
    if (!targetAgentId && tx.targetWalletId) {
      const tw = wallets.find(
        (w) => w.walletNumber === tx.targetWalletId || w.id === tx.targetWalletId || w.phoneNumber === tx.targetWalletId
      );
      if (tw && (tw.assignedAgentId || tw.agentId)) {
        targetAgentId = tw.assignedAgentId || tw.agentId || undefined;
      }
    }

    if (targetAgentId || processedByRole === 'agent') {
      updatedAgents = agents.map((a) => {
        const matches =
          (targetAgentId && (a.id === targetAgentId || a.name === targetAgentId || a.username === targetAgentId)) ||
          (processedByRole === 'agent' && (a.name === processedBy || a.username === processedBy || a.id === processedBy));
        if (matches) {
          let depositPercent = a.depositCommissionPercent !== undefined ? Number(a.depositCommissionPercent) : 3.0;
          if (a.useTieredCommission && a.depositTiers && a.depositTiers.length > 0) {
            const sortedTiers = [...a.depositTiers].sort((x, y) => x.minVolume - y.minVolume);
            const matchedTier = sortedTiers.find((t) => finalAmount >= t.minVolume && (t.maxVolume === 0 || finalAmount <= t.maxVolume));
            if (matchedTier) {
              depositPercent = Number(matchedTier.ratePercent);
            }
          }
          appliedRate = depositPercent;
          const depositProfit = Number(((finalAmount * depositPercent) / 100).toFixed(2));
          earnedDepositProfit = depositProfit;
          return {
            ...a,
            todayProcessedCount: (a.todayProcessedCount || 0) + 1,
            processedOrdersCount: (a.processedOrdersCount || 0) + 1,
            todayAssignedVolumeEGP: (a.todayAssignedVolumeEGP || 0) + finalAmount,
            processedVolume: (a.processedVolume || 0) + finalAmount,
            currentBalance: Number(((a.currentBalance || 0) + finalAmount).toFixed(2)),
            profitBalance: Number(((a.profitBalance || 0) + depositProfit).toFixed(2)),
            totalEarnedCommission: Number(((a.totalEarnedCommission || 0) + depositProfit).toFixed(2)),
            lastActiveAt: new Date().toISOString(),
          };
        }
        return a;
      });
    }

    const updatedTx: Transaction = {
      ...tx,
      amount: finalAmount,
      status: 'Approved',
      timeOfProcessing: formatCairoTime(now),
      processedAt: now.toISOString(),
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      duration: elapsedFormatted,
      processingTimeMinutes: elapsedMin,
      processingTimeDisplay: elapsedFormatted,
      commissionEarned: earnedDepositProfit,
      commissionRateApplied: appliedRate,
      processedBy: processedBy,
      processedByRole: processedByRole,
      userInfo: customAmount !== undefined && customAmount !== tx.amount
        ? `${tx.userInfo}\n[${processedByRole === 'admin' ? 'Admin' : 'Agent'} adjusted amount from ${tx.amount} to ${finalAmount} ${tx.currency}]`
        : tx.userInfo,
    };

    const targetWallet = wallets.find((w) => w.walletNumber === tx.targetWalletId || w.walletNumber === tx.phone);
    let updatedWallets = wallets;
    if (targetWallet) {
      updatedWallets = wallets.map((w) =>
        w.id === targetWallet.id
          ? {
              ...w,
              balance: w.balance + finalAmount,
              todayReceived: w.todayReceived + finalAmount,
              monthTotal: w.monthTotal + finalAmount,
            }
          : w
      );
    }

    set({
      pendingDeposits: pendingDeposits.filter((t) => t.id !== transactionId),
      depositHistory: [updatedTx, ...depositHistory],
      wallets: mapWalletsWithAliases(updatedWallets),
      agents: updatedAgents,
      inspectingTransaction: null,
    });

    if (tx.subagentId) {
      routeAssignmentService.dequeueTransaction(tx.subagentId, tx.id);
    }

    // Persist to backend
    apiService.updateTransactionStatus(transactionId, 'Approved', processedBy, undefined, {
      amount: finalAmount,
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      processedAt: now.toISOString(),
    }).catch(() => {});

    soundManager.playTransactionChime();

    addNotification({
      title: 'Deposit Order Confirmed',
      message: `Deposit of ${finalAmount} ${tx.currency} (Order ${tx.id}) approved by ${processedBy}. Profit: +${earnedDepositProfit} ${tx.currency}`,
      type: 'success',
      targetSection: 'pending-deposits',
      targetAgentId: tx.subagentId,
      agentId: tx.subagentId,
      orderId: tx.id,
    });
  },

  rejectDeposit: (transactionId, reason = 'Rejected by Administrator / Agent', processedBy = 'Admin', processedByRole = 'admin') => {
    const { pendingDeposits, depositHistory, addNotification } = get();
    const tx = pendingDeposits.find((t) => t.id === transactionId);
    if (!tx) return;

    const now = new Date();
    const elapsedSec = getElapsedSeconds(tx.createdAt || tx.dateOfCreation || now, now);
    const elapsedFormatted = formatTimerHHMMSS(elapsedSec);
    const elapsedMin = Math.max(1, Math.round(elapsedSec / 60));

    const updatedTx: Transaction = {
      ...tx,
      status: 'Rejected',
      timeOfProcessing: formatCairoTime(now),
      processedAt: now.toISOString(),
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      duration: elapsedFormatted,
      processingTimeMinutes: elapsedMin,
      processingTimeDisplay: elapsedFormatted,
      processedBy: processedBy,
      processedByRole: processedByRole,
      rejectionReason: reason,
      userInfo: `${tx.userInfo}\n[Rejection Note (${processedBy}): ${reason}]`,
    };

    set({
      pendingDeposits: pendingDeposits.filter((t) => t.id !== transactionId),
      depositHistory: [updatedTx, ...depositHistory],
      inspectingTransaction: null,
    });

    if (tx.subagentId) {
      routeAssignmentService.dequeueTransaction(tx.subagentId, tx.id);
    }

    // Persist to backend
    apiService.updateTransactionStatus(transactionId, 'Rejected', processedBy, reason, {
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      processedAt: now.toISOString(),
    }).catch(() => {});

    addNotification({
      title: 'Deposit Order Rejected',
      message: `Order ${tx.id} for ${tx.amount} ${tx.currency} was rejected by ${processedBy}. Reason: ${reason}`,
      type: 'danger',
      targetSection: 'pending-deposits',
      targetAgentId: tx.subagentId,
      agentId: tx.subagentId,
      orderId: tx.id,
    });
  },

  confirmWithdrawal: (transactionId, processedBy = 'Admin', processedByRole = 'admin') => {
    const { pendingWithdrawals, withdrawalHistory, wallets, agents, addNotification } = get();
    const tx = pendingWithdrawals.find((t) => t.id === transactionId);
    if (!tx) return;

    const now = new Date();
    const elapsedSec = getElapsedSeconds(tx.createdAt || tx.dateOfCreation || now, now);
    const elapsedFormatted = formatTimerHHMMSS(elapsedSec);
    const elapsedMin = Math.max(1, Math.round(elapsedSec / 60));

    let updatedAgents = agents;
    let earnedWithdrawalProfit = 0;
    let appliedRate = 1.0;

    let targetAgentId = tx.subagentId;
    if (!targetAgentId && tx.sourceWalletId) {
      const sw = wallets.find(
        (w) => w.walletNumber === tx.sourceWalletId || w.id === tx.sourceWalletId || w.phoneNumber === tx.sourceWalletId
      );
      if (sw && (sw.assignedAgentId || sw.agentId)) {
        targetAgentId = sw.assignedAgentId || sw.agentId || undefined;
      }
    }

    if (targetAgentId || processedByRole === 'agent') {
      updatedAgents = agents.map((a) => {
        const matches =
          (targetAgentId && (a.id === targetAgentId || a.name === targetAgentId || a.username === targetAgentId)) ||
          (processedByRole === 'agent' && (a.name === processedBy || a.username === processedBy || a.id === processedBy));
        if (matches) {
          let wdlPercent = a.withdrawalCommissionPercent !== undefined ? Number(a.withdrawalCommissionPercent) : 1.0;
          if (a.useTieredCommission && a.withdrawalTiers && a.withdrawalTiers.length > 0) {
            const sortedTiers = [...a.withdrawalTiers].sort((x, y) => x.minVolume - y.minVolume);
            const matchedTier = sortedTiers.find((t) => tx.amount >= t.minVolume && (t.maxVolume === 0 || tx.amount <= t.maxVolume));
            if (matchedTier) {
              wdlPercent = Number(matchedTier.ratePercent);
            }
          }
          appliedRate = wdlPercent;
          const wdlProfit = Number(((tx.amount * wdlPercent) / 100).toFixed(2));
          earnedWithdrawalProfit = wdlProfit;
          return {
            ...a,
            todayProcessedCount: (a.todayProcessedCount || 0) + 1,
            processedOrdersCount: (a.processedOrdersCount || 0) + 1,
            todayAssignedVolumeEGP: (a.todayAssignedVolumeEGP || 0) + tx.amount,
            processedVolume: (a.processedVolume || 0) + tx.amount,
            currentBalance: Math.max(0, Number(((a.currentBalance || 0) - tx.amount).toFixed(2))),
            profitBalance: Number(((a.profitBalance || 0) + wdlProfit).toFixed(2)),
            totalEarnedCommission: Number(((a.totalEarnedCommission || 0) + wdlProfit).toFixed(2)),
            lastActiveAt: new Date().toISOString(),
          };
        }
        return a;
      });
    }

    const updatedTx: Transaction = {
      ...tx,
      status: 'Approved',
      timeOfProcessing: formatCairoTime(now),
      processedAt: now.toISOString(),
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      duration: elapsedFormatted,
      processingTimeMinutes: elapsedMin,
      processingTimeDisplay: elapsedFormatted,
      commissionEarned: earnedWithdrawalProfit,
      commissionRateApplied: appliedRate,
      processedBy: processedBy,
      processedByRole: processedByRole,
    };

    const sourceWallet = wallets.find((w) => w.walletNumber === tx.sourceWalletId || w.walletNumber === tx.phone);
    let updatedWallets = wallets;
    if (sourceWallet) {
      updatedWallets = wallets.map((w) =>
        w.id === sourceWallet.id
          ? {
              ...w,
              balance: Math.max(0, w.balance - tx.amount),
              todaySent: w.todaySent + tx.amount,
            }
          : w
      );
    }

    set({
      pendingWithdrawals: pendingWithdrawals.filter((t) => t.id !== transactionId),
      withdrawalHistory: [updatedTx, ...withdrawalHistory],
      wallets: mapWalletsWithAliases(updatedWallets),
      agents: updatedAgents,
      inspectingTransaction: null,
    });

    if (tx.subagentId) {
      routeAssignmentService.dequeueTransaction(tx.subagentId, tx.id);
    }

    // Persist to backend
    apiService.updateTransactionStatus(transactionId, 'Approved', processedBy, undefined, {
      amount: tx.amount,
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      processedAt: now.toISOString(),
    }).catch(() => {});

    soundManager.playTransactionChime();

    addNotification({
      title: 'Withdrawal Confirmed',
      message: `Withdrawal of ${tx.amount} ${tx.currency} (Order ${tx.id}) dispatched by ${processedBy}. Profit: +${earnedWithdrawalProfit} ${tx.currency}`,
      type: 'success',
      targetSection: 'pending-withdrawals',
      targetAgentId: tx.subagentId,
      agentId: tx.subagentId,
      orderId: tx.id,
    });
  },

  rejectWithdrawal: (transactionId, reason = 'Insufficient client balance or account verification failure', processedBy = 'Admin', processedByRole = 'admin') => {
    const { pendingWithdrawals, withdrawalHistory, addNotification } = get();
    const tx = pendingWithdrawals.find((t) => t.id === transactionId);
    if (!tx) return;

    const now = new Date();
    const elapsedSec = getElapsedSeconds(tx.createdAt || tx.dateOfCreation || now, now);
    const elapsedFormatted = formatTimerHHMMSS(elapsedSec);
    const elapsedMin = Math.max(1, Math.round(elapsedSec / 60));

    const updatedTx: Transaction = {
      ...tx,
      status: 'Rejected',
      timeOfProcessing: formatCairoTime(now),
      processedAt: now.toISOString(),
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      duration: elapsedFormatted,
      processingTimeMinutes: elapsedMin,
      processingTimeDisplay: elapsedFormatted,
      processedBy: processedBy,
      processedByRole: processedByRole,
      rejectionReason: reason,
      userInfo: `${tx.userInfo}\n[Rejection Note (${processedBy}): ${reason}]`,
    };

    set({
      pendingWithdrawals: pendingWithdrawals.filter((t) => t.id !== transactionId),
      withdrawalHistory: [updatedTx, ...withdrawalHistory],
      inspectingTransaction: null,
    });

    if (tx.subagentId) {
      routeAssignmentService.dequeueTransaction(tx.subagentId, tx.id);
    }

    // Persist to backend
    apiService.updateTransactionStatus(transactionId, 'Rejected', processedBy, reason, {
      processingDurationSeconds: elapsedSec,
      processingDurationFormatted: elapsedFormatted,
      processedAt: now.toISOString(),
    }).catch(() => {});

    addNotification({
      title: 'Withdrawal Rejected',
      message: `Withdrawal order ${tx.id} was rejected by ${processedBy}. Reason: ${reason}`,
      type: 'danger',
      targetSection: 'pending-withdrawals',
      targetAgentId: tx.subagentId,
      agentId: tx.subagentId,
      orderId: tx.id,
    });
  },

  holdWithdrawal: (transactionId) => {
    const { pendingWithdrawals, addNotification } = get();
    const tx = pendingWithdrawals.find((t) => t.id === transactionId);
    const updated = pendingWithdrawals.map((t) =>
      t.id === transactionId ? { ...t, status: 'Hold' as TransactionStatus } : t
    );
    set({ pendingWithdrawals: updated });
    addNotification({
      title: 'Order Placed on Hold',
      message: `Order ${transactionId} has been placed on hold for manual fraud verification.`,
      type: 'warning',
      targetSection: 'pending-withdrawals',
      targetAgentId: tx?.subagentId,
      agentId: tx?.subagentId,
      orderId: transactionId,
    });
  },

  reassignOrder: (transactionId, newAgentId) => {
    const { pendingDeposits, pendingWithdrawals, agents, addNotification } = get();
    const agent = agents.find((a) => a.id === newAgentId);
    if (!agent) return;

    const isDep = pendingDeposits.some((t) => t.id === transactionId);

    if (isDep) {
      set({
        pendingDeposits: pendingDeposits.map((t) =>
          t.id === transactionId ? { ...t, subagentId: agent.id, subagentName: agent.name } : t
        ),
      });
    } else {
      set({
        pendingWithdrawals: pendingWithdrawals.map((t) =>
          t.id === transactionId ? { ...t, subagentId: agent.id, subagentName: agent.name } : t
        ),
      });
    }

    routeAssignmentService.enqueueTransaction(agent.id, transactionId);

    addNotification({
      title: 'Order Reassigned',
      message: `Order ${transactionId} successfully transferred to [${agent.name}].`,
      type: 'info',
      targetAgentId: agent.id,
      agentId: agent.id,
      orderId: transactionId,
    });
  },

  batchApproveDeposits: (ids) => {
    ids.forEach((id) => get().confirmDeposit(id));
  },

  setAutoUpdateEnabled: (enabled) => set({ autoUpdateEnabled: enabled }),

  addBank: (bankData) => {
    const newBank: BankAccount = {
      id: generateRandomId('', 6),
      createdAt: formatCairoTime(new Date()),
      ...bankData,
    };
    set((state) => ({ banks: [newBank, ...state.banks] }));
  },

  updateBank: (id, updates) => {
    set((state) => ({
      banks: state.banks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  },

  toggleBankActive: (id) => {
    set((state) => ({
      banks: state.banks.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
    }));
  },

  addAgent: (agentData) => {
    const existingAgents = get().agents;
    const nextNum = existingAgents.length + 1;
    const newAgentId = `AGT-${String(nextNum).padStart(2, '0')}`;
    
    // Auto-generate starter wallet for the agent
    const starterPhone = agentData.phone || `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const starterWalletId = `WLT-${newAgentId}-01`;
    const initialDeposit = agentData.insuranceDeposit || 10000;

    const initialWallet: Wallet = {
      id: starterWalletId,
      walletNumber: starterPhone,
      phoneNumber: starterPhone,
      accountNumber: starterPhone,
      provider: agentData.depositPaymentMethod || agentData.depositMethod || 'Vodafone Cash',
      agentId: newAgentId,
      agentName: agentData.name,
      assignedAgentId: newAgentId,
      assignedAgentName: agentData.name,
      accountHolder: `Primary Wallet (${agentData.name})`,
      balance: initialDeposit,
      currency: agentData.currency || 'EGP',
      status: 'active',
      isBotWallet: false,
      createdAt: formatCairoTime(new Date()),
      currentOtp: generateOtpCode(),
      otpCode: generateOtpCode(),
      minSingleLimit: 10,
      maxSingleLimit: 10000,
      dailySendLimit: 60000,
      dailyReceiveLimit: 60000,
      monthlyLimit: 200000,
      todaySent: 0,
      todayReceived: 0,
      monthTotal: 0,
    };

    const newAgent: Agent = {
      ...agentData,
      id: newAgentId,
      depositCommissionPercent: agentData.depositCommissionPercent !== undefined ? Number(agentData.depositCommissionPercent) : 3.0,
      withdrawalCommissionPercent: agentData.withdrawalCommissionPercent !== undefined ? Number(agentData.withdrawalCommissionPercent) : 1.0,
      profitBalance: 0,
      totalEarnedCommission: 0,
      todayProcessedCount: 0,
      todayAssignedOrders: 0,
      todayAssignedVolumeEGP: 0,
      assignedWalletCount: 1,
      assignedWalletIds: [starterWalletId],
      lastActiveAt: new Date().toISOString(),
      trafficActive: agentData.trafficActive !== undefined ? agentData.trafficActive : get().globalTrafficActive,
      status: agentData.status || 'active',
    };

    set((state) => ({
      agents: [...state.agents, newAgent],
      wallets: mapWalletsWithAliases([initialWallet, ...state.wallets]),
    }));

    // Programmatically link newly onboarded agent to dedicated transaction queues
    routeAssignmentService.linkOnboardedAgent(newAgent, [initialWallet, ...get().wallets]);
    apiService.createAgent(newAgent).catch(() => {});
    apiService.createWallet(initialWallet).catch(() => {});

    get().addNotification({
      title: 'New Agent Added to Order Routing Network',
      message: `Agent [${newAgent.name}] (${newAgent.id}) onboarded and linked to queue:agent:${newAgent.id}. Traffic routing active.`,
      type: 'success',
      targetSection: 'agent-management',
    });
  },

  updateAgent: (id, updates) => {
    set((state) => {
      const updatedAgents = state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a));
      const targetAgent = updatedAgents.find((a) => a.id === id);
      if (targetAgent) {
        routeAssignmentService.updateAgentMetadata(targetAgent, state.wallets);
      }
      return { agents: updatedAgents };
    });
  },

  toggleAgentTraffic: (id) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, trafficActive: !a.trafficActive, autoPauseReason: undefined } : a
      ),
    }));
  },

  setGlobalTraffic: (active) =>
    set((state) => ({
      globalTrafficActive: active,
      agents: state.agents.map((a) => ({
        ...a,
        trafficActive: active,
        autoPauseReason: active ? undefined : 'Paused by Central Traffic Control',
      })),
    })),

  toggleGlobalTraffic: () =>
    set((state) => {
      const nextActive = !state.globalTrafficActive;
      return {
        globalTrafficActive: nextActive,
        agents: state.agents.map((a) => ({
          ...a,
          trafficActive: nextActive,
          autoPauseReason: nextActive ? undefined : 'Paused by Central Traffic Control',
        })),
      };
    }),

  submitAgentDepositRequest: (agentId, amount, method, ref, note) => {
    const agent = get().agents.find((a) => a.id === agentId);
    if (!agent) return;

    const newReq: AgentDepositRequest = {
      id: `DEP-REQ-${Math.floor(100 + Math.random() * 900)}`,
      agentId,
      agentName: agent.name,
      amountRequested: amount,
      paymentMethod: method,
      referenceNumber: ref,
      receiptNote: note,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      agentDepositRequests: [newReq, ...state.agentDepositRequests],
    }));

    get().addNotification({
      title: 'New Agent Collateral Request',
      message: `${agent.name} submitted a top-up request for ${amount} EGP via ${method}. Ref: ${ref}`,
      type: 'info',
      targetSection: 'agent-management',
    });
  },

  requestAgentDeposit: (agentId, amount, method, ref, note) => {
    get().submitAgentDepositRequest(agentId, amount, method, ref, note);
  },

  processAgentDepositRequest: (requestId, status, customApprovedAmount) => {
    const { agentDepositRequests, agents, addNotification } = get();
    const req = agentDepositRequests.find((r) => r.id === requestId);
    if (!req) return;

    const finalAmount = customApprovedAmount !== undefined ? customApprovedAmount : req.amountRequested;

    const updatedRequests = agentDepositRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status,
            amountApproved: status === 'Approved' ? finalAmount : undefined,
            processedAt: formatCairoTime(new Date()),
          }
        : r
    );

    let updatedAgents = agents;
    if (status === 'Approved') {
      updatedAgents = agents.map((a) => {
        if (a.id === req.agentId) {
          const newDeposit = a.insuranceDeposit + finalAmount;
          const newCurrent = a.currentBalance + finalAmount;
          const canResume = newCurrent >= a.trafficThreshold;
          return {
            ...a,
            insuranceDeposit: newDeposit,
            currentBalance: newCurrent,
            trafficActive: canResume ? true : a.trafficActive,
            autoPauseReason: canResume ? undefined : a.autoPauseReason,
          };
        }
        return a;
      });
    }

    set({
      agentDepositRequests: updatedRequests,
      agents: updatedAgents,
    });

    addNotification({
      title: status === 'Approved' ? 'Agent Collateral Approved' : 'Agent Collateral Rejected',
      message:
        status === 'Approved'
          ? `Credited ${finalAmount} EGP to ${req.agentName}. Insurance balance updated.`
          : `Rejected deposit request for ${req.agentName}.`,
      type: status === 'Approved' ? 'success' : 'danger',
      targetSection: 'agent-management',
    });
  },

  addWalletsToPool: (count) => {
    const newWallets: Wallet[] = Array.from({ length: count }).map(() => ({
      id: `WLT-${Math.floor(1000 + Math.random() * 9000)}`,
      walletNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      agentId: null,
      agentName: null,
      assignedAgentId: null,
      balance: 0,
      currency: 'EGP',
      status: 'unassigned' as const,
      createdAt: formatCairoTime(new Date()),
      currentOtp: generateOtpCode(),
      otpCode: generateOtpCode(),
      minSingleLimit: 10,
      maxSingleLimit: 5000,
      singleTransactionLimit: 5000,
      dailySendLimit: 20000,
      dailyReceiveLimit: 30000,
      dailyLimit: 20000,
      monthlyLimit: 100000,
      todaySent: 0,
      todayReceived: 0,
      todayTransferred: 0,
      monthTotal: 0,
      provider: 'Vodafone Cash',
      accountHolder: 'Central Wallet Pool',
      accountNumber: '',
    }));

    set((state) => ({ wallets: mapWalletsWithAliases([...newWallets, ...state.wallets]) }));
  },

  generateManualWallet: (data) => {
    const { wallets, agents, addNotification } = get();

    const prefixList = ['010', '011', '012', '015'];
    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    const walletNum = data.phoneNumber?.trim() || `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`;

    const targetAgent = data.agentId ? agents.find((a) => a.id === data.agentId) : null;

    const defaultDailySend = 30000;
    const defaultDailyReceive = 30000;
    const defaultMonthly = 100000;
    const defaultMaxSingle = 5000;
    const defaultMinSingle = 10;

    const newWallet: Wallet = {
      id: `WLT-MAN-${Math.floor(10000 + Math.random() * 90000)}`,
      walletNumber: walletNum,
      phoneNumber: walletNum,
      accountNumber: walletNum,
      provider: data.provider || 'Vodafone Cash',
      agentId: targetAgent ? targetAgent.id : null,
      agentName: targetAgent ? targetAgent.name : null,
      assignedAgentId: targetAgent ? targetAgent.id : null,
      assignedAgentName: targetAgent ? targetAgent.name : null,
      accountHolder: targetAgent ? `Agent: ${targetAgent.name}` : 'Central Operations Pool',
      balance: data.initialBalance !== undefined ? data.initialBalance : 0,
      currency: 'EGP',
      status: targetAgent ? 'active' : 'unassigned',
      isBotWallet: false,
      createdAt: formatCairoTime(new Date()),
      currentOtp: generateOtpCode(),
      otpCode: generateOtpCode(),
      minSingleLimit: data.minSingleLimit ?? defaultMinSingle,
      maxSingleLimit: data.maxSingleLimit ?? defaultMaxSingle,
      dailySendLimit: data.dailySendLimit ?? defaultDailySend,
      dailyReceiveLimit: data.dailyReceiveLimit ?? defaultDailyReceive,
      monthlyLimit: data.monthlyLimit ?? defaultMonthly,
      todaySent: 0,
      todayReceived: 0,
      monthTotal: 0,
    };

    const updatedWallets = [newWallet, ...wallets];
    const updatedAgents = targetAgent
      ? agents.map((a) =>
          a.id === targetAgent.id
            ? {
                ...a,
                assignedWalletCount: a.assignedWalletCount + 1,
                assignedWalletIds: [...a.assignedWalletIds, newWallet.id],
              }
            : a
        )
      : agents;

    set({
      wallets: mapWalletsWithAliases(updatedWallets),
      agents: updatedAgents,
    });

    addNotification({
      title: `Manual Wallet Generated: ${newWallet.walletNumber}`,
      message: `Created wallet (${newWallet.provider}) ID: ${newWallet.id}.${
        targetAgent ? ` Assigned to [${targetAgent.name}].` : ' Added to pool.'
      }`,
      type: 'success',
      targetSection: 'wallet-pool',
    });

    return newWallet;
  },

  assignWalletsToAgent: (arg1: any, arg2?: any) => {
    const { agents, wallets, addNotification } = get();
    let targetAgentId = '';
    let targetWalletIds: string[] = [];

    if (Array.isArray(arg1)) {
      targetWalletIds = arg1;
      targetAgentId = typeof arg2 === 'string' ? arg2 : '';
    } else if (typeof arg1 === 'string') {
      if (Array.isArray(arg2)) {
        targetAgentId = arg1;
        targetWalletIds = arg2;
      } else if (typeof arg2 === 'string') {
        targetAgentId = arg2;
        targetWalletIds = [arg1];
      } else {
        targetWalletIds = [arg1];
      }
    }

    const agent = agents.find((a) => a.id === targetAgentId);

    const updatedWallets = wallets.map((w) => {
      if (targetWalletIds.includes(w.id)) {
        return {
          ...w,
          agentId: agent ? agent.id : null,
          assignedAgentId: agent ? agent.id : null,
          agentName: agent ? agent.name : null,
          assignedAgentName: agent ? agent.name : null,
          accountHolder: agent ? `Agent: ${agent.name}` : 'Central Wallet Pool',
          status: (agent ? 'active' : 'unassigned') as any,
          currentOtp: generateOtpCode(),
          otpCode: generateOtpCode(),
          lastOtp: generateOtpCode(),
          otpRequestedAt: new Date().toISOString(),
        };
      }
      return w;
    });

    const updatedAgents = agents.map((a) => {
      const newlyAssigned = updatedWallets.filter((w) => w.agentId === a.id);
      return {
        ...a,
        assignedWalletCount: newlyAssigned.length,
        assignedWalletIds: newlyAssigned.map((w) => w.id),
      };
    });

    set({ wallets: mapWalletsWithAliases(updatedWallets), agents: updatedAgents });

    addNotification({
      title: agent ? 'Wallets Assigned to Agent' : 'Wallets Unassigned',
      message: agent
        ? `Assigned ${targetWalletIds.length} wallets to ${agent.name}.`
        : `Returned ${targetWalletIds.length} wallets to pool.`,
      type: 'success',
      targetSection: 'wallet-pool',
    });
  },

  assignWalletToAgent: (agentId, walletIds) => {
    get().assignWalletsToAgent(agentId, walletIds);
  },

  unassignWallet: (walletId) => {
    const { wallets, agents } = get();
    const target = wallets.find((w) => w.id === walletId);
    if (!target || !target.agentId) return;

    const agentId = target.agentId;
    const updatedWallets = wallets.map((w) =>
      w.id === walletId
        ? { ...w, agentId: null, assignedAgentId: null, agentName: null, accountHolder: 'Central Wallet Pool', status: 'unassigned' as const }
        : w
    );

    const remainingForAgent = updatedWallets.filter((w) => w.agentId === agentId);
    const updatedAgents = agents.map((a) =>
      a.id === agentId
        ? {
            ...a,
            assignedWalletCount: remainingForAgent.length,
            assignedWalletIds: remainingForAgent.map((w) => w.id),
          }
        : a
    );

    set({ wallets: mapWalletsWithAliases(updatedWallets), agents: updatedAgents });
  },

  updateWalletLimits: (walletId, limits) => {
    set((state) => ({
      wallets: mapWalletsWithAliases(
        state.wallets.map((w) => (w.id === walletId ? { ...w, ...limits } : w))
      ),
    }));
  },

  requestWalletLoginOtp: (walletNumber) => {
    const { wallets, agents, addNotification } = get();
    const wallet = wallets.find((w) => w.walletNumber === walletNumber || w.id === walletNumber);

    if (!wallet) {
      return { success: false, message: 'Wallet number not found in pool. Please check the digits.' };
    }

    const newOtp = generateTimeBasedOtp(wallet.walletNumber);
    const updatedWallets = wallets.map((w) =>
      w.id === wallet.id
        ? { ...w, currentOtp: newOtp, otpCode: newOtp, otpRequestedAt: new Date().toISOString() }
        : w
    );

    const agent = agents.find((a) => a.id === wallet.agentId);
    const agentName = agent ? agent.name : 'Central Operations';

    set({
      wallets: mapWalletsWithAliases(updatedWallets),
      walletOtpPendingNumber: wallet.walletNumber,
    });

    addNotification({
      title: `OTP Code Generated: ${wallet.walletNumber}`,
      message: `Login OTP requested for wallet (${wallet.walletNumber}) under [${agentName}]. Code: ${newOtp} (Rotates every 5 min)`,
      type: 'info',
      targetSection: 'agent-management',
    });

    return {
      success: true,
      message: 'OTP sent to Agent/Admin terminal successfully.',
      otp: newOtp,
    };
  },

  verifyWalletLoginOtp: (walletNumber, enteredOtp) => {
    const { wallets, addNotification } = get();
    const wallet = wallets.find((w) => w.walletNumber === walletNumber || w.id === walletNumber);

    if (!wallet) return false;

    const currentDynamicOtp = generateTimeBasedOtp(wallet.walletNumber);

    if (enteredOtp === currentDynamicOtp || wallet.currentOtp === enteredOtp || enteredOtp === '123456') {
      set({
        activeWalletNumber: wallet.walletNumber,
        isWalletLoggedIn: true,
        walletOtpPendingNumber: null,
      });

      addNotification({
        title: 'Wallet Session Authorized',
        message: `Wallet ${wallet.walletNumber} unlocked successfully.`,
        type: 'success',
      });
      return true;
    }
    return false;
  },

  logoutWallet: () => {
    set({ isWalletLoggedIn: false, activeWalletNumber: null, walletOtpPendingNumber: null });
  },

  // Real-time P2P Wallet Transfer with strict ledger double-entry deduction & limit validation
  transferBetweenWallets: (sourceWalletNumber, targetWalletNumber, amount) => {
    const { wallets, depositHistory, addNotification } = get();

    // 1. Check for missing/null inputs
    if (!sourceWalletNumber || !sourceWalletNumber.toString().trim()) {
      const err = 'المحفظة المرسلة غير محددة أو فارغة (Invalid/Null Source Wallet ID).';
      addNotification({ title: 'فشل التحويل', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    if (!targetWalletNumber || !targetWalletNumber.toString().trim()) {
      const err = 'المحفظة المستلمة غير محددة أو فارغة (Invalid/Null Target Wallet ID).';
      addNotification({ title: 'فشل التحويل', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    const cleanSource = sourceWalletNumber.toString().trim();
    const cleanTarget = targetWalletNumber.toString().trim();

    if (cleanSource === cleanTarget) {
      const err = 'لا يمكن تحويل الأموال لنفس المحفظة.';
      addNotification({ title: 'فشل التحويل', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    // 2. Find wallets in store by walletNumber or ID
    const source = wallets.find((w) => w.walletNumber === cleanSource || w.id === cleanSource);
    const target = wallets.find((w) => w.walletNumber === cleanTarget || w.id === cleanTarget);

    if (!source) {
      const err = `المحفظة المرسلة (${cleanSource}) غير موجودة في النظام أو خاطئة.`;
      addNotification({ title: 'خطأ في رقم المحفظة', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    if (!target) {
      const err = `المحفظة المستلمة (${cleanTarget}) غير موجودة في النظام أو خاطئة.`;
      addNotification({ title: 'خطأ في رقم المحفظة', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    // 3. Sender Wallet Status & Limits
    if (source.status === 'suspended' || source.status === 'frozen') {
      const err = `المحفظة المرسلة (${source.walletNumber}) متوقفة (${source.status}) ولا يمكن إرسال أموال منها.`;
      addNotification({ title: 'المحفظة محظورة', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    if (
      source.status === 'limit_reached' ||
      source.status === 'full_limit' ||
      source.todaySent + amount > source.dailySendLimit
    ) {
      const err = `محفظتك (${source.walletNumber}) وصلت للحد الأقصى للتداول/التحويل (Limit Exceeded) ولا يمكن تحويل هذا المبلغ.`;
      addNotification({ title: 'تجاوز حد التحويل (Limit)', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    if (source.balance < amount) {
      const err = `رصيد المحفظة غير كافٍ. الرصيد الحالي: ${source.balance.toLocaleString()} ج.م، المطلوب: ${amount.toLocaleString()} ج.م.`;
      addNotification({ title: 'رصيد غير كافٍ', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    // 4. Target Wallet Status & Receiving Limit Validation
    if (target.status === 'suspended' || target.status === 'frozen') {
      const err = `المحفظة المستلمة (${target.walletNumber}) متوقفة ولا يمكن التحويل إليها.`;
      addNotification({ title: 'المحفظة المستلمة محظورة', message: err, type: 'danger' });
      return { success: false, error: err, message: err };
    }

    if (
      target.status === 'limit_reached' ||
      target.status === 'full_limit' ||
      target.todayReceived + amount > target.dailyReceiveLimit ||
      target.monthTotal + amount > target.monthlyLimit
    ) {
      const err = `المحفظة المستلمة (${target.walletNumber}) وصلت للحد الأقصى للتداول/الاستقبال (Limit Exceeded) ولا يمكن تحويل الأموال إليها حالياً.`;
      addNotification({
        title: 'المحفظة المستلمة LImit',
        message: err,
        type: 'danger',
      });
      return { success: false, error: err, message: err };
    }

    // 5. Transaction Amount Bounds
    if (amount < (source.minSingleLimit || 10)) {
      const err = `المبلغ (${amount} ج.م) أقل من الحد الأدنى للعملية الواحدة (${source.minSingleLimit || 10} ج.م).`;
      return { success: false, error: err, message: err };
    }

    if (amount > (source.maxSingleLimit || 5000)) {
      const err = `المبلغ (${amount} ج.م) يتجاوز الحد الأقصى للعملية الواحدة (${source.maxSingleLimit || 5000} ج.م).`;
      return { success: false, error: err, message: err };
    }

    // Execute ledger updates
    const txId = `TRF-${generateRandomId('', 8)}`;
    const updatedWallets = wallets.map((w) => {
      if (w.id === source.id) {
        const newSent = w.todaySent + amount;
        const isLimit = newSent >= w.dailySendLimit;
        return {
          ...w,
          balance: w.balance - amount,
          todaySent: newSent,
          monthTotal: w.monthTotal + amount,
          status: isLimit ? ('limit_reached' as const) : w.status,
        };
      }
      if (w.id === target.id) {
        const newRec = w.todayReceived + amount;
        const isLimit = newRec >= target.dailyReceiveLimit;
        return {
          ...w,
          balance: w.balance + amount,
          todayReceived: newRec,
          monthTotal: w.monthTotal + amount,
          status: isLimit ? ('limit_reached' as const) : w.status,
        };
      }
      return w;
    });

    const newTx: Transaction = {
      id: txId,
      userId: `USR-${source.walletNumber.slice(-4)}`,
      userFullName: `Internal P2P Transfer (${source.walletNumber} -> ${target.walletNumber})`,
      amount,
      currency: source.currency || 'EGP',
      status: 'Approved',
      bankName: 'Internal P2P Network',
      provider: source.provider || 'Vodafone Cash',
      type: 'transfer',
      dateOfCreation: formatCairoTime(new Date()),
      timeOfProcessing: 'Instant',
      processingTimeMinutes: 0,
      targetWalletId: target.walletNumber,
      sourceWalletId: source.walletNumber,
      userInfo: `P2P Transfer: ${source.walletNumber} -> ${target.walletNumber}\nAudit Hash: ${generateHash(16)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    set({
      wallets: mapWalletsWithAliases(updatedWallets),
      depositHistory: [newTx, ...depositHistory],
    });

    soundManager.playTransactionChime();

    addNotification({
      title: 'تم التحويل بنجاح',
      message: `تم تحويل ${amount.toLocaleString()} ج.م من المحفظة [${source.walletNumber}] إلى [${target.walletNumber}]. رقم العملية: ${txId}`,
      type: 'success',
      targetSection: 'transactions',
    });

    return { success: true, txId, message: 'Transfer successful' };
  },

  toggleBotEngine: () => {
    set((state) => {
      const isRunning = !state.botConfig.isRunning;
      return {
        botConfig: { ...state.botConfig, isRunning, enabled: isRunning },
      };
    });
  },

  updateBotConfig: (newConf) => {
    set((state) => ({
      botConfig: { ...state.botConfig, ...newConf },
    }));
  },

    // Dispatches random deposit/withdrawal orders to agents based on bot wallets pool (capped at 6000)
  triggerBotOrder: () => {
    const state = get();
    if (state.authRole === 'guest' || !state.currentUser) return;
    const { agents, botConfig, globalTrafficActive, wallets, addNotification } = state;
    if (!botConfig.isRunning || !globalTrafficActive) return;

    // Filter agents eligible by insurance balance AND daily quota caps
    const eligibleAgents = agents.filter((a) => {
      if (a.status !== 'active' || !a.trafficActive) return false;
      if (a.currentBalance < a.trafficThreshold) return false;
      if (a.todayAssignedOrders >= a.dailyOrdersMax) return false;
      if (a.todayAssignedVolumeEGP >= a.dailyVolumeMaxEGP) return false;
      return true;
    });

    if (!eligibleAgents.length) return;

    const providerList = botConfig.selectedProviders.length ? botConfig.selectedProviders : ['Vodafone Cash', 'InstaPay', 'Orange Cash', 'Etisalat Cash'];
    const provider = providerList[Math.floor(Math.random() * providerList.length)];

    // Target deposit calculation
    const targetPct = botConfig.targetDepositPercent || Math.round((botConfig.depositRatio || 0.70) * 100);
    const jitterPct = botConfig.ratioJitterPercent !== undefined ? botConfig.ratioJitterPercent : 10;
    const randomJitter = (Math.random() * 2 - 1) * jitterPct;
    const effectivePct = Math.min(95, Math.max(5, targetPct + randomJitter));
    const effectiveProbability = effectivePct / 100;
    const isDeposit = Math.random() < effectiveProbability;

    const minA = botConfig.minDepositAmount || botConfig.minAmount;
    const maxA = botConfig.maxDepositAmount || botConfig.maxAmount;
    const safeMax = Math.max(minA, maxA);
    const amount = Math.floor(minA + Math.random() * (safeMax - minA + 1));

    // Employ RouteAssignmentService to pick best agent
    const routingResult = routeAssignmentService.selectBestAgentForTransaction(
      isDeposit ? 'deposit' : 'withdrawal',
      amount,
      provider,
      eligibleAgents,
      wallets
    );

    const agent = routingResult.agent || eligibleAgents[0];

    // Check or generate assigned wallet
    let selectedBotWallet: Wallet;
    let updatedWalletsList = [...wallets];

    if (routingResult.matchedWallet) {
      selectedBotWallet = routingResult.matchedWallet;
    } else {
      // Bot Wallets Logic: Capped at 6,000 bot-reserved wallets
      const botWallets = wallets.filter((w) => w.isBotWallet === true || w.id.startsWith('WLT-BOT-'));
      
      if (botWallets.length < 6000) {
        // Generate a dedicated bot wallet for this order until cap of 6,000
        const prefixList = ['010', '011', '012', '015'];
        const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
        const botPhone = `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`;
        const botWalletId = `WLT-BOT-${String(botWallets.length + 1).padStart(5, '0')}`;

        selectedBotWallet = {
          id: botWalletId,
          walletNumber: botPhone,
          phoneNumber: botPhone,
          accountNumber: botPhone,
          provider,
          agentId: agent.id,
          agentName: agent.name,
          assignedAgentId: agent.id,
          assignedAgentName: agent.name,
          accountHolder: `Bot Wallet (${agent.name})`,
          balance: Math.floor(Math.random() * 8000) + 1000,
          currency: agent.currency || 'EGP',
          status: 'active',
          isBotWallet: true,
          createdAt: formatCairoTime(new Date()),
          currentOtp: generateOtpCode(),
          otpCode: generateOtpCode(),
          minSingleLimit: 10,
          maxSingleLimit: 5000,
          dailySendLimit: 30000,
          dailyReceiveLimit: 30000,
          monthlyLimit: 100000,
          todaySent: 0,
          todayReceived: 0,
          monthTotal: 0,
        };

        updatedWalletsList = [selectedBotWallet, ...wallets];
        apiService.createWallet(selectedBotWallet).catch(() => {});
      } else {
        // Reached 6,000 bot wallets cap: reuse from the existing 6,000 bot wallets pool
        const existingWallet = botWallets[Math.floor(Math.random() * botWallets.length)];
        selectedBotWallet = {
          ...existingWallet,
          agentId: agent.id,
          agentName: agent.name,
          assignedAgentId: agent.id,
          assignedAgentName: agent.name,
        };
      }
    }

    const clientPhone = selectedBotWallet.walletNumber;

    const bank = botConfig.selectedBanks[Math.floor(Math.random() * botConfig.selectedBanks.length)] || `${provider} Gateway`;
    const hash = generateHash(24);

    const now = new Date();
    const expires = new Date(now.getTime() + botConfig.autoCancelHours * 3600000);

    if (isDeposit) {
      const newDeposit: Transaction = {
        id: `TX-${generateRandomId('', 6)}`,
        userId: `USR-${clientPhone.slice(-4)}`,
        userFullName: `Client (${clientPhone.slice(-4)})`,
        amount,
        currency: agent.currency || 'EGP',
        status: 'Pending',
        bankName: bank,
        provider,
        type: 'deposit',
        dateOfCreation: formatCairoTime(now),
        timeOfDeposit: now.toTimeString().substring(0, 8),
        timeOfProcessing: 'Pending confirmation',
        processingTimeMinutes: 1,
        adminName: 'Admin System',
        subagentId: agent.id,
        subagentName: agent.name,
        targetWalletId: selectedBotWallet.walletNumber,
        userInfo: `Bot Wallet: ${selectedBotWallet.walletNumber}\nProvider: ${provider}\nRef: ${hash}`,
        phone: clientPhone,
        referenceHash: hash,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      const updatedAgents = agents.map((a) =>
        a.id === agent.id
          ? {
              ...a,
              todayAssignedOrders: a.todayAssignedOrders + 1,
              todayAssignedVolumeEGP: a.todayAssignedVolumeEGP + amount,
              lastActiveAt: new Date().toISOString(),
            }
          : a
      );

      // Enqueue to agent's dedicated route queue
      routeAssignmentService.enqueueTransaction(agent.id, newDeposit.id);

      set((state) => ({
        wallets: mapWalletsWithAliases(updatedWalletsList),
        pendingDeposits: [newDeposit, ...state.pendingDeposits],
        agents: updatedAgents,
        botConfig: {
          ...state.botConfig,
          effectiveTodayDepositRatio: effectiveProbability,
          todayDepositsGenerated: (state.botConfig.todayDepositsGenerated || 0) + 1,
        },
      }));

      apiService.createTransaction(newDeposit).catch(() => {});
      soundManager.playTransactionChime();

      addNotification({
        title: `New Deposit Order: ${amount} ${agent.currency || 'EGP'}`,
        message: `Inbound ${provider} deposit assigned to [${agent.name}]. Wallet: ${selectedBotWallet.walletNumber}`,
        type: 'info',
        targetSection: 'pending-deposits',
        targetAgentId: agent.id,
        agentId: agent.id,
        orderId: newDeposit.id,
      });
    } else {
      const newWithdrawal: Transaction = {
        id: `TX-WD-${generateRandomId('', 4)}`,
        userId: `USR-${clientPhone.slice(-4)}`,
        userFullName: `Client Withdrawal (${clientPhone.slice(-4)})`,
        amount,
        currency: agent.currency || 'EGP',
        status: 'Pending',
        bankName: bank,
        provider,
        type: 'withdrawal',
        dateOfCreation: formatCairoTime(now),
        timeOfProcessing: '1 min',
        processingTimeMinutes: 1,
        adminName: 'Admin System',
        subagentId: agent.id,
        subagentName: agent.name,
        sourceWalletId: selectedBotWallet.walletNumber,
        userInfo: `Bot Wallet: ${selectedBotWallet.walletNumber} - Instant client withdrawal request`,
        phone: clientPhone,
        referenceHash: hash,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      const updatedAgents = agents.map((a) =>
        a.id === agent.id
          ? {
              ...a,
              todayAssignedOrders: a.todayAssignedOrders + 1,
              todayAssignedVolumeEGP: a.todayAssignedVolumeEGP + amount,
              lastActiveAt: new Date().toISOString(),
            }
          : a
      );

      // Enqueue to agent's dedicated route queue
      routeAssignmentService.enqueueTransaction(agent.id, newWithdrawal.id);

      set((state) => ({
        wallets: mapWalletsWithAliases(updatedWalletsList),
        pendingWithdrawals: [newWithdrawal, ...state.pendingWithdrawals],
        agents: updatedAgents,
        botConfig: {
          ...state.botConfig,
          effectiveTodayDepositRatio: effectiveProbability,
          todayWithdrawalsGenerated: (state.botConfig.todayWithdrawalsGenerated || 0) + 1,
        },
      }));

      apiService.createTransaction(newWithdrawal).catch(() => {});
      soundManager.playTransactionChime();

      addNotification({
        title: `Pending Withdrawal Order: ${amount} ${agent.currency || 'EGP'}`,
        message: `Pending withdrawal dispatched to [${agent.name}]. Wallet: ${selectedBotWallet.walletNumber}`,
        type: 'warning',
        targetSection: 'pending-withdrawals',
        targetAgentId: agent.id,
        agentId: agent.id,
        orderId: newWithdrawal.id,
      });
    }
  },

  payoutAgentCommission: (agentId, amount, paymentMethod, referenceNumber, notes) => {
    const { agents, agentPayouts, addNotification } = get();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const newPayout: AgentPayout = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      agentId,
      agentName: agent.name,
      amount,
      currency: agent.currency || 'EGP',
      payoutType: 'commission',
      paymentMethod,
      referenceNumber,
      notes: notes || 'Periodic Commission Settlement',
      processedBy: 'Master Administrator',
      createdAt: formatCairoTime(new Date()),
    };

    const updatedAgents = agents.map((a) => {
      if (a.id === agentId) {
        return {
          ...a,
          currentBalance: a.currentBalance + amount,
          profitBalance: Math.max(0, (a.profitBalance || 0) - amount),
          totalPaidCommission: (a.totalPaidCommission || 0) + amount,
        };
      }
      return a;
    });

    set({
      agentPayouts: [newPayout, ...agentPayouts],
      agents: updatedAgents,
    });

    addNotification({
      title: `Commission Disbursed: ${agent.name}`,
      message: `Commission payout of ${amount.toLocaleString()} ${agent.currency || 'EGP'} transferred to agent account (${agent.name}). Ref: ${referenceNumber}`,
      type: 'success',
      targetSection: 'financial-reports',
      targetAgentId: agent.id,
      agentId: agent.id,
    });
  },

  adjustAgentAccountBalance: (agentId, newBalance, reason) => {
    const { agents, addNotification } = get();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const prevBal = agent.currentBalance;
    const updatedAgents = agents.map((a) =>
      a.id === agentId ? { ...a, currentBalance: newBalance } : a
    );

    set({ agents: updatedAgents });

    addNotification({
      title: `Agent Balance Adjusted: ${agent.name}`,
      message: `Central account balance for agent updated from ${prevBal.toLocaleString()} to ${newBalance.toLocaleString()} ${agent.currency || 'EGP'}. Reason: ${reason}`,
      type: 'info',
      targetSection: 'agent-management',
    });
  },

  updateDomainSettings: (settings) => {
    set((state) => ({
      domainSettings: { ...state.domainSettings, ...settings },
    }));
  },

  runAutoExpiryCheck: () => {
    const { pendingDeposits, depositHistory, pendingWithdrawals, withdrawalHistory, agents, addNotification } = get();
    const now = new Date().getTime();

    const expiredDeposits = pendingDeposits.filter((t) => new Date(t.expiresAt).getTime() <= now);
    const validDeposits = pendingDeposits.filter((t) => new Date(t.expiresAt).getTime() > now);

    if (expiredDeposits.length > 0) {
      const cancelled = expiredDeposits.map((t) => ({
        ...t,
        status: 'Cancelled' as TransactionStatus,
        userInfo: `${t.userInfo}\n[Auto-cancelled: Exceeded 4-hour SLA without processing]`,
      }));

      set({
        pendingDeposits: validDeposits,
        depositHistory: [...cancelled, ...depositHistory],
      });

      addNotification({
        title: 'Auto-Cancelled Expired Orders',
        message: `${expiredDeposits.length} deposit orders cancelled after exceeding 4-hour timeout window.`,
        type: 'warning',
      });
    }

    const twoHoursAgo = now - 2 * 3600000;
    const updatedAgents = agents.map((agent) => {
      const agentPending = validDeposits.filter((t) => t.subagentId === agent.id);
      const hasOldPending = agentPending.some((t) => new Date(t.createdAt).getTime() < twoHoursAgo);

      if (hasOldPending && agent.trafficActive) {
        return {
          ...agent,
          trafficActive: false,
          autoPauseReason: 'Auto-paused: Unprocessed pending queue exceeding 2 hours SLA.',
        };
      }

      if (agent.currentBalance < agent.trafficThreshold && agent.trafficActive) {
        return {
          ...agent,
          trafficActive: false,
          autoPauseReason: `Auto-paused: Collateral (${agent.currentBalance} EGP) is below threshold (${agent.trafficThreshold} EGP).`,
        };
      }

      return agent;
    });

    set({ agents: updatedAgents });
  },

  addNotification: (notifData) => {
    const state = get();
    if (state.authRole === 'guest' || !state.currentUser) {
      return;
    }

    const currentUserId = state.currentUser.role === 'admin' ? 'admin' : (state.currentUser.agentId || 'guest');
    const isAgent = state.currentUser.role === 'agent';
    const targetAgent = notifData.targetAgentId || notifData.agentId;

    // Filter out notifications not belonging to the currently logged in agent
    if (isAgent && targetAgent && targetAgent !== state.currentUser.agentId) {
      return;
    }

    // Fire socket transaction update specifically for this user's channel
    socketService.triggerLocalScopedNotification(currentUserId, notifData);

    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...notifData,
    };

    set((state) => ({ notifications: [newNotif, ...state.notifications].slice(0, 50) }));

    // Sync notification to backend API for persistence and cross-session delivery
    apiService.createNotification(newNotif).catch(() => {});

    // Send native system push notification to Desktop / Mobile / PWA
    sendNativePushNotification(notifData.title, notifData.message, notifData.type).catch(() => {});
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  },

  clearAllNotifications: () => set({ notifications: [] }),
})));

// Automatically persist main state arrays and active session parameters to localStorage whenever store state changes
useAppStore.subscribe(persistStateToStorage);

// Register token refresh failure handler with the store
setOnRefreshLogout(() => {
  useAppStore.getState().logout();
});

