import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const Dashboard: React.FC = () => {
  const {
    pendingDeposits,
    pendingWithdrawals,
    depositHistory,
    withdrawalHistory,
    agents,
    wallets,
    disputes,
    setActiveSection,
    confirmDeposit,
    confirmWithdrawal,
    rejectDeposit,
    rejectWithdrawal,
    globalTrafficActive,
    toggleGlobalTraffic,
    setInspectingTransaction,
    setSelectedAgentDetailId,
  } = useAppStore();

  const totalPendingDepositsAmount = pendingDeposits.reduce((acc, t) => acc + t.amount, 0);
  const totalPendingWithdrawalsAmount = pendingWithdrawals.reduce((acc, t) => acc + t.amount, 0);
  const activeAgents = agents.filter((a) => a.trafficActive);
  const totalAgentBalance = agents.reduce((acc, a) => acc + (a.currentBalance || 0), 0);
  const totalInsuranceCollateral = agents.reduce((acc, a) => acc + (a.insuranceDeposit || a.securityDeposit || 0), 0);
  const totalWalletLiquidity = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const openDisputesCount = disputes.filter((d) => d.status === 'Open' || d.status === 'UnderReview').length;

  return (
    <div id="admin-dashboard-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Global Traffic Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">لوحة التحكم الرئيسية (Management OS Dashboard)</h1>
          <p className="text-xs text-slate-500 mt-1">
            نظام إدارة وتوزيع السيولة والعمليات بين الوكلاء والمحافظ وتطبيق الموبايل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-global-traffic-btn"
            onClick={toggleGlobalTraffic}
            className={`px-4 py-2 text-xs font-bold rounded transition border ${
              globalTrafficActive
                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
            }`}
          >
            {globalTrafficActive ? 'الترافيك العام: يعمل (Active)' : 'الترافيك العام: متوقف (Paused)'}
          </button>
        </div>
      </div>

      {/* 3 Main Sections Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SECTION 1: WALLETS */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">قسم المحافظ</span>
            <button
              onClick={() => setActiveSection('wallet-pool')}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">إجمالي المحافظ:</span>
              <span className="font-bold text-slate-900 font-mono">{wallets.length} محفظة</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">المحافظ المخصصة للوكلاء:</span>
              <span className="font-bold text-slate-900 font-mono">
                {wallets.filter((w) => w.assignedAgentId || w.agentId).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">إجمالي رصيد المحافظ:</span>
              <span className="font-bold text-slate-900 font-mono">{totalWalletLiquidity.toLocaleString()} USDT</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setActiveSection('wallet-pool')}
              className="py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition text-center cursor-pointer"
            >
              مجمع المحافظ
            </button>
            <button
              onClick={() => setActiveSection('mobile-apk-wallet')}
              className="py-1.5 text-xs font-bold text-[#8B1E2D] bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition text-center cursor-pointer"
            >
              فتح UZX Wallet
            </button>
          </div>
        </div>

        {/* SECTION 2: AGENTS */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">قسم الوكلاء</span>
            <button
              onClick={() => setActiveSection('agent-management')}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">إجمالي الوكلاء:</span>
              <span className="font-bold text-slate-900 font-mono">{agents.length} وكيل</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الوكلاء النشطون (Traffic ON):</span>
              <span className="font-bold text-emerald-700 font-mono">{activeAgents.length} وكيل</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">إجمالي السيولة المودعة:</span>
              <span className="font-bold text-slate-900 font-mono">{totalAgentBalance.toLocaleString()} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">إجمالي حد التأمين المحجوز:</span>
              <span className="font-bold text-amber-700 font-mono">{totalInsuranceCollateral.toLocaleString()} USDT</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setActiveSection('agent-management')}
              className="py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition text-center cursor-pointer"
            >
              إدارة الوكلاء
            </button>
            <button
              onClick={() => setActiveSection('agent-mobile-app')}
              className="py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition text-center cursor-pointer"
            >
              Management OS
            </button>
          </div>
        </div>

        {/* SECTION 3: OPERATIONS & DISPUTES */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">قسم العمليات والشكاوى</span>
            <button
              onClick={() => setActiveSection('disputes')}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              مركز الشكاوى
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">طلبات الإيداع المعلقة:</span>
              <span className="font-bold text-slate-900 font-mono">
                {pendingDeposits.length} ({totalPendingDepositsAmount.toLocaleString()} USDT)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">طلبات السحب المعلقة:</span>
              <span className="font-bold text-slate-900 font-mono">
                {pendingWithdrawals.length} ({totalPendingWithdrawalsAmount.toLocaleString()} USDT)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الشكاوى المفتوحة (Disputes):</span>
              <span className={`font-bold font-mono ${openDisputesCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {openDisputesCount} شكوى
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setActiveSection('deposit-history')}
              className="py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition text-center"
            >
              سجل الإيداعات
            </button>
            <button
              onClick={() => setActiveSection('withdrawal-history')}
              className="py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition text-center"
            >
              سجل السحوبات
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Pending Deposits Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase">طلبات الإيداع قيد الانتظار (Pending Deposits)</h2>
            <span className="text-[11px] text-slate-500">مطلوب التحقق والاعتماد لإضافة الرصيد للعميل والمحفظة</span>
          </div>
          <button
            onClick={() => setActiveSection('pending-deposits')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
          >
            عرض الكل ({pendingDeposits.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-right">رقم الطلب</th>
                <th className="p-3 text-right">العميل</th>
                <th className="p-3 text-right">المبلغ</th>
                <th className="p-3 text-right">المحفظة المستلمة</th>
                <th className="p-3 text-right">الوكيل المسؤول</th>
                <th className="p-3 text-right">الوقت</th>
                <th className="p-3 text-center">الإجراءات المباشرة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {pendingDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    لا توجد طلبات إيداع معلقة حالياً.
                  </td>
                </tr>
              ) : (
                pendingDeposits.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{tx.id}</td>
                    <td className="p-3 font-medium">{tx.userFullName || 'مستخدم مباشر'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{tx.amount.toLocaleString()} USDT</td>
                    <td className="p-3 font-mono text-slate-600">{tx.targetWalletId || 'N/A'}</td>
                    <td className="p-3 font-medium text-slate-800">{tx.subagentName || 'مركزي'}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{tx.dateOfCreation || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => confirmDeposit(tx.id, undefined, 'Admin', 'admin')}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                        >
                          اعتماد
                        </button>
                        <button
                          onClick={() => rejectDeposit(tx.id, 'Unverified funds', 'Admin', 'admin')}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                        >
                          رفض
                        </button>
                        <button
                          onClick={() => setInspectingTransaction(tx)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                        >
                          فحص
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Pending Withdrawals Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase">طلبات السحب وصرف الأموال (Pending Withdrawals)</h2>
            <span className="text-[11px] text-slate-500">يتطلب رصيد متاح أعلى من حد التأمين لدى الوكيل للتأكيد</span>
          </div>
          <button
            onClick={() => setActiveSection('pending-withdrawals')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
          >
            عرض الكل ({pendingWithdrawals.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-right">رقم الطلب</th>
                <th className="p-3 text-right">العميل</th>
                <th className="p-3 text-right">المبلغ</th>
                <th className="p-3 text-right">عنوان السحب (USDT TRC20)</th>
                <th className="p-3 text-right">الوكيل المنفذ</th>
                <th className="p-3 text-right">الوقت</th>
                <th className="p-3 text-center">الإجراءات المباشرة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {pendingWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    لا توجد طلبات سحب معلقة حالياً.
                  </td>
                </tr>
              ) : (
                pendingWithdrawals.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{tx.id}</td>
                    <td className="p-3 font-medium">{tx.userFullName || 'مستخدم مباشر'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{tx.amount.toLocaleString()} USDT</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px] max-w-[150px] truncate">
                      {tx.customerPayoutAddress || tx.customerAddress || 'N/A'}
                    </td>
                    <td className="p-3 font-medium text-slate-800">{tx.subagentName || 'مركزي'}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{tx.dateOfCreation || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => confirmWithdrawal(tx.id, 'Admin', 'admin')}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                        >
                          تأكيد وصرف
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(tx.id, 'Invalid address / balance', 'Admin', 'admin')}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                        >
                          رفض
                        </button>
                        <button
                          onClick={() => setInspectingTransaction(tx)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                        >
                          فحص
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agents Quick Roster */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase">قائمة الوكلاء وحالة الترافيك والسيولة</h2>
          </div>
          <button
            onClick={() => setActiveSection('agent-management')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
          >
            إدارة الوكلاء ({agents.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-right">اسم الوكيل</th>
                <th className="p-3 text-right">الرصيد المتاح (USDT)</th>
                <th className="p-3 text-right">حد التأمين المحجوز</th>
                <th className="p-3 text-right">أرباح العمولات</th>
                <th className="p-3 text-right">المحافظ المربوطة</th>
                <th className="p-3 text-right">حالة الترافيك</th>
                <th className="p-3 text-center">الملف الفردي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    لا يوجد وكلاء مسجلون حالياً.
                  </td>
                </tr>
              ) : (
                agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{a.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.username}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{a.currentBalance.toLocaleString()} USDT</td>
                    <td className="p-3 font-mono text-amber-700 font-semibold">
                      {(a.insuranceDeposit || a.securityDeposit || 0).toLocaleString()} USDT
                    </td>
                    <td className="p-3 font-mono text-emerald-700 font-semibold">
                      +{(a.profitBalance || 0).toLocaleString()} USDT
                    </td>
                    <td className="p-3 font-mono text-slate-700">{a.assignedWalletCount || 0} محفظة</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.trafficActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.trafficActive ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedAgentDetailId(a.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                      >
                        عرض ملف الوكيل
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
