import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Transaction } from '../../types';

export const WithdrawalHistoryView: React.FC = () => {
  const { withdrawalHistory, setInspectingTransaction, agents } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Rejected'>('All');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('All');

  const filteredWithdrawals = useMemo(() => {
    return withdrawalHistory.filter((tx) => {
      const matchSearch =
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.userFullName && tx.userFullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.sourceWalletId && tx.sourceWalletId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.subagentName && tx.subagentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.customerPayoutAddress && tx.customerPayoutAddress.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'All' ? true : tx.status === statusFilter;
      const matchAgent =
        selectedAgentFilter === 'All'
          ? true
          : tx.subagentId === selectedAgentFilter || tx.subagentName === selectedAgentFilter;

      return matchSearch && matchStatus && matchAgent;
    });
  }, [withdrawalHistory, searchTerm, statusFilter, selectedAgentFilter]);

  const totalVolume = filteredWithdrawals.reduce((acc, t) => acc + (t.status === 'Approved' ? t.amount : 0), 0);
  const totalCommission = filteredWithdrawals.reduce((acc, t) => acc + (t.commissionEarned || 0), 0);

  return (
    <div id="withdrawal-history-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">سجل عمليات السحب (Withdrawal History)</h1>
          <p className="text-xs text-slate-500 mt-1">
            الأرشيف المالي الشامل لجميع طلبات السحب وصرف الأرباح المكتملة والمرفوضة
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-100 px-3 py-1.5 rounded border border-slate-300">
            <span className="text-slate-500">إجمالي حجم السحب المعتمد:</span>{' '}
            <span className="font-bold text-slate-900 font-mono">{totalVolume.toLocaleString()} USDT</span>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded border border-slate-300">
            <span className="text-slate-500">عمولات الوكلاء:</span>{' '}
            <span className="font-bold text-slate-900 font-mono">{totalCommission.toLocaleString()} USDT</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <input
          id="withdrawal-history-search"
          type="text"
          placeholder="بحث بالمعرف، اسم المستخدم، محفظة السحب، الوكيل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[240px] px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
        />

        <select
          id="withdrawal-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="All">جميع الحالات</option>
          <option value="Approved">مقبول (Approved)</option>
          <option value="Rejected">مرفوض (Rejected)</option>
        </select>

        <select
          id="withdrawal-agent-filter"
          value={selectedAgentFilter}
          onChange={(e) => setSelectedAgentFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded bg-white"
        >
          <option value="All">جميع الوكلاء</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <span className="text-slate-500 font-medium ml-auto">
          العدد: {filteredWithdrawals.length} عملية
        </span>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-right">رقم العملية (ID)</th>
                <th className="p-3 text-right">المستخدم / العميل</th>
                <th className="p-3 text-right">المبلغ (USDT)</th>
                <th className="p-3 text-right">عنوان السحب (Destination)</th>
                <th className="p-3 text-right">محفظة الخصم</th>
                <th className="p-3 text-right">الوكيل المنفذ</th>
                <th className="p-3 text-right">العمولة</th>
                <th className="p-3 text-right">وقت الإنشاء</th>
                <th className="p-3 text-right">وقت المعالجة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    لا توجد عمليات سحب مطابقة للفلاتر المحددة.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{tx.id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{tx.userFullName || 'مستخدم مباشر'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.userId || 'N/A'}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{tx.amount.toLocaleString()} USDT</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px] max-w-[140px] truncate">
                      {tx.customerPayoutAddress || tx.customerAddress || tx.userPhone || 'N/A'}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{tx.sourceWalletId || 'N/A'}</td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800">{tx.subagentName || 'النظام المركزي'}</span>
                    </td>
                    <td className="p-3 font-mono text-emerald-700 font-semibold">
                      +{tx.commissionEarned ? tx.commissionEarned.toFixed(2) : '0.00'} USDT
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{tx.dateOfCreation || 'N/A'}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{tx.timeOfProcessing || 'N/A'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status === 'Approved' ? 'معتمد' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        id={`inspect-withdrawal-${tx.id}`}
                        onClick={() => setInspectingTransaction(tx)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
