import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Send,
  UploadCloud,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { formatCairoTime } from '../../utils/cairoTime';
import { triggerHaptic, playSynthesizedChime } from '../../services/notificationService';
import { Transaction, DisputeReport } from '../../types';

export const ManagementOSAgentAppView: React.FC = () => {
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
    wallets,
    disputes,
    updateDispute,
    agentPayouts,
    requestAgentCommissionPayout,
    submitAgentDepositRequest,
    toggleAgentTraffic,
  } = useAppStore();

  // Pick authenticated agent or fallback to first
  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Mobile App Navigation Tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'profits' | 'disputes' | 'wallets' | 'collateral'>('tasks');
  const [showBalance, setShowBalance] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live Mirror Sync Simulation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Commission Payout Modal / Form State
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [payoutAddress, setPayoutAddress] = useState<string>(currentAgent?.payoutAddress || 'TRC20-AgentAddress...');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [payoutResultMsg, setPayoutResultMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Collateral / Deposit Request Form
  const [collateralAmount, setCollateralAmount] = useState<number | ''>('');
  const [collateralTxRef, setCollateralTxRef] = useState<string>('');
  const [collateralSuccess, setCollateralSuccess] = useState(false);

  // Dispute resolution state
  const [activeDisputeProofUrl, setActiveDisputeProofUrl] = useState<string>('');
  const [activeDisputeComment, setActiveDisputeComment] = useState<string>('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeReport | null>(null);

  // Calculate Headroom & Limits
  const securityFloor = currentAgent ? (currentAgent.insuranceDeposit || currentAgent.securityDeposit || 0) : 0;
  const currentBal = currentAgent ? (currentAgent.currentBalance || 0) : 0;
  const availableHeadroom = Math.max(0, currentBal - securityFloor);
  const isTrafficActive = currentAgent?.trafficActive && currentBal > securityFloor;

  // Filter pending orders for this agent
  const agentAssignedDeposits = pendingDeposits.filter(
    (tx) => tx.subagentId === currentAgent?.id || (!tx.subagentId && tx.targetWalletId)
  );
  const agentAssignedWithdrawals = pendingWithdrawals.filter(
    (tx) => tx.subagentId === currentAgent?.id || (!tx.subagentId && tx.sourceWalletId)
  );

  // Filter disputes assigned to this agent
  const agentDisputes = disputes.filter(
    (d) => d.agentId === currentAgent?.id || d.agentName === currentAgent?.name
  );

  // Filter payouts for this agent
  const myPayouts = agentPayouts.filter((p) => p.agentId === currentAgent?.id);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    triggerHaptic('light');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    triggerHaptic('medium');
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 600);
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgent) return;
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum <= 0) {
      setPayoutResultMsg({ text: 'يرجى إدخال مبلغ صالح لسحب الأرباح', type: 'error' });
      return;
    }
    if (amountNum > (currentAgent.profitBalance || 0)) {
      setPayoutResultMsg({
        text: `رصيد أرباحك (${currentAgent.profitBalance || 0} USDT) أقل من المبلغ المطلوب (${amountNum} USDT)`,
        type: 'error',
      });
      return;
    }

    const res = requestAgentCommissionPayout(currentAgent.id, amountNum, payoutAddress, payoutNotes);
    if (res.success) {
      setPayoutResultMsg({ text: res.message, type: 'success' });
      setPayoutAmount('');
      playSynthesizedChime();
    } else {
      setPayoutResultMsg({ text: res.message, type: 'error' });
    }
    setTimeout(() => setPayoutResultMsg(null), 4500);
  };

  const handleCollateralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgent || !collateralAmount) return;
    submitAgentDepositRequest(
      currentAgent.id,
      Number(collateralAmount),
      'USDT TRC20',
      collateralTxRef || `TX-${Date.now().toString().slice(-8)}`,
      'شحن تأمين إضافي لرفع الترافيك'
    );
    setCollateralSuccess(true);
    setCollateralAmount('');
    setCollateralTxRef('');
    triggerHaptic('heavy');
    setTimeout(() => setCollateralSuccess(false), 4000);
  };

  const handleSaveDisputeProof = (disputeId: string) => {
    updateDispute(disputeId, {
      proofScreenshotUrl: activeDisputeProofUrl || undefined,
      agentComment: activeDisputeComment || 'تم فحص العملية وتأكيد بيانات المحفظة',
      status: 'UnderReview',
    });
    setSelectedDispute(null);
    setActiveDisputeProofUrl('');
    setActiveDisputeComment('');
    triggerHaptic('light');
  };

  return (
    <div className="min-h-screen bg-slate-900 py-4 px-2 sm:px-4 flex flex-col items-center justify-start select-none">
      {/* Container Frame mimicking mobile native standalone APK */}
      <div className="w-full max-w-md bg-slate-950 text-slate-100 rounded-[36px] shadow-2xl border-4 border-slate-800 overflow-hidden flex flex-col h-[880px] relative">
        {/* Native Status Bar */}
        <div className="bg-slate-950 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <span className="font-bold text-slate-200">09:41</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto" />
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Management OS Header Bar (No Domain Exposed) */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Logo OS */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 border-2 border-sky-400/80 flex items-center justify-center font-black font-mono text-white text-sm shadow-md">
              OS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider text-white">Management OS</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-800 rounded">
                  AGENT APP
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>{currentAgent?.name || 'Agent Terminal'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-sky-400">{currentAgent?.username}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all ${
                isRefreshing ? 'animate-spin text-emerald-400' : ''
              }`}
              title="تحديث البيانات حياً"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Mirror Sync Banner */}
        <div className="bg-slate-900/60 px-4 py-1.5 border-b border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>متزامن حياً مع النظام المركزي</span>
          </div>
          <span>Sync: {lastSyncTime}</span>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 text-slate-200 [&::-webkit-scrollbar]:hidden">
          {/* Main Account Card: Balance vs Security Deposit vs Headroom */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">رصيد الحساب الإجمالي</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {showBalance ? `${formatCurrency(currentBal, 'USDT')}` : '••••••••'}
              </div>
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                  isTrafficActive
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}
              >
                {isTrafficActive ? '● ترافيك نشط' : '■ ترافيك متوقف'}
              </div>
            </div>

            {/* Security Deposit & Usable Headroom Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
              <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">حد التأمين المحجوز</span>
                <span className="font-bold text-amber-400">{securityFloor.toLocaleString()} USDT</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">الرصيد المتاح للمعالجة</span>
                <span className="font-bold text-emerald-400">{availableHeadroom.toLocaleString()} USDT</span>
              </div>
            </div>

            {/* Headroom Warning if below or at floor */}
            {availableHeadroom === 0 && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-[11px] text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  تم الوصول لحد التأمين. لا يمكن تأكيد أي سحب إلا بعد إيداع تأمين جديد لتجاوز {securityFloor} USDT.
                </span>
              </div>
            )}
          </div>

          {/* TAB 1: LIVE ASSIGNED TASKS (Deposits & Withdrawals Queue) */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>الطلبات الواردة المخصصة للوكيل</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {agentAssignedDeposits.length + agentAssignedWithdrawals.length} معلق
                </span>
              </div>

              {agentAssignedDeposits.length === 0 && agentAssignedWithdrawals.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/60 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">لا توجد طلبات معلقة بانتظارك حالياً</p>
                  <p className="text-[10px] text-slate-500">يقوم البوت بتوجيه الطلبات تلقائياً وفقاً للسيولة المتوفرة</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Deposits Queue */}
                  {agentAssignedDeposits.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-slate-900 rounded-2xl border border-emerald-900/40 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-800">
                            <ArrowDownLeft className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">إيداع وارد (Deposit)</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{tx.id}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-sm font-black text-emerald-400">+{tx.amount} USDT</span>
                          <span className="text-[9px] text-slate-500 block">{tx.dateOfCreation}</span>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-950 rounded-xl text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>المحفظة: {tx.targetWalletId?.slice(0, 12)}...{tx.targetWalletId?.slice(-6)}</span>
                        <button
                          onClick={() => handleCopy(tx.targetWalletId || '', tx.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedText === tx.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => {
                            confirmDeposit(tx.id, tx.amount, currentAgent?.name, 'agent');
                            triggerHaptic('heavy');
                          }}
                          className="py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأكيد الإيداع</span>
                        </button>
                        <button
                          onClick={() => {
                            rejectDeposit(tx.id, 'مرفوض من قبل الوكيل');
                            triggerHaptic('medium');
                          }}
                          className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Withdrawals Queue */}
                  {agentAssignedWithdrawals.map((tx) => {
                    const canAfford = availableHeadroom >= tx.amount;
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 bg-slate-900 rounded-2xl border border-amber-900/40 shadow-sm space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-800">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">سحب صادر (Withdrawal)</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{tx.id}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-sm font-black text-amber-400">-{tx.amount} USDT</span>
                            <span className="text-[9px] text-slate-500 block">{tx.dateOfCreation}</span>
                          </div>
                        </div>

                        {!canAfford && (
                          <div className="p-2 bg-rose-950/60 border border-rose-800 text-[10px] text-rose-300 rounded-xl">
                            ⚠️ لا يمكن التنفيذ: يتطلب رصيد متاح فوق التأمين بقيمة {tx.amount} USDT (المتاح: {availableHeadroom} USDT)
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              confirmWithdrawal(tx.id, currentAgent?.name, 'agent');
                              triggerHaptic('heavy');
                            }}
                            className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer ${
                              canAfford
                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تأكيد وصرف</span>
                          </button>
                          <button
                            onClick={() => {
                              rejectWithdrawal(tx.id, 'مرفوض لعدم كفاية السيولة فوق التأمين');
                              triggerHaptic('medium');
                            }}
                            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGENT PROFITS & COMMISSION PAYOUT */}
          {activeTab === 'profits' && (
            <div className="space-y-4">
              {/* Profit Card */}
              <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/80 space-y-2">
                <span className="text-xs font-semibold text-emerald-300 block">رصيد الأرباح والعمولات المتراكمة</span>
                <div className="text-3xl font-black font-mono text-emerald-400">
                  {formatCurrency(currentAgent?.profitBalance || 0, 'USDT')}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-emerald-900/60 pt-2 font-mono">
                  <span>إجمالي العمولات المحققة:</span>
                  <span className="text-white font-bold">{currentAgent?.totalEarnedCommission?.toLocaleString() || 0} USDT</span>
                </div>
              </div>

              {payoutResultMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    payoutResultMsg.type === 'success'
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950 border border-rose-800 text-rose-300'
                  }`}
                >
                  {payoutResultMsg.text}
                </div>
              )}

              {/* Payout Request Form */}
              <form onSubmit={handlePayoutSubmit} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-right">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                  <span>طلب سحب العمولات إلى محفظتك</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </h3>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">المبلغ المطلوب سحبه (USDT)</label>
                  <input
                    type="number"
                    min="1"
                    max={currentAgent?.profitBalance || 0}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 500"
                    required
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 outline-none text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">عنوان محفظتك (USDT TRC20 Address)</label>
                  <input
                    type="text"
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    placeholder="T..."
                    required
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 outline-none text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="ملاحظات الحوالة"
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 outline-none text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!payoutAmount || Number(payoutAmount) <= 0 || Number(payoutAmount) > (currentAgent?.profitBalance || 0)}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال طلب السحب للأدمن</span>
                </button>
              </form>

              {/* Payout History */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block">سجل طلبات السحب والحوالات</span>
                {myPayouts.length === 0 ? (
                  <div className="p-4 text-center bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-500">
                    لا توجد طلبات سحب سابقة
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    {myPayouts.map((p) => (
                      <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white font-mono">{p.amount} USDT</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.createdAt}</div>
                          {p.txHash && (
                            <div className="text-[9px] text-emerald-400 font-mono">TxID: {p.txHash.slice(0, 16)}...</div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.status === 'Approved'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : p.status === 'Rejected'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {p.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WRONG WALLET DISPUTES & COMPLAINTS */}
          {activeTab === 'disputes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>الشكاوى والنزاعات (Wrong Wallet)</span>
                <span className="text-[10px] font-mono text-rose-400">{agentDisputes.length} نزاع</span>
              </div>

              {agentDisputes.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/60 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs text-slate-400">سجلك خالٍ من أي نزاعات أو شكاوى معلقة</p>
                  <p className="text-[10px] text-slate-500">يتم تسجيل الشكاوى تلقائياً عند وجود تحويل خاطئ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agentDisputes.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 bg-slate-900 rounded-2xl border border-rose-900/60 shadow-md space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-bold text-white">نزاع #{d.id}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800">
                          {d.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300">{d.notes || d.reason}</p>

                      <div className="p-2 bg-slate-950 rounded-xl space-y-1 text-[10px] font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>المبلغ:</span>
                          <span className="text-white font-bold">{d.receivedAmount} USDT</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>المحفظة المستهدفة:</span>
                          <span className="text-slate-300">{d.expectedWallet?.slice(0, 10)}...</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>المحفظة التي استلمت:</span>
                          <span className="text-rose-400">{d.actualSentWallet?.slice(0, 10)}...</span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                          <span>مهلة الحل (SLA 2h):</span>
                          <span className="text-amber-400">خلال ساعتين</span>
                        </div>
                      </div>

                      {/* Upload Proof / Resolution UI */}
                      {selectedDispute?.id === d.id ? (
                        <div className="p-2.5 bg-slate-950 rounded-xl space-y-2 border border-slate-800">
                          <label className="block text-[10px] text-slate-400">إرفاق سكرين شوت أو فيديو التحويل:</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setActiveDisputeProofUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-[10px] text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                            />
                          </div>

                          <input
                            type="text"
                            value={activeDisputeProofUrl}
                            onChange={(e) => setActiveDisputeProofUrl(e.target.value)}
                            placeholder="أو ضع رابط الإثبات المباشر https://..."
                            className="w-full text-[10px] font-mono px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                          />

                          {activeDisputeProofUrl && activeDisputeProofUrl.startsWith('data:image') && (
                            <div className="p-1 border border-slate-800 rounded bg-slate-900">
                              <img src={activeDisputeProofUrl} alt="Dispute Preview" className="h-20 w-auto rounded object-contain mx-auto" />
                            </div>
                          )}

                          <input
                            type="text"
                            value={activeDisputeComment}
                            onChange={(e) => setActiveDisputeComment(e.target.value)}
                            placeholder="تعليق وتوضيح الوكيل"
                            className="w-full text-[10px] px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveDisputeProof(d.id)}
                              className="w-1/2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              إرسال الرد والإثبات
                            </button>
                            <button
                              onClick={() => setSelectedDispute(null)}
                              className="w-1/2 py-1.5 bg-slate-800 text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setActiveDisputeProofUrl(d.proofScreenshotUrl || '');
                            setActiveDisputeComment(d.agentComment || '');
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                          <span>رفع إثبات وسكرين شوت للشكوى</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COLLATERAL / TOP-UP REQUEST */}
          {activeTab === 'collateral' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-800/60 space-y-2">
                <span className="text-xs font-semibold text-amber-300 block">شحن وتأمين الحساب (Collateral Top-up)</span>
                <p className="text-[11px] text-slate-300">
                  لرفع حد الترافيك واستقبال مبالغ أكبر، أودع رصيد تأميني إضافي. يتم مراجعة الإيداع وتأكيده فورياً من لوحة الأدمن.
                </p>
              </div>

              {collateralSuccess && (
                <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-medium">
                  تم إرسال طلب شحن التأمين للأدمن للموافقة والإيداع في حسابك.
                </div>
              )}

              <form onSubmit={handleCollateralSubmit} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-right">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">مبلغ التأمين المراد شحنه (USDT)</label>
                  <input
                    type="number"
                    min="100"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 5000"
                    required
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">رقم المعاملة / هاش التحويل (TxID)</label>
                  <input
                    type="text"
                    value={collateralTxRef}
                    onChange={(e) => setCollateralTxRef(e.target.value)}
                    placeholder="TX-..."
                    required
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none text-left"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>تقديم طلب شحن التأمين</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Native Navigation Bar */}
        <div className="px-2 py-2 bg-slate-900 border-t border-slate-800 grid grid-cols-4 gap-1 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('tasks');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'tasks' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-bold">الطلبات</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('profits');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'profits' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] font-bold">سحب الأرباح</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('disputes');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'disputes' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-bold">الشكاوى</span>
            {agentDisputes.length > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('collateral');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'collateral' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-bold">شحن تأمين</span>
          </button>
        </div>
      </div>
    </div>
  );
};
