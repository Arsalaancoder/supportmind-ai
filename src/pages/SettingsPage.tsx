import React from 'react';
import { Settings, BrainCircuit, Database, Cpu, ShieldCheck, Layers, Server } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" /> Platform Configuration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          SupportMind architecture settings, Hindsight memory bank configuration, and system parameters
        </p>
      </div>

      <div className="space-y-6 font-mono text-xs">
        {/* Hindsight Config */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" /> Hindsight Semantic Memory Bank
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Target Bank ID:</span>
              <div className="text-purple-300 font-bold text-sm">SmartMind</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Environment Base URL:</span>
              <div className="text-slate-300 truncate">https://api.hindsight.vectorize.io</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Deduplication Strategy:</span>
              <div className="text-emerald-400 font-bold">In-memory Deduplication + Hindsight Idempotency</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Retention Triggers:</span>
              <div className="text-indigo-300">Automatic on Ticket Outcome (Success/Failed/Escalated)</div>
            </div>
          </div>
        </div>

        {/* Supabase DB Config */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" /> Supabase Database System of Record
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Normalized Schemas:</span>
              <div className="text-slate-200">customers, tickets, ticket_messages, ticket_outcomes, agent_runs, memory_events</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Connection Status:</span>
              <div className="text-emerald-400 font-bold">Active Cloud Connection</div>
            </div>
          </div>
        </div>

        {/* Gemini AI Config */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" /> Gemini AI Model Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Active Model:</span>
              <div className="text-indigo-300 font-bold text-sm">gemini-3.6-flash</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">SDK Version:</span>
              <div className="text-slate-200">@google/genai TypeScript SDK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
