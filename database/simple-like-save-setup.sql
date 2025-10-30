-- ============================================
-- SIMPLE LIKE & SAVE SYSTEM - MINIMAL VERSION
-- ============================================
-- Just the essentials - no fancy stuff!

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. CREATE SIMPLE USER_SIGNALS TABLE
-- ============================================
-- This is the ONLY table you need for like/save to work!

CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  signal_id TEXT NOT NULL,
  liked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, signal_id)
);

-- ============================================
-- 3. CREATE INDEXES FOR SPEED
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_liked ON user_signals(user_id, liked) WHERE liked = true;
CREATE INDEX IF NOT EXISTS idx_user_signals_saved ON user_signals(user_id, saved) WHERE saved = true;

-- ============================================
-- 4. ENABLE SECURITY
-- ============================================

ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can insert own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can update own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can delete own signal interactions" ON user_signals;

-- Users can only see/modify their own likes and saves
CREATE POLICY "Users can view own signal interactions" ON user_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signal interactions" ON user_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signal interactions" ON user_signals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signal interactions" ON user_signals
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. AUTO-UPDATE TRIGGER
-- ============================================

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

-- ============================================
-- DONE! ✅
-- ============================================
-- 
-- Test it:
-- SELECT * FROM user_signals;
--
-- You should see an empty table (0 rows).
-- When you like an article in the app, you'll see rows appear!
--
-- ============================================
