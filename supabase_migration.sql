-- SupportMind AI Supabase Database Migration
-- System of Record Schema Setup

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  environment JSONB DEFAULT '{}'::jsonb,
  frustration_level TEXT DEFAULT 'low',
  frustration_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if table already exists
ALTER TABLE customers ADD COLUMN IF NOT EXISTS environment JSONB DEFAULT '{}'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS frustration_level TEXT DEFAULT 'low';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS frustration_score INTEGER DEFAULT 0;

-- 2. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  frustration_level TEXT DEFAULT 'low',
  repeat_issue_detected BOOLEAN DEFAULT FALSE,
  environment_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  hindsight_memory_id TEXT,
  hindsight_retained BOOLEAN DEFAULT FALSE,
  hindsight_retained_at TIMESTAMPTZ
);

-- Safely add columns if tickets table exists
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS frustration_level TEXT DEFAULT 'low';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS repeat_issue_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS environment_snapshot JSONB DEFAULT '{}'::jsonb;

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ticket Outcomes Table
CREATE TABLE IF NOT EXISTS ticket_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agent Runs Table
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

-- 6. Memory Events Table
CREATE TABLE IF NOT EXISTS memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  operation TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  hindsight_bank TEXT NOT NULL,
  hindsight_memory_id TEXT,
  memory_fingerprint TEXT,
  status TEXT NOT NULL,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Known Issues Table
CREATE TABLE IF NOT EXISTS known_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  affected_environment TEXT,
  description TEXT NOT NULL,
  workaround TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'investigating',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_outcomes_ticket_id ON ticket_outcomes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_ticket_id ON agent_runs(ticket_id);

CREATE INDEX IF NOT EXISTS idx_memory_events_ticket_id ON memory_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_memory_events_hindsight_memory_id ON memory_events(hindsight_memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_events_fingerprint ON memory_events(memory_fingerprint);
CREATE INDEX IF NOT EXISTS idx_known_issues_category ON known_issues(category);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_issues ENABLE ROW LEVEL SECURITY;

-- Permissive policies for application access (Anon + Authenticated + Service Role)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service customers') THEN
    CREATE POLICY "Allow all for anon and service customers" ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service tickets') THEN
    CREATE POLICY "Allow all for anon and service tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service messages') THEN
    CREATE POLICY "Allow all for anon and service messages" ON messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service outcomes') THEN
    CREATE POLICY "Allow all for anon and service outcomes" ON ticket_outcomes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service agent_runs') THEN
    CREATE POLICY "Allow all for anon and service agent_runs" ON agent_runs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service memory_events') THEN
    CREATE POLICY "Allow all for anon and service memory_events" ON memory_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon and service known_issues') THEN
    CREATE POLICY "Allow all for anon and service known_issues" ON known_issues FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

