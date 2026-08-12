import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, PriorityLevel } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Ticket as TicketIcon, Search, Filter, Plus, ArrowUpDown, RefreshCw, Hash } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface TicketsPageProps {
  onNavigate: (path: string) => void;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ onNavigate }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const data = await safeFetchJson(`/api/tickets?${params.toString()}`);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TicketIcon className="w-6 h-6 text-indigo-400" /> Support Tickets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer support tickets, AI reasoning history & memory retention status
          </p>
        </div>

        <button
          onClick={() => onNavigate('/new-ticket')}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs font-mono uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, description or ticket ID..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filters:
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="failed">Failed</option>
            <option value="escalated">Escalated</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="network">Network</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="database">Database</option>
            <option value="security">Security</option>
            <option value="billing">Billing</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            onClick={fetchTickets}
            className="ml-auto p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm">Fetching tickets from Supabase...</div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <TicketIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Tickets Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-mono uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Hindsight Retain</th>
                  <th className="p-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onNavigate(`/tickets/${t.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-white">{t.subject}</div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Hash className="w-3 h-3 text-indigo-400" /> {t.id.substring(0, 8)}...
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-slate-200">{t.customer?.name || 'Customer'}</div>
                      <div className="text-xs text-slate-400">{t.customer?.company || 'N/A'}</div>
                    </td>

                    <td className="p-4 font-mono text-xs text-slate-300 uppercase">
                      {t.category}
                    </td>

                    <td className="p-4 font-mono text-xs uppercase">
                      <span className={`px-2 py-0.5 rounded ${
                        t.priority === 'high' || t.priority === 'urgent'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>

                    <td className="p-4 font-mono text-xs">
                      {t.hindsight_retained ? (
                        <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          ✓ Retained
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right font-mono text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
