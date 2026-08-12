import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.HINDSIGHT_API_KEY;
const bankId = process.env.HINDSIGHT_BANK_ID || 'SmartMind';
const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';

console.log('Testing Hindsight Cloud payload formats for bank:', bankId);

async function testFormats() {
  const formats = [
    // Format 1: items with content & metadata
    {
      name: 'Format 1: items with content string',
      url: `${baseUrl}/v1/default/banks/${bankId}/memories`,
      body: {
        async: false,
        items: [
          {
            content: 'Customer Sarah Connor experienced database connection timeouts. Resolution: Configured PgBouncer transaction mode and max_connections=50.',
            context: 'technical_support',
            document_id: `doc_format1_${Date.now()}`,
            metadata: { customer: 'Sarah Connor', topic: 'database' }
          }
        ]
      }
    },
    // Format 2: items with messages array (conversation format)
    {
      name: 'Format 2: items with messages array',
      url: `${baseUrl}/v1/default/banks/${bankId}/memories`,
      body: {
        async: false,
        items: [
          {
            messages: [
              { role: 'user', content: 'Database connection timeout error on AWS Lambda' },
              { role: 'assistant', content: 'Configured PgBouncer to transaction mode and increased max_connections=50.' }
            ],
            context: 'support_ticket',
            document_id: `doc_format2_${Date.now()}`,
          }
        ]
      }
    },
    // Format 3: Direct document endpoint /v1/default/banks/${bankId}/documents
    {
      name: 'Format 3: Direct /documents endpoint',
      url: `${baseUrl}/v1/default/banks/${bankId}/documents`,
      body: {
        document_id: `doc_format3_${Date.now()}`,
        content: 'Customer Sarah Connor resolved database connection pool issue by setting PgBouncer transaction mode.',
      }
    },
  ];

  for (const fmt of formats) {
    console.log(`\n==================================================`);
    console.log(`Testing: ${fmt.name}`);
    console.log(`URL: ${fmt.url}`);
    try {
      const res = await fetch(fmt.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fmt.body),
      });

      const status = res.status;
      const text = await res.text();
      console.log(`HTTP Status: ${status}`);
      console.log(`Response: ${text}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

testFormats();
