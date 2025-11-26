import { communityService } from '../lib/communityService';
import { Signal } from '../types';

// Test the sharing functionality
async function testShareFunctionality() {
  console.log('Testing share functionality...');
  
  // Mock user ID and signal for testing
  const testUserId = 'test-user-id';
  const testSignal: Signal = {
    id: 'test-signal-id',
    title: 'Test Article',
    summary: 'This is a test article for sharing functionality',
    sourceId: 'test-source',
    sourceName: 'Test Source',
    verified: true,
    tags: ['test', 'sharing'],
    url: 'https://example.com/test-article',
    relevanceScore: 0.8,
    timestamp: new Date(),
    imageUrl: 'https://example.com/test-image.jpg',
    saved: false,
    liked: false
  };
  const testMessage = 'Testing share functionality';
  
  try {
    console.log('Attempting to share article with all friends...');
    const result = await communityService.shareArticleWithAllFriends(
      testUserId,
      testSignal,
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