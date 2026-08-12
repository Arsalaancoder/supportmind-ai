import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('=== STARTING HINDSIGHT MINDAI INTEGRATION VERIFICATION ===\n');

  // Step 1 & 2: Hindsight Health Check via /api/diagnostics
  console.log('[STEP 1 & 2] Running Hindsight Health Check via /api/diagnostics...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/diagnostics`);
    const healthData = await healthRes.json();
    console.log('Diagnostics Health Check Response:', JSON.stringify(healthData, null, 2));
  } catch (err) {
    console.error('Health check request failed:', err.message);
  }

  // Step 3 & 4: Create a test ticket (triggers Supabase customer lookup/create, ticket insert, Hindsight Retain, and Hindsight Recall against MindAi bank)
  console.log('\n[STEP 3 & 4] Creating new ticket (triggers Hindsight Recall against MindAi bank)...');
  const testSubject = `Database Connection Pool Exhaustion - ${Date.now()}`;
  const testDesc = 'Application servers throwing 500 errors due to PostgreSQL connection pool exhaustion under load.';

  let ticket;
  try {
    const ticketRes = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'MindAi Test Corp',
        email: 'verifier@mindai.test',
        company: 'MindAi Testing',
        subject: testSubject,
        description: testDesc,
        category: 'Database',
        priority: 'high'
      })
    });
    const ticketData = await ticketRes.json();
    console.log('\n[STEP 3 RESULT] Created Ticket Response:', JSON.stringify(ticketData, null, 2));
    ticket = ticketData.ticket;
  } catch (err) {
    console.error('Create ticket failed:', err.message);
    return;
  }

  if (!ticket || !ticket.id) {
    console.error('Ticket creation failed, cannot proceed with troubleshooting retention.');
    return;
  }

  // Step 4 & 5 & 6: Create a test troubleshooting outcome and retain it into MindAi bank
  console.log(`\n[STEP 4, 5, 6] Creating test troubleshooting outcome and retaining into MindAi bank for ticket ${ticket.id}...`);
  let outcomeResult;
  try {
    const outcomeRes = await fetch(`${BASE_URL}/api/tickets/${ticket.id}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_taken: 'Increased max_connections to 250 in postgresql.conf and deployed PgBouncer transaction pooling.',
        result_outcome: 'successful',
        notes: 'Latency dropped to 10ms and pool exhaustion errors ceased under 10,000 RPS load test.'
      })
    });
    outcomeResult = await outcomeRes.json();
    console.log('\n[STEP 6 RESULT] Retain Outcome Response:', JSON.stringify(outcomeResult, null, 2));
  } catch (err) {
    console.error('Troubleshoot retention request failed:', err.message);
    return;
  }

  // Step 7 & 8: Verify actual returned memory ID captured & stored in Supabase
  console.log('\n[STEP 7 & 8] Capturing returned Memory ID & verifying Supabase storage...');
  const memoryId = outcomeResult?.hindsight_memory_id || outcomeResult?.memory_id || outcomeResult?.hindsight_retain?.memory_id;
  console.log(`Captured Memory ID from Retain: ${memoryId || 'None'}`);

  // Step 9: Verify memory appears in Hindsight Memory Bank View
  console.log('\n[STEP 9] Querying Memory Bank API (/api/memory) to verify memory appears in MindAi bank...');
  try {
    const memRes = await fetch(`${BASE_URL}/api/memory`);
    const memData = await memRes.json();
    console.log('Memory Bank Response:', JSON.stringify(memData, null, 2));
  } catch (err) {
    console.error('Fetch memory list failed:', err.message);
  }

  // Step 10: Run Recall again on a new ticket with similar problem to verify newly retained memory is returned
  console.log('\n[STEP 10] Creating second ticket with similar problem to run Recall and verify newly retained memory is returned...');
  try {
    const ticket2Res = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'MindAi Test Corp',
        email: 'verifier@mindai.test',
        company: 'MindAi Testing',
        subject: 'PostgreSQL connection exhaustion under heavy load',
        description: 'Database is timing out on new client connections due to max_connections pool exhaustion.',
        category: 'Database',
        priority: 'high'
      })
    });
    const ticket2Data = await ticket2Res.json();
    console.log('\n[STEP 10 RESULT] Second Ticket Creation Recall Results:', JSON.stringify({
      recalled_memories_count: ticket2Data?.recalled_memories?.length || 0,
      recalled_memories: ticket2Data?.recalled_memories,
      gemini_analysis_preview: ticket2Data?.gemini_analysis?.substring(0, 200)
    }, null, 2));
  } catch (err) {
    console.error('Second ticket creation failed:', err.message);
  }

  console.log('\n=== VERIFICATION SEQUENCE FINISHED ===');
}

runVerification();
