import { GoogleGenAI, Type } from '@google/genai';
import { GeminiAnalysis, HindsightMemory } from '../types';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiClient;
}

export async function analyzeTicketWithGemini(params: {
  ticket: {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
  };
  customer: {
    name: string;
    company?: string | null;
    environment?: any | null;
    past_ticket_count?: number;
  };
  historicalMemories: HindsightMemory[];
  mentalModel?: string | null;
  knownIssues?: any[];
}): Promise<{
  success: boolean;
  analysis?: GeminiAnalysis;
  error?: string;
}> {
  const startTime = Date.now();
  console.log('[Gemini] REQUEST START', {
    service: 'Gemini',
    host: 'generativelanguage.googleapis.com',
    method: 'POST',
    startTime: new Date(startTime).toISOString(),
    ticket_id: params.ticket.id,
    memories_count: params.historicalMemories.length,
    mental_model_included: !!params.mentalModel,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini] FETCH FAILED', {
      service: 'Gemini',
      host: 'generativelanguage.googleapis.com',
      method: 'POST',
      success: false,
      message: 'GEMINI_API_KEY missing',
    });
    return {
      success: false,
      error: 'GEMINI_API_KEY environment variable is not configured.',
    };
  }

  const systemInstruction = `You are SupportMind AI, an enterprise technical support reasoning agent with 100% Customer Memory.
Your goal is ZERO-REPETITION customer support.
Analyze the CURRENT ticket using the customer's exact environment, historical memories, known issues, and frustration level.

CRITICAL INSTRUCTIONS:
1. CUSTOMER FRUSTRATION LEVEL: Evaluate emotional tone & repeat explanation indicators. Output a frustration score (0-100), level (low, moderate, high, critical), reasoning, and friction warning.
2. PROVEN SOLUTIONS: Extract solutions from historical memories that succeeded previously.
3. KNOWN ISSUES MATCH: Check if ticket matches any system known issues or bugs.
4. ENVIRONMENT COMPATIBILITY: Analyze if customer's OS/Stack/SDK has known conflicts.
5. NEVER ask customer to repeat facts already present in their memory or environment.`;

  const memoriesFormatted = params.historicalMemories.length > 0
    ? params.historicalMemories.map((m, i) => `--- HISTORICAL MEMORY #${i + 1} ---
ID: ${m.id}
Ticket Reference: ${m.metadata?.ticket_id || 'N/A'}
Text:
${m.text}
Metadata: ${JSON.stringify(m.metadata || {})}`).join('\n\n')
    : 'No historical Hindsight memories found for similar issues.';

  const knownIssuesFormatted = (params.knownIssues && params.knownIssues.length > 0)
    ? params.knownIssues.map((k, i) => `--- KNOWN SYSTEM ISSUE #${i + 1} ---
ID: ${k.id}
Title: ${k.title}
Affected Environment: ${k.affected_environment || 'All'}
Description: ${k.description}
Workaround: ${k.workaround}
Status: ${k.status}`).join('\n\n')
    : 'No active system known issues currently listed.';

  const envFormatted = params.customer.environment
    ? JSON.stringify(params.customer.environment, null, 2)
    : 'No environment details supplied.';

  const mentalModelSection = params.mentalModel ? `\n=== CUSTOMER MENTAL MODEL ===\n${params.mentalModel}\n\n` : '';

  const prompt = `
=== CURRENT TICKET (SYSTEM OF RECORD) ===
Ticket ID: ${params.ticket.id}
Customer Name: ${params.customer.name}
Company: ${params.customer.company || 'N/A'}
Past Ticket Count: ${params.customer.past_ticket_count || 0}
Category: ${params.ticket.category}
Priority: ${params.ticket.priority}
Subject: ${params.ticket.subject}
Description: ${params.ticket.description}

=== CUSTOMER ENVIRONMENT STACK ===
${envFormatted}

=== KNOWN PLATFORM INCIDENTS / ISSUES ===
${knownIssuesFormatted}

=== RECALLED HISTORICAL HINDSIGHT MEMORIES ===
${memoriesFormatted}
${mentalModelSection}
Based on the data above, generate your structured technical troubleshooting recommendation in JSON format matching the schema.
`;

  try {
    const ai = getGeminiClient();

    const modelCandidates = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-pro-latest', 'gemini-2.5-flash'];
    let response: any = null;
    let lastError: any = null;
    const maxAttempts = 2;

    const config = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Executive technical summary of the problem' },
          risk_level: { type: Type.STRING, description: 'Risk level: low, medium, high, or critical' },
          frustration_assessment: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: 'Frustration score 0 to 100' },
              level: { type: Type.STRING, description: 'low, moderate, high, or critical' },
              reasoning: { type: Type.STRING, description: 'Reasoning behind frustration score' },
              friction_warning: { type: Type.STRING, description: 'Warning if customer is repeating explanations' },
              repeat_explanations_count: { type: Type.NUMBER, description: 'Number of times customer explained this issue' },
            },
            required: ['score', 'level', 'reasoning'],
          },
          proven_solutions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticket_id: { type: Type.STRING },
                problem_summary: { type: Type.STRING },
                action_taken: { type: Type.STRING },
                outcome: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: ['problem_summary', 'action_taken', 'outcome'],
            },
          },
          known_issue_match: {
            type: Type.OBJECT,
            properties: {
              issue_id: { type: Type.STRING },
              title: { type: Type.STRING },
              workaround: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ['title', 'workaround'],
          },
          environment_analysis: {
            type: Type.OBJECT,
            properties: {
              compatibility_status: { type: Type.STRING, description: 'compatible, known_conflict, deprecated, or unknown' },
              notes: { type: Type.STRING },
            },
            required: ['compatibility_status', 'notes'],
          },
          historical_evidence: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                memory_id: { type: Type.STRING },
                ticket_id: { type: Type.STRING },
                relevance_explanation: { type: Type.STRING },
                previous_action: { type: Type.STRING },
                previous_outcome: { type: Type.STRING },
              },
              required: ['relevance_explanation'],
            },
            description: 'Relevance of historical memories to this current ticket',
          },
          recommended_actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Step-by-step troubleshooting recommendations',
          },
          reasoning: { type: Type.STRING, description: 'Technical justification drawing from evidence and system behavior' },
          confidence: { type: Type.NUMBER, description: 'Confidence score percentage between 0 and 100' },
          next_steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Immediate actions for the support engineer',
          },
          escalation_required: { type: Type.BOOLEAN, description: 'Whether level-2 or tier-3 escalation is required' },
        },
        required: [
          'summary',
          'risk_level',
          'historical_evidence',
          'recommended_actions',
          'reasoning',
          'confidence',
          'next_steps',
          'escalation_required',
        ],
      },
    };


    for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[Gemini] Trying model: ${model} (attempt ${attempt})`);
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
          });
          console.log(`[Gemini] Model succeeded: ${model}`);
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini] Model ${model} attempt ${attempt} failed:`, err?.message || err);
          // small backoff
          await new Promise(r => setTimeout(r, 250 * attempt));
        }
      }
      if (response) break;
    }

    if (!response) {
      throw lastError || new Error('All Gemini models failed.');
    }

    const endTime = Date.now();
    console.log('[Gemini] REQUEST END', {
      service: 'Gemini',
      host: 'generativelanguage.googleapis.com',
      method: 'POST',
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
      success: true,
    });

    // Try multiple fallbacks to extract textual output from different SDK response shapes
    let text: string | undefined = undefined;
    try {
      if (typeof (response as any)?.text === 'string') text = (response as any).text.trim();
      if (!text && Array.isArray((response as any)?.output) && (response as any).output[0]) {
        const out = (response as any).output[0];
        if (typeof out?.content?.text === 'string') text = out.content.text.trim();
        if (!text && typeof out?.text === 'string') text = out.text.trim();
      }
      if (!text && Array.isArray((response as any)?.generations) && (response as any).generations[0]) {
        if (typeof (response as any).generations[0].text === 'string') text = (response as any).generations[0].text.trim();
      }
      if (!text && (response as any)?.generation && typeof (response as any).generation === 'string') text = (response as any).generation.trim();
    } catch (e) {
      // ignore extraction errors
    }

    if (!text) {
      // provide raw response for debugging
      const raw = JSON.stringify(response, null, 2).slice(0, 2000);
      throw new Error(`Gemini returned no textual output. RawResponsePreview: ${raw}`);
    }

    let parsed: GeminiAnalysis;
    try {
      parsed = JSON.parse(text) as GeminiAnalysis;
    } catch (parseErr) {
      // Try a quick retry requesting explicit JSON wrapped in a code block
      try {
        console.warn('[Gemini] Initial JSON parse failed, retrying with strict JSON wrapper prompt');
        const retryPrompt = prompt + '\n\nIMPORTANT: Output ONLY valid JSON. Wrap the JSON with a ```json block. Example:\n```json\n{...}\n```';
        const retryResp = await ai.models.generateContent({
          model: response?.model || modelCandidates[0],
          contents: retryPrompt,
          // omit schema to get raw text
        });
        let retryText = ((retryResp as any)?.text || (Array.isArray((retryResp as any)?.output) && (retryResp as any).output[0]?.content?.text) || '') as string;
        const match = /```json\s*([\s\S]*?)\s*```/.exec(retryText);
        if (match && match[1]) retryText = match[1];
        parsed = JSON.parse(retryText) as GeminiAnalysis;
      } catch (retryErr: any) {
        throw new Error(`Failed to parse Gemini JSON output: ${(parseErr as Error).message}; retry error: ${retryErr?.message || retryErr}\n----RAW TEXT----\n${text.substring(0, 2000)}`);
      }
    }

    // Sanitize and validate risk level
    if (!['low', 'medium', 'high', 'critical'].includes(parsed.risk_level)) {
      parsed.risk_level = 'medium';
    }

    return {
      success: true,
      analysis: parsed,
    };
  } catch (err: any) {
    const endTime = Date.now();
    console.error('[Gemini] FETCH FAILED', {
      service: 'Gemini',
      host: 'generativelanguage.googleapis.com',
      method: 'POST',
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
      success: false,
      name: err?.name,
      message: err?.message,
      code: err?.cause?.code,
      errno: err?.cause?.errno,
      syscall: err?.cause?.syscall,
      hostname: err?.cause?.hostname,
      address: err?.cause?.address,
      port: err?.cause?.port,
      cause: err?.cause,
      stack: err?.stack,
    });
    return {
      success: false,
      error: `Gemini API Error: ${err.message}`,
    };
  }
}
