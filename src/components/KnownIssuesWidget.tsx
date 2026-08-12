import React from 'react';
import { KnownIssue } from '../types';
import { Bug, AlertOctagon, Wrench, ArrowRight, CheckCircle } from 'lucide-react';

interface KnownIssuesWidgetProps {
  knownIssue?: {
    issue_id?: string;
    title: string;
    workaround: string;
    severity: string;
  } | KnownIssue | null;
  onApplyWorkaround?: (workaroundText: string) => void;
}

export const KnownIssuesWidget: React.FC<KnownIssuesWidgetProps> = ({ knownIssue, onApplyWorkaround }) => {
  if (!knownIssue || !knownIssue.title) {
    return null;
  }

  const { title, workaround, severity } = knownIssue;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-500/30 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bug className="w-5 h-5 text-rose-400 animate-pulse" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
            Known Issue Match Detected
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
          Severity: {severity || 'high'}
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
          <AlertOctagon className="w-4 h-4 text-amber-400" /> {title}
        </h5>

        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1 text-emerald-400">
            <Wrench className="w-3.5 h-3.5" /> Official Workaround / Fix:
          </div>
          <p className="text-slate-200 leading-relaxed font-sans">{workaround}</p>
        </div>

        {onApplyWorkaround && (
          <button
            onClick={() => onApplyWorkaround(workaround)}
            className="w-full py-2 px-3 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Use Known Workaround in Response
          </button>
        )}
      </div>
    </div>
  );
};
