Migration steps to create missing Supabase tables

Problem:
- The runtime shows the error: "Could not find the table 'public.messages' in the schema cache" and also 'agent_runs' is missing.

Options to create the tables:

1) Use the Supabase SQL Editor (recommended):
- Open your Supabase project dashboard.
- Open the "SQL" editor and paste the relevant sections from `supabase_migration.sql`.

Run the following statements (messages + agent_runs):

```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  query TEXT,
  recalled_memory_count INTEGER DEFAULT 0,
  unique_memory_count INTEGER DEFAULT 0,
  gemini_response JSONB,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

-- To add a Customer Mental Model column to persist generated models (optional but recommended)
-- Run this in the Supabase SQL editor if you want the server to persist mental models:

```sql
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS mental_model JSONB,
  ADD COLUMN IF NOT EXISTS mental_model_updated_at TIMESTAMPTZ;
```

2) Use `psql` if you have direct DB connection:
- Obtain the Postgres connection string from Supabase (Settings → Database → Connection string).
- Run:

```bash
psql "postgres://<user>:<pass>@<host>:5432/postgres" -f supabase_migration.sql
```

3) Use Supabase CLI to apply SQL migration files:
- Install CLI: `npm install -g supabase` or follow Supabase docs.
- Login: `supabase login`
- Link project and run migrations (see Supabase docs for workflow).

Notes:
- Creating tables requires the proper role/privileges; use the service role or DB admin.
- After migration, restart the local server and re-run `http://localhost:4000/api/diagnostics`.

If you want, I can try to create a script that attempts to run these migrations automatically, but it requires a direct DB connection string or elevated credentials in the environment (not just the service key)."