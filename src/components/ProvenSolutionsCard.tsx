import React from 'react';
import { ProvenSolution } from '../types';
import { Sparkles, CheckCircle2, History, ArrowRight, ThumbsUp } from 'lucide-react';

interface ProvenSolutionsCardProps {
  solutions?: ProvenSolution[] | null;
  onApplySolution?: (actionText: string) => void;
}

export const ProvenSolutionsCard: React.FC<ProvenSolutionsCardProps> = ({ solutions, onApplySolution }) => {
  if (!solutions || solutions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
            What Solutions Worked Before
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
          <ThumbsUp className="w-3 h-3 text-purple-400" /> Hindsight Memory Verified
        </span>
      </div>

      <div className="space-y-3">
        {solutions.map((sol, index) => (
          <div key={index} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Solution #{index + 1}
              </span>
              {sol.ticket_id && (
                <span className="text-slate-500 font-mono">
                  Ref Ticket: <strong className="text-slate-400">{sol.ticket_id}</strong>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-slate-300">
                <strong className="text-slate-400">Previous Problem:</strong> {sol.problem_summary}
              </div>
              <div className="p-2 rounded bg-indigo-950/40 border border-indigo-900/50 text-indigo-200 font-sans">
                <strong className="font-mono text-indigo-400 text-[11px] block">Proven Action:</strong>
                {sol.action_taken}
              </div>
            </div>

            {onApplySolution && (
              <button
                onClick={() => onApplySolution(sol.action_taken)}
                className="w-full py-1.5 px-3 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                Apply Proven Solution to Response <ArrowRight className="w-3 h-3 text-purple-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
