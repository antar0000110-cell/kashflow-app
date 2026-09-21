import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DisputeReport } from '../../types';

export const DisputeManagementView: React.FC = () => {
  const { disputes, resolveDispute, createDispute, agents, wallets } = useAppStore();

  const [selectedDispute, setSelectedDispute] = useState<DisputeReport | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Simulated Test Dispute Injection
  const handleInjectSimulatedDispute = () => {
    const randomAgent = agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)] : null;
    const randomWallet = wallets.length > 0 ? wallets[Math.floor(Math.random() * wallets.length)] : null;
    const amounts = [100, 250, 500, 1200, 2500];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    const testDispute: Omit<DisputeReport, 'id' | 'createdAt'> = {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      agentId: randomAgent ? randomAgent.id : 'agent-central',
      agentName: randomAgent ? randomAgent.name : 'Central Agent',
      userFullName: 'عميل تجريبي (Mismatch Simulated)',
      userPhone: '0100' + Math.floor(1000000 + Math.random() * 9000000),
      expectedWallet: randomWallet ? randomWallet.walletNumber : 'TQjX9P2v7h78QvYvLpA69jTzM5wX84L3dK',
      actualSentWallet: 'TXw8kP1v4a92QzYvLpA69jTzM5wX11L9dZ (Wrong Wallet)',
      expectedAmount: amount,
      receivedAmount: amount,
      currency: 'USDT',
      status: 'Open',
      reason: 'wrong_wallet',
      notes: 'العميل قام بالتحويل على عنوان محفظة قديم/خاطئ غير المحدد في الفاتورة الحالية.',
      proofImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
      dueAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    };

    createDispute(testDispute);
  };

  const filteredDisputes = disputes.filter((d) => {
    if (filterStatus === 'All') return true;
    return d.status === filterStatus;
  });

  const handleResolve = (action: 'refund' | 'credit' | 'reject') => {
    if (!selectedDispute) return;
    resolveDispute(selectedDispute.id, resolutionNote || `Processed action: ${action}`, action);
    setSelectedDispute(null);
    setResolutionNote('');
  };

  return (
    <div id="dispute-management-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة الشكاوى والتحويل الخاطئ (Disputes & Wrong-Wallet Hub)</h1>
          <p className="text-xs text-slate-500 mt-1">
            معالجة نزاعات التحويل إلى محافظ خاطئة أو مطالبات الإيداع المعلقة مع إثباتات الدفع ومهلة الرد (SLA 2h)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="inject-test-dispute-btn"
            onClick={handleInjectSimulatedDispute}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition"
          >
            + محاكاة شكوى إيداع خاطئ (Test Simulation)
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <span className="font-semibold text-slate-700">تصفية حسب الحالة:</span>
        {['All', 'Open', 'UnderReview', 'Resolved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded transition ${
              filterStatus === status
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status === 'All' ? 'الكل' : status}
          </button>
        ))}
        <span className="text-slate-500 ml-auto">العدد: {filteredDisputes.length} شكوى</span>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-right">رقم الشكوى</th>
                <th className="p-3 text-right">رقم الطلب المرتبط</th>
                <th className="p-3 text-right">العميل</th>
                <th className="p-3 text-right">الوكيل المعني</th>
                <th className="p-3 text-right">المبلغ</th>
                <th className="p-3 text-right">المحفظة المستهدفة vs المحولة</th>
                <th className="p-3 text-right">نوع الشكوى</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد شكاوى أو نزاعات مسجلة حالياً.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{d.id}</td>
                    <td className="p-3 font-mono font-medium text-slate-800">{d.orderId}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{d.userFullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.userPhone}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{d.agentName}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{d.receivedAmount} USDT</td>
                    <td className="p-3 font-mono text-[11px]">
                      <div className="text-slate-500 truncate max-w-[150px]">مطلوبة: {d.expectedWallet}</div>
                      <div className="text-rose-600 font-bold truncate max-w-[150px]">محولة: {d.actualSentWallet}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                        {d.reason === 'wrong_wallet' ? 'محفظة خاطئة' : d.reason}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{new Date(d.createdAt).toLocaleTimeString()}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedDispute(d)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                      >
                        مراجعة والبت
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Review Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                مراجعة الشكوى #{selectedDispute.id} (طلب: {selectedDispute.orderId})
              </h2>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">العميل:</span>
                <span className="font-bold text-slate-900">{selectedDispute.userFullName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">المبلغ المدعى:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedDispute.receivedAmount} USDT</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 col-span-2">
                <span className="text-slate-500 block">تفاصيل الخطأ:</span>
                <span className="text-rose-700 font-bold block mt-0.5">
                  تم التحويل على: {selectedDispute.actualSentWallet}
                </span>
                <span className="text-slate-600 block mt-0.5">المطلوبة كانت: {selectedDispute.expectedWallet}</span>
              </div>
            </div>

            {selectedDispute.proofImageUrl && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700">صورة إيصال التحويل المرفقة:</span>
                <img
                  src={selectedDispute.proofImageUrl}
                  alt="Proof"
                  className="w-full h-36 object-cover rounded border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات وقرار الإدارة:</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="اكتب سبب القرار أو تفاصيل التسوية اليدوية..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 h-20"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleResolve('reject')}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
              >
                رفض الشكوى (Reject)
              </button>
              <button
                onClick={() => handleResolve('refund')}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded"
              >
                إرجاع للعميل (Refund)
              </button>
              <button
                onClick={() => handleResolve('credit')}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow"
              >
                اعتماد وإضافة الرصيد للوكيل (Credit & Resolve)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
