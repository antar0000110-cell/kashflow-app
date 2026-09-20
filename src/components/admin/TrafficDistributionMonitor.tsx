import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Sliders,
  Shield,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { routeAssignmentService } from '../../services/RouteAssignmentService';
import { formatCurrency } from '../../utils/formatters';
import { formatCairoTime } from '../../utils/cairoTime';

interface TrafficDistributionMonitorProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const TrafficDistributionMonitor: React.FC<TrafficDistributionMonitorProps> = ({
  onClose,
  isModal = false,
}) => {
  const {
    agents,
    pendingDeposits,
    pendingWithdrawals,
    depositHistory,
    withdrawalHistory,
    globalTrafficActive,
    toggleGlobalTraffic,
    toggleAgentTraffic,
    triggerBotOrder,
    setActivePortal,
    setSelectedAgentId,
  } = useAppStore();

  const [refreshKey, setRefreshKey] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'overloaded' | 'underutilized' | 'paused'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportedToast, setExportedToast] = useState(false);

  // Generate traffic imbalance report
  const report = useMemo(() => {
    return routeAssignmentService.generateTrafficImbalanceReport(
      agents,
      pendingDeposits,
      pendingWithdrawals,
      depositHistory,
      withdrawalHistory
    );
  }, [agents, pendingDeposits, pendingWithdrawals, depositHistory, withdrawalHistory, refreshKey]);

  const filteredMetrics = useMemo(() => {
    return report.agentMetrics.filter((m) => {
      const matchSearch =
        m.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.agentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [report.agentMetrics, searchTerm, filterStatus]);

  const handleExportReport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `UZX_Traffic_Distribution_Report_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportedToast(true);
    setTimeout(() => setExportedToast(false), 3000);
  };

  const getImbalanceBadge = (level: string) => {
    switch (level) {
      case 'balanced':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Optimal Distribution (Balanced)
          </span>
        );
      case 'slight_skew':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            Minor Load Skew Detected
          </span>
        );
      case 'high_imbalance':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            High Load Imbalance (Action Advised)
          </span>
        );
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Top Header & Summary Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#8B1E2D] flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Automated Traffic Distribution Monitor
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time transaction queue tracking, workload variance &amp; load-balancing diagnostics
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {getImbalanceBadge(report.imbalanceLevel)}

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh Queue Metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportReport}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Global Traffic Status & Score Metric */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Imbalance Score
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
              {report.imbalanceScore} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  report.imbalanceScore > 50
                    ? 'bg-rose-500'
                    : report.imbalanceScore > 25
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${report.imbalanceScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Agents
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
              {report.totalActiveAgents} <span className="text-xs text-slate-400">/ {agents.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">In routing pool</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Avg Orders / Agent
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
              {report.averageOrdersPerAgent}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Mean assignment</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Avg Volume / Agent
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {formatCurrency(report.averageVolumePerAgent, 'EGP')}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Today&apos;s average</span>
          </div>
        </div>
      </div>

      {/* Diagnostics & AI Routing Recommendations */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 sm:p-4 text-xs text-amber-950">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 w-full">
            <span className="font-bold text-amber-900 block">
              Traffic Engine Intelligence &amp; Imbalance Advice:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Agents ({report.agentMetrics.length})
          </button>
          <button
            onClick={() => setFilterStatus('healthy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'healthy'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Balanced ({report.agentMetrics.filter((m) => m.status === 'healthy').length})
          </button>
          <button
            onClick={() => setFilterStatus('overloaded')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'overloaded'
                ? 'bg-rose-700 text-white'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            Overloaded ({report.agentMetrics.filter((m) => m.status === 'overloaded').length})
          </button>
          <button
            onClick={() => setFilterStatus('underutilized')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'underutilized'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            Underutilized ({report.agentMetrics.filter((m) => m.status === 'underutilized').length})
          </button>
          <button
            onClick={() => setFilterStatus('paused')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'paused'
                ? 'bg-slate-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Paused ({report.agentMetrics.filter((m) => m.status === 'paused').length})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search agent name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8B1E2D]"
          />
        </div>
      </div>

      {/* Agents Distribution Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Agent Details</th>
                <th className="px-3 py-2.5">Traffic Status</th>
                <th className="px-3 py-2.5">Assigned Orders</th>
                <th className="px-3 py-2.5">Pending In Queue</th>
                <th className="px-3 py-2.5">Assigned Volume</th>
                <th className="px-3 py-2.5">Capacity Load</th>
                <th className="px-3 py-2.5">Health State</th>
                <th className="px-3 py-2.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No agent metrics found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m) => {
                  const agentObj = agents.find((a) => a.id === m.agentId);

                  return (
                    <tr key={m.agentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#8B1E2D]/10 text-[#8B1E2D] flex items-center justify-center font-bold text-xs shrink-0">
                            {m.agentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                              {m.agentName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{m.agentId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => toggleAgentTraffic(m.agentId)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            m.isTrafficActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.isTrafficActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {m.isTrafficActive ? 'Active' : 'Paused'}
                        </button>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-slate-900">
                          {m.assignedTransactionsCount}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            / {m.dailyOrdersMax}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Pending Deposits">
                            ↓ {m.pendingDepositsCount}
                          </span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Pending Withdrawals">
                            ↑ {m.pendingWithdrawalsCount}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-slate-900">
                          {formatCurrency(m.assignedVolumeEGP, 'EGP')}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Cap: {formatCurrency(m.dailyMoneyCap, 'EGP')}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="font-bold text-slate-700">{m.capacityUtilizationPercent}%</span>
                          <span className="text-slate-400">quota</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all ${
                              m.capacityUtilizationPercent >= 85
                                ? 'bg-rose-500'
                                : m.capacityUtilizationPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, m.capacityUtilizationPercent)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        {m.status === 'healthy' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Balanced
                          </span>
                        )}
                        {m.status === 'overloaded' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Near Limit
                          </span>
                        )}
                        {m.status === 'underutilized' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Under-utilized
                          </span>
                        )}
                        {m.status === 'paused' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Paused
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedAgentId(m.agentId);
                            setActivePortal('agent');
                            if (onClose) onClose();
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#8B1E2D] hover:bg-rose-50 rounded border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {exportedToast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs shadow-lg flex items-center gap-2 animate-bounce z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Traffic distribution report successfully downloaded.</span>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Activity className="w-4 h-4 text-[#8B1E2D]" />
              <span>Automated Traffic Routing &amp; Distribution Report</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto">{content}</div>
        </div>
      </div>
    );
  }

  return content;
};
