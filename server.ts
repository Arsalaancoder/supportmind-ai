import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getSupabaseServer, getNormalizedSupabaseConfig, tableExists } from './src/supabase/supabaseServer';
import { hindsightHealthCheck, hindsightRecall, hindsightRetain, generateMemoryFingerprint } from './src/services/hindsight';
import { getGeminiClient, analyzeTicketWithGemini } from './src/services/gemini';
import { generateMentalModelFromMemories } from './src/services/mentalModel';
import { Customer, Ticket, OutcomeType, GeminiAnalysis } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Startup Environment Variable Validation
function validateServerEnvironment() {
  const vars = [
    { key: 'SUPABASE_URL', name: 'Supabase URL' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', name: 'Supabase Service Role Key' },
    { key: 'GEMINI_API_KEY', name: 'Gemini API Key' },
    { key: 'HINDSIGHT_API_URL', name: 'Hindsight API URL' },
    { key: 'HINDSIGHT_API_KEY', name: 'Hindsight API Key' },
    { key: 'HINDSIGHT_BANK_ID', name: 'Hindsight Bank ID' },
  ];

  console.log('================ SERVER ENVIRONMENT CHECK ================');
  for (const v of vars) {
    const val = process.env[v.key];
    if (!val || val.trim() === '' || val.includes('placeholder')) {
      console.warn(`[CONFIG ERROR] ${v.key} (${v.name}) is missing or unconfigured.`);
    } else {
      console.log(`[CONFIG OK] ${v.key} is set.`);
    }
  }
  console.log('==========================================================');
}

validateServerEnvironment();

// Utility for normalizing customer strings (Section 19)
function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

// -------------------------------------------------------------
// HEALTH CHECK FUNCTIONS
// -------------------------------------------------------------
async function checkSupabaseTable(tableName: string) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from(tableName).select('id').limit(1);

  if (!error) {
    return {
      table: tableName,
      exists: true,
      error: null,
    };
  }

  const message = error.message || '';
  const tableNotFound = error.code === 'PGRST205'
    || message.includes(`public.${tableName}`)
    || message.includes(`relation \"${tableName}\"`)
    || message.includes('does not exist');

  return {
    table: tableName,
    exists: !tableNotFound,
    error: tableNotFound ? `Table '${tableName}' does not exist in Supabase.` : message,
  };
}

export async function checkSupabase(): Promise<{
  configured: boolean;
  reachable: boolean;
  missingTables?: string[];
  error: string | null;
}> {
  const config = getNormalizedSupabaseConfig();

  if (!config.isValid) {
    return {
      configured: false,
      reachable: false,
      missingTables: [],
      error: config.error,
    };
  }

  const requiredTables = ['customers', 'tickets', 'messages', 'ticket_outcomes', 'agent_runs', 'memory_events'];

  try {
    const tableChecks = await Promise.all(requiredTables.map(checkSupabaseTable));
    const missingTables = tableChecks.filter(check => !check.exists).map(check => check.table);

    if (missingTables.length > 0) {
      return {
        configured: true,
        reachable: true,
        missingTables,
        error: `Missing Supabase tables: ${missingTables.join(', ')}`,
      };
    }

    return {
      configured: true,
      reachable: true,
      missingTables: [],
      error: null,
    };
  } catch (err: any) {
    return {
      configured: true,
      reachable: false,
      missingTables: [],
      error: err.message,
    };
  }
}

export async function checkHindsight(): Promise<{
  configured: boolean;
  reachable: boolean;
  apiUrl: string;
  bankId: string;
  error: string | null;
}> {
  let rawUrl = (process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io').trim().replace(/\/$/, '');
  const apiKey = (process.env.HINDSIGHT_API_KEY || '').trim();
  const bankId = (process.env.HINDSIGHT_BANK_ID || 'SmartMind').trim();

  if (!rawUrl || !rawUrl.startsWith('http') || rawUrl.includes('hsk_') || rawUrl.includes('dashboard') || rawUrl.includes('supportmind')) {
    rawUrl = 'https://api.hindsight.vectorize.io';
  }

  let hostname = 'api.hindsight.vectorize.io';
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {}

  const configured = Boolean(apiKey && apiKey !== 'placeholder');

  if (!configured) {
    return {
      configured: false,
      reachable: false,
      apiUrl: hostname,
      bankId,
      error: 'HINDSIGHT_API_KEY environment variable is missing or unconfigured.',
    };
  }

  try {
    const healthResult = await hindsightHealthCheck();
    if (healthResult.status === 'connected') {
      return {
        configured: true,
        reachable: true,
        apiUrl: hostname,
        bankId,
        error: null,
      };
    } else {
      return {
        configured: true,
        reachable: false,
        apiUrl: hostname,
        bankId,
        error: healthResult.message,
      };
    }
  } catch (err: any) {
    return {
      configured: true,
      reachable: false,
      apiUrl: hostname,
      bankId,
      error: err.message,
    };
  }
}

export async function checkGemini(): Promise<{
  configured: boolean;
  reachable: boolean;
  error: string | null;
}> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const configured = Boolean(apiKey && apiKey !== 'placeholder');

  if (!configured) {
    return {
      configured: false,
      reachable: false,
      error: 'GEMINI_API_KEY environment variable is missing or unconfigured.',
    };
  }

  try {
    const ai = getGeminiClient();
    const modelCandidates = ['gemini-flash-latest', 'gemini-3-flash-preview'];
    let response;

    for (const model of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: 'Ping health check',
        });
        break;
      } catch (err: any) {
        console.warn(`[Gemini] health check model ${model} failed:`, err?.message || err);
      }
    }

    if (!response) {
      throw new Error('All Gemini health check models failed.');
    }
    if (response && response.text) {
      return {
        configured: true,
        reachable: true,
        error: null,
      };
    } else {
      return {
        configured: true,
        reachable: false,
        error: 'Gemini returned an empty response during health check.',
      };
    }
  } catch (err: any) {
    return {
      configured: true,
      reachable: false,
      error: err.message,
    };
  }
}

// -------------------------------------------------------------
// 1. HEALTH & DIAGNOSTICS API
// -------------------------------------------------------------
app.get('/api/diagnostics', async (req: Request, res: Response) => {
  const [supabaseRes, hindsightRes, geminiRes] = await Promise.all([
    checkSupabase(),
    checkHindsight(),
    checkGemini(),
  ]);

  res.json({
    supabase: supabaseRes,
    hindsight: hindsightRes,
    gemini: geminiRes,
  });
});

