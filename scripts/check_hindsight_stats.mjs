import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.HINDSIGHT_API_KEY;
const bankId = process.env.HINDSIGHT_BANK_ID || 'SmartMind';
const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';

async function checkStats() {
  const url = `${baseUrl}/v1/default/banks/${bankId}/stats`;
  console.log('Fetching Hindsight stats for bank:', bankId);
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    },
  });
  const data = await res.json();
  console.log('Hindsight Bank Stats:', JSON.stringify(data, null, 2));
}

checkStats();
