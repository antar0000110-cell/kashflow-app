import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Copy,
  Check,
  User,
  Smartphone,
  Building2,
  Layers,
  FileText,
  AlertTriangle,
  ArrowRightLeft,
  Printer,
  ExternalLink
} from 'lucide-react';
import { Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { formatCairoTime, getRemainingSlaSeconds, formatSecondsToCountdown } from '../../utils/cairoTime';

interface OrderDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ transaction, onClose }) => {
  const {
    confirmDeposit,
    rejectDeposit,
    confirmWithdrawal,
    rejectWithdrawal,
    holdWithdrawal,
    reassignOrder,
    agents
  } = useAppStore();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [reassignMode, setReassignMode] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Payment reference mismatch with mobile banking ledger');
  const [remainingSla, setRemainingSla] = useState(0);

  useEffect(() => {
    if (!transaction) return;
    setRemainingSla(getRemainingSlaSeconds(transaction.expiresAt));

    const timer = setInterval(() => {
      setRemainingSla(getRemainingSlaSeconds(transaction.expiresAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction]);

  if (!transaction) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirm = () => {
    if (transaction.type === 'deposit') {
      confirmDeposit(transaction.id);
    } else {
      confirmWithdrawal(transaction.id);
    }
    onClose();
  };

  const handleRejectSubmit = () => {
    if (transaction.type === 'deposit') {
      rejectDeposit(transaction.id, rejectionReason);
    } else {
      rejectWithdrawal(transaction.id, rejectionReason);
    }
    onClose();
  };

  const handleReassignSubmit = () => {
    if (!selectedAgentId) return;
    reassignOrder(transaction.id, selectedAgentId);
    onClose();
  };

  const isPending = transaction.status === 'Pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#1E293B]">
        {/* Header */}
        <div className="bg-[#1E293B] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#8B1E2D] flex items-center justify-center text-white font-mono font-bold text-xs shadow-inner">
              ORD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono tracking-wide">{transaction.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    transaction.type === 'deposit'
                      ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                      : 'bg-amber-900/80 text-amber-200 border border-amber-700'
                  }`}
                >
                  {transaction.type}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    transaction.status === 'Approved'
                      ? 'bg-emerald-600 text-white'
                      : transaction.status === 'Pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-mono mt-0.5">
                Real-Time Cairo: {transaction.dateOfCreation || formatCairoTime(transaction.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* SLA Alert Strip if pending */}
          {isPending && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded p-2.5 text-amber-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">Auto-Cancellation SLA Countdown:</span>
              </div>
              <span className="font-mono font-bold text-xs bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">
                {formatSecondsToCountdown(remainingSla)}
              </span>
            </div>
          )}

          {/* Amount Hero Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <span className="text-gray-500 text-[11px] block font-medium">Order Financial Value</span>
              <div className="text-2xl font-bold font-mono text-[#8B1E2D] tracking-tight mt-0.5">
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
              <span className="text-[10px] text-gray-400">Gateway Fee: 0.00 EGP (Net: {formatCurrency(transaction.amount, transaction.currency)})</span>
            </div>

            <div className="text-right">
              <span className="text-gray-500 text-[11px] block font-medium">Target Provider</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800 mt-1 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-[#8B1E2D]" />
                {transaction.provider || transaction.bankName}
              </span>
            </div>
          </div>

          {/* Customer & Wallet Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Customer Spec */}
            <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold border-b border-slate-100 pb-1.5">
                <User className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span>Customer & Sender Profile</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Customer Name:</span>
                  <span className="font-medium text-slate-900">{transaction.userFullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">User ID:</span>
                  <span className="font-mono text-slate-700">{transaction.userId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Sender Phone / Wallet:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-900">{transaction.phone || transaction.targetWalletId || '-'}</span>
                    {transaction.phone && (
                      <button
                        onClick={() => handleCopy(transaction.phone!, 'phone')}
                        className="text-gray-400 hover:text-[#8B1E2D] p-0.5"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subagent Spec */}
            <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold border-b border-slate-100 pb-1.5">
                <Shield className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span>Assigned Operations Subagent</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Agent Name:</span>
                  <span className="font-medium text-slate-900">{transaction.subagentName || 'Central Operations'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Agent ID:</span>
                  <span className="font-mono text-slate-700">{transaction.subagentId || 'SYSTEM'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Routing Terminal:</span>
                  <span className="font-mono text-emerald-700 font-medium">LIVE AUTOMATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Proof & Notes */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <FileText className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span>Payment Reference & Cryptographic Audit Hash</span>
              </div>
              {transaction.referenceHash && (
                <button
                  onClick={() => handleCopy(transaction.referenceHash!, 'hash')}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#8B1E2D]"
                >
                  {copiedField === 'hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Hash</span>
                </button>
              )}
            </div>

            <div className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded border border-slate-200 select-all leading-relaxed whitespace-pre-wrap">
              {transaction.userInfo}
            </div>
          </div>

          {/* Rejection Input Box if triggered */}
          {rejectMode && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-2 animate-in fade-in">
              <label className="block font-semibold text-rose-900 text-xs">
                Specify Official Rejection Reason:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-rose-300 rounded text-xs focus:ring-1 focus:ring-rose-500 bg-white"
                rows={2}
                placeholder="Enter rejection justification..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectMode(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  className="px-3 py-1 bg-rose-700 text-white rounded text-xs font-semibold hover:bg-rose-800"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Reassign Agent Dropdown */}
          {reassignMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-2 animate-in fade-in">
              <label className="block font-semibold text-blue-900 text-xs">
                Select New Subagent for Order Reassignment:
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded text-xs bg-white"
              >
                <option value="">-- Choose Target Agent --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id}) - Current Balance: {formatCurrency(a.currentBalance, 'EGP')}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setReassignMode(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignSubmit}
                  disabled={!selectedAgentId}
                  className="px-3 py-1 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  Transfer Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(JSON.stringify(transaction, null, 2), 'json')}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5"
            >
              {copiedField === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy JSON Audit</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isPending ? (
              <>
                <button
                  onClick={() => {
                    setReassignMode(!reassignMode);
                    setRejectMode(false);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium text-xs flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Reassign</span>
                </button>

                {transaction.type === 'withdrawal' && (
                  <button
                    onClick={() => {
                      holdWithdrawal(transaction.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 font-semibold text-xs"
                  >
                    Put on Hold
                  </button>
                )}

                <button
                  onClick={() => {
                    setRejectMode(!rejectMode);
                    setReassignMode(false);
                  }}
                  className="px-3 py-1.5 bg-rose-700 text-white rounded hover:bg-rose-800 font-semibold text-xs flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={handleConfirm}
                  className="px-4 py-1.5 bg-[#8B1E2D] text-white rounded hover:bg-[#721825] font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Credit Balance</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-700 text-white rounded text-xs hover:bg-slate-800"
              >
                Close Inspector
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
