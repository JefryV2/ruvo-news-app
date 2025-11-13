// Test Supabase auth endpoint
const https = require('https');

const SUPABASE_URL = 'https://zwawjwxurvhfihbgqzwl.supabase.co';
const AUTH_ENDPOINT = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

console.log('Testing Supabase auth endpoint...');
console.log('Endpoint:', AUTH_ENDPOINT);

// Test the auth endpoint
const options = {
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YXdqd3h1cnZoZmloYmdxendsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjMxMDEsImV4cCI6MjA3NjA5OTEwMX0.dwlYlqYfbZIF6TgkkJJ0Sjrw1oHiBWzV_VLa8OYRtl4',
    'Content-Type': 'application/json'
  }
};

const req = https.request(AUTH_ENDPOINT, options, (res) => {
  console.log('Response status code:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  res.on('data', (chunk) => {
    console.log('Response data (first 200 chars):', chunk.toString().substring(0, 200));
  });
  
  res.on('end', () => {
    console.log('Request completed');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('❌ Request failed');
  console.log('Error:', err.message);
  process.exit(1);
});

req.setTimeout(10000, () => {
  console.log('❌ Request timeout');
  req.destroy();
  process.exit(1);
});

// Send empty body to test endpoint
req.write(JSON.stringify({}));
req.end();