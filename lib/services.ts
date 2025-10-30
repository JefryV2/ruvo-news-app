import { supabase, IS_SUPABASE_CONFIGURED, User, Signal, UserSignal, Notification, Interest, Source } from './supabase';

// User Management
export const userService = {
  async getCurrentUser(): Promise<User | null> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
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
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
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
          saved: false
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
          saved: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async dismissSignal(userId: string, signalId: string): Promise<UserSignal> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    // Simple schema doesn't have dismissed column, so we'll just delete the row or do nothing
    const { data: existing } = await supabase
      .from('user_signals')
      .select('*')
      .eq('user_id', userId)
      .eq('signal_id', signalId)
      .single();

    if (existing) {
      // In simple schema, dismissing = deleting the interaction
      const { error } = await supabase
        .from('user_signals')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return existing;
    } else {
      // No existing interaction, nothing to dismiss
      return {
        id: '',
        user_id: userId,
        signal_id: signalId,
        liked: false,
        saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserSignal;
    }
  },

  async getUserSignalInteractions(userId: string): Promise<Record<string, UserSignal>> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return {};
    const { data, error } = await supabase
      .from('user_signals')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Convert to a map keyed by signal_id for easy lookup
    const interactions: Record<string, UserSignal> = {};
    (data || []).forEach(interaction => {
      interactions[interaction.signal_id] = interaction;
    });
    
    return interactions;
  },

  async getLikedSignals(userId: string): Promise<string[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return [];
    const { data, error } = await supabase
      .from('user_signals')
      .select('signal_id')
      .eq('user_id', userId)
      .eq('liked', true);
    
    if (error) throw error;
    return (data || []).map(item => item.signal_id);
  },

  async getSavedSignals(userId: string): Promise<string[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) return [];
    const { data, error } = await supabase
      .from('user_signals')
      .select('signal_id')
      .eq('user_id', userId)
      .eq('saved', true);
    
    if (error) throw error;
    return (data || []).map(item => item.signal_id);
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

// Account Settings Management
export const accountSettingsService = {
  async getAccountSettings(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Return default settings if backend not configured
      return {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        language: 'en',
        isActive: true
      };
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('is_premium, language, created_at')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    // Return settings with defaults
    return {
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      language: data?.language || 'en',
      isActive: true,
      isPremium: data?.is_premium || false,
      joinedDate: data?.created_at
    };
  },

  async updateAccountSettings(userId: string, settings: any): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Mock update for development
      return { ...settings, updated: true };
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({
        language: settings.language,
        is_premium: settings.isPremium,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getProfileStats(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Return mock stats for development
      return {
        totalLikes: 0,
        totalSaved: 0,
        joinedDate: new Date().toISOString()
      };
    }
    
    // Get user's signal interactions (simple schema: only liked and saved)
    const { data: userSignals, error: signalsError } = await supabase
      .from('user_signals')
      .select('liked, saved')
      .eq('user_id', userId);
    
    if (signalsError) {
      console.error('Error fetching profile stats:', signalsError);
      return {
        totalLikes: 0,
        totalSaved: 0,
        joinedDate: new Date().toISOString()
      };
    }
    
    // Calculate stats from user_signals table
    const totalLikes = userSignals?.filter(s => s.liked).length || 0;
    const totalSaved = userSignals?.filter(s => s.saved).length || 0;
    
    console.log('📊 Profile Stats:', { totalLikes, totalSaved, userId });
    
    return {
      totalLikes,
      totalSaved,
      joinedDate: new Date().toISOString() // We don't have users table in simple schema
    };
  },

  async deleteAccount(userId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }
    
    // Delete user and all related data (cascade will handle user_signals and notifications)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  },

  async exportUserData(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Return mock data for development
      return {
        user: { id: userId, username: 'mock_user' },
        signals: [],
        settings: { language: 'en' },
        exportedAt: new Date().toISOString()
      };
    }
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Get user's signal interactions
    const { data: userSignals, error: signalsError } = await supabase
      .from('user_signals')
      .select(`
        *,
        signals(*)
      `)
      .eq('user_id', userId);
    
    if (signalsError) throw signalsError;
    
    // Get user's notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    
    if (notificationsError) throw notificationsError;
    
    return {
      user,
      signals: userSignals || [],
      notifications: notifications || [],
      exportedAt: new Date().toISOString()
    };
  }
};
