import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.HINDSIGHT_API_KEY;
const bankId = process.env.HINDSIGHT_BANK_ID || 'SmartMind';
const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';

console.log('Testing Hindsight Cloud API endpoints...');
console.log('Base URL:', baseUrl);
console.log('Bank ID:', bankId);
console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Missing');

async function testEndpoints() {
  const endpoints = [
    // Endpoint candidate 1
    { url: `${baseUrl}/v1/default/banks/${bankId}/memories`, method: 'POST', body: { async: false, items: [{ content: 'Test support memory', context: 'technical_support' }] } },
    // Endpoint candidate 2 (without default)
    { url: `${baseUrl}/v1/banks/${bankId}/memories`, method: 'POST', body: { async: false, items: [{ content: 'Test support memory', context: 'technical_support' }] } },
    // Endpoint candidate 3 (without v1)
    { url: `${baseUrl}/banks/${bankId}/memories`, method: 'POST', body: { async: false, items: [{ content: 'Test support memory', context: 'technical_support' }] } },
    // Retain candidate 4 (simple memory payload)
    { url: `${baseUrl}/v1/default/banks/${bankId}/memories`, method: 'POST', body: { text: 'Test support memory for Sarah Connor', metadata: { category: 'database' } } },
    // Retain candidate 5 (messages payload)
    { url: `${baseUrl}/v1/default/banks/${bankId}/memories`, method: 'POST', body: { messages: [{ role: 'user', content: 'Database timeout error' }] } },
    // Stats endpoint
    { url: `${baseUrl}/v1/default/banks/${bankId}/stats`, method: 'GET' },
    // List banks endpoint
    { url: `${baseUrl}/v1/default/banks`, method: 'GET' },
  ];

  for (const ep of endpoints) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing ${ep.method} ${ep.url}`);
    try {
      const opts = {
        method: ep.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      };
      if (ep.body) opts.body = JSON.stringify(ep.body);

      const res = await fetch(ep.url, opts);
      const status = res.status;
      const text = await res.text();
      console.log(`HTTP ${status}`);
      console.log('Response:', text.substring(0, 500));
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

testEndpoints();
