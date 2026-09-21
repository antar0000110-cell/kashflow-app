import React, { useState } from 'react';
import { Breadcrumb } from '../common/Breadcrumb';
import { StatusBadge } from '../common/StatusBadge';
import { PaginationBar } from '../common/PaginationBar';
import {
  Search,
  Eye,
  CheckCircle2,
  MessageSquare,
  Plus,
  AlertCircle,
  FileQuestion,
  XCircle,
  Send,
  User,
  Clock,
  Check
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { formatCairoTime } from '../../utils/cairoTime';
import { useAppStore } from '../../store/useAppStore';

interface ComplaintTicket {
  id: string;
  ticketId: string;
  agentId: string;
  agentName: string;
  customerName: string;
  walletNumber: string;
  subject: string;
  category: 'Missing Balance Credit' | 'Receipt Mismatch' | 'OTP Delay' | 'Wallet Daily Limit' | 'Other Inquiry';
  amount: number;
  currency: string;
  status: 'Pending' | 'Under Investigation' | 'Approved' | 'Rejected';
  createdAt: string;
  description: string;
  adminNotes?: string;
}

export const PaymentQueriesView: React.FC<{ isAgentMode?: boolean }> = ({ isAgentMode = false }) => {
  const { agents, selectedAgentId, addNotification } = useAppStore();
  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Initial tickets list
  const [tickets, setTickets] = useState<ComplaintTicket[]>([
    {
      id: 'PQ-9041',
      ticketId: 'TCK-88192',
      agentId: 'AGT-01',
      agentName: 'Agent Ahmed (Operations)',
      customerName: 'Mohamed Tarek Hassan',
      walletNumber: 'TSa9281hG82ks901847192',
      subject: 'Delay in TRC20 network confirmation for inbound transfer',
      category: 'Missing Balance Credit',
      amount: 500,
      currency: 'USDT',
      status: 'Under Investigation',
      createdAt: '2026-09-19 11:45:00',
      description: 'Customer transferred from personal wallet at 11:40. Network node sync delayed. TxHash verified.',
      adminNotes: 'Contacting TRC20 gateway node for instant reconciliation.',
    },
    {
      id: 'PQ-9042',
      ticketId: 'TCK-88193',
      agentId: 'AGT-02',
      agentName: 'Agent Mohamed (Delta Hub)',
      customerName: 'Sarah Samir Zaki',
      walletNumber: 'TX5z81pA92ks891047192',
      subject: 'TRC20 transaction hash verification and manual ledger check',
      category: 'Receipt Mismatch',
      amount: 1200,
      currency: 'USDT',
      status: 'Pending',
      createdAt: '2026-09-19 12:10:00',
      description: 'TRC20 TxHash: 8492019482. Ledger check required for automatic clearance.',
    },
    {
      id: 'PQ-9043',
      ticketId: 'TCK-88195',
      agentId: 'AGT-03',
      agentName: 'Agent Sarah (Cairo Express)',
      customerName: 'Khaled Omar Mostafa',
      walletNumber: 'TY7x902rT91ks892019482',
      subject: 'Wallet Daily Limit Threshold Inquiry',
      category: 'Wallet Daily Limit',
      amount: 3500,
      currency: 'USDT',
      status: 'Approved',
      createdAt: '2026-09-19 10:20:00',
      description: 'Requested limit extension on primary wallet node for today.',
      adminNotes: 'Limit raised to 60,000 USDT.',
    }
  ]);

  // Form State for new complaint
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<ComplaintTicket['category']>('Missing Balance Credit');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newWalletNumber, setNewWalletNumber] = useState('');
  const [newAmount, setNewAmount] = useState<number>(500);
  const [newDescription, setNewDescription] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter based on role
  const displayedTickets = tickets.filter((t) => {
    if (isAgentMode && t.agentId !== currentAgent?.id) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (
      filterQuery &&
      !t.subject.toLowerCase().includes(filterQuery.toLowerCase()) &&
      !t.customerName.toLowerCase().includes(filterQuery.toLowerCase()) &&
      !t.ticketId.toLowerCase().includes(filterQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newDescription) return;

    const newTicket: ComplaintTicket = {
      id: `PQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ticketId: `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
      agentId: currentAgent?.id || 'AGT-01',
      agentName: currentAgent?.name || 'Agent Workspace',
      customerName: newCustomerName || 'Client Order',
      walletNumber: newWalletNumber || 'TSa9281hG82ks901847192',
      subject: newSubject,
      category: newCategory,
      amount: Number(newAmount),
      currency: 'USDT',
      status: 'Pending',
      createdAt: formatCairoTime(new Date()),
      description: newDescription,
    };

    setTickets([newTicket, ...tickets]);
    setSubmitSuccess(true);

    addNotification({
      title: `Support Complaint Raised: ${newTicket.ticketId}`,
      message: `[${newTicket.agentName}] raised ticket: "${newSubject}"`,
      type: 'info',
      targetSection: 'payment-queries',
    });

    setTimeout(() => {
      setSubmitSuccess(false);
      setIsSubmitModalOpen(false);
      setNewSubject('');
      setNewDescription('');
      setNewCustomerName('');
      setNewWalletNumber('');
    }, 1200);
  };

  const handleUpdateStatus = (ticketId: string, status: ComplaintTicket['status'], note: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === ticketId ? { ...t, status, adminNotes: note || t.adminNotes } : t
      )
    );
    setSelectedTicket(null);
  };

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb
        items={[
          { label: 'Bank Transfers', section: 'banks' },
          { label: isAgentMode ? 'Agent Support & Complaints' : 'Payment Queries & Fraud Claims' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#8B1E2D]" />
            <span>
              {isAgentMode
                ? 'Agent Support Complaints & Discrepancies'
                : 'Customer Claims & Support Inquiries'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAgentMode
              ? 'Raise official complaints regarding delayed transactions, proof mismatches, or wallet limits.'
              : 'Review and resolve agent complaints and customer reconciliation requests.'}
          </p>
        </div>

        {isAgentMode && (
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New Complaint</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search by Ticket ID, Customer, or Subject..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {displayedTickets.length} ticket(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                <th className="py-2.5 px-3 font-semibold text-[11px]">Ticket ID</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Category</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Subject</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Customer</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Amount</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-center">Status</th>
                {!isAgentMode && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Agent</th>
                )}
                <th className="py-2.5 px-3 font-semibold text-[11px]">Cairo Created At</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No tickets matching current filters.
                  </td>
                </tr>
              ) : (
                displayedTickets.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{item.ticketId}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium max-w-xs truncate">{item.subject}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.customerName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#8B1E2D]">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    {!isAgentMode && (
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{item.agentName}</td>
                    )}
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{item.createdAt}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedTicket(item)}
                        className="p-1 rounded text-slate-600 hover:text-white hover:bg-[#8B1E2D] transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Complaint Modal (Agent-Only) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#8B1E2D]" />
                <span>Raise Official Complaint / Ticket</span>
              </h3>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Issue Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="Missing Balance Credit">Missing Balance Credit / Telecom SMS Delay</option>
                  <option value="Receipt Mismatch">Customer Receipt Mismatch</option>
                  <option value="OTP Delay">OTP Generation Delay</option>
                  <option value="Wallet Daily Limit">Wallet Daily Limit Increase Request</option>
                  <option value="Other Inquiry">Other Technical Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Complaint Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delayed network confirmation for 500 USDT transfer"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Tarek Mahmoud"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Disputed Amount (USDT)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Wallet ID</label>
                <input
                  type="text"
                  placeholder="e.g. TSa9281hG82ks901847192"
                  value={newWalletNumber}
                  onChange={(e) => setNewWalletNumber(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Detailed Description / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what happened, including exact time and transaction IDs..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitSuccess}
                  className={`px-4 py-1.5 rounded text-xs font-semibold text-white shadow-2xs flex items-center gap-1 transition-all ${
                    submitSuccess ? 'bg-emerald-600' : 'bg-[#8B1E2D] hover:bg-[#721825]'
                  }`}
                >
                  {submitSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Ticket Submitted!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-mono text-xs text-slate-500">{selectedTicket.ticketId}</span>
                <h3 className="font-bold text-sm text-slate-900">{selectedTicket.subject}</h3>
              </div>
              <StatusBadge status={selectedTicket.status} />
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Agent:</span>
                <span className="font-semibold text-slate-900">{selectedTicket.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedTicket.customerName} ({selectedTicket.walletNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-[#8B1E2D]">{formatCurrency(selectedTicket.amount, selectedTicket.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted (Cairo):</span>
                <span className="font-mono text-slate-700">{selectedTicket.createdAt}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800 leading-relaxed">
                {selectedTicket.description}
              </div>
            </div>

            {selectedTicket.adminNotes && (
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">Admin Resolution Note</label>
                <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900">
                  {selectedTicket.adminNotes}
                </div>
              </div>
            )}

            {/* Admin Resolution Buttons (Admin only) */}
            {!isAgentMode && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.ticketId, 'Under Investigation', 'Investigating with telecom carrier')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-semibold"
                >
                  Mark Under Investigation
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.ticketId, 'Approved', 'Reconciliation approved and balance adjusted')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                >
                  Approve & Reconcile
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.ticketId, 'Rejected', 'Invalid claim based on statement')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                >
                  Reject Claim
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
