-- Deloitte Menti: Database Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)

-- Sessions table
CREATE TABLE IF NOT EXISTS menti_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Participants table
CREATE TABLE IF NOT EXISTS menti_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES menti_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allocations table (point distributions)
CREATE TABLE IF NOT EXISTS menti_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES menti_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES menti_participants(id) ON DELETE CASCADE,
  pain_point_id INTEGER NOT NULL CHECK (pain_point_id BETWEEN 1 AND 9),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (participant_id, pain_point_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participants_session ON menti_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_allocations_session ON menti_allocations(session_id);
CREATE INDEX IF NOT EXISTS idx_allocations_participant ON menti_allocations(participant_id);

-- Enable Row Level Security (permissive for anon access)
ALTER TABLE menti_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menti_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menti_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: allow all operations for anon role
CREATE POLICY "Allow all on menti_sessions" ON menti_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on menti_participants" ON menti_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on menti_allocations" ON menti_allocations FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for allocations table
ALTER PUBLICATION supabase_realtime ADD TABLE menti_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE menti_participants;
