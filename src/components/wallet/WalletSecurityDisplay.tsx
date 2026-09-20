import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { generateTimeBasedOtp } from '../../utils/formatters';

interface WalletSecurityDisplayProps {
  walletNumber: string;
}

export const WalletSecurityDisplay: React.FC<WalletSecurityDisplayProps> = ({ walletNumber }) => {
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [otpCode, setOtpCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateOtpAndTimer = () => {
      const now = Date.now();
      const elapsedMs = now % 300000;
      const remainingSec = Math.floor((300000 - elapsedMs) / 1000);
      setTimeRemaining(remainingSec);

      // Generate secure SHA-256 hash based OTP code
      const code = generateTimeBasedOtp(walletNumber);
      setOtpCode(code);
    };

    updateOtpAndTimer();
    const interval = setInterval(updateOtpAndTimer, 1000);
    return () => clearInterval(interval);
  }, [walletNumber]);

  const handleCopy = () => {
    navigator.clipboard.writeText(otpCode);
    setCopied(true);
    
    // Trigger window event for native haptics if available
    try {
      window.dispatchEvent(new CustomEvent('wallet-haptic', { detail: 'medium' }));
    } catch {
      // ignore
    }

    setTimeout(() => setCopied(false), 2000);
  };

  // SVG Circular progress bar measurements
  const radius = 28;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius; // Approx 175.93
  const percentage = Math.max(0, Math.min(1, timeRemaining / 300));
  const strokeDashoffset = circumference * (1 - percentage);

  // Format time remaining as mm:ss
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div id="wallet-security-display-card" className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-left relative overflow-hidden transition-all duration-300 hover:border-slate-300">
      {/* Dynamic Background Pattern */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50/20 rounded-full blur-2xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-slate-800 tracking-wide uppercase font-sans">
            Secure Dynamic OTP
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#8B1E2D] font-bold bg-rose-50/80 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cairo Time Synchronized</span>
        </div>
      </div>

      {/* Main OTP & Circular Timer Grid */}
      <div className="grid grid-cols-12 gap-3 items-center relative z-10">
        {/* Left Side: Code Block with Blur-Fade Animation */}
        <div className="col-span-8 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-center h-[90px] relative">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Authentication Code
          </span>
          <div className="flex items-center justify-between h-8 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={otpCode}
                initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl sm:text-3xl font-mono font-black text-[#8B1E2D] tracking-[0.2em]"
              >
                {otpCode}
              </motion.div>
            </AnimatePresence>

            <button
              onClick={handleCopy}
              className="h-8 w-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-3xs flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95"
              title="Copy OTP Code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 animate-scale" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Circular Timer Ring */}
        <div className="col-span-4 flex flex-col items-center justify-center bg-slate-50/50 border border-slate-100 rounded-2xl p-2 h-[90px]">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Underlay shadow track */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="text-slate-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress path */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="text-[#8B1E2D] transition-all duration-1000 ease-linear"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            
            {/* Countdown string inside the center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono font-black text-slate-700 tracking-tighter">
                {formattedTime}
              </span>
              <RefreshCw className="w-2 h-2 text-slate-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>
          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase mt-1">
            ROTLIMIT
          </span>
        </div>
      </div>

      {/* Copy Toast Alert inside card */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-2 left-4 right-4 bg-slate-900 text-white rounded-lg py-1 px-3 text-[10px] font-bold text-center z-20 flex items-center justify-center gap-1 shadow-md"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            تم نسخ كود الأمان بنجاح إلى الحافظة!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
