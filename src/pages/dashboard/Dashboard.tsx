import React from 'react';
import {
  Users,
  Key,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Power,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';

const CHART_COLORS = ['#8B1E2D', '#0284C7', '#D97706', '#059669', '#7C3AED', '#64748B'];

export const Dashboard: React.FC = () => {
  const {
    pendingDeposits,
    pendingWithdrawals,
    agents,
    wallets,
    setActiveSection,
    confirmDeposit,
    confirmWithdrawal,
    isProductionMode,
    setProductionMode,
    resetSystemData,
    globalTrafficActive,
    toggleGlobalTraffic,
    setInspectingTransaction,
  } = useAppStore();

  const totalPendingDepositsAmount = pendingDeposits.reduce((acc, t) => acc + t.amount, 0);
  const totalPendingWithdrawalsAmount = pendingWithdrawals.reduce((acc, t) => acc + t.amount, 0);
  const activeAgentsCount = agents.filter((a) => a.trafficActive).length;
  const activeWalletsCount = wallets.filter((w) => w.status === 'active').length;

  // Intraday Volume data for Area Chart
  const volumeData = [
    { time: '00:00', deposits: 14000, withdrawals: 9000 },
    { time: '04:00', deposits: 6000, withdrawals: 3000 },
    { time: '08:00', deposits: 48000, withdrawals: 24000 },
    { time: '12:00', deposits: 125000, withdrawals: 78000 },
    { time: '16:00', deposits: 198000, withdrawals: 110000 },
    { time: '20:00', deposits: 145000, withdrawals: 95000 },
    { time: 'Now', deposits: 89000, withdrawals: 52000 },
  ];

  // Provider Distribution
  const providerDistribution = [
    { name: 'Vodafone Cash', value: 45 },
    { name: 'InstaPay National', value: 30 },
    { name: 'Orange Money', value: 12 },
    { name: 'Etisalat Cash', value: 8 },
    { name: 'WE Pay', value: 5 },
  ];

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Top Banner with Cairo Time & System Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Intraday Settlement &amp; Operations Console
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B1E2D] text-white shrink-0 shadow-2xs">
              Cairo LIVE
            </span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Real-time Egyptian banking gateway settlement, automated 6,000 wallet balancing &amp; subagent queue distribution.
          </p>
        </div>

        {/* Global Operational Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Production Mode Toggle Button */}
          <button
            onClick={() => setProductionMode(!isProductionMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer border ${
              isProductionMode
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="When active, strictly locks production mode and hides simulated test tools"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isProductionMode ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>{isProductionMode ? 'Production: ACTIVE' : 'Staging / Sandbox'}</span>
          </button>

          {/* Reset Simulated Counters */}
          <button
            onClick={() => {
              if (window.confirm('Reset all simulated test orders back to default initial seed?')) {
                resetSystemData();
              }
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
            title="Reset simulated counter values"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Zero Counters</span>
            <span className="sm:hidden">Reset</span>
          </button>

          {/* Global Traffic Switch */}
          <button
            onClick={toggleGlobalTraffic}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer border ${
              globalTrafficActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{globalTrafficActive ? 'Traffic Running' : 'Traffic Paused'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Responsive from 2 cols on mobile to 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Pending Deposits KPI */}
        <div
          onClick={() => setActiveSection('pending-deposits')}
          className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-[#8B1E2D] hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Pending Deposits
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-[#8B1E2D] truncate tracking-tight">
              {formatCurrency(totalPendingDepositsAmount, 'EGP')}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-2 flex items-center gap-1 truncate">
            <span className="font-mono font-bold text-slate-800">{pendingDeposits.length}</span>
            <span>orders waiting action</span>
          </div>
        </div>

        {/* Pending Withdrawals KPI */}
        <div
          onClick={() => setActiveSection('pending-withdrawals')}
          className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Pending Payouts
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-slate-900 truncate tracking-tight">
              {formatCurrency(totalPendingWithdrawalsAmount, 'EGP')}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-2 flex items-center gap-1 truncate">
            <span className="font-mono font-bold text-slate-800">{pendingWithdrawals.length}</span>
            <span>payouts queued</span>
          </div>
        </div>

        {/* Active Agents KPI */}
        <div
          onClick={() => setActiveSection('agent-management')}
          className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Subagent Network
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-slate-900 truncate tracking-tight">
              {activeAgentsCount} <span className="text-xs font-normal text-slate-500">/ {agents.length}</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-2 truncate">
            Quota allocation enforced
          </div>
        </div>

        {/* Wallets Pool KPI */}
        <div
          onClick={() => setActiveSection('wallet-pool')}
          className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-[#8B1E2D] hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                6k Wallet Pool
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-[#8B1E2D] flex items-center justify-center shrink-0">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono text-[#8B1E2D] truncate tracking-tight">
              6,000 <span className="text-xs font-normal text-slate-500">Total</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-2 truncate">
            {activeWalletsCount} Ready for swap
          </div>
        </div>
      </div>

      {/* Charts Section - Cairo Settlement Curve & Payment Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Settlement Volume Chart */}
        <div className="lg:col-span-2 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Intraday Cairo Settlement Curve
              </h2>
              <span className="text-[11px] text-slate-500">Inbound Deposits vs. Dispatched Payouts (EGP)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-100">
              Today
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="depositsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1E2D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B1E2D" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="withdrawalsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), 'EGP')}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Inbound Deposits"
                  stroke="#8B1E2D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#depositsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="withdrawals"
                  name="Dispatched Payouts"
                  stroke="#D97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#withdrawalsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Channel Share */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Payment Channel Share
            </h2>
            <span className="text-[11px] text-slate-500">Vodafone Cash &amp; InstaPay national share</span>
          </div>

          <div className="h-56 sm:h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {providerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `${val}%`}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Operational Action Queues (Deposits & Withdrawals) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Pending Deposits Action Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3 sm:p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B1E2D] animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Live Deposits Action Queue
              </h3>
            </div>
            <button
              onClick={() => setActiveSection('pending-deposits')}
              className="text-[11px] text-[#8B1E2D] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Full Queue ({pendingDeposits.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto no-scrollbar">
            {pendingDeposits.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-0.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#8B1E2D]">
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {tx.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tx.provider}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    <strong className="text-slate-800">{tx.userFullName}</strong> • Phone: <span className="font-mono select-all">{tx.phone || tx.userInfo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setInspectingTransaction(tx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Inspect Order Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDeposit(tx.id)}
                    className="px-3 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>
                </div>
              </div>
            ))}
            {pendingDeposits.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>All inbound deposits are verified and cleared.</span>
              </div>
            )}
          </div>
        </div>

        {/* Pending Withdrawals Action Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3 sm:p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Live Payouts Action Queue
              </h3>
            </div>
            <button
              onClick={() => setActiveSection('pending-withdrawals')}
              className="text-[11px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Full Queue ({pendingWithdrawals.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto no-scrollbar">
            {pendingWithdrawals.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-0.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {tx.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tx.provider}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    <strong className="text-slate-800">{tx.userFullName}</strong> • Target: <span className="font-mono select-all">{tx.phone || tx.userInfo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setInspectingTransaction(tx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Inspect Order Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmWithdrawal(tx.id)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </button>
                </div>
              </div>
            ))}
            {pendingWithdrawals.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>All withdrawal payouts are dispatched.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
