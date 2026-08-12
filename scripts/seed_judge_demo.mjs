import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabaseServer } from '../src/supabase/supabaseServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = getSupabaseServer();

async function seedJudgeDemo() {
  console.log('==========================================================');
  console.log('SEEDING JUDGE-READY HACKATHON DEMO DATA...');
  console.log('==========================================================');

  // 1. Known Issues
  console.log('[1/4] Seeding Known System Issues...');
  const { data: ki, error: kiErr } = await supabase.from('known_issues').insert([
    {
      title: 'Supabase Connection Pool Exhaustion on AWS Lambda (Node v20)',
      category: 'database',
      affected_environment: 'Node.js 20.x, AWS Lambda, Supabase PgBouncer',
      description: 'Node v20 socket pooling leaks idle connections during Lambda cold starts when DB_POOL_MODE is set to session.',
      workaround: 'Configure PgBouncer to transaction mode, set max_connections=50, and pass keepAlive: true in Supabase JS client options.',
      severity: 'critical',
      status: 'identified',
    },
    {
      title: 'JWT Auth Header Stripping on Cloudflare Proxy',
      category: 'authentication',
      affected_environment: 'Cloudflare Proxy, Node.js',
      description: 'Custom Authorization headers with Bearer tokens stripped by default HTTP proxy settings.',
      workaround: 'Add custom header rule in Cloudflare Dashboard: Transform Rules -> Preserve Authorization Header.',
      severity: 'medium',
      status: 'fixing',
    }
  ]).select();

  if (kiErr) console.warn('Known issues seed note:', kiErr.message);

  // 2. Customer: Sarah Connor (Angry customer with rich environment)
  console.log('[2/4] Creating Customer Profile: Sarah Connor...');
  const envObj = {
    os: 'Ubuntu 22.04 LTS',
    framework: 'Node.js 20.x + Express',
    cloud_provider: 'AWS Lambda',
    sdk_version: '@supabase/supabase-js 2.112.3',
    db_engine: 'PostgreSQL (PgBouncer)',
    plan_tier: 'Enterprise Unlimited',
  };

  let customer = null;
  // Try inserting with environment column
  const { data: c1, error: e1 } = await supabase.from('customers').insert([
    {
      name: 'Sarah Connor',
      email: 'sarah.connor@cyberdyne-tech.io',
      company: 'Cyberdyne Systems Tech',
      phone: '+1 (555) 019-2831',
      environment: envObj,
      frustration_level: 'critical',
      frustration_score: 92,
    }
  ]).select().single();

  if (c1) {
    customer = c1;
  } else {
    // Fallback if environment column does not exist on remote Supabase DB yet
    console.log('Inserting with mental_model fallback for environment...');
    const { data: c2, error: e2 } = await supabase.from('customers').insert([
      {
        name: 'Sarah Connor',
        email: 'sarah.connor@cyberdyne-tech.io',
        company: 'Cyberdyne Systems Tech',
        phone: '+1 (555) 019-2831',
        mental_model: {
          environment: envObj,
          frustration_level: 'critical',
          frustration_score: 92,
        },
      }
    ]).select().single();

    if (e2 || !c2) {
      console.log('Inserting basic customer profile with standard schema fields...');
      const { data: c3, error: e3 } = await supabase.from('customers').insert([
        {
          name: 'Sarah Connor',
          email: 'sarah.connor@cyberdyne-tech.io',
          company: 'Cyberdyne Systems Tech (Node.js 20.x | AWS Lambda | Supabase PgBouncer)',
        }
      ]).select().single();

      if (e3 || !c3) {
        console.error('Failed to create customer:', e3?.message || e2?.message || e1?.message);
        process.exit(1);
      }
      customer = c3;
    } else {
      customer = c2;
    }
    customer.environment = envObj;
    customer.frustration_level = 'critical';
    customer.frustration_score = 92;
  }

  console.log('Created customer ID:', customer.id);

  // 3. Past Tickets for Sarah
  console.log('[3/4] Creating Past Tickets & Solutions history...');
  
  // Past Resolved Ticket
  const ticket1Payload = {
    customer_id: customer.id,
    subject: 'Database connection timeout during peak load spike',
    description: 'Our API server failed to execute queries during the 9 AM traffic surge. Connection refused by Postgres pool manager.',
    category: 'database',
    priority: 'high',
    status: 'resolved',
    resolution: 'Adjusted PgBouncer pool mode from session to transaction and increased max pool connections to 50.',
    resolved_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  };

  let { data: ticket1 } = await supabase.from('tickets').insert([{ ...ticket1Payload, frustration_level: 'moderate' }]).select().single();
  if (!ticket1) {
    const { data: t1Fallback } = await supabase.from('tickets').insert([ticket1Payload]).select().single();
    ticket1 = t1Fallback;
  }

  if (ticket1) {
    await supabase.from('ticket_outcomes').insert([{
      ticket_id: ticket1.id,
      action: 'Configured PgBouncer transaction mode and max_connections=50',
      outcome: 'successful',
      notes: 'Connection pool stability verified under 10k req/min load spike.',
    }]);

    await supabase.from('messages').insert([
      { ticket_id: ticket1.id, sender: 'Sarah Connor', content: 'Our API is throwing database connection timeout errors!' },
      { ticket_id: ticket1.id, sender: 'Support Engineer', content: 'We updated your PgBouncer pooler to transaction mode and scaled pool limits to 50.' },
      { ticket_id: ticket1.id, sender: 'Sarah Connor', content: 'Verified working! Traffic is smooth now.' },
    ]);

    // Push memory to Hindsight Cloud Bank SmartMind
    try {
      const { hindsightRetain } = await import('../src/services/hindsight.js');
      const retRes = await hindsightRetain({
        ticket_id: ticket1.id,
        customer_id: customer.id,
        customer_name: customer.name,
        company: customer.company || undefined,
        category: ticket1.category || 'database',
        problem: ticket1.description,
        action: 'Configured PgBouncer transaction mode and set max_connections=50',
        outcome: 'successful',
        notes: 'Connection pool stability verified under 10k req/min load spike.',
        memory_type: 'resolution',
      });
      console.log('[HINDSIGHT] Cloud bank SmartMind retain result:', retRes);
    } catch (err) {
      console.warn('[HINDSIGHT] Cloud bank retain note:', err.message);
    }
  }

  // Active High Frustration Ticket (Judge Demo Ticket!)
  const ticket2Payload = {
    customer_id: customer.id,
    subject: 'CRITICAL: App crashed AGAIN with Supabase connection pool exhaustion on AWS Lambda!',
    description: `This is the 3rd time our production environment has frozen due to database connection exhaustion!

We are losing thousands of dollars a minute during our enterprise launch!
Do NOT ask me to re-verify basic hardware settings or restart my network interface!
Look at our environment history (Node 20, AWS Lambda, Supabase v2) and past ticket resolutions and fix this immediately!`,
    category: 'database',
    priority: 'urgent',
    status: 'open',
  };

  let { data: ticket2, error: t2Err } = await supabase.from('tickets').insert([{
    ...ticket2Payload,
    frustration_level: 'critical',
    repeat_issue_detected: true,
    environment_snapshot: customer.environment,
  }]).select().single();

  if (!ticket2) {
    const { data: t2Fallback, error: t2fErr } = await supabase.from('tickets').insert([ticket2Payload]).select().single();
    if (!t2Fallback) {
      console.log('Inserting ticket with basic standard schema fields...');
      const { data: t2Basic, error: t2bErr } = await supabase.from('tickets').insert([{
        customer_id: customer.id,
        subject: ticket2Payload.subject,
        description: ticket2Payload.description,
        category: ticket2Payload.category,
        status: ticket2Payload.status,
      }]).select().single();

      if (t2bErr) console.error('Basic ticket insert error:', t2bErr.message);
      ticket2 = t2Basic;
    } else {
      ticket2 = t2Fallback;
    }
  }

  if (ticket2) {
    await supabase.from('messages').insert([
      { ticket_id: ticket2.id, sender: 'Sarah Connor', content: 'CRITICAL: Production API is completely unresponsive on AWS Lambda!' }
    ]);
  }

  console.log('==========================================================');
  console.log('DEMO DATA SEEDED SUCCESSFULLY!');
  console.log('==========================================================');
  console.log('Customer: Sarah Connor (Cyberdyne Systems Tech)');
  console.log('Frustration Level: CRITICAL (92%)');
  console.log('Environment Stack: Node.js 20.x, AWS Lambda, Supabase PgBouncer');
  console.log('Demo Ticket ID:', ticket2?.id);
  console.log('Direct URL to Demo Ticket: http://localhost:3000/#/tickets/' + ticket2?.id);
  console.log('==========================================================');
}

seedJudgeDemo().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
