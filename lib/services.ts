import { supabase, IS_SUPABASE_CONFIGURED, User, Signal, UserSignal, Interest, Source } from './supabase';
import { Notification as TypesNotification } from '../types';

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
  },

  async listAllUsers(limit = 100): Promise<User[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    
    console.log('Listing all users');
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
      .limit(limit);
    
    console.log('All users list - data:', data, 'error:', error);
    
    if (error) throw error;
    return data || [];
  },

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    // Special check for Ruairi Morgan
    if (query.trim().toLowerCase() === 'ruairi morgan') {
      console.log('Special search for Ruairi Morgan');
      try {
        if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
        const { data: ruairiData, error: ruairiError } = await supabase
          .from('users')
          .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
          .eq('username', 'Ruairi Morgan');
        
        console.log('Direct Ruairi Morgan search - data:', ruairiData, 'error:', ruairiError);
        
        if (ruairiData && ruairiData.length > 0) {
          return ruairiData;
        }
      } catch (error) {
        console.error('Error in direct Ruairi Morgan search:', error);
      }
    }
    
    console.log('Supabase configured:', IS_SUPABASE_CONFIGURED);
    console.log('Supabase client:', supabase);
    if (!IS_SUPABASE_CONFIGURED || !supabase) throw new Error('Backend not configured');
    
    console.log('Executing user search with query:', query);
    
    // Special debug for Ruairi Morgan
    if (query.includes('Ruairi') || query.includes('Morgan')) {
      console.log('Searching for Ruairi Morgan specifically');
      
      // Check if Ruairi Morgan exists in the database
      const { data: ruairiData, error: ruairiError } = await supabase
        .from('users')
        .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
        .eq('username', 'Ruairi Morgan');
      
      console.log('Ruairi Morgan exact match - data:', ruairiData, 'error:', ruairiError);
      
      // Also try partial match
      const { data: ruairiPartialData, error: ruairiPartialError } = await supabase
        .from('users')
        .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
        .ilike('username', '%Ruairi%Morgan%');
      
      console.log('Ruairi Morgan partial match - data:', ruairiPartialData, 'error:', ruairiPartialError);
    }
    
    // First check if we can retrieve any users at all (to test RLS)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
      .limit(5);
    
    console.log('All users query - data:', allUsers, 'error:', allUsersError);
    
    // Then try the search query
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);
    
    // If that fails, try a simpler approach
    if (error || !data || data.length === 0) {
      console.log('Primary search failed, trying alternative approach');
      const { data: usernameData, error: usernameError } = await supabase
        .from('users')
        .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
        .ilike('username', `%${query}%`)
        .limit(limit);
      
      console.log('Username search - data:', usernameData, 'error:', usernameError);
      
      if (usernameData && usernameData.length > 0) {
        return usernameData;
      }
      
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('id, username, email, interests, sources, is_premium, language, created_at, updated_at')
        .ilike('email', `%${query}%`)
        .limit(limit);
      
      console.log('Email search - data:', emailData, 'error:', emailError);
      
      if (emailData && emailData.length > 0) {
        return emailData;
      }
    }
    
    console.log('Search response - data:', data, 'error:', error);
    
    if (error) {
      console.log('Primary search failed with error:', error);
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }
    return data || [];
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
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for toggleLike');
      // Return a mock response to prevent app crash
      return {
        id: `mock_${userId}_${signalId}_${Date.now()}`,
        user_id: userId,
        signal_id: signalId,
        liked: true,
        saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserSignal;
    }
    
    try {
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
        
        if (error) {
          console.error('Error updating like:', error);
          throw error;
        }
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
        
        if (error) {
          console.error('Error inserting like:', error);
          throw error;
        }
        return data;
      }
    } catch (error) {
      console.error('Error in toggleLike:', error);
      // Return a mock response to prevent app crash
      return {
        id: `mock_${userId}_${signalId}_${Date.now()}`,
        user_id: userId,
        signal_id: signalId,
        liked: true,
        saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserSignal;
    }
  },

  async toggleSave(userId: string, signalId: string): Promise<UserSignal> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for toggleSave');
      // Return a mock response to prevent app crash
      return {
        id: `mock_${userId}_${signalId}_${Date.now()}`,
        user_id: userId,
        signal_id: signalId,
        liked: false,
        saved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserSignal;
    }
    
    try {
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
        
        if (error) {
          console.error('Error updating save:', error);
          throw error;
        }
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
        
        if (error) {
          console.error('Error inserting save:', error);
          throw error;
        }
        return data;
      }
    } catch (error) {
      console.error('Error in toggleSave:', error);
      // Return a mock response to prevent app crash
      return {
        id: `mock_${userId}_${signalId}_${Date.now()}`,
        user_id: userId,
        signal_id: signalId,
        liked: false,
        saved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserSignal;
    }
  },

  async dismissSignal(userId: string, signalId: string): Promise<UserSignal> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for dismissSignal');
      // Return a mock response to prevent app crash
      return {
        id: `mock_${userId}_${signalId}_${Date.now()}`,
        user_id: userId,
        signal_id: signalId,
        liked: false,
        saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserSignal;
    }
    
    try {
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
        
        if (error) {
          console.error('Error deleting signal interaction:', error);
          throw error;
        }
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
    } catch (error) {
      console.error('Error in dismissSignal:', error);
      // Return a mock response to prevent app crash
      return {
        id: `mock_${userId}_${signalId}_${Date.now()}`,
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
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for getUserSignalInteractions');
      return {};
    }
    
    try {
      const { data, error } = await supabase
        .from('user_signals')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user signal interactions:', error);
        throw error;
      }
      
      // Convert to a map keyed by signal_id for easy lookup
      const interactions: Record<string, UserSignal> = {};
      (data || []).forEach(interaction => {
        interactions[interaction.signal_id] = interaction;
      });
      
      return interactions;
    } catch (error) {
      console.error('Error in getUserSignalInteractions:', error);
      // Return empty object instead of throwing to prevent app crash
      return {};
    }
  },

  async getLikedSignals(userId: string): Promise<string[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for getLikedSignals');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('user_signals')
        .select('signal_id')
        .eq('user_id', userId)
        .eq('liked', true);
      
      if (error) {
        console.error('Error fetching liked signals:', error);
        throw error;
      }
      return (data || []).map(item => item.signal_id);
    } catch (error) {
      console.error('Error in getLikedSignals:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  async getSavedSignals(userId: string): Promise<string[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for getSavedSignals');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('user_signals')
        .select('signal_id')
        .eq('user_id', userId)
        .eq('saved', true);
      
      if (error) {
        console.error('Error fetching saved signals:', error);
        throw error;
      }
      return (data || []).map(item => item.signal_id);
    } catch (error) {
      console.error('Error in getSavedSignals:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }
};

// Notifications Management
export const notificationService = {
  async getNotificationsForUser(userId: string, limit = 50): Promise<TypesNotification[]> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for getNotificationsForUser');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      // Convert Supabase Notification to Types Notification
      return (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: 'General', // Default category
        urgency: notification.priority as 'low' | 'medium' | 'high',
        timestamp: new Date(notification.created_at),
        read: notification.read,
        signalId: notification.signal_id,
      }));
    } catch (error) {
      console.error('Error in getNotificationsForUser:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<TypesNotification> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for markAsRead');
      // Return a mock response to prevent app crash
      return {
        id: notificationId,
        title: 'Mock Notification',
        message: 'Mock message',
        category: 'Mock',
        urgency: 'low',
        timestamp: new Date(),
        read: true,
      } as unknown as TypesNotification;
    }
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
      
      // Convert Supabase Notification to Types Notification
      return {
        id: data.id,
        title: data.title,
        message: data.message,
        category: 'General', // Default category
        urgency: data.priority as 'low' | 'medium' | 'high',
        timestamp: new Date(data.created_at),
        read: data.read,
        signalId: data.signal_id,
      };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      // Return a mock response to prevent app crash
      return {
        id: notificationId,
        title: 'Mock Notification',
        message: 'Mock message',
        category: 'Mock',
        urgency: 'low',
        timestamp: new Date(),
        read: true,
      } as unknown as TypesNotification;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for markAllAsRead');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      // Don't throw to prevent app crash
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for getUnreadCount');
      return 0;
    }
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        console.error('Error fetching unread count:', error);
        throw error;
      }
      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      // Return 0 instead of throwing to prevent app crash
      return 0;
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for deleteNotification');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
      
      console.log('Successfully deleted notification:', notificationId);
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      // Don't throw to prevent app crash
    }
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
      console.warn('Backend not configured for getAccountSettings, returning defaults');
      return {
        pushNotifications: true,
        emailNotifications: true,
        language: 'en',
        isActive: true
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, language, created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching account settings:', error);
        throw error;
      }
      
      // Return settings with defaults
      return {
        pushNotifications: true,
        emailNotifications: true,
        language: data?.language || 'en',
        isActive: true,
        isPremium: data?.is_premium || false,
        joinedDate: data?.created_at
      };
    } catch (error) {
      console.error('Error in getAccountSettings:', error);
      // Return default settings instead of throwing to prevent app crash
      return {
        pushNotifications: true,
        emailNotifications: true,
        language: 'en',
        isActive: true,
        isPremium: false,
        joinedDate: new Date().toISOString()
      };
    }
  },

  async updateAccountSettings(userId: string, settings: any): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Mock update for development
      console.warn('Backend not configured for updateAccountSettings, returning mock');
      return { ...settings, updated: true };
    }
    
    try {
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
      
      if (error) {
        console.error('Error updating account settings:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in updateAccountSettings:', error);
      // Return mock data instead of throwing to prevent app crash
      return { ...settings, updated: true };
    }
  },

  async getProfileStats(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Return mock stats for development
      console.warn('Backend not configured for getProfileStats, returning mock');
      return {
        totalLikes: 0,
        totalSaved: 0,
        joinedDate: new Date().toISOString()
      };
    }
    
    try {
      // Get user's signal interactions (simple schema: only liked and saved)
      const { data: userSignals, error: signalsError } = await supabase
        .from('user_signals')
        .select('liked, saved')
        .eq('user_id', userId);
      
      if (signalsError) {
        console.error('Error fetching profile stats:', signalsError);
        // Return mock data instead of throwing to prevent app crash
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
    } catch (error) {
      console.error('Error in getProfileStats:', error);
      // Return mock data instead of throwing to prevent app crash
      return {
        totalLikes: 0,
        totalSaved: 0,
        joinedDate: new Date().toISOString()
      };
    }
  },

  async deleteAccount(userId: string): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Backend not configured for deleteAccount');
      throw new Error('Backend not configured');
    }
    
    try {
      // Delete user and all related data (cascade will handle user_signals and notifications)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting account:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error; // Re-throw for critical operations like account deletion
    }
  },

  async exportUserData(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      // Return mock data for development
      console.warn('Backend not configured for exportUserData, returning mock');
      return {
        user: { id: userId, username: 'mock_user' },
        signals: [],
        settings: { language: 'en' },
        exportedAt: new Date().toISOString()
      };
    }
    
    try {
      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      // Get user's signal interactions
      const { data: userSignals, error: signalsError } = await supabase
        .from('user_signals')
        .select(`
          *,
          signals(*)
        `)
        .eq('user_id', userId);
      
      if (signalsError) {
        console.error('Error fetching user signals:', signalsError);
        throw signalsError;
      }
      
      // Get user's notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);
      
      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        throw notificationsError;
      }
      
      return {
        user,
        signals: userSignals || [],
        notifications: notifications || [],
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in exportUserData:', error);
      // Return mock data instead of throwing to prevent app crash
      return {
        user: { id: userId, username: 'mock_user' },
        signals: [],
        settings: { language: 'en' },
        exportedAt: new Date().toISOString()
      };
    }
  }
};
