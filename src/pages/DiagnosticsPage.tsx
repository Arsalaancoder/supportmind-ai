import React, { useState, useEffect } from 'react';
import { Activity, Database, Cpu, BrainCircuit, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface DiagnosticsPageProps {
  onNavigate: (path: string) => void;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const json = await safeFetchJson('/api/diagnostics');
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-indigo-400" /> Real Diagnostics & Health Checks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live health verification for Supabase DB, Gemini 3.6 API, and Hindsight Cloud Bank
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Live Health Check</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-sm">Testing real API connections...</div>
      ) : (
        <div className="space-y-6">
          {/* Main Engines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Supabase */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Supabase DB</h3>
                </div>
                {data?.supabase === 'CONNECTED' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> FAILED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">System of record for customers, tickets & events</p>
            </div>

            {/* Gemini */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Gemini 3.6 AI</h3>
                </div>
                {data?.gemini === 'CONNECTED' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> FAILED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">Technical reasoning & troubleshooting model</p>
            </div>

            {/* Hindsight Cloud */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Hindsight Memory</h3>
                </div>
                {data?.hindsight === 'CONNECTED' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {data?.hindsight}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">Bank ID: <strong className="text-purple-300">{data?.hindsight_bank}</strong></p>
            </div>

          </div>

          {/* Audit Details Box */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Operations Audit Log
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Last Memory Recall:</span>
                <div className="text-indigo-300 font-bold">{data?.last_recall ? new Date(data.last_recall).toLocaleString() : 'None'}</div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Last Memory Retain:</span>
                <div className="text-purple-300 font-bold">{data?.last_retain ? new Date(data.last_retain).toLocaleString() : 'None'}</div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Last Retained Memory ID:</span>
                <div className="text-emerald-400 font-bold">{data?.last_retain_memory_id || 'None'}</div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Hindsight Bank ID:</span>
                <div className="text-purple-300 font-bold">{data?.hindsight_bank || 'SmartMind'}</div>
              </div>
            </div>

            {data?.last_error && (
              <div className="p-3 rounded bg-rose-950/60 border border-rose-800 text-rose-200 space-y-1">
                <span className="text-rose-400 font-bold">Last System Error:</span>
                <div className="text-rose-300 font-sans text-xs">{data.last_error}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
