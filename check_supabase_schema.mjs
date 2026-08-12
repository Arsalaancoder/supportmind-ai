import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env' });

const rawUrl = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

function normalizeSupabaseUrl(rawUrl) {
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
  return url.replace(/\/+$|\s+/g, '');
}

const url = normalizeSupabaseUrl(rawUrl);
console.log('rawUrl=', rawUrl);
console.log('normalized=', url);
console.log('keyPresent=', Boolean(key));

if (!url || !key) {
  console.error('MISSING_URL_OR_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);
for (const table of ['tickets', 'customers', 'messages', 'ticket_messages', 'ticket_outcomes', 'agent_runs', 'memory_events']) {
  try {
    const result = await supabase.from(table).select('id').limit(1);
    console.log(`TABLE ${table}:`, JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`TABLE ${table} ERROR:`, err);
  }
}
