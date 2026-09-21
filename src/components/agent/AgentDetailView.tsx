import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const AgentDetailView: React.FC = () => {
  const {
    agents,
    selectedAgentDetailId,
    setSelectedAgentDetailId,
    setActiveSection,
    depositHistory,
    withdrawalHistory,
    wallets,
    agentDepositRequests,
    toggleAgentTraffic,
    setInspectingTransaction,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'wallets' | 'collateral'>('deposits');

  const agent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentDetailId);
  }, [agents, selectedAgentDetailId]);

  if (!agent) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">لم يتم العثور على الوكيل المحدد</h2>
        <p className="text-xs text-slate-500">يرجى اختيار وكيل من قائمة إدارة الوكلاء</p>
        <button
          onClick={() => setActiveSection('agent-management')}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded"
        >
          العودة لقائمة الوكلاء
        </button>
      </div>
    );
  }

  const agentDeposits = depositHistory.filter(
    (tx) => tx.subagentId === agent.id || tx.subagentName === agent.name
  );
  const agentWithdrawals = withdrawalHistory.filter(
    (tx) => tx.subagentId === agent.id || tx.subagentName === agent.name
  );
  const assignedWallets = wallets.filter(
    (w) => w.assignedAgentId === agent.id || w.agentId === agent.id
  );
  const agentRequests = agentDepositRequests.filter(
    (r) => r.agentId === agent.id
  );

  const totalDepositVol = agentDeposits.reduce((acc, t) => acc + (t.status === 'Approved' ? t.amount : 0), 0);
  const totalWithdrawalVol = agentWithdrawals.reduce((acc, t) => acc + (t.status === 'Approved' ? t.amount : 0), 0);
  const totalCommissionEarned =
    agentDeposits.reduce((acc, t) => acc + (t.commissionEarned || 0), 0) +
    agentWithdrawals.reduce((acc, t) => acc + (t.commissionEarned || 0), 0);

  return (
    <div id="agent-detail-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setSelectedAgentDetailId(null);
              setActiveSection('agent-management');
            }}
            className="text-slate-500 hover:text-slate-900 font-semibold"
          >
            إدارة الوكلاء
          </button>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-900">ملف الوكيل: {agent.name}</span>
        </div>

        <button
          onClick={() => {
            setSelectedAgentDetailId(null);
            setActiveSection('agent-management');
          }}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
        >
          عودة للقائمة
        </button>
      </div>

      {/* Agent Summary Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900">{agent.name}</h1>
              <span className="text-[11px] font-mono text-slate-500 font-normal">({agent.username})</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  agent.trafficActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {agent.trafficActive ? 'ترافيك نشط' : 'ترافيك متوقف'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">ID: {agent.id} | المحفظة: {agent.payoutAddress || agent.depositAddress || 'USDT TRC20 غير محددة'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleAgentTraffic(agent.id)}
              className={`px-4 py-2 text-xs font-bold rounded transition ${
                agent.trafficActive
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {agent.trafficActive ? 'إيقاف استقبال الطلبات (Pause)' : 'تشغيل استقبال الطلبات (Resume)'}
            </button>
          </div>
        </div>

        {/* Financial Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">الرصيد المتاح (Liquidity)</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {agent.currentBalance.toLocaleString()} USDT
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">حد التأمين (Deposit Cap)</div>
            <div className="text-base font-bold font-mono text-amber-700 mt-0.5">
              {(agent.insuranceDeposit || agent.securityDeposit || 0).toLocaleString()} USDT
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">رصيد الأرباح القابل للسحب</div>
            <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
              {(agent.profitBalance || 0).toLocaleString()} USDT
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">إجمالي الإيداعات المنفذة</div>
            <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
              {totalDepositVol.toLocaleString()} USDT
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">إجمالي السحوبات المنفذة</div>
            <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
              {totalWithdrawalVol.toLocaleString()} USDT
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">إجمالي العمولات المكتسبة</div>
            <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
              +{totalCommissionEarned.toFixed(2)} USDT
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-1 bg-white p-1 rounded-t-lg">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded transition ${
            activeTab === 'deposits'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل الإيداعات ({agentDeposits.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded transition ${
            activeTab === 'withdrawals'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل السحوبات ({agentWithdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded transition ${
            activeTab === 'wallets'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          المحافظ المرتبطة ({assignedWallets.length})
        </button>
        <button
          onClick={() => setActiveTab('collateral')}
          className={`px-4 py-2 rounded transition ${
            activeTab === 'collateral'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          طلبات شحن التأمين ({agentRequests.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg border border-slate-200 p-4 shadow-sm">
        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-right">رقم العملية</th>
                  <th className="p-3 text-right">العميل</th>
                  <th className="p-3 text-right">المبلغ (USDT)</th>
                  <th className="p-3 text-right">المحفظة المستلمة</th>
                  <th className="p-3 text-right">العمولة</th>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {agentDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      لا توجد عمليات إيداع مسجلة لهذا الوكيل حتى الآن.
                    </td>
                  </tr>
                ) : (
                  agentDeposits.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{tx.id}</td>
                      <td className="p-3 font-medium">{tx.userFullName || 'مستخدم مباشر'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{tx.amount.toLocaleString()} USDT</td>
                      <td className="p-3 font-mono text-slate-600">{tx.targetWalletId || 'N/A'}</td>
                      <td className="p-3 font-mono text-emerald-700 font-semibold">
                        +{tx.commissionEarned ? tx.commissionEarned.toFixed(2) : '0.00'} USDT
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{tx.dateOfCreation || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.status === 'Approved' ? 'معتمد' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setInspectingTransaction(tx)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
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
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-right">رقم العملية</th>
                  <th className="p-3 text-right">العميل</th>
                  <th className="p-3 text-right">المبلغ (USDT)</th>
                  <th className="p-3 text-right">عنوان السحب</th>
                  <th className="p-3 text-right">العمولة</th>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {agentWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      لا توجد عمليات سحب مسجلة لهذا الوكيل حتى الآن.
                    </td>
                  </tr>
                ) : (
                  agentWithdrawals.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{tx.id}</td>
                      <td className="p-3 font-medium">{tx.userFullName || 'مستخدم مباشر'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{tx.amount.toLocaleString()} USDT</td>
                      <td className="p-3 font-mono text-slate-600 text-[11px] max-w-[150px] truncate">
                        {tx.customerPayoutAddress || tx.customerAddress || 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-semibold">
                        +{tx.commissionEarned ? tx.commissionEarned.toFixed(2) : '0.00'} USDT
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{tx.dateOfCreation || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.status === 'Approved' ? 'معتمد' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setInspectingTransaction(tx)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
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
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-right">رقم المحفظة / العنوان</th>
                  <th className="p-3 text-right">الشبكة / المزود</th>
                  <th className="p-3 text-right">الرصيد الحالي</th>
                  <th className="p-3 text-right">الحد اليومي</th>
                  <th className="p-3 text-right">المحول اليوم</th>
                  <th className="p-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {assignedWallets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      لا توجد محافظ مخصصة لهذا الوكيل حالياً.
                    </td>
                  </tr>
                ) : (
                  assignedWallets.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{w.walletNumber}</td>
                      <td className="p-3">{w.provider || 'TRC20 Network'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{w.balance.toLocaleString()} USDT</td>
                      <td className="p-3 font-mono text-slate-600">{w.dailySendLimit.toLocaleString()} USDT</td>
                      <td className="p-3 font-mono text-slate-600">{w.todaySent.toLocaleString()} USDT</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {w.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Collateral Requests Tab */}
        {activeTab === 'collateral' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-right">رقم الطلب</th>
                  <th className="p-3 text-right">المبلغ المطلوب</th>
                  <th className="p-3 text-right">طريقة الإيداع</th>
                  <th className="p-3 text-right">المرجع (TxID)</th>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {agentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      لا توجد طلبات إيداع تأمين مسجلة لهذا الوكيل.
                    </td>
                  </tr>
                ) : (
                  agentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{req.id}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {(req.requestedAmount || req.amountRequested || 0).toLocaleString()} USDT
                      </td>
                      <td className="p-3">{req.paymentMethod}</td>
                      <td className="p-3 font-mono text-slate-600 text-[11px] max-w-[150px] truncate">
                        {req.txReference || req.referenceNumber || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{req.createdAt || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
