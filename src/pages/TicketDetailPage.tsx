import React, { useState, useEffect } from 'react';
import { Ticket, Message, TicketOutcome, AgentRun, MemoryEvent, OutcomeType, HindsightMemory, GeminiAnalysis } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AIAnalysisBox } from '../components/AIAnalysisBox';
import { TroubleshootingPanel } from '../components/TroubleshootingPanel';
import { CustomerStoryBanner } from '../components/CustomerStoryBanner';
import { FrustrationMeter } from '../components/FrustrationMeter';
import { EnvironmentCard } from '../components/EnvironmentCard';
import { KnownIssuesWidget } from '../components/KnownIssuesWidget';
import { ProvenSolutionsCard } from '../components/ProvenSolutionsCard';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Hash, 
  Brain, 
  Send, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface TicketDetailPageProps {
  ticketId: string;
  onNavigate: (path: string) => void;
}

export const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ ticketId, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzeState, setAnalyzeState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  // Transient in-memory analysis returned directly from /api/analyze-ticket
  const [transientAnalysis, setTransientAnalysis] = useState<GeminiAnalysis | null>(null);
  const [submittingOutcome, setSubmittingOutcome] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [approving, setApproving] = useState(false);

  const fetchTicketDetail = async () => {
    try {
      const json = await safeFetchJson(`/api/tickets/${ticketId}`);
      setData(json);
      // If a persisted latest_agent_run with a saved `gemini_response` exists, clear any transient analysis
      if (json?.latest_agent_run?.gemini_response) {
        setTransientAnalysis(null);
      }
    } catch (err) {
      console.error('Error loading ticket detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId]);

  const handleRecordOutcome = async (action: string, outcome: OutcomeType, notes: string) => {
    setSubmittingOutcome(true);
    try {
      await safeFetchJson(`/api/tickets/${ticketId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, outcome, notes }),
      });
      await fetchTicketDetail();
    } catch (err: any) {
      alert(`Error recording outcome: ${err.message}`);
      throw err;
    } finally {
      setSubmittingOutcome(false);
    }
  };

  const handleRetryRetain = async () => {
    try {
      await safeFetchJson(`/api/tickets/${ticketId}/retain-retry`, {
        method: 'POST',
      });
      await fetchTicketDetail();
    } catch (err: any) {
      alert(`Retry Retain Error: ${err.message}`);
      throw err;
    }
  };

  const handleReAnalyze = async () => {
    if (!ticketId) {
      setAnalyzeError('Ticket ID is missing. Cannot run analysis.');
      setAnalyzeState('error');
      return;
    }

    setAnalyzeState('loading');
    setAnalyzeError(null);
    console.log('[ANALYZE] button clicked', { ticket_id: ticketId });

    try {
      const result = await safeFetchJson('/api/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      if (result.success) {
        setAnalyzeState('success');
        // If backend returned analysis immediately (persistence may be unavailable), show it transiently
        if (result.analysis || result.agent_run?.gemini_response) {
          setTransientAnalysis(result.analysis || result.agent_run?.gemini_response || null);
        }
        // Reload ticket detail so latest_agent_run is populated from Supabase
        await fetchTicketDetail();
      } else {
        const errMsg = result.error || 'Analysis failed.';
        setAnalyzeError(`[${result.service || 'unknown'}] ${errMsg}`);
        setAnalyzeState('error');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error during analysis.';
      console.error('[ANALYZE] failed', { name: err.name, message: err.message });
      setAnalyzeError(errMsg);
      setAnalyzeState('error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    console.log('[SEND] clicked', { ticket_id: ticketId });

    if (!ticketId) {
      setSendError('Ticket ID is missing. Cannot send message.');
      return;
    }

    if (!newMessage.trim()) return;

    console.log('[SEND] message length', newMessage.trim().length);
    setMessageSending(true);

    try {
      console.log('[SEND] API request started', { ticket_id: ticketId });
      const result = await safeFetchJson(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'Support Engineer',
          content: newMessage.trim(),
        }),
      });

      console.log('[SEND] API response status OK', { message_id: result?.message?.id });

      if (result.success) {
        console.log('[SEND] message inserted', { message_id: result.message?.id });
        setNewMessage('');
        // If backend returned an AI reply proposal, surface it for human approval
        if (result.ai_reply) {
          setAiProposal(result.ai_reply);
        }
        await fetchTicketDetail();
      } else {
        const errMsg = result.error || 'Failed to send message.';
        console.error('[SEND] failed', { error: errMsg });
        setSendError(errMsg);
      }
    } catch (err: any) {
      console.error('[SEND] failed', {
        name: err.name,
        message: err.message,
        cause: err.cause,
        code: err.cause?.code,
      });
      setSendError(err.message || 'Failed to send message. Please retry.');
    } finally {
      setMessageSending(false);
    }
  };

  const handleApproveAi = async (overrideContent?: string) => {
    if (!ticketId || !aiProposal) return;
    setApproving(true);
    try {
      const pid = aiProposal.id || 'null';
      const body: any = { content: overrideContent || aiProposal.content };
      const result = await safeFetchJson(`/api/tickets/${ticketId}/ai-proposals/${pid}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (result.success) {
        setAiProposal(null);
        await fetchTicketDetail();
      } else {
        alert('Failed to approve AI reply: ' + (result.error || 'unknown'));
      }
    } catch (err: any) {
      alert('Approve failed: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-sm max-w-7xl mx-auto space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p>Loading ticket from Supabase system of record...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-400 max-w-7xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <button
          onClick={() => onNavigate('/tickets')}
          className="px-4 py-2 text-xs font-semibold rounded bg-indigo-600 text-white"
        >
          Back to Tickets List
        </button>
      </div>
    );
  }

  const ticket: Ticket = data;
  const customer = data.customers || {};
  const latestAgentRun: AgentRun | null = data.latest_agent_run;
  const geminiAnalysis = transientAnalysis || latestAgentRun?.gemini_response || null;
  const recalledMemories: HindsightMemory[] = data.memory_events
    ?.filter((e: MemoryEvent) => e.operation === 'recall')
    ?.map((e: MemoryEvent) => e.metadata?.recalled_memories)
    ?.flat()
    ?.filter(Boolean) || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('/tickets')}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </button>
          <div className="flex items-center space-x-3">
            <StatusBadge status={ticket.status} size="lg" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {ticket.subject}
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-indigo-400" /> ID: {ticket.id}</span>
            <span className="uppercase text-slate-300">Category: {ticket.category}</span>
            <span className="uppercase text-slate-300">Priority: {ticket.priority}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReAnalyze}
            disabled={analyzeState === 'loading'}
            className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 ${
              analyzeState === 'loading'
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : analyzeState === 'success'
                ? 'bg-emerald-900/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                : analyzeState === 'error'
                ? 'bg-rose-900/40 border-rose-700 text-rose-300 hover:bg-rose-900/60'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Sparkles className={`w-4 h-4 text-amber-400 ${analyzeState === 'loading' ? 'animate-spin' : ''}`} />
            <span>
              {analyzeState === 'loading'
                ? 'Analyzing...'
                : analyzeState === 'success'
                ? 'Analysis Complete'
                : analyzeState === 'error'
                ? 'Retry Analysis'
                : 'Run Hindsight Recall & Gemini Analysis'}
            </span>
          </button>
        </div>
      </div>

      {/* Zero-Repetition Customer Memory Banner */}
      <CustomerStoryBanner
        customer={customer}
        ticketsCount={data.tickets?.length || 1}
        environment={customer.environment}
        frustrationLevel={geminiAnalysis?.frustration_assessment?.level || ticket.frustration_level}
        repeatIssueDetected={ticket.repeat_issue_detected || Boolean(geminiAnalysis?.frustration_assessment?.repeat_explanations_count)}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols): CURRENT TICKET & AI Reasoning */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 27: CRITICAL UI DISTINCTION - CURRENT TICKET BOX */}
          <div className="p-6 rounded-xl bg-slate-900/90 border-2 border-indigo-500/80 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-700/60">
                ★ CURRENT TICKET (SYSTEM OF RECORD)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Created: {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
              <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed bg-slate-950/70 p-4 rounded-lg border border-slate-800/80 font-sans">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Known Issues Widget */}
          {geminiAnalysis?.known_issue_match && (
            <KnownIssuesWidget
              knownIssue={geminiAnalysis.known_issue_match}
              onApplyWorkaround={(text) => setNewMessage(`[Workaround Applied] ${text}`)}
            />
          )}

          {/* What Solutions Worked Before (Proven Solutions Card) */}
          {geminiAnalysis?.proven_solutions && geminiAnalysis.proven_solutions.length > 0 && (
            <ProvenSolutionsCard
              solutions={geminiAnalysis.proven_solutions}
              onApplySolution={(action) => setNewMessage(`Based on past successful resolution: ${action}`)}
            />
          )}

          {/* AI Analysis Section (Gemini + Recall Stats) */}
          <AIAnalysisBox
            analysis={geminiAnalysis}
            recallStats={
              latestAgentRun
                ? {
                    total_recalled: latestAgentRun.recalled_memory_count,
                    unique_memories: latestAgentRun.unique_memory_count,
                    duplicates_removed: Math.max(0, latestAgentRun.recalled_memory_count - latestAgentRun.unique_memory_count),
                  }
                : undefined
            }
            isLoading={analyzeState === 'loading'}
            error={analyzeError}
            onReAnalyze={handleReAnalyze}
          />

          {/* Troubleshooting Panel */}
          <TroubleshootingPanel
            ticketId={ticket.id}
            currentStatus={ticket.status}
            hindsightRetained={ticket.hindsight_retained}
            hindsightMemoryId={ticket.hindsight_memory_id}
            onRecordOutcome={handleRecordOutcome}
            onRetryRetain={handleRetryRetain}
            isSubmitting={submittingOutcome}
          />

          {/* Conversation & Activity History */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Support Agent & Customer Conversation
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {data.messages?.map((msg: Message) => (
                <div key={msg.id} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1 text-sm">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-indigo-300">{msg.sender}</span>
                    <span className="text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-line font-sans">{msg.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-slate-800">
              {sendError && (
                <div className="px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              {aiProposal && (
                <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800 text-slate-100 text-sm space-y-2 mb-2">
                  <div className="font-mono text-xs text-indigo-200">Proposed AI Reply</div>
                  <div className="whitespace-pre-wrap text-sm">{aiProposal.content}</div>
                  <div className="flex items-center space-x-2 pt-2">
                    <button type="button" onClick={() => handleApproveAi()} disabled={approving} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded">{approving ? 'Approving...' : 'Approve'}</button>
                    <button type="button" onClick={() => setAiProposal(null)} disabled={approving} className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs rounded">Reject</button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); setSendError(null); }}
                  placeholder="Type a support response or diagnostic log..."
                  className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={messageSending || !newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{messageSending ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Sidebar (1 col): Customer Profile & Memory Insights */}
        <div className="space-y-6">
          
          {/* Customer Frustration Meter */}
          <FrustrationMeter
            assessment={geminiAnalysis?.frustration_assessment}
            level={customer.frustration_level || ticket.frustration_level}
            score={customer.frustration_score}
          />

          {/* Customer Environment Profile Card */}
          <EnvironmentCard
            environment={customer.environment}
            analysis={geminiAnalysis?.environment_analysis}
          />

          {/* Customer Profile Card */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
              Customer Information
            </h3>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="flex items-center space-x-2.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-100 font-semibold">{customer.name || 'Customer'}</span>
              </div>

              {customer.company && (
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{customer.company}</span>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center space-x-2.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate(`/customers/${customer.id}`)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono rounded border border-slate-700 transition-colors"
            >
              View Customer History
            </button>
          </div>

          {/* Hindsight Memory Status */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Hindsight Memory Bank</span>
              <Brain className="w-4 h-4 text-purple-400" />
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Bank Identifier:</span>
                <span className="text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">SmartMind</span>
              </div>

              {ticket.hindsight_memory_id && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-500">Memory ID:</div>
                  <div className="text-indigo-300 truncate font-semibold">{ticket.hindsight_memory_id}</div>
                </div>
              )}
            </div>
          </div>

          {/* Previous Outcomes History */}
          {data.outcomes && data.outcomes.length > 0 && (
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                Recorded Troubleshooting Log
              </h3>

              <div className="space-y-2">
                {data.outcomes.map((o: TicketOutcome) => (
                  <div key={o.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-100 font-semibold">{o.action}</span>
                      <StatusBadge status={o.outcome} size="sm" />
                    </div>
                    {o.notes && <div className="text-slate-400 text-[11px] font-sans">{o.notes}</div>}
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
