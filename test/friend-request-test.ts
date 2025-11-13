import { communityService } from '../lib/communityService';
import { userService } from '../lib/services';

async function testFriendRequestFunctionality() {
  try {
    console.log('Testing friend request functionality...');
    
    // Create two test users
    const user1 = await userService.createUser({
      username: 'testuser1',
      email: 'testuser1@example.com',
      interests: [],
      sources: [],
      is_premium: false,
      language: 'en'
    });
    
    const user2 = await userService.createUser({
      username: 'testuser2',
      email: 'testuser2@example.com',
      interests: [],
      sources: [],
      is_premium: false,
      language: 'en'
    });
    
    console.log('Created test users:', user1, user2);
    
    // Send a friend request from user1 to user2
    const friendRequest = await communityService.sendFriendRequest(user1.id, user2.id);
    console.log('Sent friend request:', friendRequest);
    
    // Check if the friend request exists
    const friendshipStatus = await communityService.checkFriendshipStatus(user1.id, user2.id);
    console.log('Friendship status:', friendshipStatus);
    
    // Get friend requests for user2
    const requests = await communityService.getFriendRequests(user2.id);
    console.log('Friend requests for user2:', requests);
    
    // Accept the friend request
    const acceptedRequest = await communityService.acceptFriendRequest(user2.id, user1.id);
    console.log('Accepted friend request:', acceptedRequest);
    
    // Check if they are now friends
    const friendshipStatusAfterAccept = await communityService.checkFriendshipStatus(user1.id, user2.id);
    console.log('Friendship status after accept:', friendshipStatusAfterAccept);
    
    // Get friends for user1
    const friends = await communityService.getFriends(user1.id);
    console.log('Friends for user1:', friends);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFriendRequestFunctionality();