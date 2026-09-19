import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  History,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  LogOut,
  Receipt,
  Lock,
  ChevronRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  BellRing
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { formatCairoTime } from '../../utils/cairoTime';
import {
  getNativePermission,
  triggerHaptic,
  playSynthesizedChime,
  sendNativePushNotification,
} from '../../services/notificationService';
import { NotificationPermissionModal } from '../notifications/NotificationPermissionModal';

const SAVED_WALLETS_KEY = 'zux_saved_wallets';

export const MobileApkWalletView: React.FC = () => {
  const {
    wallets,
    transferBetweenWallets,
    depositHistory,
    withdrawalHistory,
    confirmDeposit,
  } = useAppStore();

  // Login / Session State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [walletNumberInput, setWalletNumberInput] = useState('');
  const [savedWallets, setSavedWallets] = useState<string[]>([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  const [loginStep, setLoginStep] = useState<'enter_number' | 'enter_otp'>('enter_number');
  const [otpInput, setOtpInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeWalletNumber, setActiveWalletNumber] = useState('01031860138');

  // Load saved wallet numbers from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_WALLETS_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          setSavedWallets(list);
          if (list.length > 0 && !walletNumberInput) {
            setWalletNumberInput(list[0]);
          }
        }
      } else {
        // Default list of initial wallets
        const initial = ['01031860138', '01018073883', '01092530012', '01055419082'];
        setSavedWallets(initial);
        localStorage.setItem(SAVED_WALLETS_KEY, JSON.stringify(initial));
      }
    } catch {
      setSavedWallets(['01031860138', '01018073883']);
    }
  }, []);

  // Inside Wallet Navigation & Tab State
  // Strictly only 'home', 'deposit', 'withdraw', 'transfer', 'history' - NO OTP TAB!
  const [activeTab, setActiveTab] = useState<'home' | 'deposit' | 'withdraw' | 'transfer' | 'history'>('home');
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userBalance, setUserBalance] = useState(14850);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any | null>(null);

  // History Search Query
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Forms State
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [depositMethod, setDepositMethod] = useState('Vodafone Cash');
  const [depositSuccess, setDepositSuccess] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState<number>(300);
  const [withdrawRecipient, setWithdrawRecipient] = useState('01018073883');
  const [withdrawMethod, setWithdrawMethod] = useState('Vodafone Cash');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [transferTarget, setTransferTarget] = useState('01092530012');
  const [transferAmount, setTransferAmount] = useState<number>(200);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Handle wallet number submit in login
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanNumber = walletNumberInput.trim();
    if (!cleanNumber || cleanNumber.length < 9) {
      setLoginError('Please enter a valid 11-digit mobile wallet number');
      triggerHaptic("light");
      return;
    }

    triggerHaptic("light");
    // Save to history cache
    const updatedList = Array.from(new Set([cleanNumber, ...savedWallets])).slice(0, 10);
    setSavedWallets(updatedList);
    try {
      localStorage.setItem(SAVED_WALLETS_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore storage errors
    }

    setLoginStep('enter_otp');
  };

  // Handle OTP verification during login
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Accept 6-digit code (any 6 digits or standard code)
    if (otpInput.length < 4) {
      setLoginError('Please enter the 6-digit OTP code');
      triggerHaptic("light");
      return;
    }

    triggerHaptic("light");
    playSynthesizedChime('cash');
    setActiveWalletNumber(walletNumberInput);
    setIsLoggedIn(true);
    setLoginStep('enter_number');
    setOtpInput('');
  };

  const handleLogout = () => {
    triggerHaptic("light");
    setIsLoggedIn(false);
    setLoginStep('enter_number');
    setOtpInput('');
    setActiveTab('home');
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(activeWalletNumber);
    triggerHaptic("light");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;
    triggerHaptic("light");
    playSynthesizedChime('cash');
    setDepositSuccess(true);
    sendNativePushNotification(
      'Deposit Successful',
      `Credited ${formatCurrency(depositAmount, 'EGP')} to wallet ${activeWalletNumber} via ${depositMethod}.`,
      'success'
    );
    setTimeout(() => {
      setDepositSuccess(false);
      setUserBalance((prev) => prev + Number(depositAmount));
      setActiveTab('home');
    }, 1200);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || withdrawAmount > userBalance) return;
    triggerHaptic("light");
    playSynthesizedChime('cash');
    setWithdrawSuccess(true);
    sendNativePushNotification(
      'Cash-Out Completed',
      `Processed payout of ${formatCurrency(withdrawAmount, 'EGP')} to ${withdrawRecipient}.`,
      'info'
    );
    setTimeout(() => {
      setWithdrawSuccess(false);
      setUserBalance((prev) => prev - Number(withdrawAmount));
      setActiveTab('home');
    }, 1200);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    if (transferAmount <= 0) {
      setTransferError('يرجى إدخال مبلغ تحويل أسرع أكبر من 0');
      return;
    }

    const result = transferBetweenWallets(activeWalletNumber, transferTarget, Number(transferAmount));
    if (!result.success) {
      setTransferError(result.error || result.message || 'فشلت عملية التحويل');
      triggerHaptic("light");
      return;
    }

    triggerHaptic("light");
    playSynthesizedChime('cash');
    setTransferSuccess(true);
    sendNativePushNotification(
      'تم إرسال التحويل',
      `تم تحويل ${formatCurrency(transferAmount, 'EGP')} بنجاح إلى ${transferTarget}.`,
      'success'
    );
    setTimeout(() => {
      setTransferSuccess(false);
      const activeW = wallets.find((w) => w.walletNumber === activeWalletNumber);
      if (activeW) setUserBalance(activeW.balance);
      setActiveTab('home');
    }, 1200);
  };

  // Filtered wallet numbers for autocomplete
  const filteredSuggestions = savedWallets.filter((num) =>
    num.includes(walletNumberInput.trim())
  );

  // Filtered wallet transactions for search in history
  const allWalletTransactions = [
    ...depositHistory.map((t) => ({ ...t, direction: 'inbound' as const })),
    ...withdrawalHistory.map((t) => ({ ...t, direction: 'outbound' as const })),
  ];

  const filteredHistory = allWalletTransactions.filter((tx) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
      (tx.phone && tx.phone.includes(q)) ||
      (tx.provider && tx.provider.toLowerCase().includes(q)) ||
      tx.amount.toString().includes(q) ||
      (tx.status && tx.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-slate-100 font-sans">
      {/* Container Device Mockup Wrapper */}
      <div className="w-full max-w-[410px] bg-white sm:rounded-[36px] rounded-2xl shadow-2xl border-2 sm:border-4 border-slate-300 overflow-hidden flex flex-col h-[760px] max-h-[90vh] sm:max-h-[760px] relative">
        {/* Mobile Status Bar */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-mono text-slate-700 bg-white shrink-0 select-none">
          <span className="font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsNotificationModalOpen(true);
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Push Notification Settings"
            >
              <BellRing className={`w-3 h-3 ${getNativePermission() === 'granted' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}`} />
            </button>
            <span className="text-[10px] font-bold text-emerald-600">Vodafone 4G+</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-2xs flex items-center p-0.5">
              <div className="w-full h-full bg-emerald-500 rounded-3xs" />
            </div>
          </div>
        </div>

        {/* NOT LOGGED IN: LOGIN VIEW WITH SAVED HISTORY DROPDOWN & MANUAL OTP */}
        {!isLoggedIn ? (
          <div className="flex-1 p-6 flex flex-col justify-between bg-slate-50 overflow-y-auto">
            <div className="space-y-6 pt-4 text-center">
              {/* Brand Logo */}
              <div className="w-16 h-16 rounded-2xl bg-[#8B1E2D] text-white flex items-center justify-center mx-auto shadow-md">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Sign In to Wallet</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Certified Fast Electronic Wallet Gateway
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left justify-start">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* STEP 1: Enter Wallet Number with Autocomplete Cache */}
              {loginStep === 'enter_number' && (
                <form onSubmit={handleProceedToOtp} className="space-y-4 text-left">
                  <div className="relative">
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      Wallet Number (Vodafone Cash / InstaPay)
                    </label>
                    <input
                      type="tel"
                      value={walletNumberInput}
                      onChange={(e) => {
                        setWalletNumberInput(e.target.value);
                        setShowSavedDropdown(true);
                      }}
                      onFocus={() => setShowSavedDropdown(true)}
                      placeholder="010XXXXXXXX"
                      required
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl font-mono text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#8B1E2D] focus:border-transparent outline-none transition-all text-left"
                    />

                    {/* Saved Wallets History Cache Dropdown */}
                    {showSavedDropdown && filteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-[68px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto divide-y divide-slate-100 text-left">
                        <div className="p-2 bg-slate-50 text-[10px] text-slate-500 font-semibold text-left">
                          Previously Saved Wallets
                        </div>
                        {filteredSuggestions.map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              setWalletNumberInput(num);
                              setShowSavedDropdown(false);
                            }}
                            className="w-full p-2.5 text-xs font-mono text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-bold">{num}</span>
                            <span className="text-[10px] text-slate-400">Saved</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed &amp; Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP Given Manually by Admin/Operator */}
              {loginStep === 'enter_otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                  <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100 text-left">
                    <div className="text-[11px] text-slate-500">Wallet Number:</div>
                    <div className="font-mono font-bold text-sm text-[#8B1E2D]">{walletNumberInput}</div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Verification code is provided by your assigned operator/agent to authorize session access.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5 flex items-center justify-between">
                      <span>One-Time Password (OTP)</span>
                      <span className="text-[10px] text-slate-400 font-mono">6 digits</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      autoFocus
                      required
                      className="w-full h-12 px-3 border-2 border-slate-300 rounded-xl font-mono text-center text-xl tracking-widest bg-white text-slate-900 focus:ring-2 focus:ring-[#8B1E2D] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('enter_number');
                        setOtpInput('');
                      }}
                      className="w-1/3 h-11 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 h-11 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Unlock Wallet</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-400 font-mono py-2">
              ZUX Secure Mobile Banking Engine v4.2
            </div>
          </div>
        ) : (
          /* LOGGED IN: REALISTIC WALLET INTERFACE (NO OTP FIELD INSIDE) */
          <>
            {/* Mobile Header Bar */}
            <div className="px-4 py-3 bg-[#8B1E2D] text-white flex items-center justify-between shrink-0 shadow-xs select-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs border border-white/20">
                  VF
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wide">Vodafone Cash</div>
                  <div className="text-[10px] text-rose-200 font-mono flex items-center gap-1">
                    <span>{activeWalletNumber}</span>
                    <button
                      onClick={handleCopyPhone}
                      className="p-0.5 text-rose-200 hover:text-white cursor-pointer"
                      title="Copy wallet number"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setIsNotificationModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Push Notifications &amp; Permissions"
                >
                  <BellRing className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Screen Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* 1. HOME VIEW */}
              {activeTab === 'home' && (
                <div className="space-y-4">
                  {/* Balance Card */}
                  <div className="p-4 bg-[#8B1E2D] rounded-2xl shadow-sm text-white space-y-3">
                    <div className="flex items-center justify-between text-xs text-rose-100">
                      <span className="font-medium">Available Balance</span>
                      <button
                        onClick={() => {
                          triggerHaptic("light");
                          setShowBalance(!showBalance);
                        }}
                        className="p-1 text-rose-200 hover:text-white cursor-pointer"
                      >
                        {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="text-2xl font-bold font-mono tracking-tight text-left">
                      {showBalance ? formatCurrency(userBalance, 'EGP') : '••••••••'}
                    </div>

                    <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-rose-100 font-mono">
                      <span>Node Status: Active</span>
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Live Connected
                      </span>
                    </div>
                  </div>

                  {/* 3 Main Required Buttons: Cash In, Cash Out, Transfer */}
                  <div className="grid grid-cols-3 gap-2.5 text-center select-none">
                    {/* 1. Cash In */}
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('deposit');
                      }}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Cash In</span>
                      <span className="text-[9px] text-slate-400">Deposit</span>
                    </button>

                    {/* 2. Cash Out */}
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('withdraw');
                      }}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Cash Out</span>
                      <span className="text-[9px] text-slate-400">Withdraw</span>
                    </button>

                    {/* 3. Transfer */}
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('transfer');
                      }}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1E2D] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Send className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Transfer</span>
                      <span className="text-[9px] text-slate-400">Send Funds</span>
                    </button>
                  </div>

                  {/* Quota Progress */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Daily Transfer Limit</span>
                      <span className="font-mono text-[#8B1E2D]">1,200 / 30,000 EGP</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#8B1E2D] h-full rounded-full" style={{ width: '6%' }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Monthly: 100,000 EGP</span>
                      <span>Single Tx: 5,000 EGP</span>
                    </div>
                  </div>

                  {/* Recent Operations */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Recent Transactions
                      </span>
                      <button
                        onClick={() => {
                          triggerHaptic("light");
                          setActiveTab('history');
                        }}
                        className="text-[11px] text-[#8B1E2D] font-bold hover:underline cursor-pointer"
                      >
                        View Full History
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {allWalletTransactions.slice(0, 4).map((tx) => (
                        <div
                          key={tx.id}
                          onClick={() => {
                            triggerHaptic("light");
                            setSelectedTxDetail(tx);
                          }}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 text-left">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                tx.direction === 'inbound'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-[#8B1E2D]'
                              }`}
                            >
                              {tx.direction === 'inbound' ? '+' : '-'}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 truncate max-w-[150px]">
                                {tx.userFullName || 'Wallet Transaction'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {tx.dateOfCreation || 'Today, Cairo'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <div
                              className={`text-xs font-bold ${
                                tx.direction === 'inbound' ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {tx.direction === 'inbound' ? '+' : '-'}
                              {formatCurrency(tx.amount, 'EGP')}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {tx.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CASH IN / DEPOSIT */}
              {activeTab === 'deposit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      <span>Cash In / Deposit</span>
                    </h3>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('home');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>

                  <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-left">
                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1">Deposit Channel</label>
                      <select
                        value={depositMethod}
                        onChange={(e) => setDepositMethod(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl bg-white text-slate-900 text-xs"
                      >
                        <option value="Vodafone Cash">Vodafone Cash (010)</option>
                        <option value="InstaPay">InstaPay Direct</option>
                        <option value="Orange Cash">Orange Cash (012)</option>
                        <option value="Etisalat Cash">Etisalat Cash (011)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1">Deposit Amount (EGP)</label>
                      <input
                        type="number"
                        min="10"
                        required
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-[#8B1E2D] bg-white text-slate-900 text-left"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={depositSuccess}
                      className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                        depositSuccess ? 'bg-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      {depositSuccess ? 'Deposit Confirmed &amp; Credited!' : 'Confirm Cash In'}
                    </button>
                  </form>
                </div>
              )}

              {/* 3. CASH OUT / WITHDRAW */}
              {activeTab === 'withdraw' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-amber-600" />
                      <span>Cash Out / Withdraw</span>
                    </h3>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('home');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>

                  <form onSubmit={handleWithdrawSubmit} className="space-y-3.5 text-left">
                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1">Recipient Wallet Number</label>
                      <input
                        type="text"
                        required
                        value={withdrawRecipient}
                        onChange={(e) => setWithdrawRecipient(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#8B1E2D] bg-white text-slate-900 text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1">Withdrawal Amount (EGP)</label>
                      <input
                        type="number"
                        min="10"
                        max={userBalance}
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-[#8B1E2D] bg-white text-slate-900 text-left"
                      />
                      <div className="text-[10px] text-slate-500 mt-1">
                        Available Balance: {formatCurrency(userBalance, 'EGP')}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={withdrawSuccess}
                      className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                        withdrawSuccess ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {withdrawSuccess ? 'Withdrawal Completed!' : 'Confirm Cash Out'}
                    </button>
                  </form>
                </div>
              )}

              {/* 4. TRANSFER / SEND MONEY */}
              {activeTab === 'transfer' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-[#8B1E2D]" />
                      <span>Transfer to Another Wallet</span>
                    </h3>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('home');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>

                  {transferError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                      {transferError}
                    </div>
                  )}

                  <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-left">
                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1">Destination Wallet Number</label>
                      <input
                        type="text"
                        required
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#8B1E2D] bg-white text-slate-900 text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold text-xs mb-1">Transfer Amount (EGP)</label>
                      <input
                        type="number"
                        min="10"
                        max={userBalance}
                        required
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(Number(e.target.value))}
                        className="w-full h-10 px-3 border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-[#8B1E2D] bg-white text-slate-900 text-left"
                      />
                      <div className="text-[10px] text-slate-500 mt-1">
                        Available Balance: {formatCurrency(userBalance, 'EGP')}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={transferSuccess}
                      className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                        transferSuccess ? 'bg-emerald-600' : 'bg-[#8B1E2D] hover:bg-[#721825]'
                      }`}
                    >
                      {transferSuccess ? 'Transfer Completed!' : 'Confirm &amp; Send Money'}
                    </button>
                  </form>
                </div>
              )}

              {/* 5. HISTORY WITH SEARCH BAR */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#8B1E2D]" />
                      <span>Transactions History</span>
                    </h3>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab('home');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search by ID, recipient, or amount..."
                      className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 text-left focus:ring-1 focus:ring-[#8B1E2D] outline-none"
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    {filteredHistory.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No transactions found matching your criteria.
                      </div>
                    ) : (
                      filteredHistory.map((tx) => (
                        <div
                          key={tx.id}
                          onClick={() => {
                            triggerHaptic("light");
                            setSelectedTxDetail(tx);
                          }}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                        >
                          <div className="text-left">
                            <div className="font-semibold text-slate-900">{tx.userFullName || 'Transaction'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.id} • {tx.provider}</div>
                          </div>

                          <div className="text-right font-mono">
                            <div
                              className={`font-bold ${
                                tx.direction === 'inbound' ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {tx.direction === 'inbound' ? '+' : '-'}
                              {formatCurrency(tx.amount, 'EGP')}
                            </div>
                            <div className="text-[10px] text-slate-400">{tx.status}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Bar - Strictly 4 buttons: Home, Transfer, Cash In, History */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-around text-slate-500 shrink-0 select-none">
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab('home');
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'home' ? 'text-[#8B1E2D]' : 'hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab('transfer');
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'transfer' ? 'text-[#8B1E2D]' : 'hover:text-slate-800'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Transfer</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab('deposit');
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'deposit' ? 'text-[#8B1E2D]' : 'hover:text-slate-800'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Cash In</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab('history');
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'history' ? 'text-[#8B1E2D]' : 'hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-5 border border-slate-200 text-slate-800 space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-sm text-slate-900">Transfer Receipt</h3>
            <p className="text-2xl font-bold font-mono text-[#8B1E2D]">
              {formatCurrency(selectedTxDetail.amount, 'EGP')}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Transaction ID:</span>
                <span className="text-slate-900 font-semibold">{selectedTxDetail.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Provider:</span>
                <span className="text-slate-900">{selectedTxDetail.provider}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="text-emerald-700 font-semibold">{selectedTxDetail.status}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Timestamp:</span>
                <span className="text-slate-900">{selectedTxDetail.dateOfCreation || 'Cairo'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("light");
                setSelectedTxDetail(null);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
      {/* Push Notification Modal */}
      {isNotificationModalOpen && (
        <NotificationPermissionModal
          forceOpen={true}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}
    </div>
  );
};
