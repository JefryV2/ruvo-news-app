// Test script to verify RLS policies for shared_articles table
require('dotenv').config();

console.log('=== RLS Policy Verification ===');

// Check if Supabase is configured
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Supabase configuration is missing');
  process.exit(1);
}

console.log('\n=== Expected RLS Policy ===');
console.log('The shared_articles table should have a policy that allows:');
console.log('SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id OR friend_id IS NULL)');

console.log('\n=== Manual Verification Steps ===');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to Authentication > Policies');
console.log('3. Find the shared_articles table policies');
console.log('4. Check if there is a policy that allows viewing articles where friend_id IS NULL');

console.log('\n=== Test Data Structure ===');
console.log('Community shares should have:');
console.log('- user_id: valid user ID');
console.log('- signal_id: valid signal ID');
console.log('- friend_id: NULL (this is the key)');
console.log('- message: optional message');

console.log('\n=== SQL Query for Testing ===');
console.log('To manually test, run this query in Supabase SQL editor:');
console.log("SELECT * FROM shared_articles WHERE friend_id IS NULL LIMIT 5;");

console.log('\n=== Verification Complete ===');