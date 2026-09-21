import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileSpreadsheet, RotateCcw, Eye, Download } from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { StatusBadge } from '../common/StatusBadge';
import { PaginationBar } from '../common/PaginationBar';
import { ColumnSettingsDrawer, ColumnDefinition } from '../common/ColumnSettingsDrawer';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { formatCairoTime } from '../../utils/cairoTime';

export const DepositRequestsView: React.FC = () => {
  const { depositHistory, setInspectingTransaction } = useAppStore();

  const savedFilters = useMemo(() => {
    try {
      const stored = localStorage.getItem('uzx_deposit_history_filters');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const [filterId, setFilterId] = useState(savedFilters?.filterId ?? '');
  const [filterAgentName, setFilterAgentName] = useState(savedFilters?.filterAgentName ?? '');
  const [minAmount, setMinAmount] = useState(savedFilters?.minAmount ?? '');
  const [maxAmount, setMaxAmount] = useState(savedFilters?.maxAmount ?? '');
  const [filterStatus, setFilterStatus] = useState(savedFilters?.filterStatus ?? 'all');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    try {
      const toSave = { filterId, filterAgentName, minAmount, maxAmount, filterStatus };
      localStorage.setItem('uzx_deposit_history_filters', JSON.stringify(toSave));
    } catch {}
  }, [filterId, filterAgentName, minAmount, maxAmount, filterStatus]);

  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { key: 'transactionId', label: 'Order ID', visible: true },
    { key: 'user', label: 'Customer Name', visible: true },
    { key: 'amount', label: 'Amount (EGP)', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'bankName', label: 'Bank / Gateway', visible: true },
    { key: 'provider', label: 'Provider', visible: true },
    { key: 'agent', label: 'Agent / Partner', visible: true },
    { key: 'processedBy', label: 'Processed By', visible: true },
    { key: 'dateOfCreation', label: 'Cairo Creation Time', visible: true },
    { key: 'timeOfProcessing', label: 'Processing Duration', visible: true },
    { key: 'actions', label: 'Audit Details', visible: true },
  ]);

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible ?? true;

  const handleColumnToggle = (key: string, visible: boolean) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible } : c)));
  };

  const filteredData = depositHistory.filter((t) => {
    if (filterId && !t.id.toLowerCase().includes(filterId.toLowerCase()) && !t.userId.toLowerCase().includes(filterId.toLowerCase())) return false;
    if (filterAgentName) {
      const q = filterAgentName.toLowerCase();
      const matchAgent =
        t.subagentName?.toLowerCase().includes(q) ||
        t.subagentId?.toLowerCase().includes(q) ||
        t.adminName?.toLowerCase().includes(q) ||
        t.processedBy?.toLowerCase().includes(q);
      if (!matchAgent) return false;
    }
    if (minAmount !== '' && !isNaN(Number(minAmount)) && t.amount < Number(minAmount)) return false;
    if (maxAmount !== '' && !isNaN(Number(maxAmount)) && t.amount > Number(maxAmount)) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb items={[{ label: 'Bank Transfers', section: 'banks' }, { label: 'Deposit Requests History' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900">
            Deposit Requests Archive
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete historical registry of processed, approved, and rejected inbound deposits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filteredData, `deposit_history_${Date.now()}`)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded flex items-center gap-1 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportToExcel(filteredData, `deposit_history_${Date.now()}`)}
            className="px-2.5 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white text-xs font-semibold rounded flex items-center gap-1 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search Transaction ID or User ID..."
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Agent Name..."
              value={filterAgentName}
              onChange={(e) => setFilterAgentName(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Min Amount EGP"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Max Amount EGP"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => {
              setFilterId('');
              setFilterAgentName('');
              setMinAmount('');
              setMaxAmount('');
              setFilterStatus('all');
              try {
                localStorage.removeItem('uzx_deposit_history_filters');
              } catch {}
            }}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                {isColVisible('transactionId') && <th className="py-2.5 px-3 font-semibold text-[11px]">Order ID</th>}
                {isColVisible('user') && <th className="py-2.5 px-3 font-semibold text-[11px]">Customer</th>}
                {isColVisible('amount') && <th className="py-2.5 px-3 font-semibold text-[11px]">Amount</th>}
                {isColVisible('status') && <th className="py-2.5 px-3 font-semibold text-[11px] text-center">Status</th>}
                {isColVisible('bankName') && <th className="py-2.5 px-3 font-semibold text-[11px]">Bank / Gateway</th>}
                {isColVisible('provider') && <th className="py-2.5 px-3 font-semibold text-[11px]">Provider</th>}
                {isColVisible('agent') && <th className="py-2.5 px-3 font-semibold text-[11px]">Agent</th>}
                {isColVisible('processedBy') && <th className="py-2.5 px-3 font-semibold text-[11px]">Processed By</th>}
                {isColVisible('dateOfCreation') && <th className="py-2.5 px-3 font-semibold text-[11px]">Cairo Created At</th>}
                {isColVisible('timeOfProcessing') && <th className="py-2.5 px-3 font-semibold text-[11px]">Duration</th>}
                {isColVisible('actions') && <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Audit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No historical records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {isColVisible('transactionId') && (
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">{tx.id}</td>
                    )}
                    {isColVisible('user') && (
                      <td className="py-2 px-3 text-slate-900 font-medium">{tx.userFullName}</td>
                    )}
                    {isColVisible('amount') && (
                      <td className="py-2 px-3 font-mono font-bold text-[#8B1E2D]">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                    )}
                    {isColVisible('status') && (
                      <td className="py-2 px-3 text-center">
                        <StatusBadge status={tx.status} />
                      </td>
                    )}
                    {isColVisible('bankName') && <td className="py-2 px-3 text-slate-800">{tx.bankName}</td>}
                    {isColVisible('provider') && (
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 border border-slate-200">
                          {tx.provider}
                        </span>
                      </td>
                    )}
                    {isColVisible('agent') && <td className="py-2 px-3 text-slate-800">{tx.subagentName || 'Central'}</td>}
                    {isColVisible('processedBy') && (
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          tx.processedByRole === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : tx.processedByRole === 'agent'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {tx.processedBy || (tx.processedByRole ? (tx.processedByRole === 'admin' ? 'Admin' : 'Agent') : 'System')}
                        </span>
                      </td>
                    )}
                    {isColVisible('dateOfCreation') && (
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                        {tx.dateOfCreation || formatCairoTime(tx.createdAt)}
                      </td>
                    )}
                    {isColVisible('timeOfProcessing') && (
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{tx.timeOfProcessing || '1 min'}</td>
                    )}
                    {isColVisible('actions') && (
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => setInspectingTransaction(tx)}
                          className="p-1 rounded text-slate-600 hover:text-white hover:bg-[#8B1E2D] transition-colors"
                          title="Inspect Order Details & Proofs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
    </div>
  );
};
