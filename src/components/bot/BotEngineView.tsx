import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  Zap,
  Sliders,
  RotateCcw,
  Activity,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Cpu,
  Users,
  Send,
  Settings2,
  DollarSign,
  Shuffle
} from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { formatCairoTime } from '../../utils/cairoTime';
import { OrderDispatchModal } from '../operations/OrderDispatchModal';

export const BotEngineView: React.FC = () => {
  const {
    botConfig,
    toggleBotEngine,
    updateBotConfig,
    triggerBotOrder,
    wallets,
    agents,
    updateAgent,
    pendingDeposits,
    pendingWithdrawals,
  } = useAppStore();

  const [intervalSec, setIntervalSec] = useState(botConfig.intervalSeconds || 90);
  const [minDeposit, setMinDeposit] = useState(botConfig.minDepositAmount || 50);
  const [maxDeposit, setMaxDeposit] = useState(botConfig.maxDepositAmount || 5000);
  const [depositRatio, setDepositRatio] = useState(botConfig.depositRatio || 0.70);
  const [targetDepositPercent, setTargetDepositPercent] = useState(botConfig.targetDepositPercent || 70);
  const [ratioJitterPercent, setRatioJitterPercent] = useState(botConfig.ratioJitterPercent !== undefined ? botConfig.ratioJitterPercent : 10);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedAgentForDispatch, setSelectedAgentForDispatch] = useState<string>('');

  const [recentGeneratedLog, setRecentGeneratedLog] = useState<string[]>([
    `[${formatCairoTime(new Date())}] Bot Engine active with 6,000 randomized Egyptian wallet registry`,
    `[${formatCairoTime(new Date())}] Dynamic deposit/withdrawal ratio set to 70/30 with ±10% random bot jitter`,
    `[${formatCairoTime(new Date())}] Pulse timer synchronized with Africa/Cairo real-time clock`,
    `[${formatCairoTime(new Date())}] Automatic agent quota balancer armed`
  ]);

  const handleSaveGlobalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const ratioDec = targetDepositPercent / 100;
    updateBotConfig({
      intervalSeconds: Number(intervalSec),
      minDepositAmount: Number(minDeposit),
      maxDepositAmount: Number(maxDeposit),
      depositRatio: ratioDec,
      targetDepositPercent: Number(targetDepositPercent),
      ratioJitterPercent: Number(ratioJitterPercent),
      effectiveTodayDepositRatio: ratioDec,
    });
  };

  const handleManualTriggerSingle = () => {
    triggerBotOrder();
    const newEntry = `[${formatCairoTime(new Date())}] Single Order Pulse Fired across 6,000 wallet pool`;
    setRecentGeneratedLog((prev) => [newEntry, ...prev.slice(0, 14)]);
  };

  const handleBatchTrigger = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        triggerBotOrder();
      }, i * 300);
    }
    const newEntry = `[${formatCairoTime(new Date())}] Batch Dispatched: ${count} randomized orders distributed to active agents`;
    setRecentGeneratedLog((prev) => [newEntry, ...prev.slice(0, 14)]);
  };

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb items={[{ label: 'System Engine', section: 'bot-engine' }, { label: '6k Traffic Engine & Quotas' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#8B1E2D]" />
            <span>6,000 Wallets Automated Traffic Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Decentralized order generator distributing authentic deposit/withdrawal flow from 6,000 persistent wallets to agent terminals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-rose-300" />
            <span>Open Order Form</span>
          </button>

          <button
            onClick={toggleBotEngine}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${
              botConfig.isRunning || botConfig.isEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {botConfig.isRunning || botConfig.isEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Auto-Traffic Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Traffic Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">6k Pool Size</span>
            <Layers className="w-4 h-4 text-[#8B1E2D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#8B1E2D]">6,000</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Vodafone, Orange, Etisalat, InstaPay
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Subagents</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {agents.filter((a) => a.trafficEnabled || a.trafficActive).length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {agents.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Eligible for automatic order dispatch
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pulse Cycle</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {botConfig.intervalSeconds || 90}s <span className="text-xs font-normal text-slate-400">(Cairo Time)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Automated pulse every 1.5 minutes
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inbound Split Ratio</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {targetDepositPercent}% Dep / {100 - targetDepositPercent}% Wd
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Jitter: ±{ratioJitterPercent}% ({Math.max(0, targetDepositPercent - ratioJitterPercent)}%-{Math.min(100, targetDepositPercent + ratioJitterPercent)}%)</span>
            <span className="text-emerald-700 font-bold font-mono">
              Live: {Math.round((botConfig.effectiveTodayDepositRatio || targetDepositPercent / 100) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Agent Traffic Configuration Matrix */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#8B1E2D]" />
            <span>Per-Agent Bot Traffic & Limits Configuration</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Customizable Deposit/Withdrawal ratio, dynamic ±jitter, and daily caps per agent
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                <th className="py-2.5 px-3 font-semibold text-[11px]">Subagent Name</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Traffic Status</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Deposit Ratio & Jitter</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Daily Quota (Orders)</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Daily Money Cap</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Speed Mode</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Today Progress</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Instant Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => {
                const agDepositPct = agent.customDepositPercent !== undefined ? agent.customDepositPercent : targetDepositPercent;
                const agJitterPct = agent.customRatioJitter !== undefined ? agent.customRatioJitter : ratioJitterPercent;
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{agent.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Insurance: {formatCurrency(agent.insuranceDeposit, 'EGP')} • Threshold: {formatCurrency(agent.trafficThreshold, 'EGP')}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() =>
                          updateAgent(agent.id, {
                            trafficActive: !agent.trafficActive,
                            trafficEnabled: !agent.trafficActive,
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          agent.trafficActive || agent.trafficEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {agent.trafficActive || agent.trafficEnabled ? 'Live Receiving' : 'Traffic Paused'}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="5"
                            max="95"
                            value={agDepositPct}
                            onChange={(e) =>
                              updateAgent(agent.id, { customDepositPercent: Number(e.target.value) })
                            }
                            className="w-12 h-6 px-1 border border-slate-300 rounded font-mono text-center text-xs font-bold text-slate-800"
                            title="Target Deposit % (e.g. 70%)"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">% Dep</span>
                        </div>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={agJitterPct}
                            onChange={(e) =>
                              updateAgent(agent.id, { customRatioJitter: Number(e.target.value) })
                            }
                            className="w-10 h-6 px-1 border border-amber-300 bg-amber-50/50 rounded font-mono text-center text-xs text-amber-800"
                            title="Random Jitter ±% (e.g. ±10%)"
                          />
                          <span className="text-[10px] text-amber-700 font-mono">±%</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        Range: {Math.max(0, agDepositPct - agJitterPct)}% - {Math.min(100, agDepositPct + agJitterPct)}% Dep
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={agent.dailyOrdersMin || agent.dailyOrderLimit?.min || 10}
                          onChange={(e) =>
                            updateAgent(agent.id, { dailyOrdersMin: Number(e.target.value) })
                          }
                          className="w-12 h-6 px-1 border border-slate-300 rounded font-mono text-center text-xs"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          min="5"
                          value={agent.dailyOrdersMax || agent.dailyOrderLimit?.max || 50}
                          onChange={(e) =>
                            updateAgent(agent.id, { dailyOrdersMax: Number(e.target.value) })
                          }
                          className="w-12 h-6 px-1 border border-slate-300 rounded font-mono text-center text-xs"
                        />
                        <span className="text-[10px] text-slate-400">orders</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1000"
                          value={agent.dailyVolumeMaxEGP || agent.dailyOrderLimit?.dailyMoneyCap || 40000}
                          onChange={(e) =>
                            updateAgent(agent.id, { dailyVolumeMaxEGP: Number(e.target.value) })
                          }
                          className="w-20 h-6 px-1 border border-slate-300 rounded font-mono text-xs text-[#8B1E2D] font-bold"
                        />
                        <span className="text-[10px] text-slate-500">EGP</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={agent.speedMode || 'medium'}
                        onChange={(e) =>
                          updateAgent(agent.id, { speedMode: e.target.value as any })
                        }
                        className="h-6 px-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800 font-medium"
                      >
                        <option value="low">Low (120-180s)</option>
                        <option value="medium">Medium (60-90s)</option>
                        <option value="fast">Fast (30-45s)</option>
                        <option value="turbo">Turbo (15s)</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-900 font-bold">
                        {agent.todayAssignedOrders || agent.processedOrdersCount || 0} orders
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatCurrency(agent.todayAssignedVolumeEGP || agent.processedVolume || 0, 'EGP')}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedAgentForDispatch(agent.id);
                          setIsDispatchModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-[11px] font-semibold flex items-center gap-1 ml-auto shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Order</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Controls & Pulse Live Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Global Dispatch Controls */}
        <div className="bg-white rounded border border-slate-200 shadow-2xs p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Instant Test Dispatch Triggers</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleManualTriggerSingle}
              className="py-2.5 px-3 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Fire Single Order Pulse</span>
            </button>

            <button
              onClick={() => handleBatchTrigger(5)}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <Shuffle className="w-4 h-4 text-rose-300" />
              <span>Dispatch Batch (5 Orders)</span>
            </button>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveGlobalConfig} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Pulse Interval (Sec)</label>
                <input
                  type="number"
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Target Deposit % (e.g. 70%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5"
                    max="95"
                    value={targetDepositPercent}
                    onChange={(e) => setTargetDepositPercent(Number(e.target.value))}
                    className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900 font-bold"
                  />
                  <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    ({100 - targetDepositPercent}% Wd)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-900">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">Bot Dynamic Jitter:</span>
                <span className="font-mono font-bold">±{ratioJitterPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={ratioJitterPercent}
                  onChange={(e) => setRatioJitterPercent(Number(e.target.value))}
                  className="w-full h-1.5 accent-amber-600 bg-amber-200 rounded cursor-pointer"
                />
              </div>
              <div className="text-[10px] text-amber-700 mt-1">
                The bot dynamically randomizes the deposit/cashout ratio for each agent within ({Math.max(0, targetDepositPercent - ratioJitterPercent)}% to {Math.min(100, targetDepositPercent + ratioJitterPercent)}%) to emulate natural liquidity variance.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Min Order Amount (EGP)</label>
                <input
                  type="number"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(Number(e.target.value))}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Max Order Amount (EGP)</label>
                <input
                  type="number"
                  value={maxDeposit}
                  onChange={(e) => setMaxDeposit(Number(e.target.value))}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Save Dynamic Ratio Engine Settings
            </button>
          </form>
        </div>

        {/* Live Cairo Pulse Feed */}
        <div className="bg-white rounded border border-slate-200 shadow-2xs p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#8B1E2D]" />
              <span>Live Traffic Activity Feed (Cairo Time)</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Pulse
            </span>
          </div>

          <div className="flex-1 bg-slate-900 text-slate-300 font-mono text-[11px] p-3 rounded overflow-y-auto max-h-72 space-y-1.5">
            {recentGeneratedLog.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-emerald-400">❯</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Order Dispatch Modal */}
      <OrderDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setSelectedAgentForDispatch('');
        }}
        defaultAgentId={selectedAgentForDispatch}
      />
    </div>
  );
};
