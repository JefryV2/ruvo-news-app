import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import { Signal } from '../types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function normaliseUrl(url?: string) {
  if (!url) return undefined;
  try {
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    const withoutQuery = trimmed.split('?')[0];
    return withoutQuery?.endsWith('/') ? withoutQuery.slice(0, -1) : withoutQuery;
  } catch {
    return undefined;
  }
}

async function ensureSupabaseSignalId(signal: Signal): Promise<string> {
  if (!signal) {
    throw new Error('Unable to share this article. Missing signal data.');
  }

  if (!IS_SUPABASE_CONFIGURED || !supabase) {
    throw new Error('Supabase is not configured. Please add your credentials to .env');
  }

  const existingId = signal.id;
  if (typeof existingId === 'string' && UUID_REGEX.test(existingId)) {
    try {
      const { data: existingRecord, error: existingError } = await supabase
        .from('signals')
        .select('id')
        .eq('id', existingId)
        .maybeSingle();

      if (!existingError && existingRecord?.id) {
        return existingId;
      }

      console.warn('Signal id looked like UUID but not found in Supabase. Creating new record.', {
        id: existingId,
        existingError,
      });
    } catch (error) {
      console.warn('Failed to verify existing signal id. Falling back to upsert.', error);
    }
  }

  const normalizedUrl = normaliseUrl(signal.url);

  try {
    // Try matching by URL first
    if (normalizedUrl) {
      const { data: byUrl, error: urlError } = await supabase
        .from('signals')
        .select('id')
        .eq('source_url', normalizedUrl)
        .maybeSingle();

      if (!urlError && byUrl?.id) {
        return byUrl.id;
      }
    }

    // Fallback: try fuzzy match on title
    if (signal.title) {
      const { data: byTitle, error: titleError } = await supabase
        .from('signals')
        .select('id')
        .ilike('title', signal.title.trim())
        .maybeSingle();

      if (!titleError && byTitle?.id) {
        return byTitle.id;
      }
    }

    // Create a lightweight record in Supabase so it can be referenced
    const insertPayload = {
      title: signal.title || 'Shared article',
      summary: signal.summary || 'Shared article from external feed',
      content: signal.content || null,
      source_name: signal.sourceName || 'Unknown source',
      source_url: normalizedUrl || signal.url || 'https://ruvo.app/shared-article',
      image_url: signal.imageUrl || null,
      tags: signal.tags && signal.tags.length > 0 ? signal.tags : ['community'],
      verified: Boolean(signal.verified),
      priority: 'medium' as const,
      category: signal.tags && signal.tags.length > 0 ? signal.tags[0] : 'community',
      created_at: signal.timestamp ? new Date(signal.timestamp).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted, error: insertError } = await supabase
      .from('signals')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError || !inserted?.id) {
      console.error('Failed to upsert signal for sharing:', insertError);
      throw new Error('Unable to share this article at the moment. Please try again later.');
    }

    return inserted.id;
  } catch (error) {
    console.error('Error ensuring Supabase signal record for sharing:', error);
    throw new Error('Unable to share this article at the moment. Please try again later.');
  }
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface SharedArticle {
  id: string;
  user_id: string;
  signal_id: string;
  friend_id: string | null;
  message: string;
  created_at: string;
}

