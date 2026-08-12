import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.HINDSIGHT_API_KEY;
const bankId = process.env.HINDSIGHT_BANK_ID || 'SmartMind';
const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';

async function seedEntities() {
  console.log('Sending entity-annotated support memories to Hindsight Cloud Bank:', bankId);

  const memories = [
    {
      content: `ENTITY: Customer "Sarah Connor"
ENTITY: Organization "Cyberdyne Systems Tech"
ENTITY: Component "Supabase PgBouncer Pooler"
ENTITY: Platform "AWS Lambda Node.js 20.x Runtime"
Fact: Sarah Connor reported database connection pool exhaustion on AWS Lambda.
Fact: Cyberdyne Systems Tech support team resolved the issue by configuring PgBouncer to transaction mode and increasing max_connections to 50.
Outcome: SUCCESSFUL.
Ticket ID: ticket_sarah_connor_001`,
      context: 'customer_support_entity_memory',
      document_id: `doc_entity_sarah_${Date.now()}`,
      metadata: {
        customer_name: 'Sarah Connor',
        company: 'Cyberdyne Systems Tech',
        entity_customer: 'Sarah Connor',
        entity_org: 'Cyberdyne Systems Tech',
        entity_tech: 'Supabase PgBouncer',
        category: 'database',
      }
    },
    {
      content: `ENTITY: Customer "John Matrix"
ENTITY: Organization "Val Verde Tech"
ENTITY: Component "Redis Cache Subsystem"
ENTITY: Platform "Kubernetes Cluster v1.28"
Fact: John Matrix reported Redis cache eviction latency spikes under heavy load.
Fact: Val Verde Tech support team resolved the issue by increasing maxmemory-policy to volatile-lru and allocating 4GB RAM.
Outcome: SUCCESSFUL.
Ticket ID: ticket_john_matrix_002`,
      context: 'customer_support_entity_memory',
      document_id: `doc_entity_john_${Date.now()}`,
      metadata: {
        customer_name: 'John Matrix',
        company: 'Val Verde Tech',
        entity_customer: 'John Matrix',
        entity_org: 'Val Verde Tech',
        entity_tech: 'Redis Cache Subsystem',
        category: 'infrastructure',
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
    console.log('Hindsight Entity Retain Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

seedEntities();
