import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Ticket, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  BrainCircuit, 
  Cpu, 
  Plus, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { safeFetchJson } from '../services/apiClient';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson('/api/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 4 seconds for real-time dashboard updates
    const timer = setInterval(() => {
      safeFetchJson('/api/dashboard/stats')
        .then(data => setStats(data))
        .catch(() => {});
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            SupportMind AI Intelligence Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Support Operations, Hindsight Semantic Memory Bank & Gemini AI Reasoning
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('/new-ticket')}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs font-mono uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid (Section 43) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL CUSTOMERS</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {loading ? '...' : stats?.total_customers ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">System of Record</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>OPEN TICKETS</span>
            <Ticket className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {loading ? '...' : stats?.open_tickets ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">Active Queue</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>RESOLVED TICKETS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {loading ? '...' : stats?.resolved_tickets ?? 0}
          </div>
          <div className="text-[11px] text-emerald-500/80 font-mono">
            {stats?.total_tickets ? Math.round((stats.resolved_tickets / stats.total_tickets) * 100) : 0}% success
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>HINDSIGHT MEMORIES</span>
            <BrainCircuit className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {loading ? '...' : stats?.hindsight_memories ?? 0}
          </div>
          <div className="text-[11px] text-purple-400/80 font-mono">Bank: SmartMind</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AI AGENT RUNS</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {loading ? '...' : stats?.agent_runs ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">Gemini Reasoning</div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tickets List (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-400" /> Recent Support Tickets
            </h2>
            <button
              onClick={() => onNavigate('/tickets')}
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-mono text-sm">Loading tickets...</div>
            ) : !stats?.recent_tickets || stats.recent_tickets.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No tickets found in Supabase database.</p>
                <button
                  onClick={() => onNavigate('/new-ticket')}
                  className="px-4 py-2 text-xs font-semibold rounded bg-indigo-600 text-white"
                >
                  Create First Ticket
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {stats.recent_tickets.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate(`/tickets/${t.id}`)}
                    className="p-4 hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={t.status} size="sm" />
                        <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                          {t.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 truncate">
                        {t.subject}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {t.customers?.name || 'Customer'} {t.customers?.company ? `(${t.customers.company})` : ''}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono text-xs text-slate-500">
                      <div>{new Date(t.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-600">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hindsight Activity Feed (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" /> Memory Activity
            </h2>
            <button
              onClick={() => onNavigate('/memory')}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <span>Hindsight Bank</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            {loading ? (
              <div className="text-center text-slate-500 font-mono text-sm py-6">Loading memory logs...</div>
            ) : !stats?.recent_memory_activity || stats.recent_memory_activity.length === 0 ? (
              <div className="text-center text-slate-500 font-mono text-xs py-8">
                No memory recall/retain events recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_memory_activity.map((ev: any) => (
                  <div key={ev.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold uppercase ${ev.operation === 'retain' ? 'text-purple-400' : 'text-blue-400'}`}>
                        [{ev.operation.toUpperCase()}] {ev.memory_type}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${ev.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                        {ev.status.toUpperCase()}
                      </span>
                    </div>

                    {ev.hindsight_memory_id && (
                      <div className="text-slate-400 text-[11px]">
                        Memory ID: <span className="text-indigo-300">{ev.hindsight_memory_id}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                      <span>Bank: SmartMind</span>
                      <span>{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
