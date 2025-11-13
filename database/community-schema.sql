-- Community Features Schema for Ruvo App

-- Friends table
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Shared articles table
CREATE TABLE shared_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if shared with all friends
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_shared_articles_user_id ON shared_articles(user_id);
CREATE INDEX idx_shared_articles_signal_id ON shared_articles(signal_id);
CREATE INDEX idx_shared_articles_friend_id ON shared_articles(friend_id);
CREATE INDEX idx_shared_articles_created_at ON shared_articles(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_articles ENABLE ROW LEVEL SECURITY;

-- Friends policies
CREATE POLICY "Users can view own friendships" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to see all friendships for search purposes
CREATE POLICY "Users can view all friendships" ON friends
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own friendships" ON friends
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to insert friend requests
CREATE POLICY "Users can insert friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared articles policies
CREATE POLICY "Users can view articles shared with them or to community" ON shared_articles
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id OR friend_id IS NULL);

CREATE POLICY "Users can share their own articles" ON shared_articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared articles" ON shared_articles
  FOR DELETE USING (auth.uid() = user_id);