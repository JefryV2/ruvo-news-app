import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData) {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Supabase is not configured. Please add your credentials to .env');
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          username: data.name,
          interests: [],
          sources: [],
          is_premium: false,
          language: 'en',
        });

      if (profileError) throw profileError;

      // 3. Store session locally
      if (authData.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(authData.session));
      }

      return {
        user: authData.user,
        session: authData.session,
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  },

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData) {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Supabase is not configured. Please add your credentials to .env');
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      if (!authData.user) throw new Error('Failed to sign in');

      // Store session locally
      if (authData.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(authData.session));
      }

      return {
        user: authData.user,
        session: authData.session,
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local session
      await AsyncStorage.removeItem('supabase_session');
      await AsyncStorage.removeItem('onboardingComplete');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  /**
   * Get the current session
   */
  async getSession() {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser() {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'ruvo://reset-password',
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  },

  /**
   * Restore session from local storage
   */
  async restoreSession() {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      return null;
    }

    try {
      const sessionStr = await AsyncStorage.getItem('supabase_session');
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);
      
      // Set the session in Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Restore session error:', error);
      await AsyncStorage.removeItem('supabase_session');
      return null;
    }
  },
};
