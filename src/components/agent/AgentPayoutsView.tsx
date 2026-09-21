import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Filter,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Receipt,
  Radio,
  Sparkles,
  Wallet,
  Zap,
  CheckCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { AgentPayout } from '../../types';

export const AgentPayoutsView: React.FC = () => {
  const {
    agents,
    agentPayouts,
    approveAgentPayout,
    rejectAgentPayout,
    selectedAgentId,
    setSelectedAgentId,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Approval Modal State
  const [payoutToApprove, setPayoutToApprove] = useState<AgentPayout | null>(null);
  const [txHashInput, setTxHashInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessBanner, setActionSuccessBanner] = useState<{
    payoutId: string;
    agentName: string;
    amount: number;
    txHash: string;
  } | null>(null);

  // Reject Modal State
  const [payoutToReject, setPayoutToReject] = useState<AgentPayout | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenApproveModal = (payout: AgentPayout) => {
    setPayoutToApprove(payout);
    // Generate a default authentic TRC20 TxHash preview
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setTxHashInput(randomHex);
  };

  const handleExecuteApproval = () => {
    if (!payoutToApprove) return;
    setIsProcessing(true);

    const tx = txHashInput.trim() || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    approveAgentPayout(payoutToApprove.id, tx);

    const savedPayout = payoutToApprove;
    setTimeout(() => {
      setIsProcessing(false);
      setPayoutToApprove(null);
      setTxHashInput('');
      setActionSuccessBanner({
        payoutId: savedPayout.id,
        agentName: savedPayout.agentName,
        amount: savedPayout.amount,
        txHash: tx,
      });
      setTimeout(() => setActionSuccessBanner(null), 8000);
    }, 350);
  };

  const handleQuickApprove = (payout: AgentPayout) => {
    const tx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    approveAgentPayout(payout.id, tx);
    setActionSuccessBanner({
      payoutId: payout.id,
      agentName: payout.agentName,
      amount: payout.amount,
      txHash: tx,
    });
    setTimeout(() => setActionSuccessBanner(null), 8000);
  };

  const handleExecuteRejection = () => {
    if (!payoutToReject) return;
    rejectAgentPayout(payoutToReject.id, rejectReasonInput || 'بيانات غير مطابقة أو عنوان TRC20 غير صالح');
    setPayoutToReject(null);
    setRejectReasonInput('');
  };

  // Filtered Payouts
  const filteredPayouts = agentPayouts.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (selectedAgentFilter !== 'all' && p.agentId !== selectedAgentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.agentName.toLowerCase().includes(q) ||
        (p.payoutAddress && p.payoutAddress.toLowerCase().includes(q)) ||
        (p.txHash && p.txHash.toLowerCase().includes(q)) ||
        p.amount.toString().includes(q)
      );
    }
    return true;
  });

  const pendingList = agentPayouts.filter((p) => p.status === 'Pending');
  const totalPendingAmount = pendingList.reduce((acc, p) => acc + p.amount, 0);
  const totalPaidAmount = agentPayouts.filter((p) => p.status === 'Approved').reduce((acc, p) => acc + p.amount, 0);
  const totalCommissionsEarned = agents.reduce((acc, a) => acc + (a.totalEarnedCommission || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>نظام سحب وصرف أرباح الوكلاء (Agent TRC20 Payouts)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة طلبات سحب العمولات، تأكيد التحويلات عبر زر <strong className="text-emerald-700">Admin Confirm</strong>، وإرسال إشعارات WebSocket فورية وتحديث حالة المعاملة لدى الوكيل.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-bold flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>{pendingList.length} طلبات معلقة بانتظار التأكيد</span>
          </span>
        </div>
      </div>

      {/* ACTION SUCCESS BANNER (SOCKET BROADCAST CONFIRMED) */}
      {actionSuccessBanner && (
        <div className="bg-emerald-950 text-emerald-100 p-4 rounded-xl border border-emerald-700 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg text-emerald-200 shrink-0">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <span>تم تأكيد الصرف وإرسال إشعار Socket للوكيل بنجاح</span>
                <span className="px-2 py-0.5 bg-emerald-800/80 rounded font-mono text-[10px] text-white">
                  WebSocket Broadcast Active
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                تم صرف <strong>{actionSuccessBanner.amount} USDT</strong> للوكيل <strong>{actionSuccessBanner.agentName}</strong> (طلب #{actionSuccessBanner.payoutId}) وتحديث الحالة الداخلية للمعاملة إلى <strong className="text-white font-mono">Approved</strong>.
              </p>
              <div className="text-[10px] text-emerald-400 font-mono mt-1 truncate max-w-xl" dir="ltr">
                TxID: {actionSuccessBanner.txHash}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActionSuccessBanner(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-1 rounded bg-emerald-900 border border-emerald-700 cursor-pointer shrink-0"
          >
            إغلاق الإشعار
          </button>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>طلبات سحب معلقة بانتظار تأكيد الأدمن</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-900">
            {totalPendingAmount.toLocaleString()} <span className="text-xs font-bold">USDT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            عدد الطلبات المعلقة: {pendingList.length} طلب
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>إجمالي الأرباح المصروفة للوكلاء</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-900">
            {totalPaidAmount.toLocaleString()} <span className="text-xs font-bold">USDT</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-mono">
            تحويلات ناجحة وموثقة بالـ Blockchain TxHash
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>إجمالي العمولات المستحقة في النظام</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalCommissionsEarned.toLocaleString()} <span className="text-xs font-bold">USDT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            عمولات الإيداع والسحب التراكمية لجميع الوكلاء
          </div>
        </div>
      </div>

      {/* PENDING PAYOUTS ACTION QUEUE */}
      {pendingList.length > 0 && (
        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-white rounded-lg">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-amber-950">
                  قائمة طلبات السحب المعلقة الفورية (Pending Payouts Action Queue)
                </h3>
                <p className="text-[11px] text-amber-800">
                  انقر على زر <strong className="font-bold">Admin Confirm</strong> لإتمام التحويل، إرسال إشعار Socket، وتحديث حالة المعاملة فوراً.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full border border-amber-300">
              {pendingList.length} طلبات بحاجة لإجراء
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingList.map((payout) => {
              const agent = agents.find((a) => a.id === payout.agentId);
              return (
                <div
                  key={payout.id}
                  className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs space-y-3 hover:border-emerald-400 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{payout.agentName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {payout.id}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {payout.createdAt} • رصيد الأرباح الحالي: {agent?.profitBalance?.toLocaleString() || 0} USDT
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-base font-black text-emerald-700">
                        {payout.amount.toLocaleString()} USDT
                      </span>
                      <span className="block text-[9px] text-slate-400 uppercase">TRC20 Network</span>
                    </div>
                  </div>

                  {/* Recipient TRC20 Address */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-mono text-slate-800 truncate" dir="ltr">
                        {payout.payoutAddress || 'Standard Agency TRC20 Wallet'}
                      </span>
                    </div>
                    {payout.payoutAddress && (
                      <button
                        onClick={() => handleCopy(payout.payoutAddress!, `queue-${payout.id}`)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer shrink-0"
                        title="نسخ عنوان المحفظة"
                      >
                        {copiedId === `queue-${payout.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenApproveModal(payout)}
                      className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Confirm</span>
                    </button>

                    <button
                      onClick={() => handleQuickApprove(payout)}
                      className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      title="تأكيد سريع بتوليد TxID فوري"
                    >
                      <span>تأكيد فوري</span>
                    </button>

                    <button
                      onClick={() => setPayoutToReject(payout)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، اسم الوكيل، أو عنوان المحفظة..."
            className="w-full text-xs pr-8 pl-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Agent Filter */}
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none font-medium"
          >
            <option value="all">جميع الوكلاء</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.profitBalance?.toLocaleString() || 0} USDT أرباح)
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({agentPayouts.length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'Pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              <span>معلقة</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-amber-900/30 rounded-full">
                {pendingList.length}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تم الصرف ({agentPayouts.filter((p) => p.status === 'Approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مرفوضة ({agentPayouts.filter((p) => p.status === 'Rejected').length})
            </button>
          </div>
        </div>
      </div>

      {/* PAYOUT REQUESTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3 font-semibold text-[11px] text-right">رقم الطلب</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-right">اسم الوكيل</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-right">المبلغ المطلوب</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-right">عنوان محفظة الاستلام (TRC20)</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-right">رقم المعاملة (TxID / TxHash)</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-right">الحالة</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-right">التاريخ والوقت</th>
                <th className="py-3 px-3 font-semibold text-[11px] text-center">إجراء الأدمن (Admin Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">لا توجد طلبات سحب أرباح تطابق معايير البحث الحالية.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => {
                  const agent = agents.find((a) => a.id === p.agentId);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        p.status === 'Pending' ? 'bg-amber-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {p.id}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800">
                        <div>{p.agentName}</div>
                        {agent && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            الأرباح المتبقية: {agent.profitBalance?.toLocaleString() || 0} USDT
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-black text-emerald-700 text-sm">
                        {p.amount.toLocaleString()} USDT
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 text-[11px]">
                        <div className="flex items-center gap-1.5 max-w-[220px]">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block truncate font-mono text-slate-800" dir="ltr">
                            {p.payoutAddress || 'TRC20 Wallet'}
                          </span>
                          {p.payoutAddress && (
                            <button
                              onClick={() => handleCopy(p.payoutAddress!, `addr-${p.id}`)}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded cursor-pointer transition-colors"
                              title="نسخ عنوان المحفظة"
                            >
                              {copiedId === `addr-${p.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        {p.txHash ? (
                          <div className="flex items-center gap-1 max-w-[180px]">
                            <span className="text-emerald-700 font-bold truncate" dir="ltr">{p.txHash}</span>
                            <button
                              onClick={() => handleCopy(p.txHash!, `tx-${p.id}`)}
                              className="p-1 hover:bg-emerald-100 text-emerald-600 rounded cursor-pointer"
                              title="نسخ TxHash"
                            >
                              {copiedId === `tx-${p.id}` ? (
                                <Check className="w-3 h-3 text-emerald-700" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {p.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span>معلق</span>
                          </span>
                        ) : p.status === 'Approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>تم التحويل</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px] border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>مرفوض</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {p.createdAt}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {p.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenApproveModal(p)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Admin Confirm</span>
                            </button>
                            <button
                              onClick={() => setPayoutToReject(p)}
                              className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-xs border border-rose-200 cursor-pointer transition-all"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono">
                            {p.processedBy || 'مكتمل'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM PAYMENT / APPROVE MODAL */}
      {payoutToApprove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>تأكيد تحويل وصرف الأرباح للوكيل (Admin Confirm)</span>
              </h3>
              <button
                onClick={() => setPayoutToApprove(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Request Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">اسم الوكيل:</span>
                <span className="font-bold text-slate-900">{payoutToApprove.agentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">المبلغ المطلوب صرفه:</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  {payoutToApprove.amount.toLocaleString()} USDT
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                <span className="text-slate-500">عنوان المحفظة (TRC20 Address):</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-900 text-[11px] select-all bg-white px-2 py-0.5 rounded border border-slate-300" dir="ltr">
                    {payoutToApprove.payoutAddress || 'TRC20 Wallet'}
                  </span>
                  {payoutToApprove.payoutAddress && (
                    <button
                      onClick={() => handleCopy(payoutToApprove.payoutAddress!, 'modal-addr')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                    >
                      {copiedId === 'modal-addr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              {payoutToApprove.notes && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ملاحظات الوكيل:</span>
                  <span className="text-slate-700">{payoutToApprove.notes}</span>
                </div>
              )}
            </div>

            {/* Blockchain TxID Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  رقم المعاملة على شبكة البلوكشين (Blockchain TxHash / TxID):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
                    setTxHashInput(generated);
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                >
                  توليد TxID تلقائي
                </button>
              </div>
              <input
                type="text"
                value={txHashInput}
                onChange={(e) => setTxHashInput(e.target.value)}
                placeholder="0x..."
                dir="ltr"
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-left"
              />
              <p className="text-[10px] text-slate-500">
                * عند النقر على <strong>Admin Confirm</strong>، سيتم إرسال إشعار WebSocket فوري إلى الوكيل، خصم المبلغ من رصيده، وتحديث حالة المعاملة إلى <span className="text-emerald-700 font-mono font-bold">Approved</span>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayoutToApprove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteApproval}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'جاري التأكيد والإرسال...' : 'Admin Confirm & Broadcast'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {payoutToReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-right">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>رفض طلب سحب أرباح</span>
            </h3>

            <p className="text-xs text-slate-600">
              يرجى تحديد سبب رفض طلب سحب {payoutToReject.amount} USDT للوكيل {payoutToReject.agentName}:
            </p>

            <textarea
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="مثال: عنوان المحفظة غير صالح، أو يرجى مراجعة الإدارة..."
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPayoutToReject(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteRejection}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md cursor-pointer"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
