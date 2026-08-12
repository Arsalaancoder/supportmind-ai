import React, { useState, useEffect } from 'react';
import { BrainCircuit, Search, Filter, Layers, Hash, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface MemoryPageProps {
  onNavigate: (path: string) => void;
}

export const MemoryPage: React.FC<MemoryPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (outcomeFilter !== 'all') params.append('outcome', outcomeFilter);

      const json = await safeFetchJson(`/api/memory?${params.toString()}`);
      setData(json);
    } catch (err) {
      console.error('Failed to load Hindsight memories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [outcomeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-purple-400" /> Hindsight Memory Bank
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Long-term semantic support memory store in Bank ID: <strong className="text-purple-300 font-mono">{data?.bank || 'SmartMind'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-300 font-mono text-xs font-semibold flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Bank: {data?.bank || 'SmartMind'}</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories by customer, company, problem or memory ID..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold rounded-lg transition-colors"
          >
            Search Memory
          </button>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 flex items-center gap-1 font-semibold">
              <Filter className="w-3.5 h-3.5 text-purple-400" /> Outcome Filter:
            </span>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Outcome Types</option>
              <option value="successful">Successful Resolutions</option>
              <option value="failed">Failed Attempts</option>
              <option value="escalated">Escalations</option>
            </select>
          </div>

          <button
            onClick={fetchMemories}
            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh Memory Bank"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Memory Cards / List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm">Querying Hindsight Bank '{data?.bank || 'SmartMind'}'...</div>
        ) : !data?.memories || data.memories.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Memories Found</h3>
            <p className="text-xs text-slate-500">Memories are automatically retained into Hindsight upon resolving or closing tickets.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.memories.map((m: any) => (
              <div key={m.id} className="p-5 hover:bg-slate-800/40 transition-colors space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      [{m.memory_type.toUpperCase()}]
                    </span>
                    <h3 className="text-sm font-bold text-white">{m.customer_name} ({m.company})</h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ID: <strong className="text-indigo-300">{m.id}</strong>
                    </span>
                    <span className="text-slate-500">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div>Subject: <strong className="text-slate-100 font-sans">{m.ticket_subject}</strong></div>
                  <div>Ticket Reference: <button onClick={() => onNavigate(`/tickets/${m.ticket_id}`)} className="text-indigo-400 hover:underline">{m.ticket_id}</button></div>
                  {m.fingerprint && <div className="text-[10px] text-slate-500 truncate">Fingerprint: {m.fingerprint}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
