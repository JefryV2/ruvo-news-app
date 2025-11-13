-- Update the shared_articles RLS policy to allow viewing community shares
DROP POLICY IF EXISTS "Users can view articles shared with them" ON shared_articles;

CREATE POLICY "Users can view articles shared with them or to community" ON shared_articles
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id OR friend_id IS NULL);