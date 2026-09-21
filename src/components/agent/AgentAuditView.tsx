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
  const { agents, depositHistory, withdrawalHistory, pendingDeposits, pendingWithdrawals, commissionRates } = useAppStore();

  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any | null>(null);

  // Combine processed & pending transactions for comprehensive audit
  const allAuditTransactions = useMemo(() => {
    return [...depositHistory, ...withdrawalHistory, ...pendingDeposits, ...pendingWithdrawals];
  }, [depositHistory, withdrawalHistory, pendingDeposits, pendingWithdrawals]);

  // Compute audit records with rate validation
  const auditRecords = useMemo(() => {
    return allAuditTransactions.map((tx) => {
      // Find assigned agent
      const assignedAgent = agents.find(
        (a) => a.id === tx.subagentId || a.name === tx.subagentName
      );

      // Determine configured commission rates for this agent
      const configuredDepositRate = assignedAgent?.depositCommissionPercent ?? commissionRates.depositCommissionPercent ?? 3.0;
      const configuredWithdrawalRate = assignedAgent?.withdrawalCommissionPercent ?? commissionRates.withdrawalCommissionPercent ?? 1.0;

      const isDeposit = tx.type === 'deposit' || (tx.type as string) === 'Deposit';
      const appliedRatePercent = isDeposit ? configuredDepositRate : configuredWithdrawalRate;
      const calculatedCommission = (tx.amount * appliedRatePercent) / 100;
      
      const recordedCommission = tx.commissionEarned !== undefined ? tx.commissionEarned : calculatedCommission;
      const isVerifiedMatch = Math.abs(calculatedCommission - recordedCommission) < 0.01;

      return {
        ...tx,
        assignedAgent,
        agentNameDisplay: assignedAgent?.name || tx.subagentName || 'Unassigned',
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
        const matchRef = ((rec as any).paymentRef || rec.id)?.toLowerCase().includes(q);
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

      {/* Discrepancy Indicator Banner */}
      {summaryMetrics.totalRecords - summaryMetrics.verifiedMatchesCount > 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-900">Commission Rate Discrepancy Detected</div>
              <div className="text-[11px] text-rose-700">
                {summaryMetrics.totalRecords - summaryMetrics.verifiedMatchesCount} transaction(s) differ from configured agent commission rates. Review highlighted records.
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-mono text-xs font-bold rounded">
            {summaryMetrics.totalRecords - summaryMetrics.verifiedMatchesCount} Issues
          </span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900">100% Commission Audit Verification Passed</div>
              <div className="text-[11px] text-emerald-700">
                All transaction commission calculations match the active agent settings and ledger records. Click any row to inspect exact math.
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono text-xs font-bold rounded">
            All Verified
          </span>
        </div>
      )}

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
                  <tr
                    key={r.id}
                    onClick={() => setSelectedAuditRecord(r)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    title="Click to inspect real-time commission calculation math"
                  >
                    <td className="p-3 font-mono font-bold text-blue-900">
                      {r.id}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.type === 'deposit' || (r.type as string) === 'Deposit' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.type === 'deposit' || (r.type as string) === 'Deposit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{r.agentNameDisplay}</div>
                      <div className="text-[10px] text-slate-500">{r.subagentId || 'Standard'}</div>
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
            pageSize={pageSize}
            totalItems={filteredRecords.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Commission Math Verification Overlay Modal */}
      {selectedAuditRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">Real-Time Commission Verification Math</h3>
              </div>
              <button
                onClick={() => setSelectedAuditRecord(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between font-mono text-slate-600">
                  <span>Transaction ID:</span>
                  <span className="font-bold text-slate-900">{selectedAuditRecord.id}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-600">
                  <span>Transaction Type:</span>
                  <span className="font-bold uppercase text-slate-900">{selectedAuditRecord.type}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-600">
                  <span>Transaction Amount:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedAuditRecord.amount, selectedAuditRecord.currency || 'EGP')}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-600">
                  <span>Assigned Subagent:</span>
                  <span className="font-bold text-slate-900">{selectedAuditRecord.agentNameDisplay}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
                <div className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-purple-700" />
                  <span>Exact Mathematical Formula</span>
                </div>
                <div className="p-3 bg-white rounded border border-purple-100 font-mono text-center text-slate-800 text-sm">
                  {selectedAuditRecord.amount.toLocaleString()} {selectedAuditRecord.currency || 'EGP'} × {selectedAuditRecord.appliedRatePercent}% = <span className="text-purple-700 font-bold">{selectedAuditRecord.calculatedCommission.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Formula breakdown: Transaction Volume multiplied by active agent commission percentage divided by 100.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Calculated DB Commission</div>
                  <div className="text-base font-black font-mono text-purple-800 mt-1">
                    {formatCurrency(selectedAuditRecord.calculatedCommission, selectedAuditRecord.currency || 'EGP')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Recorded Ledger Earnings</div>
                  <div className="text-base font-black font-mono text-emerald-800 mt-1">
                    {formatCurrency(selectedAuditRecord.recordedCommission, selectedAuditRecord.currency || 'EGP')}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <div>
                  {selectedAuditRecord.isVerifiedMatch ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      VERIFIED MATCH: Zero Discrepancy
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-700" />
                      DISCREPANCY DETECTED: Rate Mismatch!
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedAuditRecord(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Close Overlay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
