import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  PauseCircle,
  ArrowRightLeft
} from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { StatusBadge } from '../common/StatusBadge';
import { PaginationBar } from '../common/PaginationBar';
import { ColumnSettingsDrawer, ColumnDefinition } from '../common/ColumnSettingsDrawer';
import { useAppStore } from '../../store/useAppStore';
import { Transaction } from '../../types';
import { formatCurrency, formatProcessingTime } from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { formatCairoTime } from '../../utils/cairoTime';

export const PendingWithdrawalsView: React.FC = () => {
  const {
    pendingWithdrawals,
    confirmWithdrawal,
    rejectWithdrawal,
    holdWithdrawal,
    autoUpdateEnabled,
    setAutoUpdateEnabled,
    agents,
    setInspectingTransaction,
  } = useAppStore();

  const [dateFilter, setDateFilter] = useState('2026-09');
  const [filterId, setFilterId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterPartner, setFilterPartner] = useState('all');

  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { key: 'confirm', label: 'Action', visible: true },
    { key: 'amount', label: 'Amount (EGP)', visible: true },
    { key: 'processingTime', label: 'Time Elapsed', visible: true },
    { key: 'userInfo', label: 'Destination Details', visible: true },
    { key: 'transactionId', label: 'Order ID', visible: true },
    { key: 'userId', label: 'User ID', visible: true },
    { key: 'provider', label: 'Provider', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'agent', label: 'Assigned Subagent', visible: true },
    { key: 'dateOfCreation', label: 'Cairo Creation Time', visible: true },
    { key: 'actions', label: 'Hold / Reject / Inspect', visible: true },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [selectedTxForConfirm, setSelectedTxForConfirm] = useState<Transaction | null>(null);
  const [selectedTxForReject, setSelectedTxForReject] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('Insufficient agent cash balance or wallet limit reached');

  const handleColumnToggle = (key: string, visible: boolean) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible } : c)));
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  const filteredData = useMemo(() => {
    return pendingWithdrawals.filter((tx) => {
      if (filterId && !tx.id.toLowerCase().includes(filterId.toLowerCase())) return false;
      if (filterUserId && !tx.userId.toLowerCase().includes(filterUserId.toLowerCase())) return false;
      if (filterProvider !== 'all' && tx.provider !== filterProvider) return false;
      if (filterPartner !== 'all' && tx.subagentId !== filterPartner) return false;
      return true;
    });
  }, [pendingWithdrawals, filterId, filterUserId, filterProvider, filterPartner]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const resetFilters = () => {
    setFilterId('');
    setFilterUserId('');
    setFilterProvider('all');
    setFilterPartner('all');
    setCurrentPage(1);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4">
      <Breadcrumb
        items={[
          { label: 'Bank Transfers', section: 'banks' },
          { label: 'Pending Withdrawals Queue' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pending Withdrawal Requests</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-xs font-mono font-bold">
              {pendingWithdrawals.length}
            </span>
          </h1>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Real-time payout queue. Dispatched payouts deduct directly from assigned agent collateral and wallet balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded border border-slate-300 shadow-2xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoUpdateEnabled}
              onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
              className="rounded text-[#8B1E2D] focus:ring-[#8B1E2D]"
            />
            <span className="font-medium">Auto-Update</span>
          </label>

          <button
            onClick={() => setIsColumnSettingsOpen(true)}
            className="px-2.5 py-1.5 text-xs bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs font-medium"
          >
            Columns
          </button>

          <button
            onClick={() => exportToCSV(filteredData, `pending_withdrawals_${Date.now()}`)}
            className="px-2.5 py-1.5 text-xs bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded border border-slate-200 shadow-2xs space-y-3">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-[#8B1E2D]" />
          <span>Withdrawal Queue Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Date</label>
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Order ID</label>
            <input
              type="text"
              placeholder="e.g. TX-WD-8810"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="w-full h-7 px-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs"
            >
              <option value="all">All Providers</option>
              <option value="Vodafone Cash">Vodafone Cash</option>
              <option value="InstaPay">InstaPay</option>
              <option value="Orange Cash">Orange Cash</option>
              <option value="Etisalat Cash">Etisalat Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Subagent</label>
            <select
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
              className="w-full h-7 px-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs"
            >
              <option value="all">All Subagents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                {isColVisible('confirm') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px] w-20 text-center">Dispatch</th>
                )}
                {isColVisible('amount') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Amount</th>
                )}
                {isColVisible('processingTime') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Elapsed Time</th>
                )}
                {isColVisible('userInfo') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px] min-w-[200px]">Destination Info</th>
                )}
                {isColVisible('transactionId') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Order ID</th>
                )}
                {isColVisible('userId') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">User ID</th>
                )}
                {isColVisible('provider') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Provider</th>
                )}
                {isColVisible('status') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px] text-center">Status</th>
                )}
                {isColVisible('agent') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Assigned Agent</th>
                )}
                {isColVisible('dateOfCreation') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Cairo Created At</th>
                )}
                {isColVisible('actions') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400 text-xs">
                    No pending withdrawals in the queue.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {isColVisible('confirm') && (
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setSelectedTxForConfirm(tx)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] shadow-2xs transition-colors whitespace-nowrap"
                        >
                          Dispatch
                        </button>
                      </td>
                    )}

                    {isColVisible('amount') && (
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-[#8B1E2D] text-xs">
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </td>
                    )}

                    {isColVisible('processingTime') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{formatProcessingTime(tx.processingTimeMinutes)}</span>
                        </div>
                      </td>
                    )}

                    {isColVisible('userInfo') && (
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700 select-all">
                        {tx.userInfo}
                      </td>
                    )}

                    {isColVisible('transactionId') && (
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {tx.id}
                      </td>
                    )}

                    {isColVisible('userId') && (
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {tx.userId}
                      </td>
                    )}

                    {isColVisible('provider') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700 border border-slate-200">
                          {tx.provider}
                        </span>
                      </td>
                    )}

                    {isColVisible('status') && (
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={tx.status} />
                      </td>
                    )}

                    {isColVisible('agent') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-slate-800 font-medium text-[11px]">
                          {tx.subagentName || 'Central Pool'}
                        </span>
                      </td>
                    )}

                    {isColVisible('dateOfCreation') && (
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.dateOfCreation || formatCairoTime(tx.createdAt)}
                      </td>
                    )}

                    {isColVisible('actions') && (
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setInspectingTransaction(tx)}
                            className="p-1 rounded text-slate-600 hover:text-white hover:bg-[#8B1E2D] transition-colors"
                            title="Inspect Order Details & Full Audit"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => holdWithdrawal(tx.id)}
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Put on Hold"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedTxForReject(tx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Reject Withdrawal"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/50">
          <PaginationBar
            totalItems={filteredData.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedTxForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
              <span>Confirm Payout Dispatch</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm payout dispatch of{' '}
              <strong className="text-[#8B1E2D] font-mono">
                {formatCurrency(selectedTxForConfirm.amount, selectedTxForConfirm.currency)}
              </strong>{' '}
              for order <strong className="font-mono text-slate-900">{selectedTxForConfirm.id}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTxForConfirm(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmWithdrawal(selectedTxForConfirm.id, 'Master Administrator', 'admin');
                  setSelectedTxForConfirm(null);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-2xs"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedTxForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Withdrawal Request</span>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-rose-500 bg-white"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTxForReject(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  rejectWithdrawal(selectedTxForReject.id, rejectReason, 'Master Administrator', 'admin');
                  setSelectedTxForReject(null);
                }}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold shadow-2xs"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      <ColumnSettingsDrawer
        isOpen={isColumnSettingsOpen}
        columns={columns}
        onToggleColumn={handleColumnToggle}
        onClose={() => setIsColumnSettingsOpen(false)}
      />
    </div>
  );
};
