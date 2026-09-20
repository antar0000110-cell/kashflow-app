import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalLoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  isVisible,
  title = 'UZX FINANCIAL GATEWAY',
  message = 'Verifying secure session token & establishing real-time ledger channels...',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="global-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md"
          id="global-loading-overlay"
        >
          <div className="relative flex flex-col items-center max-w-sm px-8 py-8 text-center bg-[#1E293B]/95 rounded-2xl border border-slate-800 shadow-2xl">
            {/* Outer Glow Ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-indigo-500/20 blur-md opacity-75 animate-pulse" />

            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-700/80 mb-5 shadow-inner">
              <svg
                className="w-8 h-8 text-emerald-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                id="loading-overlay-spinner"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-80"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>

            <h3 className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
              {title}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
