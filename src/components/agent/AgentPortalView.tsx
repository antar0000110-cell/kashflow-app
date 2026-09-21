import React, { useState } from 'react';
import {
  Shield,
  TrendingUp,
  Power,
  Key,
  Smartphone,
  Copy,
  Check,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Receipt,
  Search,
  Lock,
  Edit3,
  BellRing,
  X,
  Layers,
  Radio,
  Sparkles,
  Filter,
  CheckSquare,
  Info,
  Bell
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { Transaction } from '../../types';
import { formatCairoTime } from '../../utils/cairoTime';
import { getNativePermission } from '../../services/notificationService';
import { NotificationPermissionModal } from '../notifications/NotificationPermissionModal';
import { socketService } from '../../services/socketService';
import { OrderElapsedTimeBadge } from '../common/OrderElapsedTimeBadge';

export const AgentPortalView: React.FC = () => {
  const {
    agents,
    selectedAgentId,
    pendingDeposits,
    pendingWithdrawals,
    depositHistory,
    withdrawalHistory,
    confirmDeposit,
    rejectDeposit,
    confirmWithdrawal,
    rejectWithdrawal,
    toggleAgentTraffic,
    wallets,
    submitAgentDepositRequest,
    transferBetweenWallets,
    paymentMethods,
    agentPayouts,
  } = useAppStore();

  // STRICTLY LOCKED TO AUTHENTICATED AGENT (NO SWITCHER)
  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const [activeTab, setActiveTab] = useState<'assigned_tasks' | 'inbound_deposits' | 'deposit_history' | 'inbound_withdrawals' | 'withdrawal_history' | 'wallets' | 'payouts'>('assigned_tasks');
  const [assignedTasksFilter, setAssignedTasksFilter] = useState<'all' | 'direct' | 'deposits' | 'withdrawals' | 'broadcasts'>('all');

  // Real-time Event-Driven Scoped Notification Handler
  const [liveAssignedAlert, setLiveAssignedAlert] = useState<{
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    time: string;
    provider?: string;
  } | null>(null);

  const [isEarningsFlashing, setIsEarningsFlashing] = useState(false);

  React.useEffect(() => {
    if (!currentAgent?.id) return;

    // Listen only for transactions assigned specifically to this agent
    const unsubscribe = socketService.onAgentAssignedTransaction(currentAgent.id, (payload) => {
      setLiveAssignedAlert({
        id: payload.transactionId,
        type: payload.type,
        amount: payload.amount,
        time: new Date().toLocaleTimeString(),
        provider: payload.provider,
      });

      // Auto clear alert banner after 8s
      const timer = setTimeout(() => {
        setLiveAssignedAlert((prev) => (prev?.id === payload.transactionId ? null : prev));
      }, 8000);

      return () => clearTimeout(timer);
    });

    // Subscriptions to socket events for instant real-time earnings widget updates
    const unsubTx = socketService.subscribe('transaction:updated', (payload) => {
      if (
        payload?.subagentId === currentAgent.id ||
        payload?.agentId === currentAgent.id ||
        payload?.processedBy === currentAgent.name
      ) {
        setIsEarningsFlashing(true);
        setTimeout(() => setIsEarningsFlashing(false), 2500);
      }
    });

    const unsubAgent = socketService.subscribe('agent:updated', (payload) => {
      if (payload?.id === currentAgent.id || payload?.agentId === currentAgent.id) {
        setIsEarningsFlashing(true);
        setTimeout(() => setIsEarningsFlashing(false), 2500);
      }
    });

    return () => {
      unsubscribe();
      unsubTx();
      unsubAgent();
    };
  }, [currentAgent?.id, currentAgent?.name]);

  // Synchronize with external triggers (such as mobile bottom navigation)
  React.useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('change-agent-tab', handler);
    return () => window.removeEventListener('change-agent-tab', handler);
  }, []);

  // Notify external listeners of tab changes (e.g. to update active class on bottom nav)
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('agent-tab-changed', { detail: activeTab }));
  }, [activeTab]);

  // Modals state
  const [isDepositTopupModalOpen, setIsDepositTopupModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(10000);
  const [topupMethod, setTopupMethod] = useState(paymentMethods[0] || 'Vodafone Cash');
  const [topupRef, setTopupRef] = useState('');
  const [topupNote, setTopupNote] = useState('Transferred to Master Gateway');

  // Deposit Confirmation Modal (Allows Agent to Edit Amount)
  const [selectedDepositForConfirm, setSelectedDepositForConfirm] = useState<Transaction | null>(null);
  const [depositApprovedAmount, setDepositApprovedAmount] = useState<number>(0);

  // Withdrawal Payout Modal (Amount is STRICTLY LOCKED & CANNOT BE EDITED)
  const [selectedWithdrawalForConfirm, setSelectedWithdrawalForConfirm] = useState<Transaction | null>(null);

  // Rejection Modal
  const [orderToReject, setOrderToReject] = useState<{ id: string; type: 'deposit' | 'withdrawal' } | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment reference mismatch or invalid transfer receipt');

  // OTP view modal
  const [otpModalWallet, setOtpModalWallet] = useState<any | null>(null);

  // Internal P2P transfer modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(500);

  // Search in agent history
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!currentAgent) {
    return <div className="p-8 text-center text-slate-500">No agent profile found.</div>;
  }

  // Filter orders strictly assigned to this agent
  const directAssignedDeposits = pendingDeposits.filter((t) => t.subagentId === currentAgent.id);
  const directAssignedWithdrawals = pendingWithdrawals.filter((t) => t.subagentId === currentAgent.id);
  const allDirectAssignedTasks = [...directAssignedDeposits, ...directAssignedWithdrawals];

  // General fallback system broadcasts (unassigned to any specific agent)
  const systemBroadcastDeposits = pendingDeposits.filter((t) => !t.subagentId);
  const systemBroadcastWithdrawals = pendingWithdrawals.filter((t) => !t.subagentId);
  const allSystemBroadcastTasks = [...systemBroadcastDeposits, ...systemBroadcastWithdrawals];

  // Combined agent pool
  const agentPendingDeposits = pendingDeposits.filter(
    (t) => t.subagentId === currentAgent.id || !t.subagentId
  );

  const agentPendingWithdrawals = pendingWithdrawals.filter(
    (t) => t.subagentId === currentAgent.id || !t.subagentId
  );

  const agentAssignedWallets = wallets.filter(
    (w) => w.assignedAgentId === currentAgent.id || w.agentId === currentAgent.id
  );

  const agentProcessedDeposits = depositHistory.filter(
    (t) => t.subagentId === currentAgent.id || t.subagentName === currentAgent.name
  );

  const agentProcessedWithdrawals = withdrawalHistory.filter(
    (t) => t.subagentId === currentAgent.id || t.subagentName === currentAgent.name
  );

  const totalDepositVolume = agentProcessedDeposits.reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawalVolume = agentProcessedWithdrawals.reduce((acc, t) => acc + t.amount, 0);
  const depCommPercent = currentAgent.depositCommissionPercent !== undefined ? currentAgent.depositCommissionPercent : 3.0;
  const wdlCommPercent = currentAgent.withdrawalCommissionPercent !== undefined ? currentAgent.withdrawalCommissionPercent : 1.0;
  const totalEarnedCommission = (totalDepositVolume * (depCommPercent / 100)) + (totalWithdrawalVolume * (wdlCommPercent / 100));

  const allAgentHistory = [...agentProcessedDeposits, ...agentProcessedWithdrawals];

  const filteredHistory = allAgentHistory.filter((tx) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
      (tx.phone && tx.phone.includes(q)) ||
      (tx.provider && tx.provider.toLowerCase().includes(q)) ||
      tx.amount.toString().includes(q)
    );
  });

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenDepositConfirm = (tx: Transaction) => {
    setSelectedDepositForConfirm(tx);
    setDepositApprovedAmount(tx.amount); // Prefill original amount for editing
  };

  const handleExecuteDepositConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepositForConfirm) return;
    confirmDeposit(selectedDepositForConfirm.id, Number(depositApprovedAmount), currentAgent.name, 'agent');
    setSelectedDepositForConfirm(null);
  };

  const handleExecuteWithdrawalConfirm = () => {
    if (!selectedWithdrawalForConfirm) return;
    confirmWithdrawal(selectedWithdrawalForConfirm.id, currentAgent.name, 'agent');
    setSelectedWithdrawalForConfirm(null);
  };

  const handleExecuteReject = () => {
    if (!orderToReject) return;
    if (orderToReject.type === 'deposit') {
      rejectDeposit(orderToReject.id, rejectReason, currentAgent.name, 'agent');
    } else {
      rejectWithdrawal(orderToReject.id, rejectReason, currentAgent.name, 'agent');
    }
    setOrderToReject(null);
  };

  const handleSendTopupRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAmount || topupAmount <= 0) return;
    submitAgentDepositRequest(
      currentAgent.id,
      topupAmount,
      topupMethod,
      topupRef || 'REF-TOPUP',
      topupNote
    );
    setIsDepositTopupModalOpen(false);
    setTopupRef('');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWalletId || !toWalletId || transferAmount <= 0) return;
    const res = transferBetweenWallets(fromWalletId, toWalletId, transferAmount);
    if (res.success) {
      setIsTransferModalOpen(false);
    }
  };

  return (
    <div className="p-1.5 sm:p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-1 gap-2.5 sm:gap-4 md:gap-5">
      {/* Top Banner: Locked Strictly to Current Agent Profile (No Switcher Dropdown) */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#8B1E2D] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {currentAgent.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 truncate">{currentAgent.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                @{currentAgent.username}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Verified Account
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Phone: <span className="font-mono text-slate-700">{currentAgent.phone}</span> • Real-time Order Processing System (Cairo)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Real-time Accrued Earnings Header Widget */}
          <div className={`px-3 py-1.5 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
            isEarningsFlashing
              ? 'bg-emerald-100 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300 shadow-sm scale-105'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
          }`}
          title="Instant real-time accrued earnings across all processed orders via Socket listener"
          >
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <span>Accrued Earnings</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs font-bold font-mono text-emerald-900 truncate">
                +{formatCurrency(totalEarnedCommission, currentAgent.currency || 'EGP')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsNotificationModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              getNativePermission() === 'granted'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
            }`}
            title="System and browser push notification status for incoming orders"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>
              {getNativePermission() === 'granted' ? 'Alerts Active' : 'Enable Push Alerts'}
            </span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              currentAgent.trafficActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title="Traffic routing is controlled exclusively by Administration"
          >
            <span className={`w-2 h-2 rounded-full ${currentAgent.trafficActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{currentAgent.trafficActive ? 'Traffic Route: Active' : 'Traffic Route: Paused (Admin)'}</span>
          </div>
        </div>
      </div>

      {/* Financial Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Insurance Collateral */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="truncate">Insurance Collateral</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-[#8B1E2D] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-[#8B1E2D] truncate tracking-tight">
              {formatCurrency(currentAgent.insuranceDeposit, currentAgent.currency || 'EGP')}
            </div>
          </div>
          <button
            onClick={() => setIsDepositTopupModalOpen(true)}
            className="text-[11px] text-[#8B1E2D] hover:underline font-semibold mt-2 flex items-center gap-0.5 cursor-pointer truncate"
          >
            <span>+ Request Collateral Top-up</span>
          </button>
        </div>

        {/* Profit Balance (رصيد الأرباح المتراكمة) */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/20">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="truncate">Profit Balance (رصيد الأرباح)</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-emerald-700 truncate tracking-tight">
              +{formatCurrency(currentAgent.profitBalance || 0, currentAgent.currency || 'EGP')}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-2 truncate flex items-center gap-1">
            <span>Lifetime:</span>
            <span className="font-bold font-mono">+{formatCurrency(currentAgent.totalEarnedCommission || currentAgent.profitBalance || 0, currentAgent.currency || 'EGP')}</span>
          </div>
        </div>

        {/* Commission Rates */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="truncate">Commission Rates</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 flex flex-wrap items-center gap-1.5">
              <span className="text-emerald-700 font-bold">Dep: {depCommPercent}%</span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-700 font-bold">Wdl: {wdlCommPercent}%</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-2 truncate">
            Currency: <strong className="text-slate-800 font-mono">{currentAgent.currency || 'EGP'}</strong>
          </div>
        </div>

        {/* Today's Processed Volume */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="truncate">Today&apos;s Volume</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-slate-900 truncate tracking-tight">
              {formatCurrency(currentAgent.todayAssignedVolumeEGP || currentAgent.processedVolume || 0, currentAgent.currency || 'EGP')}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-2 truncate">
            Processed: <strong className="text-slate-800 font-mono">{currentAgent.todayProcessedCount || 0}</strong> orders
          </div>
        </div>

        {/* Assigned Wallets */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="truncate">Assigned Wallets</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-slate-900 truncate tracking-tight">
              {agentAssignedWallets.length} <span className="text-xs font-normal text-slate-400">active</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (agentAssignedWallets.length >= 2) {
                setFromWalletId(agentAssignedWallets[0].id);
                setToWalletId(agentAssignedWallets[1].id);
                setIsTransferModalOpen(true);
              }
            }}
            className="text-[11px] text-blue-600 hover:underline font-semibold mt-2 flex items-center gap-0.5 cursor-pointer truncate"
          >
            <ArrowRightLeft className="w-3 h-3 shrink-0" />
            <span>Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* Main Agent Operations Console Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Navigation Tabs Header with smooth horizontal scroll */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-2 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
            <button
              onClick={() => setActiveTab('assigned_tasks')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'assigned_tasks'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Assigned Tasks</span>
              {allDirectAssignedTasks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#8B1E2D] text-white font-mono text-[10px]">
                  {allDirectAssignedTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inbound_deposits')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'inbound_deposits'
                  ? 'bg-[#8B1E2D] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pending Deposits (طلبات الإيداع)</span>
              {agentPendingDeposits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                  {agentPendingDeposits.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('deposit_history')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'deposit_history'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Processed Deposits (سجلات الإيداع)</span>
              {agentProcessedDeposits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                  {agentProcessedDeposits.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inbound_withdrawals')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'inbound_withdrawals'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
              <span>Pending Withdrawals (طلبات السحب)</span>
              {agentPendingWithdrawals.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                  {agentPendingWithdrawals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('withdrawal_history')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'withdrawal_history'
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-200" />
              <span>Processed Withdrawals (سجلات السحب)</span>
              {agentProcessedWithdrawals.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                  {agentProcessedWithdrawals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wallets')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'wallets'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>My Wallets &amp; OTP</span>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'payouts'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Earnings &amp; Commissions</span>
              {agentPayouts.filter((p) => p.agentId === currentAgent.id).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                  {agentPayouts.filter((p) => p.agentId === currentAgent.id).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 0: Dedicated Assigned Tasks (Separating Direct Routes from General Broadcasts) */}
        {activeTab === 'assigned_tasks' && (
          <div className="p-3 sm:p-5 space-y-4 text-left">
            {/* Real-time Scoped Notification Alert Bar */}
            {liveAssignedAlert && (
              <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-3 sm:p-4 rounded-xl border border-rose-500/50 shadow-md flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Direct Task Dispatched to Your Queue</span>
                      <span className="font-mono text-[10px] bg-rose-800 px-1.5 py-0.5 rounded">
                        {liveAssignedAlert.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-200 mt-0.5">
                      {liveAssignedAlert.type === 'deposit' ? 'Cash-In Deposit' : 'Cash-Out Payout'}:{' '}
                      <strong>{formatCurrency(liveAssignedAlert.amount, currentAgent.currency || 'EGP')}</strong>{' '}
                      • Received at {liveAssignedAlert.time}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setLiveAssignedAlert(null)}
                  className="text-rose-300 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Header & Isolation Explainer */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#8B1E2D]" />
                    <span>Dedicated Agent Task Queue &amp; Direct Routing</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Channel Isolated
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Transactions routed exclusively to agent queue{' '}
                  <code className="bg-slate-200 text-slate-800 px-1 py-0.2 rounded font-mono text-[11px]">
                    queue:agent:{currentAgent.id}
                  </code>
                  . General system broadcasts are separated below.
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setAssignedTasksFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    assignedTasksFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Tasks ({allDirectAssignedTasks.length + allSystemBroadcastTasks.length})
                </button>
                <button
                  onClick={() => setAssignedTasksFilter('direct')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    assignedTasksFilter === 'direct'
                      ? 'bg-[#8B1E2D] text-white'
                      : 'bg-white text-[#8B1E2D] border border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  Directly Assigned ({allDirectAssignedTasks.length})
                </button>
                <button
                  onClick={() => setAssignedTasksFilter('deposits')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    assignedTasksFilter === 'deposits'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Cash-In ({directAssignedDeposits.length})
                </button>
                <button
                  onClick={() => setAssignedTasksFilter('withdrawals')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    assignedTasksFilter === 'withdrawals'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Cash-Out ({directAssignedWithdrawals.length})
                </button>
                <button
                  onClick={() => setAssignedTasksFilter('broadcasts')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    assignedTasksFilter === 'broadcasts'
                      ? 'bg-slate-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Broadcasts ({allSystemBroadcastTasks.length})
                </button>
              </div>
            </div>

            {/* SECTION 1: DIRECTLY ASSIGNED TO LOGGED-IN AGENT */}
            {assignedTasksFilter !== 'broadcasts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B1E2D]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      ⚡ Exclusively Routed to Your Wallets ({allDirectAssignedTasks.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Priority Direct Dispatch
                  </span>
                </div>

                {allDirectAssignedTasks.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 bg-slate-50/50">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Your direct assignment queue is all clear. No pending direct tasks.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-rose-200/80 rounded-xl overflow-hidden shadow-2xs bg-white">
                    {allDirectAssignedTasks
                      .filter((tx) => {
                        if (assignedTasksFilter === 'deposits') return tx.type === 'deposit';
                        if (assignedTasksFilter === 'withdrawals') return tx.type === 'withdrawal';
                        return true;
                      })
                      .map((tx) => {
                        const isDep = tx.type === 'deposit';
                        return (
                          <div
                            key={tx.id}
                            className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-rose-50/20 transition-colors bg-white"
                          >
                            <div className="space-y-1.5 text-left flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`font-mono font-bold text-sm sm:text-base ${isDep ? 'text-[#8B1E2D]' : 'text-amber-700'}`}>
                                  {formatCurrency(tx.amount, tx.currency)}
                                </span>
                                <span className="font-mono font-semibold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {tx.id}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B1E2D] text-white flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-3 h-3" />
                                  <span>DIRECT ROUTE</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isDep
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {isDep ? 'Cash-In Deposit' : 'Instant Cash-Out'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200">
                                  {tx.provider}
                                </span>
                                <OrderElapsedTimeBadge
                                  createdAt={tx.createdAt}
                                  processedAt={tx.processedAt}
                                  processingDurationSeconds={tx.processingDurationSeconds}
                                  processingDurationFormatted={tx.processingDurationFormatted}
                                  status={tx.status}
                                />
                              </div>

                              <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <div>
                                  Client:{' '}
                                  <strong className="text-slate-900 font-mono select-all">
                                    {tx.phone || tx.userInfo}
                                  </strong>{' '}
                                  ({tx.userFullName})
                                </div>
                                {tx.targetWalletId && (
                                  <div className="text-slate-500 font-mono text-[11px]">
                                    Assigned Wallet: <strong className="text-slate-800">{tx.targetWalletId}</strong>
                                  </div>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-400 font-mono">
                                Dispatched: {tx.dateOfCreation || formatCairoTime(tx.createdAt)} • Queue: queue:agent:{currentAgent.id}
                              </div>

                              <div className="pt-1 flex items-center gap-2">
                                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <span>💰 Expected Profit (الربح المتوقع):</span>
                                  <strong className="font-bold">+{formatCurrency((tx.amount * (isDep ? depCommPercent : wdlCommPercent)) / 100, currentAgent.currency || 'EGP')}</strong>
                                  <span className="text-slate-500">({isDep ? depCommPercent : wdlCommPercent}%)</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-auto">
                              <button
                                onClick={() => handleCopy(tx.phone || tx.targetWalletId || tx.userInfo)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                                title="Copy Client/Wallet Phone"
                              >
                                {copiedText === (tx.phone || tx.targetWalletId || tx.userInfo) ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>Copy</span>
                              </button>

                              {isDep ? (
                                <button
                                  onClick={() => handleOpenDepositConfirm(tx)}
                                  className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm Deposit (Adjust Amount)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedWithdrawalForConfirm(tx)}
                                  className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Execute Cash-Out</span>
                                </button>
                              )}

                              <button
                                onClick={() => setOrderToReject({ id: tx.id, type: isDep ? 'deposit' : 'withdrawal' })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                title="Reject Order"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: GENERAL SYSTEM BROADCASTS (UNASSIGNED FALLBACK POOL) */}
            {(assignedTasksFilter === 'all' || assignedTasksFilter === 'broadcasts') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      🌐 General System Broadcasts (Unassigned Fallback Pool) ({allSystemBroadcastTasks.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Open pool / Not locked to a specific agent
                  </span>
                </div>

                {allSystemBroadcastTasks.length === 0 ? (
                  <div className="p-6 border border-slate-200 rounded-xl text-center text-xs text-slate-400 bg-slate-50/50">
                    No open broadcast orders in the system fallback queue.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {allSystemBroadcastTasks.map((tx) => {
                      const isDep = tx.type === 'deposit';
                      return (
                        <div
                          key={tx.id}
                          className="p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors bg-white"
                        >
                          <div className="space-y-1 text-left flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-slate-800">
                                {formatCurrency(tx.amount, tx.currency)}
                              </span>
                              <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {tx.id}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Global Broadcast
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {tx.provider}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              Client: <strong className="font-mono text-slate-800">{tx.phone || tx.userInfo}</strong> ({tx.userFullName})
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {isDep ? (
                              <button
                                onClick={() => handleOpenDepositConfirm(tx)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                Accept &amp; Process Deposit
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedWithdrawalForConfirm(tx)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                Accept &amp; Execute Cash-Out
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Inbound Deposits (Agent CAN edit deposit amount upon confirmation) */}
        {activeTab === 'inbound_deposits' && (
          <div className="divide-y divide-slate-100">
            {agentPendingDeposits.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>No pending deposit orders in agency queue.</span>
              </div>
            ) : (
              agentPendingDeposits.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm sm:text-base text-[#8B1E2D]">
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <span className="font-mono font-semibold text-xs text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {tx.id}
                      </span>
                      <StatusBadge status={tx.status} />
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200">
                        {tx.provider}
                      </span>
                      <OrderElapsedTimeBadge
                        createdAt={tx.createdAt}
                        processedAt={tx.processedAt}
                        processingDurationSeconds={tx.processingDurationSeconds}
                        processingDurationFormatted={tx.processingDurationFormatted}
                        status={tx.status}
                      />
                    </div>

                    <div className="text-xs text-slate-700">
                      Client Details:{' '}
                      <strong className="text-slate-900 font-mono select-all">
                        {tx.phone || tx.userInfo}
                      </strong>{' '}
                      ({tx.userFullName})
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Created: {tx.dateOfCreation || formatCairoTime(tx.createdAt)} • Provider:{' '}
                      {tx.bankName || tx.provider}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-auto">
                    <button
                      onClick={() => handleCopy(tx.phone || tx.userInfo)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                      title="Copy client phone number"
                    >
                      {copiedText === (tx.phone || tx.userInfo) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>

                    {/* CONFIRM BUTTON (OPENS EDITABLE DEPOSIT AMOUNT MODAL) */}
                    <button
                      onClick={() => handleOpenDepositConfirm(tx)}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Deposit (Adjust Amount)</span>
                    </button>

                    <button
                      onClick={() => setOrderToReject({ id: tx.id, type: 'deposit' })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Reject Order"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Inbound Withdrawals (Agent CANNOT edit amount - strictly locked) */}
        {activeTab === 'inbound_withdrawals' && (
          <div className="divide-y divide-slate-100">
            {agentPendingWithdrawals.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>No pending cash-out orders in agency queue.</span>
              </div>
            ) : (
              agentPendingWithdrawals.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm sm:text-base text-amber-700">
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <span className="font-mono font-semibold text-xs text-slate-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {tx.id}
                      </span>
                      <StatusBadge status={tx.status} />
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-medium text-amber-800 border border-amber-200">
                        Instant Cash-Out (Payout)
                      </span>
                      <OrderElapsedTimeBadge
                        createdAt={tx.createdAt}
                        processedAt={tx.processedAt}
                        processingDurationSeconds={tx.processingDurationSeconds}
                        processingDurationFormatted={tx.processingDurationFormatted}
                        status={tx.status}
                      />
                    </div>

                    <div className="text-xs text-slate-700">
                      Destination Wallet:{' '}
                      <strong className="text-slate-900 font-mono select-all">
                        {tx.phone || tx.sourceWalletId || tx.userInfo}
                      </strong>{' '}
                      ({tx.userFullName})
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Requested: {tx.dateOfCreation || formatCairoTime(tx.createdAt)} • Provider: {tx.provider}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-auto">
                    <button
                      onClick={() => handleCopy(tx.phone || tx.sourceWalletId || tx.userInfo)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                      title="Copy recipient phone"
                    >
                      {copiedText === (tx.phone || tx.sourceWalletId || tx.userInfo) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>

                    {/* CONFIRM BUTTON (STRICTLY NON-EDITABLE FIXED PAYOUT) */}
                    <button
                      onClick={() => setSelectedWithdrawalForConfirm(tx)}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Execute Cash-Out</span>
                    </button>

                    <button
                      onClick={() => setOrderToReject({ id: tx.id, type: 'withdrawal' })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Reject Order"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Processed Deposits History (سجلات الإيداع المعالجة) */}
        {activeTab === 'deposit_history' && (
          <div className="p-3 sm:p-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search processed deposits by Order ID, client phone, or amount..."
                className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="divide-y divide-slate-100 border border-emerald-200/80 rounded-xl overflow-hidden bg-white">
              {agentProcessedDeposits.filter((tx) => {
                if (!historySearchQuery.trim()) return true;
                const q = historySearchQuery.toLowerCase();
                return (
                  tx.id.toLowerCase().includes(q) ||
                  (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
                  (tx.phone && tx.phone.includes(q)) ||
                  tx.amount.toString().includes(q)
                );
              }).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No processed deposit records found.
                </div>
              ) : (
                agentProcessedDeposits
                  .filter((tx) => {
                    if (!historySearchQuery.trim()) return true;
                    const q = historySearchQuery.toLowerCase();
                    return (
                      tx.id.toLowerCase().includes(q) ||
                      (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
                      (tx.phone && tx.phone.includes(q)) ||
                      tx.amount.toString().includes(q)
                    );
                  })
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 text-xs transition-colors"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-emerald-800">
                            {formatCurrency(tx.amount, tx.currency || currentAgent.currency || 'EGP')}
                          </span>
                          <span className="font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {tx.id}
                          </span>
                          <StatusBadge status={tx.status} />
                          <OrderElapsedTimeBadge
                            createdAt={tx.createdAt}
                            processedAt={tx.processedAt}
                            processingDurationSeconds={tx.processingDurationSeconds}
                            processingDurationFormatted={tx.processingDurationFormatted}
                            status={tx.status}
                          />
                        </div>
                        <div className="text-slate-700 font-mono text-[11px] flex flex-wrap items-center gap-2">
                          <span>Client: <strong className="text-slate-900">{tx.userFullName}</strong> ({tx.phone || tx.userInfo})</span>
                          <span>•</span>
                          <span>Gateway: {tx.provider}</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right font-mono text-[11px] space-y-0.5 shrink-0">
                        <div className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +Earned: {formatCurrency((tx.amount * depCommPercent) / 100, currentAgent.currency || 'EGP')} ({depCommPercent}%)
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Processed: {tx.processedAt ? formatCairoTime(tx.processedAt) : tx.dateOfCreation}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Processed Withdrawals History (سجلات السحب المعالجة) */}
        {activeTab === 'withdrawal_history' && (
          <div className="p-3 sm:p-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search processed withdrawals by Order ID, client phone, or amount..."
                className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-amber-600 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="divide-y divide-slate-100 border border-amber-200/80 rounded-xl overflow-hidden bg-white">
              {agentProcessedWithdrawals.filter((tx) => {
                if (!historySearchQuery.trim()) return true;
                const q = historySearchQuery.toLowerCase();
                return (
                  tx.id.toLowerCase().includes(q) ||
                  (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
                  (tx.phone && tx.phone.includes(q)) ||
                  tx.amount.toString().includes(q)
                );
              }).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No processed withdrawal records found.
                </div>
              ) : (
                agentProcessedWithdrawals
                  .filter((tx) => {
                    if (!historySearchQuery.trim()) return true;
                    const q = historySearchQuery.toLowerCase();
                    return (
                      tx.id.toLowerCase().includes(q) ||
                      (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
                      (tx.phone && tx.phone.includes(q)) ||
                      tx.amount.toString().includes(q)
                    );
                  })
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/30 text-xs transition-colors"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-amber-800">
                            {formatCurrency(tx.amount, tx.currency || currentAgent.currency || 'EGP')}
                          </span>
                          <span className="font-mono text-slate-500 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">
                            {tx.id}
                          </span>
                          <StatusBadge status={tx.status} />
                          <OrderElapsedTimeBadge
                            createdAt={tx.createdAt}
                            processedAt={tx.processedAt}
                            processingDurationSeconds={tx.processingDurationSeconds}
                            processingDurationFormatted={tx.processingDurationFormatted}
                            status={tx.status}
                          />
                        </div>
                        <div className="text-slate-700 font-mono text-[11px] flex flex-wrap items-center gap-2">
                          <span>Recipient: <strong className="text-slate-900">{tx.userFullName}</strong> ({tx.phone || tx.userInfo})</span>
                          <span>•</span>
                          <span>Gateway: {tx.provider}</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right font-mono text-[11px] space-y-0.5 shrink-0">
                        <div className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          +Earned: {formatCurrency((tx.amount * wdlCommPercent) / 100, currentAgent.currency || 'EGP')} ({wdlCommPercent}%)
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Processed: {tx.processedAt ? formatCairoTime(tx.processedAt) : tx.dateOfCreation}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Assigned SIMs & OTP Lookups */}
        {activeTab === 'wallets' && (
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agentAssignedWallets.map((w) => (
              <div key={w.id} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                    Active
                  </span>
                  <div className="font-mono font-bold text-sm text-slate-900">{w.phoneNumber}</div>
                </div>

                <div className="text-xs text-slate-600 flex justify-between font-mono">
                  <span>Balance:</span>
                  <span className="font-bold text-[#8B1E2D]">{formatCurrency(w.balance, 'EGP')}</span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex justify-between">
                  <span>Network:</span>
                  <span className="font-semibold text-slate-700">{w.provider}</span>
                </div>

                <button
                  onClick={() => setOtpModalWallet(w)}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-[#8B1E2D]" />
                  <span>View OTP Auth Code</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Settled Commissions & Payouts Received */}
        {activeTab === 'payouts' && (
          <div className="p-3 sm:p-4 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div>
                <h4 className="font-bold text-sm text-emerald-950 flex items-center justify-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Agency Earnings &amp; Commission Ledger</span>
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Commissions on deposits ({depCommPercent}%) and cash-outs ({wdlCommPercent}%) are settled automatically and credited directly to your account.
                </p>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl border border-emerald-300 text-left font-mono shrink-0 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase">Total Settled Commissions</div>
                <div className="text-lg font-bold text-emerald-700">
                  {formatCurrency(
                    agentPayouts
                      .filter((p) => p.agentId === currentAgent.id)
                      .reduce((acc, p) => acc + p.amount, 0),
                    currentAgent.currency || 'EGP'
                  )}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/80 p-2.5 px-3 border-b border-slate-200 font-bold text-xs text-slate-800 text-left">
                Settled Commission Payouts from Administration
              </div>
              <div className="divide-y divide-slate-100">
                {agentPayouts.filter((p) => p.agentId === currentAgent.id).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No historical payouts recorded yet. Disbursements appear here instantly upon administrative approval.
                  </div>
                ) : (
                  agentPayouts
                    .filter((p) => p.agentId === currentAgent.id)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700 text-sm">
                              +{formatCurrency(p.amount, p.currency || 'EGP')}
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                              {p.paymentMethod}
                            </span>
                          </div>
                          <div className="text-slate-600 text-[11px] flex flex-wrap items-center gap-2">
                            <span>Ref: <strong className="font-mono">{p.referenceNumber}</strong></span>
                            <span>•</span>
                            <span>{p.notes || 'Routine commission settlement'}</span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right font-mono text-[11px] text-slate-400">
                          <div>{p.createdAt}</div>
                          <div className="text-emerald-600 font-bold">Credited</div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: DEPOSIT CONFIRMATION (AGENT CAN EDIT AMOUNT) */}
      {selectedDepositForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 border border-slate-200 text-slate-800 space-y-4 text-left no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#8B1E2D]" />
                <span>Confirm Deposit &amp; Adjust Amount</span>
              </h3>
              <button
                onClick={() => setSelectedDepositForConfirm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 font-mono">
              <div className="flex justify-between">
                <span>Client Name:</span>
                <span className="font-bold text-slate-900">{selectedDepositForConfirm.userFullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Client Phone:</span>
                <span className="font-bold text-slate-900 select-all">{selectedDepositForConfirm.phone || selectedDepositForConfirm.userInfo}</span>
              </div>
              <div className="flex justify-between">
                <span>Requested Amount:</span>
                <span className="text-[#8B1E2D] font-bold">{selectedDepositForConfirm.amount} {selectedDepositForConfirm.currency}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteDepositConfirm} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">
                  Actually Received Amount (Adjustable)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={depositApprovedAmount}
                  onChange={(e) => setDepositApprovedAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 border-2 border-[#8B1E2D]/40 rounded-xl font-mono text-sm font-bold bg-white text-slate-900 focus:ring-2 focus:ring-[#8B1E2D] outline-none text-left"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  * You may adjust the amount if the client transferred a different figure so the exact credit is recorded.
                </p>

                {/* Profit Credit Notice */}
                <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center justify-between font-mono">
                  <span>✨ Profit to be credited ({depCommPercent}%):</span>
                  <span className="font-bold">+{formatCurrency((Number(depositApprovedAmount || 0) * depCommPercent) / 100, currentAgent.currency || 'EGP')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDepositForConfirm(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Confirm &amp; Credit Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WITHDRAWAL PAYOUT (AMOUNT IS STRICTLY LOCKED & READ-ONLY) */}
      {selectedWithdrawalForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 border border-slate-200 text-slate-800 space-y-4 text-left no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Execute Cash-Out (Fixed Locked Amount)</span>
              </h3>
              <button
                onClick={() => setSelectedWithdrawalForConfirm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs text-slate-700 font-mono">
              <div className="flex justify-between">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-900">{selectedWithdrawalForConfirm.userFullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Destination Wallet:</span>
                <span className="font-bold text-slate-900 select-all">{selectedWithdrawalForConfirm.phone || selectedWithdrawalForConfirm.sourceWalletId || selectedWithdrawalForConfirm.userInfo}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-1">
                <span>Payable Amount:</span>
                <span className="text-amber-800 font-bold text-sm">{formatCurrency(selectedWithdrawalForConfirm.amount, selectedWithdrawalForConfirm.currency)}</span>
              </div>
            </div>

            {/* Profit Credit Notice for Withdrawal */}
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] flex items-center justify-between font-mono">
              <span>✨ Profit to be credited ({wdlCommPercent}%):</span>
              <span className="font-bold">+{formatCurrency((selectedWithdrawalForConfirm.amount * wdlCommPercent) / 100, currentAgent.currency || 'EGP')}</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
              * Notice: Cash-out (payout) orders must be executed for the exact client requested amount. Adjustments are restricted by system policy.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedWithdrawalForConfirm(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteWithdrawalConfirm}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Confirm Payout &amp; Deduct
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECTION DIALOG */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 border border-slate-200 text-slate-800 space-y-4 text-left no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Reject Order</span>
              </h3>
              <button
                onClick={() => setOrderToReject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the reason for rejecting order <span className="font-mono font-bold text-slate-900">{orderToReject.id}</span>:
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 bg-white outline-none"
              rows={3}
              placeholder="e.g. Unverified transfer receipt or invalid wallet number"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOrderToReject(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReject}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TOP-UP REQUEST */}
      {isDepositTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 border border-slate-200 text-slate-800 space-y-4 text-left no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Request Agency Collateral Top-up</h3>
              <button
                onClick={() => setIsDepositTopupModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTopupRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Requested Amount ({currentAgent.currency || 'EGP'})</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#8B1E2D] outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment / Transfer Channel</label>
                <select
                  value={topupMethod}
                  onChange={(e) => setTopupMethod(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 outline-none"
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transfer Reference (TxID / Ref)</label>
                <input
                  type="text"
                  placeholder="e.g. 8839201934"
                  value={topupRef}
                  onChange={(e) => setTopupRef(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#8B1E2D] outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transfer Notes</label>
                <textarea
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-[#8B1E2D] outline-none"
                  rows={2}
                  placeholder="Additional notes for administration..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDepositTopupModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Top-up Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: OTP DISPLAY MODAL */}
      {otpModalWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 text-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#8B1E2D] mx-auto flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-sm text-slate-900">OTP Auth Code</h3>
            <p className="text-xs text-slate-500 font-mono">Wallet: {otpModalWallet.phoneNumber}</p>

            <div className="py-3.5 bg-slate-100 rounded-xl border border-slate-300">
              <span className="font-mono font-bold text-2xl sm:text-3xl tracking-widest text-[#8B1E2D]">
                {otpModalWallet.lastOtp || '849201'}
              </span>
            </div>

            <p className="text-[10px] text-slate-400">
              Secure code valid for 90 seconds (Cairo Time).
            </p>

            <button
              onClick={() => setOtpModalWallet(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: INTERNAL P2P REBALANCE */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 border border-slate-200 text-slate-800 space-y-4 text-left no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-[#8B1E2D]" />
                <span>Internal Transfer Between Wallets</span>
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Source Wallet</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-left outline-none bg-white"
                >
                  {agentAssignedWallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.phoneNumber} ({formatCurrency(w.balance, 'EGP')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Destination Wallet</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-left outline-none bg-white"
                >
                  {agentAssignedWallets
                    .filter((w) => w.id !== fromWalletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.phoneNumber} ({formatCurrency(w.balance, 'EGP')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transfer Amount (EGP)</label>
                <input
                  type="number"
                  required
                  min="10"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#8B1E2D] outline-none text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Push Notification Permission & Test Modal */}
      {isNotificationModalOpen && (
        <NotificationPermissionModal
          forceOpen={true}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}
    </div>
  );
};
