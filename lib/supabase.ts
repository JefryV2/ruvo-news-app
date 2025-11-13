import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL from env:', supabaseUrl);
console.log('Supabase Anon Key present:', !!supabaseAnonKey);

export const IS_SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

// Validate Supabase URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.warn('Invalid Supabase URL format. Should start with https://');
}

// Only create a real client when env vars exist; otherwise export null.
export let supabase: SupabaseClient | null = null;

if (IS_SUPABASE_CONFIGURED && supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'X-Client-Info': 'ruvo-app'
        }
      }
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn(' Supabase not configured - missing URL or Anon Key');
  console.log('IS_SUPABASE_CONFIGURED:', IS_SUPABASE_CONFIGURED);
  console.log('supabaseUrl:', supabaseUrl);
  console.log('supabaseAnonKey present:', !!supabaseAnonKey);
}

// Database types
export interface User {
  id: string;
  username: string;
  email: string;
  interests: string[];
  sources: string[];
  is_premium: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  title: string;
  summary: string;
  content: string;
  source_name: string;
  source_url: string;
  image_url?: string;
  tags: string[];
  verified: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
}

export interface UserSignal {
  id: string;
  user_id: string;
  signal_id: string;
  liked: boolean;
  saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  signal_id?: string;
  title: string;
  message: string;
  type: 'signal' | 'system' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  category: string;
  verified: boolean;
  icon?: string;
}