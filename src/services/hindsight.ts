import crypto from 'crypto';
import { HindsightMemory } from '../types';
import { loggedFetch } from './httpLogger';

const getHindsightConfig = () => {
  let rawUrl = (process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io').trim().replace(/\/$/, '');
  const apiKey = (process.env.HINDSIGHT_API_KEY || '').trim();
  const bankId = (process.env.HINDSIGHT_BANK_ID || 'SmartMind').trim();

  if (!rawUrl || !rawUrl.startsWith('http') || rawUrl.includes('hsk_') || rawUrl.includes('dashboard') || rawUrl.includes('supportmind')) {
    rawUrl = 'https://api.hindsight.vectorize.io';
  }

  const bankBasePath = `${rawUrl}/v1/default/banks/${bankId}`;

  return { apiUrl: rawUrl, bankBasePath, apiKey, bankId };
};

/**
 * Generate SHA-256 fingerprint for memory deduplication
 */
export function generateMemoryFingerprint(params: {
  customer_id?: string;
  category: string;
  problem: string;
  action: string;
  outcome: string;
}): string {
  const normalized = [
    (params.customer_id || '').trim().toLowerCase(),
    (params.category || '').trim().toLowerCase(),
    (params.problem || '').trim().toLowerCase().replace(/\s+/g, ' '),
    (params.action || '').trim().toLowerCase().replace(/\s+/g, ' '),
    (params.outcome || '').trim().toLowerCase(),
  ].join('|');

  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hindsight Health Check
 */
export async function hindsightHealthCheck(): Promise<{
  status: 'connected' | 'failed';
  bank: string;
  message: string;
  details?: any;
}> {
  const { apiUrl, bankBasePath, apiKey, bankId } = getHindsightConfig();

  if (!apiKey) {
    return {
      status: 'failed',
      bank: bankId,
      message: 'HINDSIGHT_API_KEY is not configured in environment variables.',
    };
  }

  try {
    console.log('[HINDSIGHT] health_check_started', { bankId, bankBasePath });

    let response = await loggedFetch('HindsightStats', `${bankBasePath}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      response = await loggedFetch('HindsightHealthFallback', `${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
        },
      });
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('[HINDSIGHT] health_check_success', data);
      return {
        status: 'connected',
        bank: bankId,
        message: 'Successfully connected to Hindsight Cloud API.',
        details: data,
      };
    } else {
      const errorText = await response.text().catch(() => '');
      console.error('[HINDSIGHT] health_check_failed', { status: response.status, errorText });
      return {
        status: 'failed',
        bank: bankId,
        message: `Hindsight API returned HTTP ${response.status}: ${errorText || response.statusText}`,
      };
    }
  } catch (err: any) {
    console.error('[HINDSIGHT] health_check_error', err.message);
    return {
      status: 'failed',
      bank: bankId,
      message: `Failed to reach Hindsight API: ${err.message}`,
    };
  }
}

/**
 * Hindsight Retain
 * Stores a structured long-term memory in Hindsight bank
 */
