import React, { useState } from 'react';
import {
  Users,
  Plus,
  Power,
  Edit,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Key,
  Smartphone,
  Briefcase,
  Zap,
  Sliders,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { StatusBadge } from '../common/StatusBadge';
import { useAppStore } from '../../store/useAppStore';
import { Agent, AgentDepositRequest } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TrafficDistributionMonitor } from '../admin/TrafficDistributionMonitor';

export const AgentManagementView: React.FC = () => {
  const {
    agents,
    addAgent,
    updateAgent,
    toggleAgentTraffic,
    globalTrafficActive,
    toggleGlobalTraffic,
    agentDepositRequests,
    processAgentDepositRequest,
    setActivePortal,
    setSelectedAgentId,
    setActiveSection,
    wallets,
  } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTrafficReportModalOpen, setIsTrafficReportModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Agent@123456');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceDeposit, setInsuranceDeposit] = useState(50000);
  const [trafficThreshold, setTrafficThreshold] = useState(10000);
  const [speedMode, setSpeedMode] = useState<'low' | 'medium' | 'fast'>('medium');
  const [dailyMin, setDailyMin] = useState(20);
  const [dailyMax, setDailyMax] = useState(150);
  const [dailyMoneyCap, setDailyMoneyCap] = useState(100000);
  const [depositCommission, setDepositCommission] = useState(3.0);
  const [withdrawalCommission, setWithdrawalCommission] = useState(1.0);
  const [currency, setCurrency] = useState('EGP');
  const [depositMethod, setDepositMethod] = useState('Vodafone Cash');
  const [depositAddress, setDepositAddress] = useState('01031860138');

  // Payment Methods State
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useAppStore();
  const [newPaymentMethodName, setNewPaymentMethodName] = useState('');
  const [editingMethod, setEditingMethod] = useState<{ oldName: string; newName: string } | null>(null);

  // Reviewing Agent Deposit Request modal
  const [reviewingReq, setReviewingReq] = useState<AgentDepositRequest | null>(null);
  const [customApproveAmount, setCustomApproveAmount] = useState<number>(0);

  const pendingRequests = agentDepositRequests.filter((r) => r.status === 'Pending');

  const totalInsurance = agents.reduce((acc, a) => acc + a.insuranceDeposit, 0);
  const totalProcessed = agents.reduce((acc, a) => acc + (a.processedOrdersCount || a.todayProcessedCount || 0), 0);
  const totalVolume = agents.reduce((acc, a) => acc + (a.processedVolume || a.todayAssignedVolumeEGP || 0), 0);

  const handleOpenAdd = () => {
    setEditingAgent(null);
    setName('');
    setUsername('');
    setPassword('Agent@123456');
    setEmail('');
    setPhone('');
    setInsuranceDeposit(50000);
    setTrafficThreshold(10000);
    setSpeedMode('medium');
    setDailyMin(20);
    setDailyMax(150);
    setDailyMoneyCap(100000);
    setDepositCommission(3.0);
    setWithdrawalCommission(1.0);
    setCurrency('EGP');
    setDepositMethod(paymentMethods[0] || 'Vodafone Cash');
    setDepositAddress('01031860138');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (a: Agent) => {
    setEditingAgent(a);
    setName(a.name);
    setUsername(a.username);
    setPassword(a.password || 'Agent@123456');
    setEmail(a.email);
    setPhone(a.phone);
    setInsuranceDeposit(a.insuranceDeposit);
    setTrafficThreshold(a.trafficThreshold);
    setSpeedMode(a.speedMode || 'medium');
    setDailyMin(a.dailyOrderLimit?.min || 10);
    setDailyMax(a.dailyOrderLimit?.max || 100);
    setDailyMoneyCap(a.dailyOrderLimit?.dailyMoneyCap || 50000);
    setDepositCommission(a.depositCommissionPercent !== undefined ? a.depositCommissionPercent : 3.0);
    setWithdrawalCommission(a.withdrawalCommissionPercent !== undefined ? a.withdrawalCommissionPercent : 1.0);
    setCurrency(a.currency || 'EGP');
    setDepositMethod(a.depositMethod || a.depositPaymentMethod || 'Vodafone Cash');
    setDepositAddress(a.depositAddress || a.depositPaymentAddress || '01031860138');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAgent) {
      updateAgent(editingAgent.id, {
        name,
        username,
        password,
        email,
        phone,
        insuranceDeposit,
        trafficThreshold,
        speedMode,
        depositCommissionPercent: Number(depositCommission),
        withdrawalCommissionPercent: Number(withdrawalCommission),
        currency,
        dailyOrderLimit: {
          min: dailyMin,
          max: dailyMax,
          dailyMoneyCap: dailyMoneyCap,
        },
        depositMethod,
        depositAddress,
      });
    } else {
      addAgent({
        name,
        username,
        password,
        email,
        phone,
        status: 'active',
        currentBalance: insuranceDeposit,
        insuranceDeposit,
        trafficThreshold,
        trafficActive: true,
        speedMode,
        dailyOrdersMin: dailyMin,
        dailyOrdersMax: dailyMax,
        dailyVolumeMinEGP: 1000,
        dailyVolumeMaxEGP: dailyMoneyCap,
        depositCommissionPercent: Number(depositCommission),
        withdrawalCommissionPercent: Number(withdrawalCommission),
        currency,
        depositPaymentMethod: depositMethod,
        depositPaymentAddress: depositAddress,
        dailyOrderLimit: {
          min: dailyMin,
          max: dailyMax,
          dailyMoneyCap: dailyMoneyCap,
        },
        depositMethod,
        depositAddress,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleLoginAsAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActivePortal('agent');
    setActiveSection('agent-portal');
  };

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb items={[{ label: 'Agent Network', section: 'agent-management' }, { label: 'Subagent Accounts & Quotas' }]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#8B1E2D]" />
            <span>Subagent Network & Daily Quotas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure agent insurance collateral, daily Min/Max order limits, daily cash volume caps, and traffic routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsTrafficReportModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer border border-slate-700"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Traffic Imbalance Report</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Subagent</span>
          </button>
        </div>
      </div>

      {/* Central Master Traffic Dispatcher Controls */}
      <div className={`p-4 rounded border shadow-sm transition-all ${
        globalTrafficActive ? 'bg-slate-900 border-emerald-800 text-white' : 'bg-slate-900 border-rose-800 text-white'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded bg-slate-800 flex items-center justify-center shrink-0 border ${
              globalTrafficActive ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Central Traffic Control Switch</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  globalTrafficActive ? 'bg-emerald-500 text-slate-950' : 'bg-rose-600 text-white'
                }`}>
                  {globalTrafficActive ? 'TRAFFIC ENABLED' : 'TRAFFIC PAUSED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {globalTrafficActive
                  ? 'Master traffic switch is ON. Operations flow directly to active subagents.'
                  : 'Master traffic switch is OFF. All agent queues are paused centrally.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleGlobalTraffic}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              globalTrafficActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{globalTrafficActive ? 'PAUSE ALL TRAFFIC' : 'ENABLE ALL TRAFFIC'}</span>
          </button>
        </div>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Agents</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">{agents.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {agents.filter((a) => a.trafficEnabled).length} Traffic Enabled
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Collateral Pool</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-[#8B1E2D]">
            {formatCurrency(totalInsurance, 'EGP')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Available insurance balance
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Settled Orders</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">{totalProcessed.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Daily throughput
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Settled Volume</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(totalVolume, 'EGP')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total lifetime volume
          </div>
        </div>
      </div>

      {/* Pending Agent Deposit Requests Box */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Pending Subagent Deposit Requests ({pendingRequests.length})</span>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Action Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white p-3 rounded border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{req.agentName}</div>
                  <div className="text-slate-500 text-[11px]">
                    Requested: <strong className="text-[#8B1E2D] font-mono">{formatCurrency(req.requestedAmount || req.amountRequested, 'EGP')}</strong> via {req.paymentMethod}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {req.txReference || req.referenceNumber || req.id}</div>
                </div>

                <button
                  onClick={() => {
                    setReviewingReq(req);
                    setCustomApproveAmount(req.requestedAmount || req.amountRequested || 0);
                  }}
                  className="px-3 py-1 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold shadow-2xs"
                >
                  Review & Credit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents Roster Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Active Subagents Directory
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">{agents.length} Registered Nodes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                <th className="py-2.5 px-3 font-semibold text-[11px]">Subagent Name</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Insurance Collateral</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Admin Commission (%)</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Currency</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Daily Order Quota</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Daily Money Cap</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-center">Traffic Route</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Speed Mode</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Assigned Wallets</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => {
                const assignedWalletsCount = wallets.filter((w) => w.assignedAgentId === agent.id).length;
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{agent.phone} • @{agent.username}</div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-[#8B1E2D]">
                      {formatCurrency(agent.insuranceDeposit, agent.currency || 'EGP')}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-mono text-[11px] space-y-0.5">
                        <div className="text-emerald-700 font-semibold">
                          Dep: <span className="font-bold">{agent.depositCommissionPercent !== undefined ? agent.depositCommissionPercent : 3.0}%</span>
                        </div>
                        <div className="text-blue-700 font-semibold">
                          Wdl: <span className="font-bold">{agent.withdrawalCommissionPercent !== undefined ? agent.withdrawalCommissionPercent : 1.0}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold text-slate-800 border border-slate-200">
                        {agent.currency || 'EGP'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-800">
                        {agent.dailyOrderLimit?.min || 10} - {agent.dailyOrderLimit?.max || 100} orders/day
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Today: <span className="font-bold text-slate-700">{agent.processedOrdersCount}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                      {formatCurrency(agent.dailyOrderLimit?.dailyMoneyCap || 50000, agent.currency || 'EGP')}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleAgentTraffic(agent.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          agent.trafficEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title="Toggle agent traffic intake"
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{agent.trafficEnabled ? 'Traffic ON' : 'Paused'}</span>
                      </button>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-700 border border-slate-200 uppercase">
                        {agent.speedMode || 'Medium'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {assignedWalletsCount}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400">wallets</span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLoginAsAgent(agent.id)}
                          className="px-2 py-1 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                          title="Open Agent Operational Terminal"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Terminal</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(agent)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Edit Quotas & Limits"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods Management Section */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#8B1E2D]" />
              <span>Payment Methods Management</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Admin control over system-wide supported payment methods (Vodafone Cash, InstaPay, Orange Cash, etc.).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New payment method name..."
              value={newPaymentMethodName}
              onChange={(e) => setNewPaymentMethodName(e.target.value)}
              className="h-8 px-2.5 border border-slate-300 rounded text-xs bg-white text-slate-800 w-48 sm:w-60 focus:ring-1 focus:ring-[#8B1E2D]"
            />
            <button
              onClick={() => {
                if (newPaymentMethodName.trim()) {
                  addPaymentMethod(newPaymentMethodName);
                  setNewPaymentMethodName('');
                }
              }}
              className="px-3 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white text-xs font-semibold rounded flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Method</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
          {paymentMethods.map((method) => {
            const isEditingThis = editingMethod?.oldName === method;
            return (
              <div
                key={method}
                className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between gap-2 text-xs"
              >
                {isEditingThis ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editingMethod.newName}
                      onChange={(e) => setEditingMethod({ ...editingMethod, newName: e.target.value })}
                      className="h-7 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 w-full"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (editingMethod.newName.trim()) {
                          updatePaymentMethod(editingMethod.oldName, editingMethod.newName);
                          setEditingMethod(null);
                        }
                      }}
                      className="p-1 bg-emerald-700 text-white rounded hover:bg-emerald-800"
                      title="Save"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingMethod(null)}
                      className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                      title="Cancel"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8B1E2D]"></span>
                      <span>{method}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingMethod({ oldName: method, newName: method })}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
                        title="Edit name"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deletePaymentMethod(method)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Delete method"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Deposit Request Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Credit Subagent Insurance</span>
              </h3>
            </div>

            <div className="text-xs space-y-2">
              <div>Agent: <strong className="text-slate-900">{reviewingReq.agentName}</strong></div>
              <div>Requested Amount: <strong className="text-[#8B1E2D] font-mono">{formatCurrency(reviewingReq.requestedAmount || reviewingReq.amountRequested, 'EGP')}</strong></div>
              <div>Method: <span className="font-mono">{reviewingReq.paymentMethod}</span></div>
              <div>Proof / Ref: <span className="font-mono text-slate-600">{reviewingReq.txReference || reviewingReq.referenceNumber || '-'}</span></div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">Approved Credit Amount (EGP)</label>
              <input
                type="number"
                value={customApproveAmount}
                onChange={(e) => setCustomApproveAmount(Number(e.target.value))}
                className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-[#8B1E2D]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setReviewingReq(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  processAgentDepositRequest(reviewingReq.id, 'Approved', customApproveAmount);
                  setReviewingReq(null);
                }}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-2xs"
              >
                Approve & Credit Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Subagent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-slate-200 text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {editingAgent ? 'Edit Subagent Configuration' : 'Register New Subagent'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Subagent Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agent Cairo Express"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Username / Code</label>
                  <input
                    type="text"
                    required
                    placeholder="cairo_express"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="010..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Password</label>
                  <input
                    type="text"
                    required
                    placeholder="Agent password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5 text-[#8B1E2D]">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Admin Commission Rates & Currency</span>
                </h4>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Deposit Commission (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={depositCommission}
                      onChange={(e) => setDepositCommission(Number(e.target.value))}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono text-emerald-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Withdrawal Commission (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={withdrawalCommission}
                      onChange={(e) => setWithdrawalCommission(Number(e.target.value))}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono text-blue-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      placeholder="EGP / USD / USDT"
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Assigned Payment Method</label>
                    <select
                      value={depositMethod}
                      onChange={(e) => setDepositMethod(e.target.value)}
                      className="w-full h-8 px-2 border border-slate-300 rounded bg-white text-slate-800"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Deposit Address / Phone</label>
                    <input
                      type="text"
                      value={depositAddress}
                      onChange={(e) => setDepositAddress(e.target.value)}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5 text-[#8B1E2D]">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Quota & Financial Capacity Safeguards</span>
                </h4>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Insurance Deposit</label>
                    <input
                      type="number"
                      value={insuranceDeposit}
                      onChange={(e) => setInsuranceDeposit(Number(e.target.value))}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Min Orders / Day</label>
                    <input
                      type="number"
                      value={dailyMin}
                      onChange={(e) => setDailyMin(Number(e.target.value))}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Max Orders / Day</label>
                    <input
                      type="number"
                      value={dailyMax}
                      onChange={(e) => setDailyMax(Number(e.target.value))}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Daily Money Cap</label>
                    <input
                      type="number"
                      value={dailyMoneyCap}
                      onChange={(e) => setDailyMoneyCap(Number(e.target.value))}
                      className="w-full h-8 px-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Speed Mode</label>
                    <select
                      value={speedMode}
                      onChange={(e) => setSpeedMode(e.target.value as any)}
                      className="w-full h-8 px-2 border border-slate-300 rounded"
                    >
                      <option value="low">Low (Conservative)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="fast">Fast (High-Throughput)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold shadow-2xs"
                >
                  Save Subagent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Traffic Distribution & Imbalance Report Modal */}
      {isTrafficReportModalOpen && (
        <TrafficDistributionMonitor
          isModal={true}
          onClose={() => setIsTrafficReportModalOpen(false)}
        />
      )}
    </div>
  );
};
