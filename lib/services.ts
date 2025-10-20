import { supabase, IS_SUPABASE_CONFIGURED, User, Signal, UserSignal, Notification, Interest, Source } from './supabase';

// User Management
export const userService = {
  async getCurrentUser(): Promise<User | null> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateInterests(userId: string, interests: string[]): Promise<User> {
    return this.updateUser(userId, { interests });
  },

  async updateSources(userId: string, sources: string[]): Promise<User> {
    return this.updateUser(userId, { sources });
  }
};

// Signals Management
export const signalService = {
  async getSignalsForUser(userId: string, limit = 20): Promise<Signal[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('signals')
      .select(`
        *,
        user_signals!left(liked, saved, dismissed, read)
      `)
      .eq('user_signals.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getSignalById(id: string): Promise<Signal | null> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTrendingSignals(limit = 10): Promise<Signal[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async searchSignals(query: string, limit = 20): Promise<Signal[]> {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
};

// User Signal Interactions
export const userSignalService = {
  async toggleLike(userId: string, signalId: string): Promise<UserSignal> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data: existing } = await supabase
      .from('user_signals')
      .select('*')
      .eq('user_id', userId)
      .eq('signal_id', signalId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('user_signals')
        .update({ liked: !existing.liked })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('user_signals')
        .insert({
          user_id: userId,
          signal_id: signalId,
          liked: true,
          saved: false,
          dismissed: false,
          read: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async toggleSave(userId: string, signalId: string): Promise<UserSignal> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data: existing } = await supabase
      .from('user_signals')
      .select('*')
      .eq('user_id', userId)
      .eq('signal_id', signalId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('user_signals')
        .update({ saved: !existing.saved })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('user_signals')
        .insert({
          user_id: userId,
          signal_id: signalId,
          liked: false,
          saved: true,
          dismissed: false,
          read: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async dismissSignal(userId: string, signalId: string): Promise<UserSignal> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data: existing } = await supabase
      .from('user_signals')
      .select('*')
      .eq('user_id', userId)
      .eq('signal_id', signalId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('user_signals')
        .update({ dismissed: true })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('user_signals')
        .insert({
          user_id: userId,
          signal_id: signalId,
          liked: false,
          saved: false,
          dismissed: true,
          read: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};

// Notifications Management
export const notificationService = {
  async getNotificationsForUser(userId: string, limit = 50): Promise<Notification[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return 0;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    return count || 0;
  }
};

// Interests and Sources
export const metadataService = {
  async getInterests(): Promise<Interest[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return [];
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getSources(): Promise<Source[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return [];
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};
