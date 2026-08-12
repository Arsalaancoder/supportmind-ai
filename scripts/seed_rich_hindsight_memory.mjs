import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.HINDSIGHT_API_KEY;
const bankId = process.env.HINDSIGHT_BANK_ID || 'SmartMind';
const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';

async function seedRichMemories() {
  console.log('Sending rich structured support memories to Hindsight Bank:', bankId);

  const memories = [
    {
      content: 'Customer Sarah Connor at Cyberdyne Systems Tech logged a critical issue: Database connection pool exhaustion on AWS Lambda with Node.js 20. Technical resolution: Configured PgBouncer in transaction mode and increased max pool connections to 50. Outcome: SUCCESSFUL. Fix confirmed working under 10,000 req/min traffic surge.',
      context: 'customer_support_resolution',
      document_id: `doc_sarah_connor_resolution_${Date.now()}`,
      metadata: {
        customer_name: 'Sarah Connor',
        company: 'Cyberdyne Systems Tech',
        category: 'database',
        problem: 'Database connection pool exhaustion',
        action: 'Configured PgBouncer transaction mode and max_connections=50',
        outcome: 'successful',
        environment: 'Ubuntu 22.04 | Node.js 20.x | AWS Lambda | Supabase PgBouncer',
        frustration_level: 'critical',
      }
    },
    {
      content: 'Customer Enterprise Admin at Acme Corp experienced JWT Auth Header Stripping on Cloudflare Proxy. Resolution: Added custom transform rule in Cloudflare Dashboard to preserve Authorization Bearer headers. Outcome: SUCCESSFUL.',
      context: 'customer_support_resolution',
      document_id: `doc_acme_corp_resolution_${Date.now()}`,
      metadata: {
        customer_name: 'Enterprise Admin',
        company: 'Acme Corp',
        category: 'authentication',
        action: 'Preserve Authorization Header rule in Cloudflare',
        outcome: 'successful',
      }
    }
  ];

  const payload = {
    async: false,
    items: memories
  };

  try {
    const res = await fetch(`${baseUrl}/v1/default/banks/${bankId}/memories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('Hindsight Retain Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

seedRichMemories();
