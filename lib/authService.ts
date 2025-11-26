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

export interface OAuthResult {
  provider: string;
  url: string;
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
      console.log('Attempting to sign in with Supabase...', { 
        email: data.email,
        supabaseConfigured: IS_SUPABASE_CONFIGURED,
        hasSupabase: !!supabase,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL
      });
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('Supabase auth response:', { authData, error });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      if (!authData.user) {
        throw new Error('Failed to sign in - no user returned');
      }

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
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more detailed error information
      if (error.name === 'AuthRetryableFetchError' && error.message === 'Failed to fetch') {
        throw new Error('Network connection issue: Unable to reach Supabase authentication service. Please check your internet connection and try again.');
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to authentication service. Please check your internet connection.');
      }
      
      throw new Error(error.message || 'Failed to sign in. Please check your credentials and try again.');
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<OAuthResult> {
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      throw new Error('Supabase is not configured. Please add your credentials to .env');
    }

    try {
      console.log('Attempting to sign in with Google OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'ruvo://auth/callback',
          skipBrowserRedirect: true
        }
      });

      console.log('Google OAuth response:', { data, error });

      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }

      // For mobile apps, we typically handle the redirect differently
      // The OAuth flow will be handled by Expo's auth session
      return {
        provider: data.provider,
        url: data.url,
      };
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  /**
   * Sign up with Google OAuth
   */
  async signUpWithGoogle(): Promise<OAuthResult> {
    // Google OAuth signup is the same as signin - Supabase handles account creation automatically
    return this.signInWithGoogle();
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    console.log('Starting sign out process');
    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.error('Supabase is not configured');
      throw new Error('Supabase is not configured');
    }

    try {
      console.log('Calling Supabase signOut');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      console.log('Supabase signOut successful');

      // Clear local session
      console.log('Clearing local session data');
      await AsyncStorage.removeItem('supabase_session');
      // Don't remove onboardingComplete - users should only onboard once
      // await AsyncStorage.removeItem('onboardingComplete');
      console.log('Local session data cleared');
      
      // Add a small delay to ensure auth state change is processed
      await new Promise(resolve => setTimeout(resolve, 100));
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
      // Determine redirect URL based on environment
      const isDev = __DEV__ || process.env.NODE_ENV === 'development';
      const redirectTo = isDev 
        ? 'http://localhost:8081/reset-password'
        : 'https://ruvo-news-app.vercel.app/reset-password';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
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
