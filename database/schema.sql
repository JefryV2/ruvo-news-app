-- Supabase Database Schema for Ruvo App

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  interests TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interests table
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sources table
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signals table (news/articles)
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Signal interactions
CREATE TABLE user_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, signal_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('signal', 'system', 'promotion')) DEFAULT 'signal',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_priority ON signals(priority);
CREATE INDEX idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow all users to view all other users (for search functionality)
CREATE POLICY "Users can search for other users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User signals policies
CREATE POLICY "Users can view own signal interactions" ON user_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own signal interactions" ON user_signals
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for signals, interests, and sources
CREATE POLICY "Anyone can view signals" ON signals FOR SELECT USING (true);
CREATE POLICY "Anyone can view interests" ON interests FOR SELECT USING (true);
CREATE POLICY "Anyone can view sources" ON sources FOR SELECT USING (true);

-- Insert sample data
INSERT INTO interests (name, category) VALUES
  ('Technology', 'Tech'),
  ('AI & Machine Learning', 'Tech'),
  ('Cryptocurrency', 'Finance'),
  ('Stock Market', 'Finance'),
  ('Climate Change', 'Environment'),
  ('Space Exploration', 'Science'),
  ('Health & Medicine', 'Health'),
  ('Politics', 'News'),
  ('Sports', 'Entertainment'),
  ('Entertainment', 'Entertainment');

INSERT INTO sources (name, url, category, verified) VALUES
  ('TechCrunch', 'https://techcrunch.com', 'Technology', true),
  ('The Verge', 'https://theverge.com', 'Technology', true),
  ('Ars Technica', 'https://arstechnica.com', 'Technology', true),
  ('Reuters', 'https://reuters.com', 'News', true),
  ('BBC News', 'https://bbc.com/news', 'News', true),
  ('The Guardian', 'https://theguardian.com', 'News', true),
  ('Bloomberg', 'https://bloomberg.com', 'Finance', true),
  ('Financial Times', 'https://ft.com', 'Finance', true),
  ('Nature', 'https://nature.com', 'Science', true),
  ('Scientific American', 'https://scientificamerican.com', 'Science', true);

-- Insert sample signals
INSERT INTO signals (title, summary, content, source_name, source_url, image_url, tags, verified, priority, category) VALUES
  ('AI Breakthrough in Quantum Computing', 'Scientists achieve quantum supremacy with new AI algorithm', 'Full article content here...', 'TechCrunch', 'https://techcrunch.com/ai-quantum', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb', ARRAY['AI', 'Quantum', 'Breakthrough'], true, 'high', 'Technology'),
  ('Climate Summit Reaches Historic Agreement', 'World leaders commit to net-zero emissions by 2050', 'Full article content here...', 'Reuters', 'https://reuters.com/climate-summit', 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce', ARRAY['Climate', 'Politics', 'Environment'], true, 'urgent', 'Environment'),
  ('New Cancer Treatment Shows 90% Success Rate', 'Revolutionary immunotherapy approach shows promising results', 'Full article content here...', 'Nature', 'https://nature.com/cancer-treatment', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56', ARRAY['Health', 'Medicine', 'Cancer'], true, 'high', 'Health'),
  ('Bitcoin Reaches New All-Time High', 'Cryptocurrency market surges as institutional adoption grows', 'Full article content here...', 'Bloomberg', 'https://bloomberg.com/bitcoin-high', 'https://images.unsplash.com/photo-1621761191319-c6fb62004040', ARRAY['Bitcoin', 'Crypto', 'Finance'], true, 'medium', 'Finance'),
  ('Mars Rover Discovers Signs of Ancient Life', 'Perseverance finds evidence of microbial fossils', 'Full article content here...', 'Scientific American', 'https://scientificamerican.com/mars-life', 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9', ARRAY['Mars', 'Space', 'Life'], true, 'high', 'Science');
