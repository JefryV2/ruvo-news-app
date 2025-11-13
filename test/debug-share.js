// Debug script to test sharing functionality
require('dotenv').config();

console.log('=== Debug Share Functionality ===');

// Check if Supabase is configured
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase is properly configured');
} else {
  console.log('❌ Supabase is NOT properly configured');
  console.log('This is expected in Node.js environment as .env is not automatically loaded');
  console.log('In Expo environment, these variables should be available');
}

// Test the sharing logic
console.log('\n=== Testing Share Logic ===');

// Simulate sharing an article to community
const testShare = {
  user_id: 'test-user-id',
  signal_id: 'test-signal-id',
  friend_id: null, // This represents community share
  message: 'Check out this article!'
};

console.log('Test share object:', testShare);
console.log('Friend ID is null:', testShare.friend_id === null);
console.log('This should be visible in community feed');

// Simulate the query that fetches community shares
console.log('\n=== Simulating Database Query ===');
console.log('Query: SELECT * FROM shared_articles WHERE friend_id IS NULL');
console.log('This should return community-shared articles');

console.log('\n=== Expected Result ===');
console.log('Articles with friend_id = NULL should appear in community feed');
console.log('All users should be able to see these articles');

console.log('\n=== Debug Complete ===');