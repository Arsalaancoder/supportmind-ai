import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, XCircle, AlertTriangle, BrainCircuit, RefreshCw, Layers } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface AnalyticsPageProps {
  onNavigate: (path: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const json = await safeFetchJson('/api/analytics');
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> SupportMind Support Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Calculated metrics across support tickets, troubleshooting outcomes, and Hindsight recall efficiency
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-sm">Calculating real application statistics...</div>
      ) : (
        <div className="space-y-8">
          {/* Core Rates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>RESOLUTION RATE</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {data?.metrics?.resolution_rate ?? 0}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Successfully resolved tickets</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>FAILURE RATE</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-extrabold text-rose-400 font-mono">
                {data?.metrics?.failure_rate ?? 0}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Unresolved or failed troubleshooting</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>ESCALATION RATE</span>
                <AlertTriangle className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-purple-400 font-mono">
                {data?.metrics?.escalation_rate ?? 0}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Tier-2 or engineering escalations</p>
            </div>
          </div>

          {/* Action Breakdown & Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Successful Actions */}
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Most Successful Troubleshooting Actions
              </h3>

              {!data?.successful_actions || data.successful_actions.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono py-4 text-center">No successful outcomes recorded yet.</div>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {data.successful_actions.map((act: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-200 font-sans">{act.action}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                        {act.count} resolved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hindsight Memory Stats */}
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" /> Hindsight Memory Bank Performance
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Total Memory Recalls:</span>
                  <span className="text-indigo-300 font-bold">{data?.hindsight_usage?.total_recalls || 0}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Total Memory Retains:</span>
                  <span className="text-purple-300 font-bold">{data?.hindsight_usage?.total_retains || 0}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Successful Retentions:</span>
                  <span className="text-emerald-400 font-bold">{data?.hindsight_usage?.successful_retains || 0}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Duplicate Preventions (Idempotent):</span>
                  <span className="text-amber-400 font-bold">{data?.hindsight_usage?.duplicate_preventions || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
