import React from 'react';
import { TransactionStatus } from '../../types';

interface StatusBadgeProps {
  status: TransactionStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Approved':
    case 'active':
    case 'Yes':
    case 'CONFIRMED':
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      break;
    case 'Pending':
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
      break;
    case 'Processing':
      badgeClass = 'bg-slate-100 text-slate-800 border-slate-300';
      break;
    case 'Rejected':
    case 'Cancelled':
    case 'No':
    case 'suspended':
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-300';
      break;
    case 'Hold':
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-400';
      break;
    case 'unassigned':
      badgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass} uppercase tracking-wider whitespace-nowrap`}
    >
      {status}
    </span>
  );
};
