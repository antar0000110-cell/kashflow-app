import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  User,
  Phone,
  DollarSign,
  Building2,
  Users,
  ShieldCheck,
  Clock,
  Shuffle,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Transaction } from '../../types';
import { formatCurrency, generateHash, generateRandomId } from '../../utils/formatters';
import { formatCairoTime, getCairoCurrentTimeString } from '../../utils/cairoTime';
import { soundManager } from '../../utils/soundAlerts';
import { getRandomEgyptianName, SIMULATION_WALLET_POOL, generateWalletNumber } from '../../services/mockData';

interface OrderDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAgentId?: string;
  defaultType?: 'deposit' | 'withdrawal';
}

export const OrderDispatchModal: React.FC<OrderDispatchModalProps> = ({
  isOpen,
  onClose,
  defaultAgentId,
  defaultType = 'deposit'
}) => {
  const {
    agents,
    wallets,
    pendingDeposits,
    pendingWithdrawals,
    addNotification,
  } = useAppStore();

  const [orderType, setOrderType] = useState<'deposit' | 'withdrawal'>(defaultType);
  const [customerName, setCustomerName] = useState(getRandomEgyptianName());
  const [customerPhone, setCustomerPhone] = useState(generateWalletNumber());
  const [amount, setAmount] = useState<number>(500);
  const [provider, setProvider] = useState('TRC20 Network');
  const [bankName, setBankName] = useState('TRC20 Network Gateway');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    defaultAgentId || (agents.length > 0 ? agents[0].id : '')
  );
  const [targetWalletNumber, setTargetWalletNumber] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>(`TRC-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [notes, setNotes] = useState<string>('Standard client order via direct mobile channel');
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [cairoLiveTime, setCairoLiveTime] = useState<string>(getCairoCurrentTimeString());

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCairoLiveTime(getCairoCurrentTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update target wallet when agent changes
  useEffect(() => {
    if (selectedAgentId) {
      const agentWallets = wallets.filter(
        (w) => w.agentId === selectedAgentId || w.assignedAgentId === selectedAgentId
      );
      if (agentWallets.length > 0) {
        setTargetWalletNumber(agentWallets[0].walletNumber || agentWallets[0].phoneNumber || '');
      } else {
        setTargetWalletNumber(customerPhone);
      }
    }
  }, [selectedAgentId, wallets, customerPhone]);

  if (!isOpen) return null;

  const handleRandomizeCustomer = () => {
    const randomPoolIndex = Math.floor(Math.random() * SIMULATION_WALLET_POOL.length);
    const poolItem = SIMULATION_WALLET_POOL[randomPoolIndex];
    setCustomerName(poolItem.name || getRandomEgyptianName());
    setCustomerPhone(poolItem.number);
    setProvider(poolItem.provider);
    setBankName(`${poolItem.provider} Gateway`);
    
    const prefix = 'TRC';
    setReferenceCode(`${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const targetAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
    const now = new Date();
    const cairoFormatted = formatCairoTime(now);
    const hash = generateHash(20);
    const txId = orderType === 'deposit' ? `TX-${generateRandomId('', 6)}` : `TX-WD-${generateRandomId('', 4)}`;

    if (orderType === 'deposit') {
      const newDeposit: Transaction = {
        id: txId,
        userId: `USR-${customerPhone.slice(-4)}`,
        userFullName: customerName,
        amount: Number(amount),
        currency: 'USDT',
        status: 'Pending',
        bankName: bankName,
        provider: provider,
        type: 'deposit',
        dateOfCreation: cairoFormatted,
        timeOfDeposit: now.toTimeString().substring(0, 8),
        timeOfProcessing: 'Pending confirmation',
        processingTimeMinutes: 0,
        adminName: 'Admin System',
        subagentId: targetAgent ? targetAgent.id : 'AGT-01',
        subagentName: targetAgent ? targetAgent.name : 'Central Operations',
        targetWalletId: targetWalletNumber || customerPhone,
        userInfo: `${customerPhone}\nClient submitted proof for ${provider} transfer\nRef: ${referenceCode}\nNotes: ${notes}`,
        phone: customerPhone,
        referenceHash: referenceCode,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 4 * 3600000).toISOString(),
      };

      // Update store
      useAppStore.setState((state) => ({
        pendingDeposits: [newDeposit, ...state.pendingDeposits],
        agents: state.agents.map((a) =>
          a.id === (targetAgent ? targetAgent.id : '')
            ? {
                ...a,
                todayAssignedOrders: (a.todayAssignedOrders || a.processedOrdersCount || 0) + 1,
                todayAssignedVolumeUSDT: (a.todayAssignedVolumeUSDT || a.processedVolume || 0) + Number(amount),
                lastActiveAt: new Date().toISOString(),
              }
            : a
        ),
      }));

      addNotification({
        title: `Inbound Order Dispatched: ${formatCurrency(amount, 'USDT')}`,
        message: `Order #${txId} assigned to [${targetAgent?.name || 'Agent'}]. Client: ${customerName} (${customerPhone})`,
        type: 'info',
        targetSection: 'pending-deposits',
        targetAgentId: targetAgent ? targetAgent.id : undefined,
        targetAudience: 'agent',
      });
    } else {
      const newWithdrawal: Transaction = {
        id: txId,
        userId: `USR-${customerPhone.slice(-4)}`,
        userFullName: customerName,
        amount: Number(amount),
        currency: 'USDT',
        status: 'Pending',
        bankName: bankName,
        provider: provider,
        type: 'withdrawal',
        dateOfCreation: cairoFormatted,
        timeOfProcessing: '0 min',
        processingTimeMinutes: 0,
        adminName: 'Admin System',
        subagentId: targetAgent ? targetAgent.id : 'AGT-01',
        subagentName: targetAgent ? targetAgent.name : 'Central Operations',
        sourceWalletId: targetWalletNumber || customerPhone,
        userInfo: `${customerPhone} - Client payout via ${provider}\nRef: ${referenceCode}\nNotes: ${notes}`,
        phone: customerPhone,
        referenceHash: referenceCode,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 4 * 3600000).toISOString(),
      };

      useAppStore.setState((state) => ({
        pendingWithdrawals: [newWithdrawal, ...state.pendingWithdrawals],
        agents: state.agents.map((a) =>
          a.id === (targetAgent ? targetAgent.id : '')
            ? {
                ...a,
                todayAssignedOrders: (a.todayAssignedOrders || a.processedOrdersCount || 0) + 1,
                lastActiveAt: new Date().toISOString(),
              }
            : a
        ),
      }));

      addNotification({
        title: `Withdrawal Order Dispatched: ${formatCurrency(amount, 'USDT')}`,
        message: `Payout #${txId} assigned to [${targetAgent?.name || 'Agent'}]. Recipient: ${customerName} (${customerPhone})`,
        type: 'info',
        targetSection: 'pending-withdrawals',
        targetAgentId: targetAgent ? targetAgent.id : undefined,
        targetAudience: 'agent',
      });
    }

    setIsDispatched(true);
    setTimeout(() => {
      setIsDispatched(false);
      onClose();
    }, 1200);
  };

  const amountPresets = [150, 300, 500, 1000, 2500, 5000, 10000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-slate-200 text-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#8B1E2D] flex items-center justify-center text-white font-bold shadow-xs">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2">
                <span>Manual Order Dispatch Form</span>
                <span className="px-1.5 py-0.5 bg-rose-900/60 text-rose-300 border border-rose-700/50 rounded text-[10px] font-mono">
                  LIVE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Cairo Time: {cairoLiveTime}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleDispatch} className="p-5 space-y-4 overflow-y-auto">
          {/* Order Type Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('deposit')}
                className={`py-2 px-3 rounded text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  orderType === 'deposit'
                    ? 'bg-[#8B1E2D] text-white border-[#8B1E2D] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Deposit (Inbound to Agent)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('withdrawal')}
                className={`py-2 px-3 rounded text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  orderType === 'withdrawal'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Withdrawal (Payout from Agent)</span>
              </button>
            </div>
          </div>

          {/* Customer Details Box with Randomize */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span>Customer / Client Information</span>
              </span>

              <button
                type="button"
                onClick={handleRandomizeCustomer}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs"
                title="Generate random realistic customer data"
              >
                <Shuffle className="w-3 h-3 text-[#8B1E2D]" />
                <span>Randomize Customer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mohamed Ahmed Hassan"
                  className="w-full h-8 px-2.5 border border-slate-300 rounded text-slate-900 bg-white focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer Wallet ID</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. TSa9281hG82ks901847192"
                  className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900 bg-white focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>
            </div>
          </div>

          {/* Amount & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Order Amount (USDT)
              </label>
              <span className="text-xs font-mono font-bold text-[#8B1E2D]">
                {formatCurrency(amount, 'USDT')}
              </span>
            </div>

            <div className="relative mb-2">
              <input
                type="number"
                min="10"
                step="5"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-9 pl-3 pr-16 border border-slate-300 rounded font-mono text-sm font-bold text-slate-900 focus:ring-1 focus:ring-[#8B1E2D]"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                USDT
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {amountPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors border ${
                    amount === preset
                      ? 'bg-[#8B1E2D] text-white border-[#8B1E2D]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Gateway Provider & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Payment Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setBankName(`${e.target.value} Gateway`);
                }}
                className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="TRC20 Network">TRC20 Network (USDT)</option>
                <option value="TRON Direct">TRON Direct Transfer</option>
                <option value="USDT Hot Wallet">USDT Hot Wallet Pool</option>
                <option value="Central Liquidity Node">Central Liquidity Node</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Transaction Ref / RRN</label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Target Agent & Wallet Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span>Target Subagent</span>
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-900 font-medium"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                <span>Target Assigned SIM</span>
              </label>
              <input
                type="text"
                value={targetWalletNumber}
                onChange={(e) => setTargetWalletNumber(e.target.value)}
                placeholder="Agent wallet phone"
                className="w-full h-8 px-2.5 border border-slate-300 rounded font-mono text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">
              Internal Audit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:ring-1 focus:ring-[#8B1E2D]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isDispatched}
              className={`px-5 py-2 rounded text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all ${
                isDispatched
                  ? 'bg-emerald-600'
                  : 'bg-[#8B1E2D] hover:bg-[#721825]'
              }`}
            >
              {isDispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Order Dispatched to Agent!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Live Order Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
