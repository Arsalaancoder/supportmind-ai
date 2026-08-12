import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { Users, Search, Building2, Mail, Phone, Ticket, ArrowRight, RefreshCw, Plus } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface CustomersPageProps {
  onNavigate: (path: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onNavigate }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/customers?search=${encodeURIComponent(search)}`);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" /> Customers & Organizations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Normalized customer directory stored in Supabase with support ticket stats
          </p>
        </div>

        <button
          onClick={() => onNavigate('/new-ticket')}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs font-mono uppercase tracking-wider shadow-lg flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Ticket</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, company, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg transition-colors flex items-center gap-1"
          >
            Search
          </button>
        </form>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-mono text-sm">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full p-16 text-center space-y-3 bg-slate-900/50 rounded-xl border border-slate-800">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Customers Found</h3>
            <p className="text-xs text-slate-500">Customers are automatically created when tickets are submitted.</p>
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate(`/customers/${c.id}`)}
              className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer shadow-xl space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {c.name}
                  </h3>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                    ID: {c.id.substring(0, 6)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                  {c.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{c.company}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-3 text-slate-400">
                  <span>Tickets: <strong className="text-white">{c.ticket_count || 0}</strong></span>
                  <span>Open: <strong className="text-blue-400">{c.open_tickets || 0}</strong></span>
                  <span>Resolved: <strong className="text-emerald-400">{c.resolved_tickets || 0}</strong></span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
