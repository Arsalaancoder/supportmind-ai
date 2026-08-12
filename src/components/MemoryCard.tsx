import React from 'react';
import { HindsightMemory } from '../types';
import { Brain, CheckCircle2, XCircle, AlertTriangle, Hash, Calendar, Building2, User } from 'lucide-react';

interface MemoryCardProps {
  memory: HindsightMemory;
  index?: number;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, index }) => {
  const meta = memory.metadata || {};
  const outcome = (meta.outcome || '').toLowerCase();

  const isSuccess = outcome === 'successful' || outcome === 'success';
  const isFailed = outcome === 'failed' || outcome === 'fail';

  return (
    <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-900/40 hover:border-indigo-500/50 transition-all duration-200 shadow-lg relative overflow-hidden group">
      {/* Visual Indicator Banner for Historical Memory */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Brain className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono tracking-wider font-semibold text-indigo-300 uppercase">
            HISTORICAL HINDSIGHT MEMORY {index !== undefined ? `#${index + 1}` : ''}
          </span>
        </div>

        {/* Outcome Badge */}
        {isSuccess ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> SUCCESSFUL
          </span>
        ) : isFailed ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle className="w-3 h-3 mr-1 text-rose-400" /> FAILED
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-950 text-purple-400 border border-purple-800">
            <AlertTriangle className="w-3 h-3 mr-1 text-purple-400" /> {(meta.outcome || 'HISTORICAL').toUpperCase()}
          </span>
        )}
      </div>

      {/* Main Text / Support Experience Content */}
      <div className="text-sm text-slate-200 font-sans space-y-2 whitespace-pre-line leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
        {memory.text}
      </div>

      {/* Metadata Badges */}
      <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
        <div className="flex flex-wrap items-center gap-3">
          {meta.ticket_id && (
            <span className="flex items-center gap-1 text-slate-400">
              <Hash className="w-3 h-3 text-indigo-400" />
              Ticket: <span className="text-indigo-300">{meta.ticket_id.substring(0, 8)}...</span>
            </span>
          )}
          {meta.customer_name && (
            <span className="flex items-center gap-1 text-slate-400">
              <User className="w-3 h-3 text-slate-400" />
              {meta.customer_name}
            </span>
          )}
          {meta.company && (
            <span className="flex items-center gap-1 text-slate-400">
              <Building2 className="w-3 h-3 text-slate-400" />
              {meta.company}
            </span>
          )}
        </div>

        {memory.id && (
          <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
            ID: {memory.id}
          </span>
        )}
      </div>
    </div>
  );
};
