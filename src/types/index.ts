export type Role = 'admin' | 'agent' | 'user';

export type TransactionStatus = 'Pending' | 'Processing' | 'Approved' | 'Rejected' | 'Cancelled' | 'Hold';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

export interface CommissionTier {
  id: string;
  minVolume: number;
  maxVolume: number; // 0 or Infinity for unlimited
  ratePercent: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  isActive: boolean;
  provider: string;
}

export interface Transaction {
  id: string;
  userId: string;
  firstName?: string;
  surname?: string;
  patronymic?: string;
  userFullName: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  bankName: string;
  provider: string;
  type: TransactionType;
  dateOfCreation: string; // Real-time Cairo formatted string
  timeOfDeposit?: string;
  timeOfProcessing?: string;
  processedAt?: string; // ISO string when order was finalized
  processingDurationSeconds?: number; // Exact elapsed seconds from creation to approval/rejection
  processingDurationFormatted?: string; // HH:MM:SS or Xm Ys formatted
  duration?: string; // Permanently locked processing time string e.g. "02m 45s"
  processingTimeMinutes: number;
  processingTimeDisplay?: string;
  commissionEarned?: number; // Real-time profit credited to agent
  commissionRateApplied?: number; // Rate percentage used at processing time
  adminName?: string;
  subagentId?: string;
  subagentName?: string;
  targetWalletId?: string;
  sourceWalletId?: string;
  userInfo: string;
  phone?: string;
  referenceHash?: string;
  receiptImage?: string;
  processedBy?: string;
  processedByRole?: 'admin' | 'agent';
  rejectionReason?: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string for auto-cancellation (4 hours)
}

export interface Wallet {
  id: string;
  walletNumber: string;
  phoneNumber?: string;
  accountNumber?: string;
  accountHolder?: string;
  provider: string; // e.g. Vodafone Cash, InstaPay, Orange Cash, Etisalat Cash, WE Pay
  agentId: string | null;
  agentName: string | null;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'unassigned' | 'suspended' | 'full_limit' | 'limit_reached';
  isBotWallet?: boolean;
  createdAt: string;
  // Security & Real-Time OTP
  currentOtp?: string;
  otpCode?: string;
  lastOtp?: string;
  otpRequestedAt?: string;
  // Financial Limits
  minSingleLimit: number;
  maxSingleLimit: number;
  singleTransactionLimit?: number;
  dailySendLimit: number;
  dailyReceiveLimit: number;
  dailyLimit?: number;
  monthlyLimit: number;
  todaySent: number;
  todayReceived: number;
  todayTransferred?: number;
  monthTotal: number;
}

export interface Agent {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  insuranceDeposit: number;
  currentBalance: number;
  trafficThreshold: number;
  trafficActive: boolean;
  trafficEnabled?: boolean;
  autoPauseReason?: string;
  lastActiveAt: string;
  speedMode: 'low' | 'medium' | 'fast';
  dailyOrdersMin: number;
  dailyOrdersMax: number;
  dailyVolumeMinEGP: number;
  dailyVolumeMaxEGP: number;
  todayProcessedCount: number;
  processedOrdersCount?: number;
  todayAssignedOrders: number;
  todayAssignedVolumeEGP: number;
  processedVolume?: number;
  depositPaymentMethod: string;
  depositMethod?: string;
  depositPaymentAddress: string;
  depositAddress?: string;
  depositCommissionPercent?: number; // e.g. 3% (نسبة أرباح الإيداع)
  withdrawalCommissionPercent?: number; // e.g. 1% (نسبة أرباح السحب)
  useTieredCommission?: boolean; // Enable volume-based tiered rate structure
  depositTiers?: CommissionTier[]; // Tiered rates based on deposit volume threshold
  withdrawalTiers?: CommissionTier[]; // Tiered rates based on withdrawal volume threshold
  profitBalance?: number; // Current accumulated profit balance from processed deposits and withdrawals (رصيد الأرباح)
  totalEarnedCommission?: number; // Lifetime total profit/commission earned
  currency?: string; // e.g. EGP, USD, USDT, USDC
  customCurrencyName?: string;
  password?: string;
  assignedWalletCount: number;
  assignedWalletIds: string[];
  // Dynamic Bot Ratio per agent (e.g. 70% deposit / 30% withdrawal ±10%)
  customDepositPercent?: number; // e.g. 70
  customRatioJitter?: number; // e.g. 10 (±10% jitter)
  totalPaidCommission?: number; // Track settled paid commissions
  dailyOrderLimit?: {
    min: number;
    max: number;
    dailyMoneyCap: number;
  };
}

export interface AgentDepositRequest {
  id: string;
  agentId: string;
  agentName: string;
  amountRequested: number;
  requestedAmount?: number;
  amountApproved?: number;
  paymentMethod: string;
  referenceNumber: string;
  txReference?: string;
  receiptNote: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  processedAt?: string;
}

export interface AgentPayout {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  currency: string;
  payoutType: 'commission' | 'bonus' | 'account_topup' | 'settlement';
  paymentMethod: string;
  referenceNumber: string;
  notes?: string;
  processedBy: string;
  createdAt: string;
}

export interface DomainSettings {
  adminDomain: string;
  agentDomain: string;
  walletDomain: string;
  enableSubdomainRouting: boolean;
  sslEnabled: boolean;
}

export interface BotEngineConfig {
  isRunning: boolean;
  enabled?: boolean;
  isEnabled?: boolean;
  intervalSeconds: number;
  minAmount: number;
  maxAmount: number;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  minWithdrawalAmount?: number;
  maxWithdrawalAmount?: number;
  depositRatio: number; // floating ratio e.g. 0.70
  targetDepositPercent: number; // e.g. 70 (70% deposit, 30% withdrawal)
  ratioJitterPercent: number; // e.g. 10 (±10% random jitter)
  effectiveTodayDepositRatio?: number;
  todayDepositsGenerated?: number;
  todayWithdrawalsGenerated?: number;
  autoCancelHours: number;
  autoPauseInactiveHours: number;
  totalWalletPoolTarget: number;
  selectedProviders: string[];
  selectedBanks: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  targetSection?: string;
  isRead: boolean;
  agentId?: string;
  targetAgentId?: string;
  orderId?: string;
}
