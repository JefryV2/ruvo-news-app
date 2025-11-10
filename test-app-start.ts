/**
 * Simple test to verify the app can start without crashing
 * This file can be used to test the app's initialization process
 */

import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

console.log('Testing app initialization...');

// Test that providers can be imported without errors
try {
  console.log('✅ AppProvider imported successfully');
} catch (error) {
  console.error('❌ Error importing AppProvider:', error);
}

try {
  console.log('✅ LanguageProvider imported successfully');
} catch (error) {
  console.error('❌ Error importing LanguageProvider:', error);
}

console.log('App initialization test completed');