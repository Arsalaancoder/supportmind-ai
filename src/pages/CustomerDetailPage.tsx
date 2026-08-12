import React, { useState, useEffect } from 'react';
import { Ticket, MemoryEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FrustrationMeter } from '../components/FrustrationMeter';
import { EnvironmentCard } from '../components/EnvironmentCard';
import { User, Building2, Mail, Phone, ArrowLeft, Ticket as TicketIcon, BrainCircuit, Hash } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface CustomerDetailPageProps {
  customerId: string;
  onNavigate: (path: string) => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customerId, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);

  useEffect(() => {
    safeFetchJson(`/api/customers/${customerId}`)
      .then(json => setData(json))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleRefreshMentalModel = async () => {
    setRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(null);
    try {
      const res = await safeFetchJson(`/api/customers/${customerId}/mental-model-refresh`, { method: 'POST' });
      if (res.success) {
        setRefreshSuccess('Updated successfully');
        // Refresh customer data
        const updated = await safeFetchJson(`/api/customers/${customerId}`);
        setData(updated);
      } else {
        setRefreshError(res.error || 'Failed to refresh mental model');
      }
    } catch (err: any) {
      setRefreshError(err.message || 'Failed to refresh mental model');
    } finally {
      setRefreshing(false);
      setTimeout(() => { setRefreshSuccess(null); setRefreshError(null); }, 4000);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-mono text-sm">Loading customer profile...</div>;
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <h2 className="text-xl font-bold text-white">Customer Not Found</h2>
        <button onClick={() => onNavigate('/customers')} className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-mono">
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 space-y-2">
        <button
          onClick={() => onNavigate('/customers')}
          className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
        </button>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <User className="w-6 h-6 text-indigo-400" /> {data.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
          {data.company && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-500" /> {data.company}</span>}
          {data.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {data.email}</span>}
          {data.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {data.phone}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Tickets */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-indigo-400" /> Support Tickets History
          </h2>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {data.tickets?.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">No tickets submitted by this customer yet.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {data.tickets?.map((t: Ticket) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate(`/tickets/${t.id}`)}
                    className="p-4 hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={t.status} size="sm" />
                        <span className="text-xs font-mono text-slate-400 uppercase font-semibold">{t.category}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{t.subject}</h3>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Historical Hindsight Memory Events & Environment */}
        <div className="space-y-4">
          <FrustrationMeter
            level={data.frustration_level}
            score={data.frustration_score}
            repeatCount={data.tickets?.length > 1 ? data.tickets.length - 1 : 0}
          />

          <EnvironmentCard environment={data.environment} />

          {/* Customer Profile Card */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
              Customer Information
            </h3>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="flex items-center space-x-2.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-100 font-semibold">{data.name}</span>
              </div>

              {data.company && (
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{data.company}</span>
                </div>
              )}

              {data.email && (
                <div className="flex items-center space-x-2.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{data.email}</span>
                </div>
              )}

              {data.phone && (
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{data.phone}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate(`/tickets?customer_id=${data.id}`)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono rounded border border-slate-700 transition-colors"
              >
                View Customer Tickets
              </button>

              <button
                onClick={handleRefreshMentalModel}
                disabled={refreshing}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono rounded border border-indigo-700 transition-colors"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Mental Model'}
              </button>

              {refreshSuccess && <div className="text-xs text-emerald-400">{refreshSuccess}</div>}
              {refreshError && <div className="text-xs text-rose-400">{refreshError}</div>}
            </div>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" /> Memory Retentions
          </h2>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            {data.memory_events?.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">No Hindsight memory events recorded for this customer.</div>
            ) : (
              data.memory_events?.map((ev: MemoryEvent) => (
                <div key={ev.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-bold uppercase">{ev.memory_type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${ev.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      {ev.status}
                    </span>
                  </div>
                  {ev.hindsight_memory_id && (
                    <div className="text-[11px] text-slate-400 truncate">
                      ID: <span className="text-indigo-300">{ev.hindsight_memory_id}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    {new Date(ev.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
