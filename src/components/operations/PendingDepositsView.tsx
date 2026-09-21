import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Shield,
  Layers
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

export const PendingDepositsView: React.FC = () => {
  const {
    pendingDeposits,
    confirmDeposit,
    rejectDeposit,
    autoUpdateEnabled,
    setAutoUpdateEnabled,
    banks,
    agents,
    setInspectingTransaction,
  } = useAppStore();

  // Load persisted filters from local storage
  const savedFilters = useMemo(() => {
    try {
      const stored = localStorage.getItem('uzx_pending_deposits_filters');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Filters state
  const [dateFilter, setDateFilter] = useState(savedFilters?.dateFilter ?? '2026-09');
  const [filterId, setFilterId] = useState(savedFilters?.filterId ?? '');
  const [filterUserId, setFilterUserId] = useState(savedFilters?.filterUserId ?? '');
  const [filterUserInfo, setFilterUserInfo] = useState(savedFilters?.filterUserInfo ?? '');
  const [filterAgentSearch, setFilterAgentSearch] = useState(savedFilters?.filterAgentSearch ?? '');
  const [minAmount, setMinAmount] = useState(savedFilters?.minAmount ?? '');
  const [maxAmount, setMaxAmount] = useState(savedFilters?.maxAmount ?? '');
  const [filterProvider, setFilterProvider] = useState(savedFilters?.filterProvider ?? 'all');
  const [filterPartner, setFilterPartner] = useState(savedFilters?.filterPartner ?? 'all');
  const [filterBank, setFilterBank] = useState(savedFilters?.filterBank ?? 'all');
  const [filterCurrency, setFilterCurrency] = useState(savedFilters?.filterCurrency ?? 'all');

  // Persist filters to local state on change
  useEffect(() => {
    try {
      const filtersToSave = {
        dateFilter,
        filterId,
        filterUserId,
        filterUserInfo,
        filterAgentSearch,
        minAmount,
        maxAmount,
        filterProvider,
        filterPartner,
        filterBank,
        filterCurrency,
      };
      localStorage.setItem('uzx_pending_deposits_filters', JSON.stringify(filtersToSave));
    } catch (e) {
      console.warn('Failed to save deposit filter state to local storage', e);
    }
  }, [
    dateFilter,
    filterId,
    filterUserId,
    filterUserInfo,
    filterAgentSearch,
    minAmount,
    maxAmount,
    filterProvider,
    filterPartner,
    filterBank,
    filterCurrency,
  ]);

  // Column visibility
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { key: 'confirm', label: 'Action', visible: true },
    { key: 'amount', label: 'Amount (USDT)', visible: true },
    { key: 'processingTime', label: 'Time Elapsed', visible: true },
    { key: 'userInfo', label: 'Client / Sender Info', visible: true },
    { key: 'transactionId', label: 'Order ID', visible: true },
    { key: 'userId', label: 'User ID', visible: true },
    { key: 'bankName', label: 'Gateway Bank', visible: true },
    { key: 'provider', label: 'Provider', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'agent', label: 'Assigned Subagent', visible: true },
    { key: 'dateOfCreation', label: 'Cairo Creation Time', visible: true },
    { key: 'actions', label: 'Audit / Reject', visible: true },
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals & Details
  const [selectedTxForConfirm, setSelectedTxForConfirm] = useState<Transaction | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number>(0);
  const [selectedTxForReject, setSelectedTxForReject] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment reference mismatch with mobile banking ledger');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleColumnToggle = (key: string, visible: boolean) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible } : c)));
  };

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filter application
  const filteredData = useMemo(() => {
    return pendingDeposits.filter((tx) => {
      if (filterId && !tx.id.toLowerCase().includes(filterId.toLowerCase())) return false;
      if (filterUserId && !tx.userId.toLowerCase().includes(filterUserId.toLowerCase())) return false;
      if (
        filterUserInfo &&
        !tx.userInfo.toLowerCase().includes(filterUserInfo.toLowerCase()) &&
        !tx.phone?.includes(filterUserInfo)
      ) {
        return false;
      }
      if (filterAgentSearch) {
        const q = filterAgentSearch.toLowerCase();
        const matchAgent =
          tx.adminName?.toLowerCase().includes(q) ||
          tx.subagentName?.toLowerCase().includes(q) ||
          tx.subagentId?.toLowerCase().includes(q) ||
          tx.processedBy?.toLowerCase().includes(q);
        if (!matchAgent) return false;
      }
      if (minAmount !== '' && !isNaN(Number(minAmount)) && tx.amount < Number(minAmount)) {
        return false;
      }
      if (maxAmount !== '' && !isNaN(Number(maxAmount)) && tx.amount > Number(maxAmount)) {
        return false;
      }
      if (filterProvider !== 'all' && tx.provider !== filterProvider) return false;
      if (filterBank !== 'all' && tx.bankName !== filterBank) return false;
      if (filterPartner !== 'all' && tx.subagentId !== filterPartner) return false;
      if (filterCurrency !== 'all' && tx.currency !== filterCurrency) return false;
      return true;
    });
  }, [
    pendingDeposits,
    filterId,
    filterUserId,
    filterUserInfo,
    filterAgentSearch,
    minAmount,
    maxAmount,
    filterProvider,
    filterBank,
    filterPartner,
    filterCurrency,
  ]);

  // Pagination slicing
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const resetFilters = () => {
    setFilterId('');
    setFilterUserId('');
    setFilterUserInfo('');
    setFilterAgentSearch('');
    setMinAmount('');
    setMaxAmount('');
    setFilterProvider('all');
    setFilterPartner('all');
    setFilterBank('all');
    setFilterCurrency('all');
    setCurrentPage(1);
    try {
      localStorage.removeItem('uzx_pending_deposits_filters');
    } catch {}
  };

  const handleExportCSV = () => {
    exportToCSV(filteredData, `pending_deposits_cairo_${Date.now()}`);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredData, `pending_deposits_cairo_${Date.now()}`);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Bank Transfers', section: 'banks' },
          { label: 'Pending Deposits Queue' },
        ]}
      />

      {/* Page Title & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pending Deposit Requests</span>
            <span className="px-2 py-0.5 rounded-full bg-[#8B1E2D] text-white text-xs font-mono font-bold">
              {pendingDeposits.length}
            </span>
          </h1>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Real-time inbound deposits queue synchronized with Cairo time. Verify proofs and credit ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Currency Filter Toolbar */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 shadow-2xs">
            <button
              onClick={() => { setFilterCurrency('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterCurrency === 'all'
                  ? 'bg-[#8B1E2D] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Currencies
            </button>
            <button
              onClick={() => { setFilterCurrency('USDT'); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterCurrency === 'USDT' || filterCurrency === 'USD'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USDT Global
            </button>
          </div>

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
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 text-xs bg-[#8B1E2D] text-white rounded hover:bg-[#721825] shadow-2xs flex items-center gap-1 font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters Box */}
      <div className="bg-white p-3 sm:p-4 rounded border border-slate-200 shadow-2xs space-y-3">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-[#8B1E2D]" />
          <span>Advanced Query Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Date</label>
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. TX-940"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">User ID</label>
            <input
              type="text"
              placeholder="e.g. USR-8812"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Wallet ID / Sender</label>
            <input
              type="text"
              placeholder="Wallet ID..."
              value={filterUserInfo}
              onChange={(e) => setFilterUserInfo(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="w-full h-7 px-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            >
              <option value="all">All Providers</option>
              <option value="TRC20 Network">TRC20 Network</option>
              <option value="TRON Direct">TRON Direct</option>
              <option value="USDT Hot Wallet">USDT Hot Wallet</option>
              <option value="Central Liquidity Node">Central Liquidity Node</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Agent / Partner Search</label>
            <input
              type="text"
              placeholder="Agent name..."
              value={filterAgentSearch}
              onChange={(e) => setFilterAgentSearch(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Min Amount</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Max Amount</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Subagent Dropdown</label>
            <select
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
              className="w-full h-7 px-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            >
              <option value="all">All Subagents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Bank Name</label>
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="w-full h-7 px-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            >
              <option value="all">All Banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.bankName}>
                  {b.bankName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Currency</label>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="w-full h-7 px-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#8B1E2D]"
            >
              <option value="all">All</option>
              <option value="USDT">USDT</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={resetFilters}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                {isColVisible('confirm') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px] w-20 text-center">Confirm</th>
                )}
                {isColVisible('amount') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Amount</th>
                )}
                {isColVisible('processingTime') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Elapsed Time</th>
                )}
                {isColVisible('userInfo') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px] min-w-[200px]">Client / Sender Details</th>
                )}
                {isColVisible('transactionId') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Order ID</th>
                )}
                {isColVisible('userId') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">User ID</th>
                )}
                {isColVisible('bankName') && (
                  <th className="py-2.5 px-3 font-semibold text-[11px]">Bank Account</th>
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
                  <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Details & Audit</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400 text-xs">
                    No pending deposit transactions match your filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Confirm Button */}
                    {isColVisible('confirm') && (
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedTxForConfirm(tx);
                            setConfirmAmount(tx.amount);
                          }}
                          className="px-2.5 py-1 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded font-bold text-[11px] shadow-2xs transition-colors whitespace-nowrap"
                          title="Confirm Deposit and credit ledger"
                        >
                          Confirm
                        </button>
                      </td>
                    )}

                    {/* Amount */}
                    {isColVisible('amount') && (
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-[#8B1E2D] text-xs">
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </td>
                    )}

                    {/* Elapsed Time */}
                    {isColVisible('processingTime') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{formatProcessingTime(tx.processingTimeMinutes)}</span>
                        </div>
                      </td>
                    )}

                    {/* Client / Sender Info with Quick Copy */}
                    {isColVisible('userInfo') && (
                      <td className="py-2 px-3">
                        <div className="flex items-start justify-between gap-1 max-w-xs">
                          <span className="font-mono text-[11px] text-slate-700 select-all line-clamp-2 leading-tight">
                            {tx.userInfo}
                          </span>
                          {tx.phone && (
                            <button
                              onClick={() => handleCopy(tx.phone!)}
                              className="text-slate-400 hover:text-[#8B1E2D] shrink-0 p-0.5"
                              title="Copy Phone Number"
                            >
                              {copiedHash === tx.phone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Transaction ID */}
                    {isColVisible('transactionId') && (
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {tx.id}
                      </td>
                    )}

                    {/* User ID */}
                    {isColVisible('userId') && (
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {tx.userId}
                      </td>
                    )}

                    {/* Bank Name */}
                    {isColVisible('bankName') && (
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {tx.bankName}
                      </td>
                    )}

                    {/* Provider */}
                    {isColVisible('provider') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700 border border-slate-200">
                          {tx.provider}
                        </span>
                      </td>
                    )}

                    {/* Status */}
                    {isColVisible('status') && (
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={tx.status} />
                      </td>
                    )}

                    {/* Assigned Agent */}
                    {isColVisible('agent') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-slate-800 font-medium text-[11px]">
                          {tx.subagentName || 'Central Pool'}
                        </span>
                      </td>
                    )}

                    {/* Cairo Date */}
                    {isColVisible('dateOfCreation') && (
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.dateOfCreation || formatCairoTime(tx.createdAt)}
                      </td>
                    )}

                    {/* Action buttons: Inspect & Reject */}
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
                            onClick={() => setSelectedTxForReject(tx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Reject Deposit"
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

        {/* Pagination Bar */}
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

      {/* Confirmation Dialog Modal */}
      {selectedTxForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Deposit & Credit Balance</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to approve deposit order{' '}
              <strong className="font-mono text-slate-900">{selectedTxForConfirm.id}</strong> for{' '}
              <strong className="text-[#8B1E2D] font-mono">
                {formatCurrency(selectedTxForConfirm.amount, selectedTxForConfirm.currency)}
              </strong>
              ? This will immediately credit the client/agent ledger.
            </p>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono space-y-1">
              <div>Sender: {selectedTxForConfirm.userFullName}</div>
              <div>Wallet ID: {selectedTxForConfirm.phone || '-'}</div>
              <div>Gateway: {selectedTxForConfirm.bankName}</div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                Approved Deposit Amount ({selectedTxForConfirm.currency || 'USDT'}):
              </label>
              <input
                type="number"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(Number(e.target.value))}
                className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTxForConfirm(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDeposit(selectedTxForConfirm.id, Number(confirmAmount), 'Master Administrator', 'admin');
                  setSelectedTxForConfirm(null);
                }}
                className="px-4 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold shadow-2xs"
              >
                Confirm & Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog Modal */}
      {selectedTxForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Deposit Request</span>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the reason for rejecting deposit order{' '}
              <strong className="font-mono">{selectedTxForReject.id}</strong>:
            </p>

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
                  rejectDeposit(selectedTxForReject.id, rejectReason, 'Master Administrator', 'admin');
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

      {/* Column Visibility Drawer */}
      <ColumnSettingsDrawer
        isOpen={isColumnSettingsOpen}
        columns={columns}
        onToggleColumn={handleColumnToggle}
        onClose={() => setIsColumnSettingsOpen(false)}
      />
    </div>
  );
};
