import React, { useState } from 'react';
import { OutcomeType, TicketStatus } from '../types';
import { Wrench, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Send, BrainCircuit, ShieldCheck } from 'lucide-react';

interface TroubleshootingPanelProps {
  ticketId: string;
  currentStatus: TicketStatus;
  hindsightRetained?: boolean;
  hindsightMemoryId?: string | null;
  onRecordOutcome: (action: string, outcome: OutcomeType, notes: string) => Promise<void>;
  onRetryRetain: () => Promise<void>;
  isSubmitting?: boolean;
}

export const TroubleshootingPanel: React.FC<TroubleshootingPanelProps> = ({
  ticketId,
  currentStatus,
  hindsightRetained,
  hindsightMemoryId,
  onRecordOutcome,
  onRetryRetain,
  isSubmitting = false,
}) => {
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState<OutcomeType>('successful');
  const [notes, setNotes] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim()) return;
    setLastError(null);
    try {
      await onRecordOutcome(action.trim(), outcome, notes.trim());
      setAction('');
      setNotes('');
    } catch (err: any) {
      setLastError(err.message);
    }
  };

  const handleRetry = async () => {
    setRetryLoading(true);
    setLastError(null);
    try {
      await onRetryRetain();
    } catch (err: any) {
      setLastError(err.message);
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Record Troubleshooting Action</h3>
            <p className="text-xs text-slate-400">Perform troubleshooting steps & retain experience into Hindsight long-term memory</p>
          </div>
        </div>

        {/* Hindsight Retention Confirmation Badge */}
        {hindsightRetained ? (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-semibold flex items-center space-x-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Retained ({hindsightMemoryId || 'Memory ID Saved'})</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400 text-xs font-mono font-semibold flex items-center space-x-1.5 max-w-xs truncate">
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="truncate">{lastError ? `Retain Failed: ${lastError}` : 'Retain Pending'}</span>
            </span>
            <button
              onClick={handleRetry}
              disabled={retryLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${retryLoading ? 'animate-spin' : ''}`} />
              <span>Retry Retain</span>
            </button>
          </div>
        )}
      </div>

      {lastError && (
        <div className="p-3.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-mono space-y-1.5">
          <div className="font-semibold text-rose-300 flex items-center justify-between">
            <span>Hindsight Retain Failure Details:</span>
            <button onClick={handleRetry} className="underline text-indigo-300 hover:text-indigo-200 font-semibold text-xs">Retry Retain</button>
          </div>
          <div className="p-2 bg-slate-950/80 rounded border border-rose-900/50 text-rose-300 break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
            {lastError}
          </div>
        </div>
      )}

      {/* Action Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
            Troubleshooting Action Executed *
          </label>
          <input
            type="text"
            required
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g., Reset DNS configuration and flush DNS cache"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
              Action Outcome *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOutcome('successful')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono border flex items-center justify-center space-x-1 transition-all ${
                  outcome === 'successful'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-emerald-900/40 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> SUCCESS
              </button>

              <button
                type="button"
                onClick={() => setOutcome('failed')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono border flex items-center justify-center space-x-1 transition-all ${
                  outcome === 'failed'
                    ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-rose-900/40 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> FAILED
              </button>

              <button
                type="button"
                onClick={() => setOutcome('escalated')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono border flex items-center justify-center space-x-1 transition-all ${
                  outcome === 'escalated'
                    ? 'bg-purple-950 text-purple-300 border-purple-600 shadow-purple-900/40 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> ESCALATED
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
              Observations / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Connection stabilized, verified ping test 0% drop."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !action.trim()}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs font-mono uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Recording & Retaining...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Record & Retain Experience</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
