import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

const envPath = './.env';
if (!fs.existsSync(envPath)) {
  console.error('.env not found');
  process.exit(1);
}

dotenv.config({ path: envPath });
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY missing');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });
const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.5-pro', 'gemini-3-flash-preview'];

async function run() {
  for (const model of models) {
    try {
      console.log('TRY', model);
      const res = await client.models.generateContent({
        model,
        contents: 'Say hi',
        config: {
          systemInstruction: 'You are a test.',
        },
      });
      console.log('OK', model, res.text?.slice(0, 100));
    } catch (err) {
      console.error('ERR', model, err?.message || err);
    }
  }
}

run().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});
