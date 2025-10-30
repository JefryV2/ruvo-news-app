-- Fix for user_signals table schema
-- Run this if you're getting UUID errors

-- Drop the existing table (WARNING: This will delete all existing likes/saves!)
DROP TABLE IF EXISTS user_signals CASCADE;

-- Recreate with correct schema
CREATE TABLE user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,          -- UUID for user (from Supabase auth)
  signal_id TEXT NOT NULL,         -- TEXT for signal (from News API)
  liked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, signal_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_liked ON user_signals(user_id, liked) WHERE liked = true;
CREATE INDEX IF NOT EXISTS idx_user_signals_saved ON user_signals(user_id, saved) WHERE saved = true;

-- Enable RLS
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can insert own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can update own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can delete own signal interactions" ON user_signals;

-- Create policies
CREATE POLICY "Users can view own signal interactions" ON user_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signal interactions" ON user_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signal interactions" ON user_signals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signal interactions" ON user_signals
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_signals_updated_at ON user_signals;
CREATE TRIGGER update_user_signals_updated_at
    BEFORE UPDATE ON user_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the schema
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_signals'
ORDER BY ordinal_position;
