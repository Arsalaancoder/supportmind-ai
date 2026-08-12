import fetch from 'node-fetch';

async function testAnalyze() {
  console.log('Fetching tickets from http://localhost:3001...');
  const tRes = await fetch('http://localhost:3001/api/tickets?status=all');
  const tickets = await tRes.json();

  if (!Array.isArray(tickets) || tickets.length === 0) {
    console.error('No tickets found!');
    return;
  }

  const ticket = tickets[0];
  console.log(`Testing analyze endpoint for ticket ID: ${ticket.id}`);

  const aRes = await fetch('http://localhost:3001/api/analyze-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId: ticket.id }),
  });

  const status = aRes.status;
  const json = await aRes.json();
  console.log(`HTTP ${status} Response:`, JSON.stringify(json, null, 2));
}

testAnalyze();
