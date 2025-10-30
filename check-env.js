// Quick check if Gemini API key is loaded in environment
console.log('Checking environment variables...\n');

const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (geminiKey) {
  console.log('✅ EXPO_PUBLIC_GEMINI_API_KEY is set');
  console.log(`   Length: ${geminiKey.length} characters`);
  console.log(`   Starts with: ${geminiKey.substring(0, 10)}...`);
  console.log(`   Ends with: ...${geminiKey.substring(geminiKey.length - 5)}`);
} else {
  console.log('❌ EXPO_PUBLIC_GEMINI_API_KEY is NOT set');
  console.log('\n📝 To fix:');
  console.log('   1. Make sure .env file has this line:');
  console.log('      EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyDe0vvYQ3Bi4uy610AslFl_twNYWQ-KQIs');
  console.log('   2. Copy from env.example if needed:');
  console.log('      Copy-Item env.example .env -Force');
}

console.log('\nAll EXPO_PUBLIC variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('EXPO_PUBLIC'))
  .forEach(key => {
    const value = process.env[key];
    if (value && value.length > 20) {
      console.log(`   ${key}: ${value.substring(0, 15)}...`);
    } else {
      console.log(`   ${key}: ${value || '(not set)'}`);
    }
  });
