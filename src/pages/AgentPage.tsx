import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { AIAnalysisBox } from '../components/AIAnalysisBox';
import { StatusBadge } from '../components/StatusBadge';
import { Bot, Cpu, Brain, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface AgentPageProps {
  onNavigate: (path: string) => void;
}

export const AgentPage: React.FC<AgentPageProps> = ({ onNavigate }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    safeFetchJson('/api/tickets?status=open')
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setTickets(list);
        if (list.length > 0) {
          loadTicketDetail(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadTicketDetail = async (id: string) => {
    setAnalyzing(true);
    try {
      const json = await safeFetchJson(`/api/tickets/${id}`);
      setSelectedTicket(json);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const handleReAnalyze = async () => {
    if (!selectedTicket?.id) return;
    setAnalyzing(true);
    try {
      await safeFetchJson('/api/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id }),
      });
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Bot className="w-6 h-6 text-indigo-400" /> SupportMind AI Support Assistant
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Interactive AI troubleshooting workspace combining Gemini reasoning with Hindsight memory bank
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Selector List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Active Tickets Queue
          </h2>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading queue...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
                <p>No open tickets in active queue.</p>
                <button
                  onClick={() => onNavigate('/new-ticket')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-mono font-semibold"
                >
                  Create New Ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetail(t.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1 ${
                    selectedTicket?.id === t.id ? 'bg-indigo-950/60 border-l-4 border-indigo-500' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={t.status} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{t.category}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate">{t.subject}</h3>
                  <div className="text-[11px] text-slate-400">{t.customer?.name || 'Customer'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Workspace Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTicket ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white">{selectedTicket.subject}</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Customer: {selectedTicket.customers?.name} | Category: {selectedTicket.category}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate(`/tickets/${selectedTicket.id}`)}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold flex items-center space-x-1"
                >
                  <span>Inspect Full Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <AIAnalysisBox
                analysis={selectedTicket.latest_agent_run?.gemini_response}
                isLoading={analyzing}
                onReAnalyze={handleReAnalyze}
              />
            </>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 font-mono text-sm">
              Select an active ticket from the queue to run SupportMind AI reasoning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
