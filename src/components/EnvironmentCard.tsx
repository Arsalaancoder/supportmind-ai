import React from 'react';
import { CustomerEnvironment } from '../types';
import { Cpu, Server, Database, Cloud, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EnvironmentCardProps {
  environment?: CustomerEnvironment | null;
  analysis?: {
    compatibility_status?: string;
    notes?: string;
  } | null;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({ environment, analysis }) => {
  if (!environment || Object.keys(environment).length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2 text-center text-slate-500 font-mono text-xs">
        <Cpu className="w-5 h-5 text-slate-600 mx-auto" />
        <div>No customer environment profile recorded.</div>
      </div>
    );
  }

  const { os, framework, cloud_provider, sdk_version, db_engine, plan_tier } = environment;

  const isConflict = analysis?.compatibility_status === 'known_conflict';

  return (
    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" /> Customer Tech Environment
        </h4>
        {analysis?.compatibility_status && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
            isConflict ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {isConflict ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {analysis.compatibility_status}
          </span>
        )}
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {os && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 block uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-400" /> OS
            </span>
            <span className="text-slate-200 font-bold truncate block">{os}</span>
          </div>
        )}

        {cloud_provider && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 block uppercase flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-400" /> Cloud Provider
            </span>
            <span className="text-slate-200 font-bold truncate block">{cloud_provider}</span>
          </div>
        )}

        {framework && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 block uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Stack / Framework
            </span>
            <span className="text-slate-200 font-bold truncate block">{framework}</span>
          </div>
        )}

        {sdk_version && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 block uppercase flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-400" /> SDK Version
            </span>
            <span className="text-slate-200 font-bold truncate block">{sdk_version}</span>
          </div>
        )}

        {db_engine && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 block uppercase flex items-center gap-1">
              <Database className="w-3 h-3 text-amber-400" /> DB Engine
            </span>
            <span className="text-slate-200 font-bold truncate block">{db_engine}</span>
          </div>
        )}

        {plan_tier && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 block uppercase font-bold text-indigo-400">
              Subscription Tier
            </span>
            <span className="text-indigo-200 font-extrabold uppercase block">{plan_tier}</span>
          </div>
        )}
      </div>

      {analysis?.notes && (
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
          <strong className="text-indigo-400">Environment Insight:</strong> {analysis.notes}
        </div>
      )}
    </div>
  );
};
