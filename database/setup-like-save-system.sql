-- ============================================
-- RUVO DATABASE SETUP - Like & Save System
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- This will create all tables, indexes, and policies needed for the like/save feature

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  interests TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  profile_image TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signals table (news articles)
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT,
  relevance_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Signal interactions (THIS IS THE KEY TABLE FOR LIKE/SAVE)
CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_id TEXT NOT NULL,  -- Can reference signals table or be external ID
  liked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, signal_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  type TEXT CHECK (type IN ('signal', 'system', 'promotion')) DEFAULT 'signal',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Signals indexes
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_category ON signals(category);
CREATE INDEX IF NOT EXISTS idx_signals_priority ON signals(priority);

-- User signals indexes (CRITICAL FOR LIKE/SAVE PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_liked ON user_signals(user_id, liked) WHERE liked = true;
CREATE INDEX IF NOT EXISTS idx_user_signals_saved ON user_signals(user_id, saved) WHERE saved = true;
CREATE INDEX IF NOT EXISTS idx_user_signals_user_signal ON user_signals(user_id, signal_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE SECURITY POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can insert own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can update own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can delete own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can manage own signal interactions" ON user_signals;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view signals" ON signals;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User signals policies (CRITICAL FOR LIKE/SAVE SECURITY)
CREATE POLICY "Users can view own signal interactions" ON user_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signal interactions" ON user_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signal interactions" ON user_signals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signal interactions" ON user_signals
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for signals
CREATE POLICY "Anyone can view signals" ON signals 
  FOR SELECT USING (true);

-- ============================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get liked signal IDs for a user
CREATE OR REPLACE FUNCTION get_liked_signals(p_user_id UUID)
RETURNS TABLE(signal_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT us.signal_id
  FROM user_signals us
  WHERE us.user_id = p_user_id AND us.liked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get saved signal IDs for a user
CREATE OR REPLACE FUNCTION get_saved_signals(p_user_id UUID)
RETURNS TABLE(signal_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT us.signal_id
  FROM user_signals us
  WHERE us.user_id = p_user_id AND us.saved = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
  total_likes BIGINT,
  total_saved BIGINT,
  total_read BIGINT,
  joined_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE us.liked = true) as total_likes,
    COUNT(*) FILTER (WHERE us.saved = true) as total_saved,
    COUNT(*) FILTER (WHERE us.read = true) as total_read,
    u.created_at as joined_date
  FROM users u
  LEFT JOIN user_signals us ON u.id = us.user_id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Sample signals (news articles) for testing
INSERT INTO signals (id, title, summary, content, source_name, source_url, image_url, tags, verified, category, relevance_score, created_at) VALUES
  ('signal-1', 'Apple announces new Vision Pro features', 'Apple unveils groundbreaking AR capabilities in latest Vision Pro update', 'Full article about Vision Pro features...', 'TechCrunch', 'https://techcrunch.com/vision-pro', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab', ARRAY['Tech', 'Apple', 'AR'], true, 'Technology', 0.95, NOW() - INTERVAL '2 hours'),
  ('signal-2', 'AI startup raises $100M in Series B funding', 'Leading AI company secures major funding round', 'Details about the funding round...', 'VentureBeat', 'https://venturebeat.com/ai-funding', 'https://images.unsplash.com/photo-1677442136019-21780ecad995', ARRAY['AI', 'Startups', 'Funding'], true, 'Technology', 0.88, NOW() - INTERVAL '5 hours'),
  ('signal-3', 'Bitcoin surges past $50K', 'Cryptocurrency market sees massive rally', 'Bitcoin and crypto market analysis...', 'Bloomberg', 'https://bloomberg.com/bitcoin', 'https://images.unsplash.com/photo-1621761191319-c6fb62004040', ARRAY['Crypto', 'Bitcoin', 'Finance'], true, 'Finance', 0.92, NOW() - INTERVAL '1 day'),
  ('signal-4', 'BTS announces surprise comeback album', 'K-pop superstars reveal new music coming soon', 'Details about the new album...', 'Billboard', 'https://billboard.com/bts', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', ARRAY['Music', 'K-Pop', 'BTS'], true, 'Entertainment', 0.90, NOW() - INTERVAL '3 hours'),
  ('signal-5', 'Climate summit reaches historic agreement', 'World leaders commit to net-zero emissions', 'Full coverage of climate summit...', 'Reuters', 'https://reuters.com/climate', 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce', ARRAY['Climate', 'Politics'], true, 'News', 0.94, NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for signals table
DROP TRIGGER IF EXISTS update_signals_updated_at ON signals;
CREATE TRIGGER update_signals_updated_at
    BEFORE UPDATE ON signals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_signals table
DROP TRIGGER IF EXISTS update_user_signals_updated_at ON user_signals;
CREATE TRIGGER update_user_signals_updated_at
    BEFORE UPDATE ON user_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. VERIFICATION QUERIES (RUN AFTER SETUP)
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'signals', 'user_signals', 'notifications')
ORDER BY table_name;

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('user_signals', 'signals', 'notifications')
ORDER BY indexname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'signals', 'user_signals', 'notifications');

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- 
-- Your database is now ready for the like/save system!
--
-- Next steps:
-- 1. Go to your Supabase project
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
-- 
-- The system will create:
-- ✅ user_signals table (stores likes, saves, dismissals)
-- ✅ Indexes for fast queries
-- ✅ Row Level Security policies
-- ✅ Helper functions for common queries
-- ✅ Sample data for testing
--
-- Test it by:
-- 1. Liking an article in the app
-- 2. Check the user_signals table in Supabase
-- 3. You should see a new row with liked=true
-- ============================================
