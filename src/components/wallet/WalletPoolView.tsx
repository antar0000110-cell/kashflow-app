import React, { useState, useMemo } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  Search,
  SlidersHorizontal,
  Key,
  Copy,
  Check,
  Building,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Percent,
  Cpu,
  Layers
} from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { StatusBadge } from '../common/StatusBadge';
import { PaginationBar } from '../common/PaginationBar';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, generateTimeBasedOtp } from '../../utils/formatters';
import { Wallet } from '../../types';

export const WalletPoolView: React.FC = () => {
  const {
    wallets,
    agents,
    addWalletsToPool,
    generateManualWallet,
    assignWalletsToAgent,
    updateWalletLimits,
    totalSimulatedWalletsCount,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedWalletForAssign, setSelectedWalletForAssign] = useState<Wallet | null>(null);
  const [assignedAgentId, setAssignedAgentId] = useState('');

  const [selectedWalletForLimits, setSelectedWalletForLimits] = useState<Wallet | null>(null);
  const [dailyLimit, setDailyLimit] = useState(20000);
  const [singleLimit, setSingleLimit] = useState(5000);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [otpModalWallet, setOtpModalWallet] = useState<Wallet | null>(null);

  // Manual Wallet Generation Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genPhone, setGenPhone] = useState('');
  const [genProvider, setGenProvider] = useState('Vodafone Cash');
  const [genAgentId, setGenAgentId] = useState('');
  const [genDailySendLimit, setGenDailySendLimit] = useState(30000);
  const [genDailyReceiveLimit, setGenDailyReceiveLimit] = useState(30000);
  const [genMonthlyLimit, setGenMonthlyLimit] = useState(100000);
  const [genMaxSingleLimit, setGenMaxSingleLimit] = useState(5000);
  const [genInitialBalance, setGenInitialBalance] = useState(0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      const num = w.phoneNumber || w.accountNumber || w.walletNumber || '';
      const holder = w.accountHolder || '';
      const matchesSearch =
        num.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterProvider !== 'all' && w.provider !== filterProvider) return false;
      if (filterAgent !== 'all' && w.assignedAgentId !== filterAgent) return false;
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      return true;
    });
  }, [wallets, searchTerm, filterProvider, filterAgent, filterStatus]);

  const paginatedWallets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWallets.slice(start, start + pageSize);
  }, [filteredWallets, currentPage, pageSize]);

  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const assignedCount = wallets.filter((w) => !!w.assignedAgentId).length;

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb items={[{ label: 'Agent Management', section: 'agent-management' }, { label: '6,000 Wallets & OTP Pool' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8B1E2D]" />
            <span>6,000 Decentralized Wallets & OTP Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Decentralized wallet repository storing up to 6,000 SIMs/wallets for dynamic subagent order rotation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>توليد محفظة جديدة (Generate Wallet)</span>
          </button>
          <button
            onClick={() => addWalletsToPool(50)}
            className="px-3 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate 50 Pool Wallets</span>
          </button>
        </div>
      </div>

      {/* Pool Capacity Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pool Target / Capacity</span>
            <Cpu className="w-4 h-4 text-[#8B1E2D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#8B1E2D]">
            {wallets.length} <span className="text-xs font-normal text-slate-400">/ 6,000</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#8B1E2D] h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (wallets.length / 6000) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned to Subagents</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {assignedCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({wallets.length ? Math.round((assignedCount / wallets.length) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {wallets.length - assignedCount} unassigned in central pool
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Liquidity in Pool</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(totalBalance, 'EGP')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Aggregated SIM balances
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">OTP Gateway State</span>
            <Key className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600">
            Online • Live
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Real-time Cairo verification
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
        <div>
          <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Search Wallet</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="010..., holder, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-7 pl-7 pr-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Provider</label>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
          >
            <option value="all">All Providers</option>
            <option value="Vodafone Cash">Vodafone Cash</option>
            <option value="InstaPay">InstaPay</option>
            <option value="Orange Cash">Orange Cash</option>
            <option value="Etisalat Cash">Etisalat Cash</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Assigned Agent</label>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
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
          <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                <th className="py-2.5 px-3 font-semibold text-[11px]">Wallet Phone</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Provider</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Current Balance</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Daily Limit</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Assigned Agent</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right">OTP & Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedWallets.map((w) => {
                const phone = w.phoneNumber || w.accountNumber || w.walletNumber || '010...';
                return (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                        <span>{phone}</span>
                        <button
                          onClick={() => handleCopy(phone)}
                          className="text-slate-400 hover:text-[#8B1E2D]"
                          title="Copy phone"
                        >
                          {copiedText === phone ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {w.id}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 border border-slate-200 font-medium">
                        {w.provider}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-[#8B1E2D]">
                      {formatCurrency(w.balance || 0, 'EGP')}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {formatCurrency(w.dailyLimit || 30000, 'EGP')}
                    </td>

                    <td className="py-2.5 px-3">
                      {w.assignedAgentName ? (
                        <span className="font-semibold text-slate-800">{w.assignedAgentName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned (Pool)</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={w.status} />
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setOtpModalWallet(w)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-mono font-semibold flex items-center gap-1 border border-slate-300"
                        >
                          <Key className="w-3 h-3 text-[#8B1E2D]" />
                          <span>OTP</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedWalletForAssign(w);
                            setAssignedAgentId(w.assignedAgentId || '');
                          }}
                          className="px-2 py-1 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-[11px] font-semibold"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/50">
          <PaginationBar
            totalItems={filteredWallets.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Assign Agent Modal */}
      {selectedWalletForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Assign Wallet to Subagent
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Wallet Phone: {selectedWalletForAssign.phoneNumber || selectedWalletForAssign.accountNumber}
            </p>

            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">Select Subagent</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
              >
                <option value="">Unassign / Return to Pool</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedWalletForAssign(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  assignWalletsToAgent([selectedWalletForAssign.id], assignedAgentId || '');
                  setSelectedWalletForAssign(null);
                }}
                className="px-4 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Display Modal */}
      {otpModalWallet && (() => {
        const activeOtp = generateTimeBasedOtp(otpModalWallet.walletNumber || otpModalWallet.phoneNumber || otpModalWallet.accountNumber || '');
        const timeRemaining = Math.floor((300000 - (Date.now() % 300000)) / 1000);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-slate-200 text-slate-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#8B1E2D] mx-auto flex items-center justify-center animate-pulse">
                <Key className="w-5 h-5" />
              </div>

              <h3 className="font-bold text-sm text-slate-900">
                Live Authentication OTP
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Phone: {otpModalWallet.walletNumber || otpModalWallet.phoneNumber || otpModalWallet.accountNumber}
              </p>

              <div className="py-3 bg-slate-50 rounded-xl border border-[#8B1E2D]/20 shadow-3xs">
                <span className="font-mono font-black text-3xl tracking-[0.2em] text-[#8B1E2D] pl-[0.2em]">
                  {activeOtp}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-medium">
                  Rotates automatically every 5 minutes
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${(timeRemaining / 300) * 100}%` }} 
                  />
                </div>
              </div>

              <button
                onClick={() => setOtpModalWallet(null)}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* Manual Wallet Generation Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  <WalletIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">توليد محفظة يدوي / Generate Manual Wallet</h3>
                  <p className="text-[11px] text-slate-500">
                    إنشاء محفظة وتخصيص الحدود الخاصة بها أو استخدام الحدود العامة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم المحفظة (اختر أو اترك تلقائي)</label>
                <input
                  type="text"
                  placeholder="010XXXXXXXX (تلقائي إن تُرك فارغاً)"
                  value={genPhone}
                  onChange={(e) => setGenPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-[#8B1E2D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">مزود المحفظة (Provider)</label>
                <select
                  value={genProvider}
                  onChange={(e) => setGenProvider(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="Vodafone Cash">Vodafone Cash (فودافون كاش)</option>
                  <option value="InstaPay">InstaPay (انستا باي)</option>
                  <option value="Orange Cash">Orange Cash (أورنج كاش)</option>
                  <option value="Etisalat Cash">Etisalat Cash (اتصالات كاش)</option>
                  <option value="CIB Smart Wallet">CIB Smart Wallet</option>
                  <option value="WE Pay">WE Pay (وي باي)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تعيين لوكيل (Assigned Agent)</label>
                <select
                  value={genAgentId}
                  onChange={(e) => setGenAgentId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-800"
                >
                  <option value="">بدون وكيل (Unassigned Pool)</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الرصيد المبدئي (Initial Balance EGP)</label>
                <input
                  type="number"
                  value={genInitialBalance}
                  onChange={(e) => setGenInitialBalance(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-[#8B1E2D] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">إعدادات حدود التداول (Transaction Limits)</span>
                <button
                  type="button"
                  onClick={() => {
                    setGenDailySendLimit(30000);
                    setGenDailyReceiveLimit(30000);
                    setGenMonthlyLimit(100000);
                    setGenMaxSingleLimit(5000);
                  }}
                  className="text-[10px] text-[#8B1E2D] hover:underline font-semibold"
                >
                  استعادة الحدود العامة (Admin Defaults)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-600 text-[11px]">حد إرسال يومي (Daily Send)</label>
                  <input
                    type="number"
                    value={genDailySendLimit}
                    onChange={(e) => setGenDailySendLimit(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px]">حد استقبال يومي (Daily Receive)</label>
                  <input
                    type="number"
                    value={genDailyReceiveLimit}
                    onChange={(e) => setGenDailyReceiveLimit(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px]">حد شهري إجمالي (Monthly Ceiling)</label>
                  <input
                    type="number"
                    value={genMonthlyLimit}
                    onChange={(e) => setGenMonthlyLimit(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px]">حد العملية الواحدة (Single Max)</label>
                  <input
                    type="number"
                    value={genMaxSingleLimit}
                    onChange={(e) => setGenMaxSingleLimit(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
              >
                إلغاء (Cancel)
              </button>
              <button
                onClick={() => {
                  generateManualWallet({
                    phoneNumber: genPhone,
                    provider: genProvider,
                    agentId: genAgentId || null,
                    dailySendLimit: genDailySendLimit,
                    dailyReceiveLimit: genDailyReceiveLimit,
                    monthlyLimit: genMonthlyLimit,
                    maxSingleLimit: genMaxSingleLimit,
                    initialBalance: genInitialBalance,
                  });
                  setIsGenModalOpen(false);
                  setGenPhone('');
                }}
                className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-2xs"
              >
                توليد وإضافة المحفظة (Create Wallet)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
