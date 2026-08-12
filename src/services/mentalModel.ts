import { getGeminiClient } from './gemini';
import { HindsightMemory } from '../types';

export async function generateMentalModelFromMemories(params: {
  customer: { id?: string; name: string; company?: string | null };
  memories: HindsightMemory[];
}): Promise<{ success: boolean; mentalModel?: string | null; error?: string }>{
  const { customer, memories } = params;

  if (!memories || memories.length === 0) {
    return { success: true, mentalModel: null };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY not configured' };
  }

  const ai = getGeminiClient();

  const memoriesFormatted = memories.map((m, i) => `--- MEMORY #${i + 1} ---\nID: ${m.id}\nTicket: ${m.metadata?.ticket_id || 'N/A'}\nText:\n${m.text}\nMetadata: ${JSON.stringify(m.metadata || {})}`).join('\n\n');

  const prompt = `Create a mental model of this customer's support history using ONLY the memories provided below. Do NOT invent facts. If a topic is not supported by the memories, state that there is no evidence.\n\nCustomer: ${customer.name} (${customer.company || 'N/A'})\n\nMEMORIES:\n${memoriesFormatted}\n\nOutput a concise mental model as plain text. Include sections for: support history, recurring issues, customer preferences, previous resolutions, escalation history, sentiment patterns, unresolved issues, behavioral patterns, and a short risk assessment. Use only information present in these memories.`;

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      // request plain text output
    });

    let text = (resp as any)?.text || (Array.isArray((resp as any)?.output) && (resp as any).output[0]?.content?.text) || '';
    if (!text && Array.isArray((resp as any)?.generations) && (resp as any).generations[0]) text = (resp as any).generations[0].text || '';

    text = (text || '').toString().trim();

    if (!text) {
      return { success: false, error: 'Empty response from Gemini while generating mental model' };
    }

    return { success: true, mentalModel: text };
  } catch (err: any) {
    console.error('[MENTAL_MODEL] generation failed', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
