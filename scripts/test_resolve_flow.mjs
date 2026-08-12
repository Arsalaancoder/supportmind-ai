import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const baseUrl = 'http://localhost:3001';

async function testFlow() {
  console.log('1. Fetching current dashboard stats...');
  const statsBeforeRes = await fetch(`${baseUrl}/api/dashboard/stats`);
  const statsBefore = await statsBeforeRes.json();
  console.log('Stats BEFORE:', {
    total_tickets: statsBefore.total_tickets,
    open_tickets: statsBefore.open_tickets,
    resolved_tickets: statsBefore.resolved_tickets,
    successful_resolutions: statsBefore.successful_resolutions,
    hindsight_memories: statsBefore.hindsight_memories,
  });

  console.log('\n2. Fetching tickets...');
  const ticketsRes = await fetch(`${baseUrl}/api/tickets?status=all`);
  const tickets = await ticketsRes.json();

  if (!Array.isArray(tickets) || tickets.length === 0) {
    console.error('No tickets found!');
    return;
  }

  const openTicket = tickets.find(t => t.status === 'open' || t.status === 'in_progress') || tickets[0];
  console.log(`Target Ticket ID: ${openTicket.id} | Subject: "${openTicket.subject}" | Initial Status: ${openTicket.status}`);

  console.log('\n3. Recording SUCCESS outcome on ticket...');
  const outcomeRes = await fetch(`${baseUrl}/api/tickets/${openTicket.id}/outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'Set PgBouncer pooler mode to transaction and allocated 50 connections',
      outcome: 'successful',
      notes: 'Customer confirmed API response time dropped to 45ms and 0 errors',
    }),
  });

  const outcomeData = await outcomeRes.json();
  console.log('Outcome Response:', outcomeData);

  console.log('\n4. Fetching updated dashboard stats...');
  const statsAfterRes = await fetch(`${baseUrl}/api/dashboard/stats`);
  const statsAfter = await statsAfterRes.json();
  console.log('Stats AFTER:', {
    total_tickets: statsAfter.total_tickets,
    open_tickets: statsAfter.open_tickets,
    resolved_tickets: statsAfter.resolved_tickets,
    successful_resolutions: statsAfter.successful_resolutions,
    hindsight_memories: statsAfter.hindsight_memories,
  });
}

testFlow();
