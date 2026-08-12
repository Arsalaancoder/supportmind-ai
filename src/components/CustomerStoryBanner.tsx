import React from 'react';
import { Customer, Ticket, CustomerEnvironment } from '../types';
import { ShieldCheck, History, Cpu, AlertTriangle, Sparkles } from 'lucide-react';

interface CustomerStoryBannerProps {
  customer?: Customer | null;
  ticketsCount?: number;
  environment?: CustomerEnvironment | null;
  frustrationLevel?: string | null;
  repeatIssueDetected?: boolean;
}

export const CustomerStoryBanner: React.FC<CustomerStoryBannerProps> = ({
  customer,
  ticketsCount = 0,
  environment,
  frustrationLevel = 'low',
  repeatIssueDetected = false,
}) => {
  const env = environment || customer?.environment;
  const isFrustrated = frustrationLevel === 'high' || frustrationLevel === 'critical';

  return (
    <div className={`p-4 md:p-5 rounded-2xl border transition-all shadow-xl relative overflow-hidden ${
      isFrustrated
        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border-amber-500/40 shadow-amber-950/20'
        : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border-indigo-500/30 shadow-indigo-950/20'
    }`}>
      {/* Decorative accent background */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-xl ${
            isFrustrated ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Full Customer Memory Active
              </span>
              {repeatIssueDetected && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Repeat Issue Detected
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              Zero-Repetition Shield: {customer?.name || 'Customer'}
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Full context loaded from past support tickets and vector memory.
              <strong className="text-slate-100 font-semibold"> Support Agent Notice:</strong> Do not ask customer to re-explain past issues or verify basic hardware stack.
            </p>
          </div>
        </div>

        {/* Quick Memory Stats */}
        <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center min-w-[80px]">
            <span className="block text-[10px] font-mono uppercase text-slate-400 flex items-center justify-center gap-1">
              <History className="w-3 h-3 text-indigo-400" /> Tickets
            </span>
            <span className="text-sm font-extrabold text-white font-mono">{ticketsCount}</span>
          </div>

          {env?.os && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center min-w-[90px]">
              <span className="block text-[10px] font-mono uppercase text-slate-400 flex items-center justify-center gap-1">
                <Cpu className="w-3 h-3 text-purple-400" /> OS / Stack
              </span>
              <span className="text-xs font-semibold text-purple-200 font-mono truncate max-w-[110px] inline-block">
                {env.os} {env.framework ? `(${env.framework})` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
