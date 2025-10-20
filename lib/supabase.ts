import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const IS_SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

// Only create a real client when env vars exist; otherwise export null.
export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

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
  dismissed: boolean;
  read: boolean;
  created_at: string;
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
