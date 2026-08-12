import React from 'react';
import { GeminiAnalysis } from '../types';
import { Cpu, ShieldAlert, CheckCircle, Lightbulb, ArrowRight, AlertTriangle, Sparkles, Layers } from 'lucide-react';

interface AIAnalysisBoxProps {
  analysis?: GeminiAnalysis | null;
  recallStats?: {
    total_recalled: number;
    unique_memories: number;
    duplicates_removed: number;
  };
  isLoading?: boolean;
  error?: string | null;
  onReAnalyze?: () => void;
}

export const AIAnalysisBox: React.FC<AIAnalysisBoxProps> = ({
  analysis,
  recallStats,
  isLoading,
  error,
  onReAnalyze,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/90 border border-indigo-900/50 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400">
            <Cpu className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-48 bg-indigo-950/80 rounded"></div>
            <div className="h-3 w-32 bg-slate-800 rounded"></div>
          </div>
        </div>
        <div className="h-16 bg-slate-800/50 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
          <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 space-y-3">
        <div className="flex items-center space-x-2 text-rose-400 font-semibold">
          <AlertTriangle className="w-5 h-5" />
          <span>Gemini AI Reasoning Error</span>
        </div>
        <p className="text-sm font-mono bg-rose-950/60 p-3 rounded border border-rose-800/40 text-rose-200">
          {error}
        </p>
        {onReAnalyze && (
          <button
            onClick={onReAnalyze}
            className="px-3 py-1.5 text-xs font-medium rounded bg-rose-900/50 hover:bg-rose-900 text-rose-100 border border-rose-700 transition-colors"
          >
            Retry Gemini Reasoning
          </button>
        )}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3 text-slate-400">
        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-80" />
        <p className="text-sm">No Gemini AI analysis generated yet.</p>
        {onReAnalyze && (
          <button
            onClick={onReAnalyze}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Run Hindsight Recall & Gemini Analysis
          </button>
        )}
      </div>
    );
  }

  const riskColors = {
    low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    medium: 'bg-amber-950 text-amber-400 border-amber-800',
    high: 'bg-orange-950 text-orange-400 border-orange-800',
    critical: 'bg-rose-950 text-rose-400 border-rose-800',
  }[analysis.risk_level] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-indigo-950/30 border border-indigo-900/50 shadow-xl space-y-6">
      {/* Header & Risk Level */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              SupportMind AI Reasoning Engine
            </h3>
            <p className="text-xs text-slate-400 font-mono">Gemini 3.6 Flash + Hindsight Contextual Memory</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <span className={`px-2.5 py-1 rounded-md border font-semibold uppercase ${riskColors}`}>
            RISK: {analysis.risk_level}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
            CONFIDENCE: {analysis.confidence}%
          </span>
        </div>
      </div>

      {/* Memory Recall Statistics Bar (Section 26) */}
      {recallStats && (
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 font-mono">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Memories Found: <strong className="text-white">{recallStats.total_recalled}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Unique Evidence: <strong className="text-white">{recallStats.unique_memories}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Duplicates Removed: <strong className="text-white">{recallStats.duplicates_removed}</strong></span>
          </div>
        </div>
      )}

      {/* Executive Problem Summary */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Executive Problem Summary
        </h4>
        <p className="text-sm text-slate-200 bg-slate-950/50 p-3.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
          {analysis.summary}
        </p>
      </div>

      {/* Recommended Troubleshooting Actions */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Recommended Actions
        </h4>
        <ul className="space-y-2">
          {analysis.recommended_actions?.map((act, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 text-sm text-slate-200 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/40">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center border border-indigo-500/40 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-snug">{act}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Historical Evidence Analysis */}
      {analysis.historical_evidence && analysis.historical_evidence.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Historical Memory Evidence
          </h4>
          <div className="space-y-2">
            {analysis.historical_evidence.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1">
                <div className="text-slate-300 font-medium">{item.relevance_explanation}</div>
                {item.previous_action && (
                  <div className="text-slate-400 font-mono text-[11px]">
                    Prev Action: <span className="text-slate-200">{item.previous_action}</span> | Outcome: <span className="text-indigo-300 font-bold">{item.previous_outcome}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Reasoning */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Technical Reasoning & Justification
        </h4>
        <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
          {analysis.reasoning}
        </p>
      </div>

      {/* Next Steps & Escalation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300">
          <ArrowRight className="w-4 h-4 text-indigo-400" />
          <span>Next Step: <strong>{analysis.next_steps?.[0] || 'Execute recommended action'}</strong></span>
        </div>

        {analysis.escalation_required ? (
          <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Escalation Advised
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
            ✓ Tier-1 Resolvable
          </span>
        )}
      </div>
    </div>
  );
};