export async function hindsightRetain(params: {
  ticket_id: string;
  customer_id?: string;
  customer_name: string;
  company?: string;
  category: string;
  problem: string;
  action: string;
  outcome: 'successful' | 'failed' | 'escalated';
  notes?: string;
  memory_type: 'ticket_created' | 'resolution' | 'failed_attempt' | 'escalation';
}): Promise<{
  success: boolean;
  memory_id?: string;
  fingerprint: string;
  bank: string;
  error?: string;
  duplicate?: boolean;
}> {
  const { apiUrl, bankBasePath, apiKey, bankId } = getHindsightConfig();

  const fingerprint = generateMemoryFingerprint({
    customer_id: params.customer_id,
    category: params.category,
    problem: params.problem,
    action: params.action,
    outcome: params.outcome,
  });

  console.log('[HINDSIGHT] retain_started', {
    ticket_id: params.ticket_id,
    bank: bankId,
    memory_type: params.memory_type,
    fingerprint,
  });

  if (!apiKey) {
    console.error('[HINDSIGHT] retain_failed', { error: 'HINDSIGHT_API_KEY missing' });
    return {
      success: false,
      fingerprint,
      bank: bankId,
      error: 'HINDSIGHT_API_KEY environment variable is not configured.',
    };
  }

  const docId = `ticket_doc_${params.ticket_id}_${Date.now()}`;
  const memoryText = [
    `ENTITY: Customer "${params.customer_name}"`,
    `ENTITY: Organization "${params.company || 'Technical Account'}"`,
    `ENTITY: Support Category "${params.category}"`,
    `Fact: Customer ${params.customer_name} from ${params.company || 'Organization'} reported: ${params.problem}`,
    `Fact: Support team resolution action: ${params.action}`,
    `Fact: Troubleshooting outcome was ${params.outcome.toUpperCase()}.`,
    `Notes: ${params.notes || 'None'}`,
    `Ticket ID: ${params.ticket_id}`,
  ].join('\n');

  const payload = {
    async: false,
    items: [
      {
        content: memoryText,
        context: 'technical_support',
        document_id: docId,
        metadata: {
          ticket_id: params.ticket_id,
          customer_id: params.customer_id || '',
          customer_name: params.customer_name,
          company: params.company || '',
          category: params.category,
          problem: params.problem,
          action: params.action,
          outcome: params.outcome,
          notes: params.notes || '',
          memory_type: params.memory_type,
          fingerprint: fingerprint,
          created_at: new Date().toISOString(),
        },
      },
    ],
  };

  const sendRetainRequest = async (retriesLeft = 2): Promise<any> => {
    try {
      const response = await loggedFetch('HindsightRetain', `${bankBasePath}/memories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const memory_id = data.document_id || data.id || data.memory_id || docId;
        console.log('[HINDSIGHT] retain_success', { memory_id, fingerprint });
        return {
          success: true,
          memory_id,
          fingerprint,
          bank: bankId,
        };
      } else if (response.status === 429 && retriesLeft > 0) {
        console.warn(`[HINDSIGHT] Rate limited (429), retrying in 2 seconds... (${retriesLeft} retries remaining)`);
        await new Promise(r => setTimeout(r, 2000));
        return sendRetainRequest(retriesLeft - 1);
      } else {
        const errText = await response.text().catch(() => '');
        console.error('[HINDSIGHT] retain_failed', { status: response.status, errText });
        return {
          success: false,
          fingerprint,
          bank: bankId,
          error: `HTTP ${response.status}: ${errText}`,
        };
      }
    } catch (err: any) {
      console.error('[HINDSIGHT] retain_failed', { error: err.message });
      return {
        success: false,
        fingerprint,
        bank: bankId,
        error: err.message,
      };
    }
  };

  return sendRetainRequest();
}

/**
 * Hindsight Recall
 * Searches long-term memory for relevant historical experiences
 */
export async function hindsightRecall(params: {
  customer_name: string;
  company?: string;
  category: string;
  subject: string;
  description: string;
  current_ticket_id?: string;
}): Promise<{
  success: boolean;
  total_recalled: number;
  unique_memories: number;
  duplicates_removed: number;
  memories: HindsightMemory[];
  error?: string;
}> {
  const { apiUrl, bankBasePath, apiKey, bankId } = getHindsightConfig();

  console.log('[HINDSIGHT] recall_started', {
    customer_name: params.customer_name,
    category: params.category,
    bank: bankId,
  });

  if (!apiKey) {
    console.error('[HINDSIGHT] recall_failed', { error: 'HINDSIGHT_API_KEY missing' });
    return {
      success: false,
      total_recalled: 0,
      unique_memories: 0,
      duplicates_removed: 0,
      memories: [],
      error: 'HINDSIGHT_API_KEY environment variable is not configured.',
    };
  }

  const queryText = [
    `Find previous support experiences relevant to a customer experiencing the following issue.`,
    `Customer: ${params.customer_name}.`,
    params.company ? `Company: ${params.company}.` : '',
    `Support category: ${params.category}.`,
    `Subject: ${params.subject}.`,
    `Issue description: ${params.description}.`,
    `Include both successful resolutions and failed troubleshooting attempts so the support engineer can learn from all historical outcomes.`,
  ].filter(Boolean).join(' ');

  const payload = {
    query: queryText,
    budget: 'mid',
  };

  try {
    const response = await loggedFetch('HindsightRecall', `${bankBasePath}/memories/recall`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const rawMemories: any[] = data.results || data.memories || (Array.isArray(data) ? data : []);

      const validMemories: HindsightMemory[] = rawMemories.map((m: any, idx: number) => ({
        id: m.id || m.document_id || `mem_recalled_${idx}`,
        bank: bankId,
        text: m.text || m.content || JSON.stringify(m),
        metadata: m.metadata || {
          ticket_id: m.metadata?.ticket_id || m.document_id,
          customer_name: m.metadata?.customer_name || params.customer_name,
          category: m.metadata?.category || params.category,
          outcome: m.metadata?.outcome || 'successful',
        },
        score: typeof m.scores?.final === 'number' ? m.scores.final : (typeof m.score === 'number' ? m.score : (100 - idx * 5)),
        created_at: m.mentioned_at || m.occurred_start || new Date().toISOString(),
      }));

      const historicalOnly = validMemories.filter(m => {
        if (!params.current_ticket_id) return true;
        const memoryTicketId = m.metadata?.ticket_id;
        return memoryTicketId !== params.current_ticket_id;
      });

      const totalRecalled = historicalOnly.length;

      const seenKeys = new Set<string>();
      const uniqueMemories: HindsightMemory[] = [];

      for (const mem of historicalOnly) {
        const ticketId = mem.metadata?.ticket_id || '';
        const fingerprint = mem.metadata?.fingerprint || mem.id;
        const key = ticketId ? `${ticketId}_${fingerprint}` : fingerprint;

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueMemories.push(mem);
        }
      }

      const duplicatesRemoved = totalRecalled - uniqueMemories.length;

      console.log('[HINDSIGHT] recall_success', {
        total_recalled: totalRecalled,
        unique_memories: uniqueMemories.length,
        duplicates_removed: duplicatesRemoved,
      });

      return {
        success: true,
        total_recalled: totalRecalled,
        unique_memories: uniqueMemories.length,
        duplicates_removed: duplicatesRemoved,
        memories: uniqueMemories,
      };
    } else {
      const errText = await response.text().catch(() => '');
      console.error('[HINDSIGHT] recall_failed', { status: response.status, errText });
      return {
        success: false,
        total_recalled: 0,
        unique_memories: 0,
        duplicates_removed: 0,
        memories: [],
        error: `HTTP ${response.status}: ${errText}`,
      };
    }
  } catch (err: any) {
    console.error('[HINDSIGHT] recall_failed', { error: err.message });
    return {
      success: false,
      total_recalled: 0,
      unique_memories: 0,
      duplicates_removed: 0,
      memories: [],
      error: err.message,
    };
  }
}

