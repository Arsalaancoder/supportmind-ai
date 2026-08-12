import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const rawUrl = process.env.SUPABASE_URL || '';
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

let normalizedUrl = rawUrl.trim();
if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
  normalizedUrl = `https://${normalizedUrl}.supabase.co`;
}

const supabase = createClient(normalizedUrl, key);

async function resetAllTickets() {
  console.log('==========================================================');
  console.log('RESETTING ALL TICKETS & OUTCOMES IN SUPABASE DATABASE...');
  console.log('==========================================================');

  // Helper for safe delete
  const safeDelete = async (table) => {
    try {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn(`Note clearing ${table}:`, error.message);
      else console.log(`Cleared table '${table}'`);
    } catch (e) {
      // ignore table not found
    }
  };

  await safeDelete('messages');
  await safeDelete('ticket_outcomes');
  await safeDelete('memory_events');
  await safeDelete('agent_runs');
  await safeDelete('tickets');
  await safeDelete('customers');

  console.log('\n[1/3] Creating Customer Profile: Sarah Connor...');
  const customerPayload = {
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.tech',
    company: 'Cyberdyne Systems Tech',
    mental_model: 'Cyberdyne Systems runs a high-throughput API gateway deployed on AWS Lambda (Node.js 20.x) connected to a managed Supabase PostgreSQL database via PgBouncer connection pooler in transaction mode.',
    frustration_level: 'critical',
    environment: {
      os: 'Ubuntu 22.04 LTS',
      framework: 'Node.js 20.x / Express',
      cloud_provider: 'AWS Lambda',
      sdk_version: '@supabase/supabase-js v2.39',
      db_engine: 'Supabase PostgreSQL 15 (PgBouncer)',
      plan_tier: 'Enterprise Tier',
    },
  };

  let customer = null;
  const { data: cData, error: cErr } = await supabase.from('customers').insert([customerPayload]).select().single();
  if (cErr) {
    const { data: cBasic } = await supabase.from('customers').insert([{
      name: customerPayload.name,
      email: customerPayload.email,
      company: customerPayload.company,
    }]).select().single();
    customer = cBasic;
  } else {
    customer = cData;
  }

  console.log('Customer created ID:', customer.id);

  console.log('\n[2/3] Creating Past Resolution History (Ticket #1)...');
  const pastTicketPayload = {
    customer_id: customer.id,
    subject: 'Database connection timeout under 10k req/min traffic surge',
    description: 'API gateway threw HTTP 500 error when database connections exceeded max pool limit on AWS Lambda.',
    category: 'database',
    priority: 'high',
    status: 'resolved',
    resolution: 'Configured PgBouncer transaction mode and increased max_connections to 50.',
    resolved_at: new Date(Date.now() - 86400000).toISOString(),
  };

  const { data: pastTicket } = await supabase.from('tickets').insert([pastTicketPayload]).select().single();

  if (pastTicket) {
    await supabase.from('ticket_outcomes').insert([{
      ticket_id: pastTicket.id,
      action: 'Configured PgBouncer transaction mode and set max_connections=50',
      outcome: 'successful',
      notes: 'Connection pool stability verified under 10k req/min load spike.',
    }]);
  }

  console.log('\n[3/3] Creating Active Demo Ticket (Ticket #2)...');
  const demoTicketPayload = {
    customer_id: customer.id,
    subject: 'CRITICAL: App crashed AGAIN with Supabase connection pool exhaustion on AWS Lambda!',
    description: `This is the 3rd time our production environment has frozen due to database connection exhaustion!

We are losing thousands of dollars a minute during our enterprise launch!
Do NOT ask me to re-verify basic hardware settings or restart my network interface!
Look at our environment history (Node 20, AWS Lambda, Supabase v2) and past ticket resolutions and fix this immediately!`,
    category: 'database',
    priority: 'urgent',
    status: 'open',
    frustration_level: 'critical',
    repeat_issue_detected: true,
  };

  let demoTicket = null;
  const { data: dtData, error: dtErr } = await supabase.from('tickets').insert([demoTicketPayload]).select().single();
  if (dtErr) {
    const { data: dtBasic } = await supabase.from('tickets').insert([{
      customer_id: customer.id,
      subject: demoTicketPayload.subject,
      description: demoTicketPayload.description,
      category: demoTicketPayload.category,
      status: demoTicketPayload.status,
    }]).select().single();
    demoTicket = dtBasic;
  } else {
    demoTicket = dtData;
  }

  console.log('==========================================================');
  console.log('DATABASE RESET COMPLETED CLEANLY!');
  console.log('==========================================================');
  console.log(`Demo Ticket ID: ${demoTicket.id}`);
  console.log(`Direct URL: http://localhost:3001/#/tickets/${demoTicket.id}`);
  console.log('==========================================================');
}

resetAllTickets();
