import React, { useState } from 'react';
import { PlusCircle, ArrowLeft, BrainCircuit, RefreshCw, Sparkles, User, Building2, Mail, Phone, Tag, AlertCircle } from 'lucide-react';
import { safeFetchJson } from '../services/apiClient';

interface NewTicketPageProps {
  onNavigate: (path: string) => void;
}

export const NewTicketPage: React.FC<NewTicketPageProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('network');
  const [priority, setPriority] = useState('medium');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !subject.trim() || !description.trim()) {
      setError('Customer name, subject, and description are required.');
      return;
    }

    setLoading(true);

    try {
      const data = await safeFetchJson('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });

      // Navigate to created ticket
      onNavigate(`/tickets/${data.ticket.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={() => onNavigate('/tickets')}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </button>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-indigo-400" /> Create Support Ticket
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Persists ticket in Supabase, triggers Hindsight Recall & Gemini reasoning automatically
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm font-mono flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Creation Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        
        {/* Customer Information Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <User className="w-4 h-4 text-indigo-400" /> Customer & Organization Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shaik Arsalaan Basha"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. SAB Infotech"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. test@supportmind.local"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Ticket Details Section */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Tag className="w-4 h-4 text-purple-400" /> Technical Issue Specification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="network">Network & Connectivity</option>
                <option value="hardware">Hardware & Equipment</option>
                <option value="software">Software & Application</option>
                <option value="database">Database & Storage</option>
                <option value="security">Security & Access</option>
                <option value="billing">Billing & Subscriptions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Outage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Ticket Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Frequent Internet Disconnections"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Problem Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed technical description of the issue..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-xl shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Ticket, Hindsight & Gemini...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Create Ticket & Analyze</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
