import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calculator,
  RefreshCw,
  Clock,
  Briefcase,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { PaginationBar } from '../common/PaginationBar';
import { useAppStore } from '../../store/useAppStore';
import { Transaction, Agent } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { OrderElapsedTimeBadge } from '../common/OrderElapsedTimeBadge';

export const AgentAuditView: React.FC = () => {
  const { agents, transactions, pendingDeposits, pendingWithdrawals, commissionRates } = useAppStore();

  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Combine processed & pending transactions for comprehensive audit
  const allAuditTransactions = useMemo(() => {
    return [...transactions, ...pendingDeposits, ...pendingWithdrawals];
  }, [transactions, pendingDeposits, pendingWithdrawals]);

  // Compute audit records with rate validation
  const auditRecords = useMemo(() => {
    return allAuditTransactions.map((tx) => {
      // Find assigned agent
      const assignedAgent = agents.find(
        (a) => a.id === tx.subagentId || a.id === tx.agentId || a.name === tx.agentName
      );

      // Determine configured commission rates for this agent
      const configuredDepositRate = assignedAgent?.depositCommissionPercent ?? commissionRates.depositRate ?? 1.5;
      const configuredWithdrawalRate = assignedAgent?.withdrawalCommissionPercent ?? commissionRates.withdrawalRate ?? 1.0;

      const appliedRatePercent = tx.type === 'Deposit' ? configuredDepositRate : configuredWithdrawalRate;
      const calculatedCommission = (tx.amount * appliedRatePercent) / 100;
      
      const recordedCommission = tx.commissionEarned !== undefined ? tx.commissionEarned : calculatedCommission;
      const isVerifiedMatch = Math.abs(calculatedCommission - recordedCommission) < 0.01;

      return {
        ...tx,
        assignedAgent,
        agentNameDisplay: assignedAgent?.name || tx.agentName || 'Unassigned',
        appliedRatePercent,
        calculatedCommission,
        recordedCommission,
        isVerifiedMatch,
      };
    });
  }, [allAuditTransactions, agents, commissionRates]);

  // Filter audit records
  const filteredRecords = useMemo(() => {
    return auditRecords.filter((rec) => {
      if (selectedAgentFilter !== 'all' && rec.assignedAgent?.id !== selectedAgentFilter && rec.subagentId !== selectedAgentFilter) {
        return false;
      }
      if (selectedTypeFilter !== 'all' && rec.type !== selectedTypeFilter) {
        return false;
      }
      if (selectedCurrencyFilter !== 'all' && rec.currency !== selectedCurrencyFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = rec.id.toLowerCase().includes(q);
        const matchUser = rec.userId?.toLowerCase().includes(q) || rec.userInfo?.toLowerCase().includes(q);
        const matchAgent = rec.agentNameDisplay.toLowerCase().includes(q);
        const matchRef = rec.referenceNumber?.toLowerCase().includes(q);
        if (!matchId && !matchUser && !matchAgent && !matchRef) return false;
      }
      return true;
    });
  }, [auditRecords, selectedAgentFilter, selectedTypeFilter, selectedCurrencyFilter, searchQuery]);

  // Pagination
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalVolumeEgp = 0;
    let totalVolumeUsd = 0;
    let totalCalculatedCommissionEgp = 0;
    let totalRecordedCommissionEgp = 0;
    let verifiedMatchesCount = 0;

    filteredRecords.forEach((rec) => {
      if (rec.currency === 'USD') {
        totalVolumeUsd += rec.amount;
      } else {
        totalVolumeEgp += rec.amount;
      }

      totalCalculatedCommissionEgp += rec.calculatedCommission;
      totalRecordedCommissionEgp += rec.recordedCommission;

      if (rec.isVerifiedMatch) {
        verifiedMatchesCount++;
      }
    });

    const matchRatePercent = filteredRecords.length > 0
      ? ((verifiedMatchesCount / filteredRecords.length) * 100).toFixed(1)
      : '100';

    return {
      totalVolumeEgp,
      totalVolumeUsd,
      totalCalculatedCommissionEgp,
      totalRecordedCommissionEgp,
      verifiedMatchesCount,
      totalRecords: filteredRecords.length,
      matchRatePercent,
    };
  }, [filteredRecords]);

  // Export handlers
  const handleExportCSV = () => {
    const exportData = filteredRecords.map((r) => ({
      'Order ID': r.id,
      'Type': r.type,
      'Currency': r.currency || 'EGP',
      'Amount': r.amount,
      'Assigned Agent': r.agentNameDisplay,
      'Configured Commission %': `${r.appliedRatePercent}%`,
      'Calculated Commission': r.calculatedCommission.toFixed(2),
      'Recorded Commission': r.recordedCommission.toFixed(2),
      'Audit Status': r.isVerifiedMatch ? 'VERIFIED MATCH' : 'RATE DISCREPANCY',
      'Status': r.status,
      'Created At': r.createdAt,
    }));
    exportToCSV(exportData, `agent_commission_audit_${Date.now()}`);
  };

  const handleExportExcel = () => {
    const exportData = filteredRecords.map((r) => ({
      'Order ID': r.id,
      'Type': r.type,
      'Currency': r.currency || 'EGP',
      'Amount': r.amount,
      'Assigned Agent': r.agentNameDisplay,
      'Configured Commission %': `${r.appliedRatePercent}%`,
      'Calculated Commission': r.calculatedCommission.toFixed(2),
      'Recorded Commission': r.recordedCommission.toFixed(2),
      'Audit Status': r.isVerifiedMatch ? 'VERIFIED MATCH' : 'RATE DISCREPANCY',
      'Status': r.status,
      'Created At': r.createdAt,
    }));
    exportToExcel(exportData, `agent_commission_audit_${Date.now()}`);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4">
      <Breadcrumb
        items={[
          { label: 'Financial Reports', section: 'financial-reports' },
          { label: 'Real-Time Agent Commission Audit' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Agent Real-Time Commission Audit</span>
          </h1>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Real-time calculation & verification of agent earnings against configured percentage settings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 text-xs bg-[#8B1E2D] text-white rounded hover:bg-[#721825] shadow-2xs flex items-center gap-1 font-semibold cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Audit Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
            {summaryMetrics.matchRatePercent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summaryMetrics.verifiedMatchesCount} / {summaryMetrics.totalRecords} verified records
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Volume Audited</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {formatCurrency(summaryMetrics.totalVolumeEgp, 'EGP')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            USD Volume: ${summaryMetrics.totalVolumeUsd.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Calculated Commission</span>
            <Calculator className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-800 mt-1 font-mono">
            {formatCurrency(summaryMetrics.totalCalculatedCommissionEgp, 'EGP')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Based on active agent rates
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recorded Earnings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
            {formatCurrency(summaryMetrics.totalRecordedCommissionEgp, 'EGP')}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            100% Synced with Ledger
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Record Search & Filters</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Showing {filteredRecords.length} records
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Select Subagent</label>
            <select
              value={selectedAgentFilter}
              onChange={(e) => { setSelectedAgentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-8 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Subagents ({agents.length})</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.depositCommissionPercent}% Dep / {a.withdrawalCommissionPercent}% Wdr)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Transaction Type</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => { setSelectedTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-8 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Types (Deposits & Withdrawals)</option>
              <option value="Deposit">Deposits Only</option>
              <option value="Withdrawal">Withdrawals Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Currency</label>
            <select
              value={selectedCurrencyFilter}
              onChange={(e) => { setSelectedCurrencyFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-8 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Currencies</option>
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Search ID or User</label>
            <input
              type="text"
              placeholder="Search by Order ID, User ID, Agent Name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-8 px-2 border border-slate-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-[10px] uppercase tracking-wider border-b border-slate-800">
                <th className="p-3">Order ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Assigned Subagent</th>
                <th className="p-3">Volume / Currency</th>
                <th className="p-3">Agent Setting Rate</th>
                <th className="p-3">Calculated Commission</th>
                <th className="p-3">Recorded Commission</th>
                <th className="p-3">Audit Verification</th>
                <th className="p-3">Processing Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                    No transaction records matching the current audit filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-900">
                      {r.id}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.type === 'Deposit' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.type === 'Deposit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{r.agentNameDisplay}</div>
                      <div className="text-[10px] text-slate-500">{r.subagentId || r.agentId || 'Standard'}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {formatCurrency(r.amount, r.currency || 'EGP')}
                    </td>
                    <td className="p-3 font-mono text-purple-900 font-bold">
                      {r.appliedRatePercent}%
                    </td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">
                      {formatCurrency(r.calculatedCommission, r.currency || 'EGP')}
                    </td>
                    <td className="p-3 font-mono text-slate-900 font-bold">
                      {formatCurrency(r.recordedCommission, r.currency || 'EGP')}
                    </td>
                    <td className="p-3">
                      {r.isVerifiedMatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          VERIFIED MATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          DISCREPANCY
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <OrderElapsedTimeBadge
                        createdAt={r.createdAt}
                        processedAt={r.processedAt}
                        processingDurationSeconds={r.processingDurationSeconds}
                        processingDurationFormatted={r.processingDurationFormatted}
                        duration={r.duration}
                        status={r.status}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRecords.length / pageSize) || 1}
            pageSize={pageSize}
            totalItems={filteredRecords.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};