export const communityService = {
  // Friend management
  async sendFriendRequest(userId: string, friendId: string): Promise<Friend> {
    console.log('Sending friend request from', userId, 'to', friendId);
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    // Prevent users from sending friend requests to themselves
    if (userId === friendId) {
      throw new Error('You cannot send a friend request to yourself');
    }
    
    // First check if a friend request already exists between these users
    const { data: existingRequest, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();
    
    console.log('Existing friend request check:', { existingRequest, checkError });
    
    if (existingRequest) {
      // If there's already a request, return it
      console.log('Friend request already exists:', existingRequest);
      if (existingRequest.status === 'accepted') {
        throw new Error('You are already friends with this user');
      } else if (existingRequest.user_id === userId) {
        throw new Error('Friend request already sent');
      } else {
        throw new Error('This user has already sent you a friend request. Check your friend requests');
      }
    }
    
    // If no existing request, create a new one
    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single();
    
    console.log('Friend request result:', { data, error });
    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(userId: string, friendId: string): Promise<Friend> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .match({ user_id: friendId, friend_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async rejectFriendRequest(userId: string, friendId: string): Promise<Friend> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .match({ user_id: friendId, friend_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getFriends(userId: string): Promise<Friend[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.log('Supabase not configured, returning empty friends array');
      return [];
    }
    
    console.log('Fetching friends for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          user_user:users!friends_user_id_fkey (username, email),
          friend_user:users!friends_friend_id_fkey (username, email)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');
      
      console.log('Friends query result:', { data, error });
      
      if (error) {
        console.error('Error fetching friends:', error);
        return [];
      }
      
      console.log('Friends found:', data || []);
      return data || [];
    } catch (error) {
      console.error('Exception in getFriends:', error);
      return [];
    }
  },

  async getFriendRequests(userId: string): Promise<Friend[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        users!friends_user_id_fkey (username, email)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
    
    return data || [];
  },

  async getOutgoingFriendRequests(userId: string): Promise<Friend[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching outgoing friend requests:', error);
      return [];
    }
    
    return data || [];
  },

  // Debug function to list all friendships
  async listAllFriendships(): Promise<Friend[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('friends')
      .select('*');
    
    if (error) {
      console.error('Error listing all friendships:', error);
      return [];
    }
    
    console.log('All friendships in database:', data);
    return data || [];
  },

  // Check if users are already connected
  async checkFriendshipStatus(userId: string, friendId: string): Promise<Friend | null> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking friendship status:', error);
      return null;
    }
    
    return data || null;
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    const { error } = await supabase
      .from('friends')
      .delete()
      .match({ user_id: userId, friend_id: friendId });
    
    if (error) throw error;
  },

  async cancelFriendRequest(userId: string, friendId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    const { error } = await supabase
      .from('friends')
      .delete()
      .match({ user_id: userId, friend_id: friendId, status: 'pending' });
    
    if (error) throw error;
  },

  async acceptFriendRequestById(requestId: string): Promise<Friend> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Article sharing
  async shareArticleWithFriend(
    userId: string, 
    signal: Signal, 
    friendId: string, 
    message: string = ''
  ): Promise<SharedArticle> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.log('Supabase not configured, cannot share article with friend');
      throw new Error('Backend not configured');
    }
    
    console.log('=== Sharing article with specific friend ===');
    console.log('User ID:', userId);
    console.log('Signal ID:', signal.id);
    console.log('Friend ID:', friendId);
    console.log('Message:', message);
    
    try {
      // Validate inputs
      if (!userId || !signal || !friendId) {
        console.error('Missing required parameters for sharing article with friend');
        throw new Error('Missing required parameters for sharing article with friend');
      }
      
      const supabaseSignalId = await ensureSupabaseSignalId(signal);

      const { data, error } = await supabase
        .from('shared_articles')
        .insert({
          user_id: userId,
          signal_id: supabaseSignalId,
          friend_id: friendId,
          message
        })
        .select()
        .single();
      
      console.log('Insert result:', { data, error });
      
      if (error) {
        console.error('Error sharing article with friend:', error);
        throw error;
      }
      
      console.log('Article shared successfully with friend:', data);
      console.log('=== Sharing with Friend Complete ===');
      return data;
    } catch (error) {
      console.error('Exception in shareArticleWithFriend:', error);
      throw error;
    }
  },

  async shareArticleWithAllFriends(
    userId: string, 
    signal: Signal, 
    message: string = ''
  ): Promise<SharedArticle[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.log('Supabase not configured, cannot share article');
      throw new Error('Backend not configured');
    }
    
    console.log('=== Sharing article with all friends and community ===');
    console.log('User ID:', userId);
    console.log('Signal ID:', signal.id);
    console.log('Message:', message);
    
    try {
      // Get all friends
      const friends = await this.getFriends(userId);
      console.log('Friends found:', friends);
      console.log('Number of friends:', friends.length);
      
      const friendIds = friends.map(friend => 
        friend.user_id === userId ? friend.friend_id : friend.user_id
      );
      
      console.log('Friend IDs:', friendIds);
      
      const supabaseSignalId = await ensureSupabaseSignalId(signal);

      // Share to community feed (using null friend_id)
      const shares: {
        user_id: string;
        signal_id: string;
        friend_id: string | null;
        message: string;
      }[] = [
        {
        user_id: userId,
          signal_id: supabaseSignalId,
          friend_id: null,
        message
        }
      ];
      
      const friendShares = friendIds.map(friendId => ({
        user_id: userId,
        signal_id: supabaseSignalId,
        friend_id: friendId,
        message
      }));
      
      shares.push(...friendShares);
      
      console.log('Shares to insert:', shares);
      console.log('Number of shares:', shares.length);
      console.log('Final shares to insert:', shares);
      
      const { data, error } = await supabase
        .from('shared_articles')
        .insert(shares)
        .select();
      
      console.log('Insert result:', { data, error });
      
      if (error) {
        console.error('Error sharing article:', error);
        throw error;
      }
      
      console.log('Article shared successfully:', data);
      console.log('=== Sharing Complete ===');
      return data || [];
    } catch (error) {
      console.error('Exception in shareArticleWithAllFriends:', error);
      throw error;
    }
  },

  async shareArticleToCommunity(
    userId: string,
    signal: Signal,
    message: string = ''
  ): Promise<SharedArticle> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.log('Supabase not configured, cannot share article to community');
      throw new Error('Backend not configured');
    }

    console.log('=== Sharing article to community feed ===');
    console.log('User ID:', userId);
    console.log('Signal ID:', signal.id);
    console.log('Message:', message);

    try {
      const supabaseSignalId = await ensureSupabaseSignalId(signal);

      const { data, error } = await supabase
        .from('shared_articles')
        .insert({
          user_id: userId,
          signal_id: supabaseSignalId,
          friend_id: null,
          message
        })
        .select()
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Error sharing article to community:', error);
        throw error;
      }

      console.log('Article shared to community successfully:', data);
      console.log('=== Community Share Complete ===');
      return data;
    } catch (error) {
      console.error('Exception in shareArticleToCommunity:', error);
      throw error;
    }
  },

  async getSharedArticlesForUser(userId: string, limit: number = 20): Promise<(SharedArticle & { signal: any | null })[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.log('Supabase not configured, returning empty array');
      return [];
    }
    
    console.log('Fetching shared articles for user:', userId);
    
    try {
      // First, let's check if we can access the table at all
      console.log('Testing basic access to shared_articles table...');
      const { data: testData, error: testError } = await supabase
        .from('shared_articles')
        .select('*')
        .limit(1);
      
      console.log('Test access result:', { testData, testError });
      
      // Get shared articles where the user is the recipient OR articles shared to community feed (friend_id is null)
      const { data: sharedArticles, error } = await supabase
        .from('shared_articles')
        .select(`
          *,
          users!shared_articles_user_id_fkey (username, email),
          signals:signals (*)
        `)
        .or(`friend_id.eq.${userId},friend_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      console.log('Shared articles query result:', { sharedArticles, error });
      
      if (error) {
        console.error('Error fetching shared articles:', error);
        return [];
      }
      
      // Process the shared articles to include user information
      const result = (sharedArticles || []).map(item => ({
        ...item,
        signal: item.signals || null
      }));
      
      console.log('Processed shared articles:', result);
      return result;
    } catch (error) {
      console.error('Exception in getSharedArticlesForUser:', error);
      return [];
    }
  },

  // Get user information by ID
  async getUserById(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  },

  // Get multiple users by IDs
  async getUsersByIds(userIds: string[]): Promise<any[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase || userIds.length === 0) {
      console.log('Supabase not configured or no user IDs provided, returning empty array');
      return [];
    }
    
    console.log('Fetching users by IDs:', userIds);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email')
        .in('id', userIds);
      
      console.log('Users query result:', { data, error });
      
      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }
      
      console.log('Users found:', data || []);
      return data || [];
    } catch (error) {
      console.error('Exception in getUsersByIds:', error);
      return [];
    }
  },

  async getSharedArticlesByUser(userId: string, limit: number = 20): Promise<(SharedArticle & { signal: Signal | null })[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return [];
    }
    
    // Get shared articles where the user is the sender
    const { data: sharedArticles, error } = await supabase
      .from('shared_articles')
      .select(`
        *,
        signals (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching shared articles:', error);
      return [];
    }
    
    return sharedArticles?.map(item => ({
      ...item,
      signal: item.signals || null
    })) || [];
  },

  async unshareArticle(userId: string, sharedArticleId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    const { error } = await supabase
      .from('shared_articles')
      .delete()
      .match({ id: sharedArticleId, user_id: userId });
    
    if (error) throw error;
  }
};