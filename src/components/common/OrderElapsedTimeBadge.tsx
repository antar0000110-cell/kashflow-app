import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { getElapsedSeconds, formatTimerHHMMSS } from '../../utils/timerUtils';

interface OrderElapsedTimeBadgeProps {
  createdAt?: string;
  processedAt?: string;
  processingDurationSeconds?: number;
  processingDurationFormatted?: string;
  duration?: string;
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const OrderElapsedTimeBadge: React.FC<OrderElapsedTimeBadgeProps> = ({
  createdAt,
  processedAt,
  processingDurationSeconds,
  processingDurationFormatted,
  duration,
  status,
  size = 'md',
  showLabel = true,
}) => {
  const isFinalized = status === 'Approved' || status === 'Rejected' || status === 'Cancelled';
  
  // For pending orders, run a live ticking timer every second
  const [currentElapsed, setCurrentElapsed] = useState<number>(() => {
    if (isFinalized && processingDurationSeconds !== undefined) {
      return processingDurationSeconds;
    }
    return getElapsedSeconds(createdAt || new Date().toISOString(), processedAt);
  });

  useEffect(() => {
    if (isFinalized) {
      if (processingDurationSeconds !== undefined) {
        setCurrentElapsed(processingDurationSeconds);
      } else if (createdAt && processedAt) {
        setCurrentElapsed(getElapsedSeconds(createdAt, processedAt));
      }
      return;
    }

    // Tick every second for pending orders
    const interval = setInterval(() => {
      if (createdAt) {
        setCurrentElapsed(getElapsedSeconds(createdAt));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, processedAt, isFinalized, processingDurationSeconds]);

  const formattedTime = isFinalized
    ? (duration || processingDurationFormatted || formatTimerHHMMSS(currentElapsed))
    : formatTimerHHMMSS(currentElapsed);

  // Dynamic badge style based on status and elapsed time
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3 h-3 text-slate-500 animate-pulse" />;
  const isSlaBreached = !isFinalized && currentElapsed >= 900; // >= 15 minutes (900s)

  if (isFinalized) {
    if (status === 'Approved') {
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    } else {
      colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
      icon = <XCircle className="w-3 h-3 text-rose-600" />;
    }
  } else {
    // Pending count-up timer: SLA Warning > 15 mins (900s), Warning > 10 mins (600s), Caution > 3 mins (180s)
    if (currentElapsed >= 900) {
      colorClass = 'bg-rose-600 text-white border-rose-700 animate-pulse font-extrabold shadow-sm';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />;
    } else if (currentElapsed > 600) {
      colorClass = 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse';
      icon = <Clock className="w-3 h-3 text-rose-400 animate-spin" />;
    } else if (currentElapsed > 180) {
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      icon = <Clock className="w-3 h-3 text-amber-600 animate-pulse" />;
    } else {
      colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
      icon = <Clock className="w-3 h-3 text-blue-600 animate-pulse" />;
    }
  }

  const textSizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 font-mono font-bold rounded-md border shadow-2xs ${textSizes[size]} ${colorClass}`}
        title={
          isFinalized
            ? `Immutable processing duration: ${formattedTime}`
            : isSlaBreached
            ? `CRITICAL SLA BREACH (>15 MINS): ${formattedTime}`
            : `Active elapsed waiting time: ${formattedTime}`
        }
      >
        {icon}
        {showLabel && (
          <span className="font-sans text-[10px] font-medium opacity-80">
            {isFinalized ? 'Processed in:' : isSlaBreached ? 'SLA OVERDUE:' : 'Elapsed:'}
          </span>
        )}
        <span className="tracking-tight">{formattedTime}</span>
      </span>

      {isSlaBreached && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-700 text-white border border-rose-900 animate-bounce shadow-2xs uppercase tracking-wider">
          SLA Breach &gt;15m
        </span>
      )}
    </span>
  );
};
