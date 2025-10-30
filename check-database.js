// Quick script to check if user_signals table exists
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database...\n');

  // Test 1: Check if user_signals table exists
  console.log('Test 1: Checking user_signals table...');
  try {
    const { data, error } = await supabase
      .from('user_signals')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ ERROR:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('\n⚠️  The user_signals table does NOT exist!');
      console.error('   You need to run: database/simple-like-save-setup.sql\n');
      return false;
    }

    console.log('✅ user_signals table exists!');
    console.log('   Rows found:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('   Sample row:', data[0]);
    }
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

async function checkAuth() {
  console.log('\nTest 2: Checking authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('❌ No user logged in');
      console.error('   You must sign in to the app first!');
      return false;
    }

    console.log('✅ User authenticated!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    return true;
  } catch (err) {
    console.error('❌ Auth check failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE DIAGNOSTIC CHECK');
  console.log('='.repeat(60) + '\n');

  const tableExists = await checkDatabase();
  const userLoggedIn = await checkAuth();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('user_signals table:', tableExists ? '✅ EXISTS' : '❌ MISSING');
  console.log('User authenticated:', userLoggedIn ? '✅ YES' : '❌ NO');

  if (!tableExists) {
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open: database/simple-like-save-setup.sql');
    console.log('2. Copy all contents');
    console.log('3. Go to: https://app.supabase.com');
    console.log('4. Select your project');
    console.log('5. SQL Editor → New query');
    console.log('6. Paste and RUN');
  }

  if (!userLoggedIn) {
    console.log('\n📱 SIGN IN:');
    console.log('1. Open your app');
    console.log('2. Sign in with your account');
    console.log('3. Then try liking an article again');
  }

  console.log('\n');
}

main();
