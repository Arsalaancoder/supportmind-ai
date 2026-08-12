import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from './supabaseServer';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  let rawUrl = process.env.SUPABASE_URL || (typeof window !== 'undefined' ? (window as any)._env_?.SUPABASE_URL : '') || '';
  let anonKey = process.env.SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? (window as any)._env_?.SUPABASE_ANON_KEY : '') || '';

  let url = normalizeSupabaseUrl(rawUrl);
  if (!url) {
    url = 'https://placeholder.supabase.co';
  }

  if (!anonKey) {
    anonKey = 'placeholder-key-0000000000000000000000000';
  }

  try {
    clientInstance = createClient(url, anonKey);
  } catch (err: any) {
    console.error('[SUPABASE] Error creating client:', err.message);
    clientInstance = createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return clientInstance;
}


