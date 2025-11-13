// Test Supabase functionality for community sharing
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('=== Supabase Test ===');

// Check if Supabase is configured
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Supabase configuration is missing');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('\n=== Testing Database Connection ===');

// Test database connection by checking if we can access the shared_articles table
async function testDatabase() {
  try {
    console.log('Testing shared_articles table access...');
    
    // Try to fetch a few records from shared_articles
    const { data, error } = await supabase
      .from('shared_articles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error accessing shared_articles table:', error.message);
      return;
    }
    
    console.log('✅ Successfully accessed shared_articles table');
    console.log('Found', data.length, 'records');
    
    if (data.length > 0) {
      console.log('Sample record:', JSON.stringify(data[0], null, 2));
    }
    
    // Test the specific query we use for community feed
    console.log('\n=== Testing Community Feed Query ===');
    const { data: communityData, error: communityError } = await supabase
      .from('shared_articles')
      .select(`
        *,
        signals (*)
      `)
      .or('friend_id.is.null')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (communityError) {
      console.log('❌ Error with community feed query:', communityError.message);
      return;
    }
    
    console.log('✅ Community feed query successful');
    console.log('Found', communityData.length, 'community-shared articles');
    
    if (communityData.length > 0) {
      const communityArticles = communityData.filter(item => item.friend_id === null);
      console.log('Community articles (friend_id = null):', communityArticles.length);
      
      if (communityArticles.length > 0) {
        console.log('Sample community article:', JSON.stringify(communityArticles[0], null, 2));
      }
    }
    
  } catch (error) {
    console.log('❌ Exception during database test:', error.message);
  }
}

// Run the test
testDatabase().then(() => {
  console.log('\n=== Test Complete ===');
});