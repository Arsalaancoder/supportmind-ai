import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  Users, 
  Bot, 
  BrainCircuit, 
  Activity, 
  BarChart3, 
  Settings,
  Database,
  Cpu,
  Layers,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

import { safeFetchJson } from '../services/apiClient';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  const [diag, setDiag] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    safeFetchJson('/api/settings')
      .then(data => setDiag(data))
      .catch(() => {});
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tickets', label: 'Tickets', icon: Ticket },
    { path: '/new-ticket', label: 'New Ticket', icon: PlusCircle, highlight: true },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/agent', label: 'AI Agent Panel', icon: Bot },
    { path: '/memory', label: 'Hindsight Memory', icon: BrainCircuit },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/diagnostics', label: 'Diagnostics', icon: Activity },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg shadow-indigo-500/30 shadow-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            SUPPORTMIND <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
          </span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop / Drawer for Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { onNavigate('/'); setMobileOpen(false); }}>
            <div className="p-2 bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-600 rounded-xl shadow-indigo-500/20 shadow-xl border border-indigo-400/20">
              <BrainCircuit className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                SUPPORTMIND
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400">Enterprise Memory Platform</p>
            </div>
          </div>
        </div>

        {/* Hindsight Bank Banner */}
        <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-950/60 border border-indigo-900/40 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Hindsight Bank
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">ACTIVE</span>
          </div>
          <div className="font-mono text-indigo-300 font-semibold bg-indigo-950/40 px-2 py-1 rounded border border-indigo-800/30 text-center tracking-wide">
            SupportMind
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-inner' 
                    : item.highlight
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white hover:bg-indigo-600/40 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}
        </nav>

        {/* System Connections Status */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2 text-xs">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">Connected Engines</div>
          
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Supabase DB
            </span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${diag?.supabase?.configured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              {diag?.supabase?.configured ? 'CONNECTED' : 'CHECKING'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-purple-400" /> Gemini 3.6
            </span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${diag?.gemini?.configured ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
              {diag?.gemini?.configured ? 'ONLINE' : 'CHECKING'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" /> Hindsight Memory
            </span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${diag?.hindsight?.configured ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
              {diag?.hindsight?.configured ? 'ACTIVE' : 'CHECKING'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
