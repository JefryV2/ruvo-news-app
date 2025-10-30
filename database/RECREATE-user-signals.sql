-- ============================================
-- RECREATE user_signals Table - FIXED VERSION
-- ============================================
-- This will DELETE all existing likes/saves and start fresh!
-- Run this ONLY if you're getting UUID errors

-- ============================================
-- 1. DROP EXISTING TABLE
-- ============================================
DROP TABLE IF EXISTS user_signals CASCADE;

-- ============================================
-- 2. CREATE TABLE WITH CORRECT SCHEMA
-- ============================================
CREATE TABLE user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,           -- UUID from Supabase auth.uid()
  signal_id TEXT NOT NULL,          -- TEXT from News API (e.g., "news-12345")
  liked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_signal UNIQUE(user_id, signal_id)
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
CREATE INDEX idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX idx_user_signals_liked ON user_signals(user_id, liked) WHERE liked = true;
CREATE INDEX idx_user_signals_saved ON user_signals(user_id, saved) WHERE saved = true;

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view own signal interactions" ON user_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signal interactions" ON user_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signal interactions" ON user_signals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signal interactions" ON user_signals
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE TRIGGER FOR AUTO-UPDATE
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_signals_updated_at
    BEFORE UPDATE ON user_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VERIFY THE SCHEMA
-- ============================================
-- Check that columns are correct types
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_signals'
ORDER BY ordinal_position;

-- Expected output:
-- column_name | data_type                | is_nullable | column_default
-- ------------|--------------------------|-------------|------------------
-- id          | uuid                     | NO          | gen_random_uuid()
-- user_id     | uuid                     | NO          | NULL
-- signal_id   | text                     | NO          | NULL  ← MUST BE TEXT!
-- liked       | boolean                  | YES         | false
-- saved       | boolean                  | YES         | false
-- created_at  | timestamp with time zone | YES         | now()
-- updated_at  | timestamp with time zone | YES         | now()

-- ============================================
-- DONE! ✅
-- ============================================
-- The table is now ready with the correct schema.
-- Try liking an article again - it should work!
