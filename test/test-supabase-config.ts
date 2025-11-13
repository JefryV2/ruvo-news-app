import 'dotenv/config';
import { supabase } from '../lib/supabase';

console.log('Testing Supabase configuration...');

// Check if Supabase URL and Anon Key are defined
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Defined' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Defined' : 'Missing');

if (supabase) {
  console.log('Supabase client initialized successfully');
} else {
  console.log('Supabase client failed to initialize');
}

export {};