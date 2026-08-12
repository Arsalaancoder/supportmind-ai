import React from 'react';
import { TicketStatus, OutcomeType } from '../types';

interface StatusBadgeProps {
  status: TicketStatus | OutcomeType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase();

  let colors = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let label = status.toUpperCase();

  if (norm === 'open') {
    colors = 'bg-blue-950/80 text-blue-400 border-blue-800/60 shadow-blue-900/20';
    label = 'OPEN';
  } else if (norm === 'in_progress' || norm === 'in progress') {
    colors = 'bg-amber-950/80 text-amber-400 border-amber-800/60 shadow-amber-900/20';
    label = 'IN PROGRESS';
  } else if (norm === 'resolved' || norm === 'successful') {
    colors = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 shadow-emerald-900/20';
    label = norm === 'successful' ? 'SUCCESSFUL' : 'RESOLVED';
  } else if (norm === 'failed') {
    colors = 'bg-rose-950/80 text-rose-400 border-rose-800/60 shadow-rose-900/20';
    label = 'FAILED';
  } else if (norm === 'escalated') {
    colors = 'bg-purple-950/80 text-purple-400 border-purple-800/60 shadow-purple-900/20';
    label = 'ESCALATED';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold tracking-wider',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wider',
    lg: 'px-3.5 py-1.5 text-sm font-semibold tracking-wider',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-md border font-mono uppercase transition-colors shadow-sm ${colors} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {label}
    </span>
  );
};
