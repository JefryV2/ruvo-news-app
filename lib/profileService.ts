import { supabase, IS_SUPABASE_CONFIGURED, User } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  language?: string;
  is_premium?: boolean;
}

export interface ProfileStats {
  totalLikes: number;
  totalSaved: number;
  totalRead: number;
  joinedDate: string;
  interestsCount: number;
  sourcesCount: number;
}

export interface AccountSettings {
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export const profileService = {
  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<User | null> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Update username
   */
  async updateUsername(userId: string, username: string): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      // Check if username is already taken
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .single();

      if (existing) {
        throw new Error('Username already taken');
      }

      return await this.updateProfile(userId, { username });
    } catch (error: any) {
      console.error('Update username error:', error);
      throw new Error(error.message || 'Failed to update username');
    }
  },

  /**
   * Update email
   */
  async updateEmail(userId: string, email: string): Promise<{ success: boolean }> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      // Update auth email (requires confirmation)
      const { error: authError } = await supabase.auth.updateUser({
        email: email,
      });

      if (authError) throw authError;

      // Update profile email
      await this.updateProfile(userId, { email });

      return { success: true };
    } catch (error: any) {
      console.error('Update email error:', error);
      throw new Error(error.message || 'Failed to update email');
    }
  },

  /**
   * Update user interests
   */
  async updateInterests(userId: string, interests: string[]): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Update interests error:', error);
      throw new Error(error.message || 'Failed to update interests');
    }
  },

  /**
   * Update user sources
   */
  async updateSources(userId: string, sources: string[]): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          sources,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Update sources error:', error);
      throw new Error(error.message || 'Failed to update sources');
    }
  },

  /**
   * Get profile statistics
   */
  async getProfileStats(userId: string): Promise<ProfileStats> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return {
        totalLikes: 0,
        totalSaved: 0,
        totalRead: 0,
        joinedDate: new Date().toISOString(),
        interestsCount: 0,
        sourcesCount: 0,
      };
    }

    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('interests, sources, created_at')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get interaction stats
      const { data: stats, error: statsError } = await supabase
        .from('user_signals')
        .select('liked, saved, read')
        .eq('user_id', userId);

      if (statsError) throw statsError;

      const totalLikes = stats?.filter(s => s.liked).length || 0;
      const totalSaved = stats?.filter(s => s.saved).length || 0;
      const totalRead = stats?.filter(s => s.read).length || 0;

      return {
        totalLikes,
        totalSaved,
        totalRead,
        joinedDate: user.created_at,
        interestsCount: user.interests?.length || 0,
        sourcesCount: user.sources?.length || 0,
      };
    } catch (error) {
      console.error('Get profile stats error:', error);
      return {
        totalLikes: 0,
        totalSaved: 0,
        totalRead: 0,
        joinedDate: new Date().toISOString(),
        interestsCount: 0,
        sourcesCount: 0,
      };
    }
  },

  /**
   * Get account settings
   */
  async getAccountSettings(): Promise<AccountSettings> {
    try {
      const settingsStr = await AsyncStorage.getItem('account_settings');
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }

      // Default settings
      return {
        smsNotifications: false,
        emailNotifications: true,
        pushNotifications: true,
        language: 'en',
        theme: 'auto',
      };
    } catch (error) {
      console.error('Get account settings error:', error);
      return {
        smsNotifications: false,
        emailNotifications: true,
        pushNotifications: true,
        language: 'en',
        theme: 'auto',
      };
    }
  },

  /**
   * Update account settings
   */
  async updateAccountSettings(settings: Partial<AccountSettings>): Promise<AccountSettings> {
    try {
      const current = await this.getAccountSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem('account_settings', JSON.stringify(updated));
      return updated;
    } catch (error: any) {
      console.error('Update account settings error:', error);
      throw new Error(error.message || 'Failed to update settings');
    }
  },

  /**
   * Toggle SMS notifications
   */
  async toggleSMSNotifications(enabled: boolean): Promise<AccountSettings> {
    return this.updateAccountSettings({ smsNotifications: enabled });
  },

  /**
   * Toggle email notifications
   */
  async toggleEmailNotifications(enabled: boolean): Promise<AccountSettings> {
    return this.updateAccountSettings({ emailNotifications: enabled });
  },

  /**
   * Toggle push notifications
   */
  async togglePushNotifications(enabled: boolean): Promise<AccountSettings> {
    return this.updateAccountSettings({ pushNotifications: enabled });
  },

  /**
   * Change language
   */
  async changeLanguage(userId: string, language: string): Promise<User> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      // Update in database
      const user = await this.updateProfile(userId, { language });

      // Update in local settings
      await this.updateAccountSettings({ language });

      return user;
    } catch (error: any) {
      console.error('Change language error:', error);
      throw new Error(error.message || 'Failed to change language');
    }
  },

  /**
   * Delete account
   */
  async deleteAccount(userId: string): Promise<{ success: boolean }> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      // Delete user data (cascades to related tables)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.warn('Failed to delete auth user:', authError);
      }

      // Clear local data
      await AsyncStorage.multiRemove([
        'supabase_session',
        'onboardingComplete',
        'account_settings',
      ]);

      return { success: true };
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  },

  /**
   * Export user data
   */
  async exportUserData(userId: string): Promise<any> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Backend not configured');
    }

    try {
      // Get user profile
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Get user interactions
      const { data: interactions } = await supabase
        .from('user_signals')
        .select('*, signals(*)')
        .eq('user_id', userId);

      // Get notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      return {
        profile: user,
        interactions,
        notifications,
        exportDate: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Export user data error:', error);
      throw new Error(error.message || 'Failed to export data');
    }
  },
};
