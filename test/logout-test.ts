import { authService } from '../lib/authService';

async function testLogoutFunctionality() {
  try {
    console.log('Testing logout functionality...');
    
    // Test signOut function directly
    await authService.signOut();
    console.log('Sign out completed successfully');
    
    // Verify session is cleared
    const session = await authService.getSession();
    if (!session) {
      console.log('Session properly cleared');
    } else {
      console.log('Session still exists:', session);
    }
    
    console.log('Logout test completed successfully!');
  } catch (error) {
    console.error('Logout test failed:', error);
  }
}

// Run the test
testLogoutFunctionality();