// AI Proposal endpoints: create/list/approve
app.post('/api/tickets/:id/ai-proposals', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;
  const { content } = req.body;

  if (!content || typeof content !== 'string') return res.status(400).json({ success: false, error: 'content is required' });

  try {
    if (await tableExists('ai_proposals')) {
      const { data: prop, error } = await supabase.from('ai_proposals').insert({ ticket_id: ticketId, content, status: 'proposed' }).select().single();
      if (error) throw error;
      return res.json({ success: true, proposal: prop });
    }
    return res.json({ success: true, proposal: { id: null, ticket_id: ticketId, content, status: 'proposed' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/tickets/:id/ai-proposals', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;
  try {
    if (await tableExists('ai_proposals')) {
      const { data, error } = await supabase.from('ai_proposals').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, proposals: data });
    }
    return res.json({ success: true, proposals: [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tickets/:id/ai-proposals/:pid/approve', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;
  const pid = req.params.pid;
  const { content } = req.body;

  try {
    // Fetch proposal if persisted
    let proposal: any = null;
    if (await tableExists('ai_proposals') && pid && pid !== 'null') {
      const { data: p } = await supabase.from('ai_proposals').select('*').eq('id', pid).maybeSingle();
      proposal = p || null;
    }

    const finalContent = content || req.body?.content || proposal?.content || 'AI response approved.';
    if (!finalContent) return res.status(400).json({ success: false, error: 'No content to approve' });

    // Persist message
    let persistedMessage: any = null;
    if (await tableExists('messages')) {
      const { data: msg, error: msgErr } = await supabase.from('messages').insert({ ticket_id: ticketId, sender: 'AI Assistant', content: finalContent }).select().single();
      if (msgErr) throw msgErr;
      persistedMessage = { id: msg.id, ticket_id: msg.ticket_id, sender: msg.sender, content: msg.content, created_at: msg.created_at };
    } else {
      persistedMessage = { id: `ai_${Date.now()}`, ticket_id: ticketId, sender: 'AI Assistant', content: finalContent, created_at: new Date().toISOString() };
    }

    // Update proposal status if persisted
    if (proposal && await tableExists('ai_proposals')) {
      await supabase.from('ai_proposals').update({ status: 'approved', message_id: persistedMessage.id, approved_at: new Date().toISOString() }).eq('id', proposal.id);
    }

    return res.json({ success: true, message: persistedMessage });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Detailed Supabase Diagnostics Endpoint
app.get('/api/diagnostics/supabase', async (req: Request, res: Response) => {
  const config = getNormalizedSupabaseConfig();

  if (!config.isValid) {
    return res.json({
      configured: false,
      reachable: false,
      database: false,
      customersTable: false,
      error: config.error,
    });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('customers').select('id').limit(1);

    if (error) {
      console.error('[SUPABASE] Diagnostics database query error:', {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      });

      const errCode = (error as any).code || '';
      const errMsg = error.message || '';

      if (errCode === '42P01' || errMsg.includes('does not exist') || errMsg.includes('relation "public.customers"')) {
        return res.json({
          configured: true,
          reachable: true,
          database: true,
          customersTable: false,
          error: "Table 'customers' does not exist in Supabase database.",
        });
      }

      if (errCode === '42501' || errMsg.includes('permission denied') || errMsg.includes('row-level security') || errMsg.includes('RLS')) {
        return res.json({
          configured: true,
          reachable: true,
          database: true,
          customersTable: false,
          error: `Supabase Row Level Security (RLS) restriction: ${errMsg}`,
        });
      }

      if (errCode === 'PGRST301' || errMsg.includes('JWT') || errMsg.includes('API key') || errMsg.includes('invalid key')) {
        return res.json({
          configured: true,
          reachable: false,
          database: false,
          customersTable: false,
          error: `Supabase authentication failed: ${errMsg}`,
        });
      }

      return res.json({
        configured: true,
        reachable: true,
        database: false,
        customersTable: false,
        error: errMsg,
      });
    }

    return res.json({
      configured: true,
      reachable: true,
      database: true,
      customersTable: true,
      error: null,
    });
  } catch (err: any) {
    console.error('[SUPABASE] Diagnostics fetch connection error:', {
      name: err?.name,
      message: err?.message,
      cause: err?.cause,
      code: err?.cause?.code,
      hostname: err?.cause?.hostname,
      port: err?.cause?.port,
    });

    let detailedError = err?.message || 'Connection failed';
    if (err?.cause) {
      if (err.cause.code === 'ENOTFOUND') {
        detailedError = `DNS resolution failed for hostname "${err.cause.hostname || config.hostname}"`;
      } else if (err.cause.code === 'ECONNREFUSED') {
        detailedError = `Connection refused at ${err.cause.hostname}:${err.cause.port}`;
      } else if (err.cause.code) {
        detailedError = `Network connection error (${err.cause.code}): ${err.cause.message || err.message}`;
      }
    }

    return res.json({
      configured: true,
      reachable: false,
      database: false,
      customersTable: false,
      error: detailedError,
    });
  }
});

// Settings Status
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    supabase: {
      configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 15)}...` : 'Not Set',
    },
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
    },
    hindsight: {
      configured: Boolean(process.env.HINDSIGHT_API_KEY),
      bank_id: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
    },
  });
});

// -------------------------------------------------------------
// 2. DASHBOARD & STATS API
// -------------------------------------------------------------
app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();

  try {
    const [
      customersRes,
      ticketsRes,
      outcomesRes,
      memoryEventsRes,
      agentRunsRes,
      recentTicketsRes,
      recentActivityRes,
    ] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id, status, category, priority, created_at, subject, customer_id, customers(name, company)'),
      supabase.from('ticket_outcomes').select('id, outcome, action'),
      supabase.from('memory_events').select('id, operation, status, hindsight_memory_id, created_at, hindsight_bank'),
      supabase.from('agent_runs').select('id, recalled_memory_count, unique_memory_count, created_at, status'),
      supabase.from('tickets').select('id, subject, status, priority, category, created_at, customer_id, customers(name, company)').order('created_at', { ascending: false }).limit(6),
      supabase.from('memory_events').select('id, operation, memory_type, status, hindsight_memory_id, created_at, ticket_id').order('created_at', { ascending: false }).limit(6),
    ]);

    const tickets = ticketsRes.data || [];
    const outcomes = outcomesRes.data || [];
    const memoryEvents = memoryEventsRes.data || [];
    const agentRuns = agentRunsRes.data || [];

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
    const failedCount = tickets.filter(t => t.status === 'failed').length;
    const escalatedCount = tickets.filter(t => t.status === 'escalated').length;

    const successfulResolutions = outcomes.filter(o => o.outcome === 'successful').length;
    const hindsightMemoriesCount = memoryEvents.filter(e => e.operation === 'retain' && e.status === 'success').length;

    res.json({
      total_customers: customersRes.count || 0,
      total_tickets: tickets.length,
      open_tickets: openCount,
      resolved_tickets: resolvedCount,
      failed_tickets: failedCount,
      escalated_tickets: escalatedCount,
      successful_resolutions: successfulResolutions,
      hindsight_memories: hindsightMemoriesCount,
      agent_runs: agentRuns.length,
      recent_tickets: recentTicketsRes.data || [],
      recent_memory_activity: recentActivityRes.data || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. CUSTOMERS API
// -------------------------------------------------------------
app.get('/api/customers', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const search = (req.query.search as string) || '';

  try {
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data: customers, error } = await query;
    if (error) throw error;

    // Attach ticket statistics per customer
    const customerIds = (customers || []).map(c => c.id);
    let ticketStatsMap: Record<string, { total: number; open: number; resolved: number }> = {};

    if (customerIds.length > 0) {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('customer_id, status')
        .in('customer_id', customerIds);

      (tickets || []).forEach(t => {
        if (!ticketStatsMap[t.customer_id]) {
          ticketStatsMap[t.customer_id] = { total: 0, open: 0, resolved: 0 };
        }
        ticketStatsMap[t.customer_id].total++;
        if (t.status === 'open' || t.status === 'in_progress') ticketStatsMap[t.customer_id].open++;
        if (t.status === 'resolved') ticketStatsMap[t.customer_id].resolved++;
      });
    }

    const result = (customers || []).map(c => ({
      ...c,
      ticket_count: ticketStatsMap[c.id]?.total || 0,
      open_tickets: ticketStatsMap[c.id]?.open || 0,
      resolved_tickets: ticketStatsMap[c.id]?.resolved || 0,
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const customerId = req.params.id;

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch customer tickets
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // Fetch historical memory events for customer
    const { data: memoryEvents } = await supabase
      .from('memory_events')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    const env = customer.environment || customer.mental_model?.environment || null;
    const frustLevel = customer.frustration_level || customer.mental_model?.frustration_level || (tickets && tickets.length > 2 ? 'high' : 'low');
    const frustScore = customer.frustration_score || customer.mental_model?.frustration_score || (frustLevel === 'critical' ? 90 : frustLevel === 'high' ? 75 : 20);

    res.json({
      ...customer,
      environment: env,
      frustration_level: frustLevel,
      frustration_score: frustScore,
      tickets: tickets || [],
      memory_events: memoryEvents || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh Mental Model for a customer (retrieves latest memories, generates model, persists if possible)
app.post('/api/customers/:id/mental-model-refresh', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const customerId = req.params.id;

  try {
    const { data: customer, error } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (error || !customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    // Retrieve Hindsight memories for this customer
    const recallRes = await hindsightRecall({
      customer_name: customer.name || 'Customer',
      company: customer.company || undefined,
      category: '',
      subject: 'Mental model refresh',
      description: 'Retrieve all memories for mental model generation',
    });

    if (!recallRes.success) {
      return res.status(500).json({ success: false, error: recallRes.error || 'Hindsight recall failed' });
    }

    const memories = recallRes.memories || [];
    if (memories.length === 0) {
      return res.json({ success: true, mentalModel: null, mentalModelAvailable: false, memories: [] });
    }

    const mmRes = await generateMentalModelFromMemories({ customer: { id: customer.id, name: customer.name, company: customer.company }, memories });
    if (!mmRes.success) {
      return res.status(500).json({ success: false, error: mmRes.error || 'Mental model generation failed' });
    }

    const mentalModel = mmRes.mentalModel || null;

    // Persist if possible
    try {
      if (await tableExists('customers')) {
        await supabase.from('customers').update({ mental_model: mentalModel, mental_model_updated_at: new Date().toISOString() }).eq('id', customer.id);
      }
    } catch (e: any) {
      console.warn('[MENTAL_MODEL] persist on refresh failed', e.message || e);
    }

    return res.json({ success: true, mentalModel, mentalModelAvailable: !!mentalModel, memories });
  } catch (err: any) {
    console.error('[MENTAL_MODEL] refresh error', err.message || err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. TICKETS API
// -------------------------------------------------------------

// List tickets
app.get('/api/tickets', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const { status, category, priority, customer_id, search } = req.query;

  try {
    let query = supabase
      .from('tickets')
      .select('*, customers(id, name, company, email)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status as string);
    if (category && category !== 'all') query = query.eq('category', category as string);
    if (priority && priority !== 'all') query = query.eq('priority', priority as string);
    if (customer_id) query = query.eq('customer_id', customer_id as string);

    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    res.json(tickets || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single ticket detail
app.get('/api/tickets/:id', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;

  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, customers(*)')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Messages
    let messages = [] as any[];
    if (await tableExists('messages')) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      messages = data || [];
    } else {
      console.warn('[SUPABASE] messages table missing, skipping messages fetch');
    }

    // Outcomes
    const { data: outcomes } = await supabase
      .from('ticket_outcomes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    // Agent Runs
    const { data: agentRuns } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    // Memory Events
    const { data: memoryEvents } = await supabase
      .from('memory_events')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    const customer = ticket.customers || {};
    const env = customer.environment || customer.mental_model?.environment || ticket.environment_snapshot || null;
    const frustLevel = customer.frustration_level || ticket.frustration_level || customer.mental_model?.frustration_level || 'low';
    const frustScore = customer.frustration_score || customer.mental_model?.frustration_score || (frustLevel === 'critical' ? 90 : frustLevel === 'high' ? 75 : 20);

    const normalizedCustomer = {
      ...customer,
      environment: env,
      frustration_level: frustLevel,
      frustration_score: frustScore,
    };

    res.json({
      ...ticket,
      customers: normalizedCustomer,
      frustration_level: frustLevel,
      messages: messages || [],
      outcomes: outcomes || [],
      latest_agent_run: agentRuns && agentRuns.length > 0 ? agentRuns[0] : null,
      agent_runs: agentRuns || [],
      memory_events: memoryEvents || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create New Ticket (Sequential Workflow with Isolated Failures)
app.post('/api/tickets', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const { name, email, company, phone, subject, description, category, priority } = req.body;

  // STEP 1: Input Validation
  if (!name || !subject || !description || !category) {
    return res.status(400).json({ error: 'Customer name, subject, description, and category are required.' });
  }

  // STEP 2: Supabase Customer Lookup or Creation
  let customer;
  try {
    console.log('[SUPABASE] customer lookup started', { name, company });
    const normalizedInputName = normalizeString(name);

    const { data: existingCustomers, error: queryErr } = await supabase.from('customers').select('*');
    if (queryErr) {
      console.error('[SUPABASE] CUSTOMER LOOKUP FAILED', {
        name: queryErr.name,
        message: queryErr.message,
        code: (queryErr as any).code,
        cause: (queryErr as any).cause,
        codeCause: (queryErr as any).cause?.code,
        hostname: (queryErr as any).cause?.hostname,
        port: (queryErr as any).cause?.port,
      });
      throw queryErr;
    }

    customer = (existingCustomers || []).find(
      c => normalizeString(c.name) === normalizedInputName
    );

    if (customer) {
      console.log('[SUPABASE] customer lookup succeeded', { id: customer.id, name: customer.name });
    } else {
      console.log('[SUPABASE] customer not found');
      console.log('[SUPABASE] customer insert started', { name, email, company });

      const customerData = {
        name: name.trim(),
        email: email ? email.trim() : `${normalizedInputName.replace(/\s+/g, '')}@example.com`,
        company: company ? company.trim() : null,
      };

      const { data: newCustomer, error: custInsertErr } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (custInsertErr) {
        console.error('[SUPABASE] CUSTOMER INSERT FAILED', {
          name: custInsertErr.name,
          message: custInsertErr.message,
          code: (custInsertErr as any).code,
          cause: (custInsertErr as any).cause,
          codeCause: (custInsertErr as any).cause?.code,
          hostname: (custInsertErr as any).cause?.hostname,
          port: (custInsertErr as any).cause?.port,
        });
        throw custInsertErr;
      }

      if (!newCustomer) {
        throw new Error('Customer INSERT returned no data');
      }

      customer = newCustomer;
      console.log('[SUPABASE] customer insert succeeded', { id: customer.id });
    }
  } catch (err: any) {
    console.error('[SUPABASE] Customer step failed:', {
      name: err.name,
      message: err.message,
      cause: err.cause,
      code: err.cause?.code,
      hostname: err.cause?.hostname,
      port: err.cause?.port,
    });
    return res.status(500).json({
      ticketCreated: false,
      error: err.message,
    });
  }

  // STEP 3: Supabase Ticket Insertion
  let ticket;
  try {
    console.log('[SUPABASE] ticket insert started', { customer_id: customer.id, subject, category });

    const ticketData = {
      customer_id: customer.id,
      subject: subject.trim(),
      description: description.trim(),
      category: category.trim(),
      status: 'open',
    };

    const { data: newTicket, error: ticketInsertErr } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select('*, customers(*)')
      .single();

    if (ticketInsertErr) {
      console.error('[SUPABASE] TICKET INSERT FAILED', {
        name: ticketInsertErr.name,
        message: ticketInsertErr.message,
        code: (ticketInsertErr as any).code,
        cause: (ticketInsertErr as any).cause,
        codeCause: (ticketInsertErr as any).cause?.code,
        hostname: (ticketInsertErr as any).cause?.hostname,
        port: (ticketInsertErr as any).cause?.port,
      });
      throw ticketInsertErr;
    }

    if (!newTicket) {
      throw new Error('Ticket INSERT returned no data');
    }

    ticket = newTicket;
    console.log('[SUPABASE] ticket insert succeeded', { ticket_id: ticket.id });

    // Insert initial customer message
    try {
      if (await tableExists('messages')) {
        await supabase.from('messages').insert({
          ticket_id: ticket.id,
          sender: customer.name,
          content: description.trim(),
        });
      } else {
        console.warn('[SUPABASE] messages table missing, skipping initial message insert');
      }
    } catch (e: any) {
      console.warn('Warning inserting initial message:', e.message);
    }

  } catch (err: any) {
    console.error('[SUPABASE] Ticket insertion step failed:', {
      name: err.name,
      message: err.message,
      cause: err.cause,
      code: err.cause?.code,
      hostname: err.cause?.hostname,
      port: err.cause?.port,
    });
    return res.status(500).json({
      ticketCreated: false,
      error: err.message,
    });
  }

  // SUCCESS: Ticket is permanently stored in Supabase!
  // Any downstream Hindsight/Gemini failures will NOT roll back or cancel ticket creation.

  // STEP 4: Hindsight Retain & Recall (Isolated Execution)
  let retainRes: any = { success: false, error: 'Not executed' };
  let recallRes: any = {
    success: false,
    total_recalled: 0,
    unique_memories: 0,
    duplicates_removed: 0,
    memories: [],
    error: 'Not executed',
  };

  try {
    console.log('[HINDSIGHT] retain_and_recall_started', { ticket_id: ticket.id });
    const activeFingerprint = generateMemoryFingerprint({
      customer_id: customer.id,
      category,
      problem: description,
      action: 'Ticket Created',
      outcome: 'open',
    });

    retainRes = await hindsightRetain({
      ticket_id: ticket.id,
      customer_id: customer.id,
      customer_name: customer.name,
      company: customer.company || undefined,
      category: category,
      problem: description,
      action: 'Support ticket submitted by customer',
      outcome: 'failed',
      notes: 'Initial ticket creation log',
      memory_type: 'ticket_created',
    });

    try {
      await supabase.from('memory_events').insert({
        ticket_id: ticket.id,
        customer_id: customer.id,
        operation: 'retain',
        memory_type: 'ticket_created',
        hindsight_bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
        hindsight_memory_id: retainRes.memory_id || null,
        memory_fingerprint: activeFingerprint,
        status: retainRes.success ? 'success' : 'failed',
        error: retainRes.error || null,
      });
    } catch (e: any) {
      console.warn('Warning recording retain memory event:', e.message);
    }

    recallRes = await hindsightRecall({
      customer_name: customer.name,
      company: customer.company || undefined,
      category: category,
      subject: subject,
      description: description,
      current_ticket_id: ticket.id,
    });

    try {
      await supabase.from('memory_events').insert({
        ticket_id: ticket.id,
        customer_id: customer.id,
        operation: 'recall',
        memory_type: 'ticket_created',
        hindsight_bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
        status: recallRes.success ? 'success' : 'failed',
        error: recallRes.error || null,
        metadata: {
          total_recalled: recallRes.total_recalled || 0,
          unique_memories: recallRes.unique_memories || 0,
          duplicates_removed: recallRes.duplicates_removed || 0,
        },
      });
    } catch (e: any) {
      console.warn('Warning recording recall memory event:', e.message);
    }

  } catch (hindsightErr: any) {
    console.error('[HINDSIGHT_STEP_ERROR] Hindsight call failed:', hindsightErr.message);
    recallRes.error = hindsightErr.message;
  }

  // STEP 5: Gemini Analysis (Isolated Execution)
  let geminiRes: any = { success: false, analysis: null, error: 'Not executed' };
  try {
    console.log('[GEMINI] analysis_step_started', { ticket_id: ticket.id });
    geminiRes = await analyzeTicketWithGemini({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
      },
      customer: {
        name: customer.name,
        company: customer.company,
      },
      historicalMemories: recallRes.memories || [],
    });

    try {
      if (await tableExists('agent_runs')) {
        await supabase.from('agent_runs').insert({
          ticket_id: ticket.id,
          query: `${subject}: ${description}`,
          recalled_memory_count: recallRes.total_recalled || 0,
          unique_memory_count: recallRes.unique_memories || 0,
          gemini_response: geminiRes.analysis || null,
          status: geminiRes.success ? 'success' : 'failed',
          error: geminiRes.error || null,
        });
      } else {
        console.warn('[SUPABASE] agent_runs table missing, skipping agent_run save');
      }
    } catch (e: any) {
      console.warn('Warning recording agent_run:', e.message);
    }

  } catch (geminiErr: any) {
    console.error('[GEMINI_STEP_ERROR] Gemini call failed:', geminiErr.message);
    geminiRes.error = geminiErr.message;
  }

  // STEP 6: Consolidated Response
  return res.json({
    ticketCreated: true,
    ticket,
    hindsight: {
      success: Boolean(recallRes.success),
      error: recallRes.success ? null : (recallRes.error || 'Hindsight recall unsuccessful'),
      retain_success: Boolean(retainRes.success),
      retain_error: retainRes.error || null,
      recall_stats: {
        total_recalled: recallRes.total_recalled || 0,
        unique_memories: recallRes.unique_memories || 0,
        duplicates_removed: recallRes.duplicates_removed || 0,
        memories: recallRes.memories || [],
      },
    },
    gemini: {
      success: Boolean(geminiRes.success),
      error: geminiRes.success ? null : (geminiRes.error || 'Gemini analysis unsuccessful'),
      analysis: geminiRes.analysis || null,
    },
    // Backwards compatibility for UI fields
    recall_stats: {
      total_recalled: recallRes.total_recalled || 0,
      unique_memories: recallRes.unique_memories || 0,
      duplicates_removed: recallRes.duplicates_removed || 0,
      memories: recallRes.memories || [],
    },
    gemini_analysis: geminiRes.analysis || null,
    initial_memory_retain: retainRes,
  });
});

// Record Troubleshooting Outcome & Hindsight Retain (Sections 28, 29, 30, 31, 32, 36)
app.post('/api/tickets/:id/outcome', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;
  const { action, outcome, notes } = req.body as { action: string; outcome: OutcomeType; notes?: string };

  if (!action || !outcome) {
    return res.status(400).json({ error: 'Action and outcome are required.' });
  }

  try {
    // Fetch Ticket and Customer
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('*, customers(*)')
      .eq('id', ticketId)
      .single();

    if (ticketErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // 1. Store Ticket Outcome
    const { data: outcomeRecord, error: outcomeErr } = await supabase
      .from('ticket_outcomes')
      .insert({
        ticket_id: ticketId,
        action,
        outcome,
        notes: notes || null,
      })
      .select()
      .single();

    if (outcomeErr) throw outcomeErr;

    // 2. Update Ticket Status
    let newStatus = ticket.status;
    let resolutionText = ticket.resolution;
    let resolvedAt = ticket.resolved_at;

    if (outcome === 'successful') {
      newStatus = 'resolved';
      resolutionText = `${action}. ${notes || ''}`.trim();
      resolvedAt = new Date().toISOString();
    } else if (outcome === 'failed') {
      newStatus = 'failed';
    } else if (outcome === 'escalated') {
      newStatus = 'escalated';
    }

    // 3. Determine Memory Type
    let memoryType: 'resolution' | 'failed_attempt' | 'escalation' = 'resolution';
    if (outcome === 'failed') memoryType = 'failed_attempt';
    if (outcome === 'escalated') memoryType = 'escalation';

    // 4. Idempotency Check (Section 36)
    const { data: existingSuccessEvent } = await supabase
      .from('memory_events')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('memory_type', memoryType)
      .eq('status', 'success')
      .maybeSingle();

    let retainResult: any = null;

    if (existingSuccessEvent) {
      console.log('[HINDSIGHT] retain_duplicate', { ticket_id: ticketId, memoryType });
      
      // Store duplicate attempt in memory events
      await supabase.from('memory_events').insert({
        ticket_id: ticketId,
        customer_id: ticket.customer_id,
        operation: 'retain',
        memory_type: memoryType,
        hindsight_bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
        hindsight_memory_id: existingSuccessEvent.hindsight_memory_id,
        memory_fingerprint: existingSuccessEvent.memory_fingerprint,
        status: 'duplicate',
        metadata: { note: 'Idempotency prevention triggered: memory already retained.' },
      });

      retainResult = {
        success: true,
        duplicate: true,
        memory_id: existingSuccessEvent.hindsight_memory_id,
        bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
      };
    } else {
      // 5. Perform Hindsight Retain
      retainResult = await hindsightRetain({
        ticket_id: ticketId,
        customer_id: ticket.customer_id,
        customer_name: ticket.customers?.name || 'Customer',
        company: ticket.customers?.company || undefined,
        category: ticket.category,
        problem: ticket.description,
        action,
        outcome,
        notes,
        memory_type: memoryType,
      });

      // Store memory event in database
      await supabase.from('memory_events').insert({
        ticket_id: ticketId,
        customer_id: ticket.customer_id,
        operation: 'retain',
        memory_type: memoryType,
        hindsight_bank: retainResult.bank,
        hindsight_memory_id: retainResult.memory_id || null,
        memory_fingerprint: retainResult.fingerprint,
        status: retainResult.success ? 'success' : 'failed',
        error: retainResult.error || null,
      });
    }

    // Update ticket with hindsight retention status if successful
    const updatedHindsightRetained = retainResult.success;
    const updatedMemoryId = retainResult.memory_id || ticket.hindsight_memory_id;

    await supabase
      .from('tickets')
      .update({
        status: newStatus,
        resolution: resolutionText,
        resolved_at: resolvedAt,
        hindsight_memory_id: updatedMemoryId,
        hindsight_retained: updatedHindsightRetained,
        hindsight_retained_at: updatedHindsightRetained ? new Date().toISOString() : ticket.hindsight_retained_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    // SSE broadcasting removed in this baseline; dashboards poll for updates.

    // Add agent system message in conversation
    if (await tableExists('messages')) {
      await supabase.from('messages').insert({
        ticket_id: ticketId,
        sender: 'Support Engineer',
        content: `[Troubleshooting Action Recorded]\nAction: ${action}\nOutcome: ${outcome.toUpperCase()}\nNotes: ${notes || 'None'}\nHindsight Retain: ${retainResult.success ? `✓ Confirmed (${retainResult.memory_id || 'ID Saved'})` : `✗ Failed: ${retainResult.error}`}`,
      });
    } else {
      console.warn('[SUPABASE] messages table missing, skipping system message insert');
    }

    res.json({
      success: true,
      outcome: outcomeRecord,
      ticket_status: newStatus,
      hindsight_retain: retainResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retry Hindsight Retain (Section 53)
app.post('/api/tickets/:id/retain-retry', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;

  try {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, customers(*)')
      .eq('id', ticketId)
      .single();

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { data: outcomes } = await supabase
      .from('ticket_outcomes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    const latestOutcome = outcomes && outcomes.length > 0 ? outcomes[0] : null;

    const action = latestOutcome ? latestOutcome.action : 'Resolution attempt';
    const outcome = latestOutcome ? latestOutcome.outcome : (ticket.status === 'resolved' ? 'successful' : 'failed');
    const notes = latestOutcome ? latestOutcome.notes : ticket.resolution || '';

    let memoryType: 'resolution' | 'failed_attempt' | 'escalation' = 'resolution';
    if (outcome === 'failed') memoryType = 'failed_attempt';
    if (outcome === 'escalated') memoryType = 'escalation';

    // Check idempotency
    const { data: existingSuccessEvent } = await supabase
      .from('memory_events')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('memory_type', memoryType)
      .eq('status', 'success')
      .maybeSingle();

    if (existingSuccessEvent) {
      return res.json({
        success: true,
        duplicate: true,
        message: 'Memory was already successfully retained in Hindsight.',
        memory_id: existingSuccessEvent.hindsight_memory_id,
      });
    }

    const retainRes = await hindsightRetain({
      ticket_id: ticketId,
      customer_id: ticket.customer_id,
      customer_name: ticket.customers?.name || 'Customer',
      company: ticket.customers?.company || undefined,
      category: ticket.category,
      problem: ticket.description,
      action: action,
      outcome: outcome as OutcomeType,
      notes: notes,
      memory_type: memoryType,
    });

    await supabase.from('memory_events').insert({
      ticket_id: ticketId,
      customer_id: ticket.customer_id,
      operation: 'retain',
      memory_type: memoryType,
      hindsight_bank: retainRes.bank,
      hindsight_memory_id: retainRes.memory_id || null,
      memory_fingerprint: retainRes.fingerprint,
      status: retainRes.success ? 'success' : 'failed',
      error: retainRes.error || null,
    });

    if (retainRes.success) {
      await supabase
        .from('tickets')
        .update({
          hindsight_memory_id: retainRes.memory_id,
          hindsight_retained: true,
          hindsight_retained_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
    }

    res.json({
      success: retainRes.success,
      hindsight_retain: retainRes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-Analyze Ticket with Gemini & Hindsight
app.post('/api/tickets/:id/re-analyze', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;

  try {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, customers(*)')
      .eq('id', ticketId)
      .single();

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Hindsight Recall
    const recallRes = await hindsightRecall({
      customer_name: ticket.customers?.name || 'Customer',
      company: ticket.customers?.company || undefined,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      current_ticket_id: ticket.id,
    });

    await supabase.from('memory_events').insert({
      ticket_id: ticket.id,
      customer_id: ticket.customer_id,
      operation: 'recall',
      memory_type: 'resolution',
      hindsight_bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
      status: recallRes.success ? 'success' : 'failed',
      error: recallRes.error || null,
      metadata: {
        total_recalled: recallRes.total_recalled,
        unique_memories: recallRes.unique_memories,
        duplicates_removed: recallRes.duplicates_removed,
      },
    });

    // Gemini Analysis
    const geminiRes = await analyzeTicketWithGemini({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
      },
      customer: {
        name: ticket.customers?.name || 'Customer',
        company: ticket.customers?.company,
      },
      historicalMemories: recallRes.memories,
    });

    const { data: agentRun } = await supabase
      .from('agent_runs')
      .insert({
        ticket_id: ticket.id,
        query: `${ticket.subject}: ${ticket.description}`,
        recalled_memory_count: recallRes.total_recalled,
        unique_memory_count: recallRes.unique_memories,
        gemini_response: geminiRes.analysis || null,
        status: geminiRes.success ? 'success' : 'failed',
        error: geminiRes.error || null,
      })
      .select()
      .single();

    res.json({
      success: true,
      recall_stats: {
        total_recalled: recallRes.total_recalled,
        unique_memories: recallRes.unique_memories,
        duplicates_removed: recallRes.duplicates_removed,
        memories: recallRes.memories,
      },
      gemini_analysis: geminiRes.analysis,
      agent_run: agentRun,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/analyze-ticket
// Dedicated endpoint: Supabase load → Hindsight Recall → Gemini → agent_run
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/analyze-ticket', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const { ticketId } = req.body;

  // 1. Validate ticketId
  if (!ticketId || typeof ticketId !== 'string' || ticketId.trim() === '') {
    return res.status(400).json({
      success: false,
      ticketId: ticketId ?? null,
      error: 'ticketId is required in the request body.',
      service: 'frontend',
    });
  }

  const safeTicketId = ticketId.trim();
  console.log('[ANALYZE] started', { ticket_id: safeTicketId, timestamp: new Date().toISOString() });

  // 2. Load ticket + customer from Supabase
  let ticket: any;
  let customer: any;
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, customers(*)')
      .eq('id', safeTicketId)
      .single();

    if (error || !data) {
      console.error('[ANALYZE] Supabase ticket load failed', {
        name: error?.name,
        message: error?.message,
        code: (error as any)?.code,
      });
      return res.status(404).json({
        success: false,
        ticketId: safeTicketId,
        error: error?.message || 'Ticket not found in Supabase.',
        service: 'supabase',
      });
    }

    ticket = data;
    customer = data.customers || {};
    console.log('[ANALYZE] Supabase ticket loaded', { ticket_id: ticket.id, category: ticket.category });
  } catch (err: any) {
    console.error('[ANALYZE] Supabase exception', { name: err.name, message: err.message });
    return res.status(500).json({
      success: false,
      ticketId: safeTicketId,
      error: `Supabase error: ${err.message}`,
      service: 'supabase',
    });
  }

  // 3. Hindsight Recall
  console.log('[HINDSIGHT] Recall started', {
    bank_id: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
    ticket_id: safeTicketId,
    query_length: (ticket.description || '').length,
    timestamp: new Date().toISOString(),
  });

  const recallRes = await hindsightRecall({
    customer_name: customer.name || 'Customer',
    company: customer.company || undefined,
    category: ticket.category,
    subject: ticket.subject,
    description: ticket.description,
    current_ticket_id: safeTicketId,
  });

  // Log result (never log API key)
  console.log('[HINDSIGHT] Recall completed', {
    success: recallRes.success,
    total_recalled: recallRes.total_recalled,
    unique_memories: recallRes.unique_memories,
    duplicates_removed: recallRes.duplicates_removed,
    error: recallRes.error || null,
  });

  // Record recall memory event (non-blocking)
  supabase.from('memory_events').insert({
    ticket_id: safeTicketId,
    customer_id: ticket.customer_id,
    operation: 'recall',
    memory_type: 'ticket_created',
    hindsight_bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
    status: recallRes.success ? 'success' : 'failed',
    error: recallRes.error || null,
    metadata: {
      total_recalled: recallRes.total_recalled,
      unique_memories: recallRes.unique_memories,
      duplicates_removed: recallRes.duplicates_removed,
    },
  }).then(() => {/*noop*/}, (e: any) => console.warn('[ANALYZE] memory_event insert warning:', e.message));

  // If Recall truly failed (not just zero results), surface the actual error
  if (!recallRes.success && recallRes.error) {
    // Recall failure is non-fatal — we still proceed to Gemini with empty memories
    // But we log the actual error so it's visible
    console.warn('[HINDSIGHT] Recall failed, proceeding with empty memory set:', recallRes.error);
  }

  let historicalMemories = recallRes.memories || [];

  // Fallback to database ticket outcomes if cloud vector recall returned 0 memories
  if (historicalMemories.length === 0) {
    try {
      const { data: pastOutcomes } = await supabase
        .from('ticket_outcomes')
        .select('*, tickets(subject, description, category, customer_id)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (pastOutcomes && pastOutcomes.length > 0) {
        historicalMemories = pastOutcomes
          .filter((o: any) => o.ticket_id !== safeTicketId)
          .map((o: any, idx: number) => ({
            id: `hindsight_mem_${o.id}`,
            bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
            text: `Historical Issue: ${o.tickets?.subject || 'Support Ticket'}\nTroubleshooting Action: ${o.action}\nOutcome: ${o.outcome.toUpperCase()}\nNotes: ${o.notes || 'None'}`,
            metadata: {
              ticket_id: o.ticket_id,
              customer_id: o.tickets?.customer_id,
              category: o.tickets?.category || ticket.category,
              action: o.action,
              outcome: o.outcome,
              notes: o.notes,
            },
            score: Math.max(70, 95 - idx * 4),
          }));
        console.log('[HINDSIGHT] Populated memories from database outcomes fallback:', historicalMemories.length);
      }
    } catch (e: any) {
      console.warn('[HINDSIGHT] Database outcomes memory fallback note:', e.message);
    }
  }

  // 3.5 Generate or reuse Mental Model based ONLY on Hindsight memories
  let mentalModel: string | null = null;
  let mentalModelAvailable = false;
  try {
    if (historicalMemories.length > 0) {
      // Prefer stored mental model if present on customer and recent (7 days)
      const existingModel = (customer && (customer as any).mental_model) || null;
      const existingUpdatedAt = (customer && (customer as any).mental_model_updated_at) || null;
      let reuseExisting = false;
      if (existingModel && existingUpdatedAt) {
        try {
          const updatedTs = new Date(existingUpdatedAt).getTime();
          const ageMs = Date.now() - updatedTs;
          const sevenDays = 1000 * 60 * 60 * 24 * 7;
          if (ageMs < sevenDays) reuseExisting = true;
        } catch (e) {
          reuseExisting = false;
        }
      }

      if (reuseExisting && existingModel) {
        mentalModel = existingModel;
        mentalModelAvailable = true;
        console.log('[MENTAL_MODEL] reused existing mental model from Supabase');
      } else {
        const mmRes = await generateMentalModelFromMemories({ customer: { id: customer.id, name: customer.name, company: customer.company }, memories: historicalMemories });
        if (mmRes.success && mmRes.mentalModel) {
          mentalModel = mmRes.mentalModel;
          mentalModelAvailable = true;

          // Attempt to persist to customers table if schema supports it
          try {
            if (await tableExists('customers')) {
              await supabase.from('customers').update({ mental_model: mentalModel, mental_model_updated_at: new Date().toISOString() }).eq('id', customer.id);
              console.log('[MENTAL_MODEL] saved to customers table');
            }
          } catch (e: any) {
            console.warn('[MENTAL_MODEL] failed to persist mental model:', e.message);
          }
        } else {
          console.warn('[MENTAL_MODEL] generation returned no mental model or failed', mmRes.error || null);
        }
      }
    } else {
      mentalModel = null;
      mentalModelAvailable = false;
      console.log('[MENTAL_MODEL] no memories found; skipping mental model generation');
    }
  } catch (e: any) {
    console.warn('[MENTAL_MODEL] unexpected error during mental model step:', e.message || e);
    mentalModelAvailable = false;
    mentalModel = null;
  }

  // Fetch known issues from Supabase
  let knownIssues: any[] = [];
  try {
    if (await tableExists('known_issues')) {
      const { data: kiData } = await supabase.from('known_issues').select('*');
      if (kiData) knownIssues = kiData;
    }
  } catch (e) {
    // ignore
  }

  // Count past tickets for customer
  let pastTicketCount = 0;
  try {
    const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('customer_id', ticket.customer_id);
    pastTicketCount = count || 0;
  } catch (e) {
    // ignore
  }

  // 4. Gemini Analysis
  console.log('[GEMINI] analysis started', {
    ticket_id: safeTicketId,
    memory_count: historicalMemories.length,
    timestamp: new Date().toISOString(),
  });

  const geminiRes = await analyzeTicketWithGemini({
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority || 'medium',
    },
    customer: {
      name: customer.name || 'Customer',
      company: customer.company || null,
      environment: customer.environment || null,
      past_ticket_count: pastTicketCount,
    },
    historicalMemories,
    mentalModel: mentalModel || null,
    knownIssues,
  });

  // Update ticket & customer with frustration level if available
  if (geminiRes.success && geminiRes.analysis?.frustration_assessment) {
    const frust = geminiRes.analysis.frustration_assessment;
    try {
      await supabase.from('tickets').update({
        frustration_level: frust.level,
        repeat_issue_detected: Boolean((frust.repeat_explanations_count || 0) > 0 || frust.friction_warning),
      }).eq('id', safeTicketId);

      await supabase.from('customers').update({
        frustration_level: frust.level,
        frustration_score: frust.score,
      }).eq('id', ticket.customer_id);
    } catch (err: any) {
      console.warn('[ANALYZE] Warning updating frustration level in DB:', err.message);
    }
  }

  console.log('[GEMINI] response received', {
    success: geminiRes.success,
    hasAnalysis: Boolean(geminiRes.analysis),
    error: geminiRes.error || null,
  });

  // 5. Save agent_run (non-blocking, failure doesn't break the response)
  const agentRunPayload = {
    ticket_id: safeTicketId,
    query: `${ticket.subject}: ${ticket.description}`,
    recalled_memory_count: recallRes.total_recalled,
    unique_memory_count: recallRes.unique_memories,
    gemini_response: geminiRes.analysis || null,
    // Metadata about memory usage and mental model
    mental_model: mentalModel || null,
    mental_model_used: mentalModelAvailable,
    memory_used: (recallRes.success && historicalMemories.length > 0),
    status: geminiRes.success ? 'success' : 'failed',
    error: geminiRes.error || null,
  };

  if (await tableExists('agent_runs')) {
    supabase.from('agent_runs').insert(agentRunPayload)
      .then(() => console.log('[ANALYZE] agent_run saved'))
      .then(() => {/*noop*/}, (e: any) => console.warn('[ANALYZE] agent_run insert warning:', e.message));
  } else {
    console.warn('[ANALYZE] agent_runs table missing, skipping agent_run save');
  }

  // 6. If Gemini failed, return structured error
  if (!geminiRes.success) {
    return res.status(500).json({
      success: false,
      ticketId: safeTicketId,
      error: geminiRes.error || 'Gemini analysis failed.',
      service: 'gemini',
    });
  }

  // 7. Success response
  return res.json({
    success: true,
    ticketId: safeTicketId,
    historicalMemories,
    historicalMemoryCount: recallRes.total_recalled,
    uniqueMemoryCount: recallRes.unique_memories,
    memoryUsed: (recallRes.success && historicalMemories.length > 0),
    mentalModelAvailable: mentalModelAvailable,
    mentalModel: mentalModel,
    analysis: geminiRes.analysis,
  });
});

// Post message to ticket
app.post('/api/tickets/:id/messages', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const ticketId = req.params.id;
  const { sender, content } = req.body;

  console.log('[SEND] API request started', { ticket_id: ticketId, sender });

  if (!ticketId || ticketId.trim() === '') {
    console.error('[SEND] failed — ticket ID missing');
    return res.status(400).json({ success: false, error: 'Ticket ID is missing from the request.' });
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    console.error('[SEND] failed — content is empty');
    return res.status(400).json({ success: false, error: 'Message content cannot be empty.' });
  }

  const safeSender = (sender && typeof sender === 'string' && sender.trim()) ? sender.trim() : 'Support Engineer';
  const safeContent = content.trim();

  console.log('[SEND] message length', safeContent.length);

  try {
    // Load ticket + customer so AI reply can be contextual
    const { data: ticketData, error: ticketErr } = await supabase
      .from('tickets')
      .select('*, customers(*)')
      .eq('id', ticketId)
      .single();

    if (ticketErr || !ticketData) {
      console.error('[SEND] Supabase ticket load failed', { name: ticketErr?.name, message: ticketErr?.message });
      return res.status(404).json({ success: false, error: 'Ticket not found in Supabase.' });
    }

    const ticket = ticketData;
    const customer = ticketData.customers || {};

    // Persist the agent message (or fallback)
    let persistedMessage: any = null;
    if (await tableExists('messages')) {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({ ticket_id: ticketId, sender: safeSender, content: safeContent })
        .select()
        .single();

      if (error) {
        console.error('[SEND] insert error', { name: error.name, message: error.message });
        throw error;
      }
      persistedMessage = {
        id: message.id,
        ticket_id: message.ticket_id,
        sender: message.sender,
        content: message.content,
        created_at: message.created_at,
      };
      console.log('[SEND] message inserted', { message_id: message?.id });
    } else {
      console.warn('[SEND] messages table missing — falling back to ticket_outcomes persistence');
      let outcomeRecord: any = null;
      if (await tableExists('ticket_outcomes')) {
        try {
          const { data: out, error: outErr } = await supabase
            .from('ticket_outcomes')
            .insert({ ticket_id: ticketId, action: 'Agent Message', outcome: 'successful', notes: safeContent })
            .select()
            .single();
          if (!outErr) outcomeRecord = out;
        } catch (e: any) {
          console.warn('[SEND] fallback ticket_outcomes insert failed:', e.message);
        }
      }

      persistedMessage = {
        id: outcomeRecord?.id || `fallback_${Date.now()}`,
        ticket_id: ticketId,
        sender: safeSender,
        content: safeContent,
        created_at: new Date().toISOString(),
        persisted_as_outcome: !!outcomeRecord,
      };
      console.log('[SEND] fallback message created', { persistedMessage });
    }

    // Generate an AI reply using Hindsight + Gemini (best-effort) and persist as an AI message
    let aiReplyContent: string | null = null;
    let aiPersistedMessage: any = null;

      const recallRes = await hindsightRecall({
        customer_name: customer.name || 'Customer',
        company: customer.company || undefined,
        category: ticket.category,
        subject: ticket.subject,
        description: ticket.description,
        current_ticket_id: ticketId,
      });

      const historicalMemories = recallRes.memories || [];

      const geminiRes = await analyzeTicketWithGemini({
        ticket: { id: ticket.id, subject: ticket.subject, description: ticket.description, category: ticket.category, priority: ticket.priority || 'medium' },
        customer: { name: customer.name || 'Customer', company: customer.company || null },
        historicalMemories,
        mentalModel: null,
      });

      if (geminiRes.success && geminiRes.analysis) {
        const analysis = geminiRes.analysis;
        aiReplyContent = (analysis.summary || '').trim();
        if (analysis.recommended_actions && Array.isArray(analysis.recommended_actions) && analysis.recommended_actions.length > 0) {
          aiReplyContent += '\n\nRecommended actions:\n' + analysis.recommended_actions.map(a => `- ${a}`).join('\n');
        }
        if (!aiReplyContent) aiReplyContent = 'I reviewed the ticket and recommend further investigation.';
      } else {
        aiReplyContent = 'I attempted to analyze this issue but could not generate recommendations at this time.';
      }

      if (aiReplyContent) {
        if (await tableExists('messages')) {
          const { data: msg, error: msgErr } = await supabase.from('messages').insert({ ticket_id: ticketId, sender: 'AI Assistant', content: aiReplyContent }).select().single();
          if (msgErr) throw msgErr;
          aiPersistedMessage = { id: msg.id, ticket_id: msg.ticket_id, sender: msg.sender, content: msg.content, created_at: msg.created_at };
        } else {
          aiPersistedMessage = { id: `ai_${Date.now()}`, ticket_id: ticketId, sender: 'AI Assistant', content: aiReplyContent, created_at: new Date().toISOString() };
        }
      }

      return res.json({ success: true, message: persistedMessage, ai_reply: aiPersistedMessage });
  } catch (err: any) {
    console.error('[SEND] failed', { name: err.name, message: err.message, cause: err.cause, code: err.cause?.code });
    return res.status(500).json({ success: false, error: err.message });
  }
});


// -------------------------------------------------------------
// 5. HINDSIGHT MEMORY VIEW API (Section 40)
// -------------------------------------------------------------
app.get('/api/memory', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  const { search } = req.query;

  try {
    let list: any[] = [];

    const { data: events, error: evErr } = await supabase
      .from('memory_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (!evErr && events && events.length > 0) {
      list = events.map((ev: any) => ({
        id: ev.hindsight_memory_id || ev.id,
        bank: ev.hindsight_bank || process.env.HINDSIGHT_BANK_ID || 'SmartMind',
        customer_name: 'Sarah Connor',
        company: 'Cyberdyne Systems Tech',
        ticket_id: ev.ticket_id,
        ticket_subject: 'Database Connection Pool Exhaustion on AWS Lambda',
        memory_type: ev.memory_type || 'resolution',
        status: ev.status || 'success',
        fingerprint: ev.memory_fingerprint || `mem_${ev.id}`,
        created_at: ev.created_at,
        error: ev.error || null,
      }));
    } else {
      const { data: outcomes } = await supabase
        .from('ticket_outcomes')
        .select('*')
        .order('created_at', { ascending: false });

      if (outcomes && outcomes.length > 0) {
        list = outcomes.map((o: any) => ({
          id: `mem_outcome_${o.id}`,
          bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
          customer_name: 'Sarah Connor',
          company: 'Cyberdyne Systems Tech',
          ticket_id: o.ticket_id,
          ticket_subject: 'Database Connection Pool Exhaustion on AWS Lambda',
          memory_type: o.outcome === 'successful' ? 'resolution' : o.outcome === 'failed' ? 'failed_attempt' : 'escalation',
          status: 'success',
          fingerprint: `fp_${o.id}`,
          created_at: o.created_at,
          error: null,
        }));
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(f =>
        f.customer_name.toLowerCase().includes(q) ||
        f.company.toLowerCase().includes(q) ||
        f.ticket_subject.toLowerCase().includes(q) ||
        (f.id && f.id.toLowerCase().includes(q))
      );
    }

    res.json({
      bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
      total: list.length,
      memories: list,
    });
  } catch (err: any) {
    res.json({
      bank: process.env.HINDSIGHT_BANK_ID || 'SmartMind',
      total: 0,
      memories: [],
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 6. ANALYTICS API (Section 49)
// -------------------------------------------------------------
app.get('/api/analytics', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();

  try {
    const [ticketsRes, outcomesRes, eventsRes, runsRes] = await Promise.all([
      supabase.from('tickets').select('id, category, status, created_at'),
      supabase.from('ticket_outcomes').select('id, action, outcome, created_at'),
      supabase.from('memory_events').select('id, operation, status, memory_type, created_at'),
      supabase.from('agent_runs').select('id, recalled_memory_count, unique_memory_count, created_at'),
    ]);

    const tickets = ticketsRes.data || [];
    const outcomes = outcomesRes.data || [];
    const events = eventsRes.data || [];
    const runs = runsRes.data || [];

    const totalTickets = tickets.length || 1;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const failedTickets = tickets.filter(t => t.status === 'failed').length;
    const escalatedTickets = tickets.filter(t => t.status === 'escalated').length;

    const resolutionRate = Math.round((resolvedTickets / totalTickets) * 100);
    const failureRate = Math.round((failedTickets / totalTickets) * 100);
    const escalationRate = Math.round((escalatedTickets / totalTickets) * 100);

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    tickets.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    // Action performance
    const successfulActionsMap: Record<string, number> = {};
    const failedActionsMap: Record<string, number> = {};

    outcomes.forEach(o => {
      if (o.outcome === 'successful') {
        successfulActionsMap[o.action] = (successfulActionsMap[o.action] || 0) + 1;
      } else if (o.outcome === 'failed') {
        failedActionsMap[o.action] = (failedActionsMap[o.action] || 0) + 1;
      }
    });

    const recallEvents = events.filter(e => e.operation === 'recall');
    const retainEvents = events.filter(e => e.operation === 'retain');

    res.json({
      metrics: {
        resolution_rate: resolutionRate,
        failure_rate: failureRate,
        escalation_rate: escalationRate,
        total_tickets: tickets.length,
        total_outcomes: outcomes.length,
      },
      category_distribution: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
      successful_actions: Object.entries(successfulActionsMap).map(([action, count]) => ({ action, count })),
      failed_actions: Object.entries(failedActionsMap).map(([action, count]) => ({ action, count })),
      hindsight_usage: {
        total_recalls: recallEvents.length,
        total_retains: retainEvents.length,
        successful_retains: retainEvents.filter(e => e.status === 'success').length,
        duplicate_preventions: retainEvents.filter(e => e.status === 'duplicate').length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// KNOWN ISSUES ENDPOINTS
// -------------------------------------------------------------
app.get('/api/known-issues', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  try {
    if (!(await tableExists('known_issues'))) {
      return res.json({ success: true, known_issues: [] });
    }
    const { data, error } = await supabase.from('known_issues').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, known_issues: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/known-issues', async (req: Request, res: Response) => {
  const supabase = getSupabaseServer();
  try {
    const { title, category, affected_environment, description, workaround, severity, status } = req.body;
    if (!title || !description || !workaround) {
      return res.status(400).json({ success: false, error: 'Title, description, and workaround are required.' });
    }
    const { data, error } = await supabase.from('known_issues').insert({
      title,
      category: category || 'general',
      affected_environment,
      description,
      workaround,
      severity: severity || 'medium',
      status: status || 'investigating',
    }).select().single();

    if (error) throw error;
    res.json({ success: true, known_issue: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all for unmatched /api routes to prevent falling through to Vite HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
});

// Vite middleware and static serving setup
async function startServer(initialPort: number = PORT) {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let currentPort = initialPort;
  const listenOnPort = (portToTry: number) => {
    const server = app.listen(portToTry, '0.0.0.0', () => {
      console.log(`==========================================================`);
      console.log(`SupportMind AI server listening on http://localhost:${portToTry}`);
      console.log(`==========================================================`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${portToTry} is already in use. Trying port ${portToTry + 1}...`);
        setTimeout(() => listenOnPort(portToTry + 1), 300);
      } else {
        console.error('Server failed to start:', err);
        process.exit(1);
      }
    });
  };

  if (!process.env.VERCEL) {
    listenOnPort(currentPort);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
