/**
 * Quick Test Script for Gemini API Key
 * 
 * Run this to check if your Gemini API key is working:
 * node test-gemini-key.js
 */

require('dotenv').config();

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testGeminiKey() {
  console.log('🔍 Checking Gemini API Key Configuration...\n');

  // Check 1: API key exists
  if (!GEMINI_API_KEY) {
    console.log('❌ FAILED: API key not found in environment variables');
    console.log('\n📝 To fix:');
    console.log('1. Create/open .env file in project root');
    console.log('2. Add line: EXPO_PUBLIC_GEMINI_API_KEY=your_key_here');
    console.log('3. Get your key at: https://makersuite.google.com/app/apikey');
    console.log('\n💡 Or copy from env.example if you want to test with the example key');
    process.exit(1);
  }

  console.log('✅ API key found in .env file');
  console.log(`   Key starts with: ${GEMINI_API_KEY.substring(0, 15)}...`);
  console.log(`   Key length: ${GEMINI_API_KEY.length} characters`);
  
  // Check 2: API key format
  if (!GEMINI_API_KEY.startsWith('AIza')) {
    console.log('⚠️  WARNING: API key doesn\'t start with "AIza" (unusual for Gemini keys)');
  } else {
    console.log('✅ API key format looks correct');
  }

  // Check 3: Test API connection
  console.log('\n🧪 Testing API connection...');
  
  try {
    const testMessage = 'Hello! Just testing if the API is working. Please respond with "API test successful!"';
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: testMessage }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ FAILED: API request failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorText}`);
      
      if (response.status === 400) {
        console.log('\n📝 Possible issues:');
        console.log('   - API key is invalid or expired');
        console.log('   - Get a new key at: https://makersuite.google.com/app/apikey');
      } else if (response.status === 429) {
        console.log('\n📝 Possible issues:');
        console.log('   - Rate limit exceeded');
        console.log('   - If using shared key, get your own at: https://makersuite.google.com/app/apikey');
      } else if (response.status === 403) {
        console.log('\n📝 Possible issues:');
        console.log('   - API key doesn\'t have permission');
        console.log('   - Gemini API might not be enabled for this key');
        console.log('   - Generate a new key at: https://makersuite.google.com/app/apikey');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!responseText) {
      console.log('❌ FAILED: Empty response from API');
      process.exit(1);
    }

    console.log('✅ API connection successful!');
    console.log(`   Response: "${responseText.substring(0, 100)}..."`);
    
    console.log('\n🎉 SUCCESS! Your Gemini API key is working correctly!');
    console.log('\n📱 Next steps:');
    console.log('   1. Restart your Expo app: npx expo start --clear');
    console.log('   2. Open Ask Ruvo (tap the 💬 button)');
    console.log('   3. Try asking: "What is artificial intelligence?"');
    console.log('   4. You should get intelligent AI responses!');

  } catch (error) {
    console.log('❌ FAILED: Network or connection error');
    console.log(`   Error: ${error.message}`);
    console.log('\n📝 Possible issues:');
    console.log('   - No internet connection');
    console.log('   - Firewall blocking API requests');
    console.log('   - Proxy configuration needed');
    process.exit(1);
  }
}

// Run the test
console.log('═══════════════════════════════════════════════════');
console.log('   Gemini API Key Test Utility');
console.log('═══════════════════════════════════════════════════\n');

testGeminiKey().catch(error => {
  console.log('\n❌ Unexpected error:', error);
  process.exit(1);
});
