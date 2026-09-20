import React, { useState } from 'react';
import { Layers, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const LoginView: React.FC = () => {
  const { login } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(username.trim(), password.trim());
      setIsLoading(false);
      if (!res.success) {
        setError(res.message || 'Invalid login credentials. Please check your username and password.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#8B1E2D]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Brand Header */}
        <div className="bg-[#0F172A] p-6 text-center border-b border-[#334155]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0F172A] shadow-xl mb-3 p-1 border border-slate-700/60">
            <img
              src="/uzx-logo.png"
              alt="UZX Wallet Logo"
              className="w-full h-full rounded-xl object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white flex items-center justify-center gap-1.5">
            UZX <span className="text-rose-400 font-bold text-lg">WALLET</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-mono tracking-wider uppercase mt-1">
            UZX FINANCIAL OS & OPERATIONS GATEWAY
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">System Access Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your assigned administrative or agent credentials</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Agent ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] text-white border border-[#334155] rounded-lg text-xs font-mono focus:outline-none focus:border-[#8B1E2D] focus:ring-1 focus:ring-[#8B1E2D] transition-all placeholder:text-slate-500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] text-white border border-[#334155] rounded-lg text-xs font-mono focus:outline-none focus:border-[#8B1E2D] focus:ring-1 focus:ring-[#8B1E2D] transition-all placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#8B1E2D] hover:bg-[#721825] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-[11px] text-slate-500 font-mono">
        UZX Wallet Financial Systems • Encrypted SSL Connection
      </div>
    </div>
  );
};
