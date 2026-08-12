import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverInstance: SupabaseClient | null = null;
let configuredHostname = '';

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  if (url.includes('supabase.com/dashboard/project/')) {
    const parts = url.split('/project/');
    if (parts[1]) {
      const ref = parts[1].split('/')[0].split('?')[0];
      url = `https://${ref}.supabase.co`;
    }
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.supabase.co')) {
      url = `https://${url}`;
    } else {
      url = `https://${url}.supabase.co`;
    }
  }

  return url.replace(/\/+$/, '');
}

export function getNormalizedSupabaseConfig(): {
  url: string;
  key: string;
  hostname: string;
  isValid: boolean;
  error: string | null;
} {
  const rawUrl = process.env.SUPABASE_URL || '';
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (!rawUrl || rawUrl.trim() === '' || rawUrl.includes('placeholder')) {
    return {
      url: '',
      key: '',
      hostname: '',
      isValid: false,
      error: 'SUPABASE_URL environment variable is missing or set to placeholder.',
    };
  }

  if (!key || key.includes('placeholder')) {
    return {
      url: '',
      key: '',
      hostname: '',
      isValid: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY environment variable is missing or set to placeholder.',
    };
  }

  const normalizedUrl = normalizeSupabaseUrl(rawUrl);
  let hostname = '';
  try {
    const parsed = new URL(normalizedUrl);
    hostname = parsed.hostname;
  } catch (err: any) {
    return {
      url: normalizedUrl,
      key,
      hostname: '',
      isValid: false,
      error: `Invalid SUPABASE_URL format "${rawUrl}": ${err.message}`,
    };
  }

  return {
    url: normalizedUrl,
    key,
    hostname,
    isValid: true,
    error: null,
  };
}

export function getSupabaseServer(): SupabaseClient {
  if (serverInstance) return serverInstance;

  const config = getNormalizedSupabaseConfig();

  if (!config.isValid) {
    console.warn(`[SUPABASE] Configuration warning: ${config.error}`);
    // Create client with fallback placeholder to prevent crash at startup, but log warning
    serverInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return serverInstance;
  }

  try {
    console.log(`[SUPABASE] URL configured: ${config.hostname}`);
    serverInstance = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    configuredHostname = config.hostname;
    console.log('[SUPABASE] client initialized');
  } catch (err: any) {
    console.error('[SUPABASE] Error initializing Supabase client:', err.message);
    serverInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return serverInstance;
}

// Simple cache for table existence checks to avoid repeated failed queries
const tableExistenceCache: Record<string, boolean> = {};

export async function tableExists(tableName: string): Promise<boolean> {
  if (tableExistenceCache[tableName] !== undefined) return tableExistenceCache[tableName];
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from(tableName).select('id').limit(1);
    if (error) {
      // If the error indicates table not found, cache false
      const msg = (error as any).message || '';
      const notFound = (error as any).code === 'PGRST205' || msg.includes(`public.${tableName}`) || msg.includes('does not exist') || msg.includes(`relation \"${tableName}\"`);
      tableExistenceCache[tableName] = !notFound ? true : false;
      return tableExistenceCache[tableName];
    }
    tableExistenceCache[tableName] = true;
    return true;
  } catch (err) {
    tableExistenceCache[tableName] = false;
    return false;
  }
}


