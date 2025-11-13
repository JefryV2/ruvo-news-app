import { communityService } from '../lib/communityService';

// Test the sharing functionality
async function testShareFunctionality() {
  console.log('Testing share functionality...');
  
  // Mock user ID and signal ID for testing
  const testUserId = 'test-user-id';
  const testSignalId = 'test-signal-id';
  const testMessage = 'Testing share functionality';
  
  try {
    console.log('Attempting to share article with all friends...');
    const result = await communityService.shareArticleWithAllFriends(
      testUserId,
      testSignalId,
      testMessage
    );
    
    console.log('Share result:', result);
    
    console.log('Attempting to fetch shared articles...');
    const sharedArticles = await communityService.getSharedArticlesForUser(testUserId);
    
    console.log('Shared articles:', sharedArticles);
  } catch (error) {
    console.error('Error testing share functionality:', error);
  }
}

// Run the test
testShareFunctionality();