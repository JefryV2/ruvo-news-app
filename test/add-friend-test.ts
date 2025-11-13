import { userService } from '../lib/services';

async function testAddFriendFunctionality() {
  try {
    console.log('Testing add friend functionality...');
    
    // Create a test user
    const testUser = await userService.createUser({
      username: 'Ruairi Morgan',
      email: 'ruairi.morgan@example.com',
      interests: [],
      sources: [],
      is_premium: false,
      language: 'en'
    });
    
    console.log('Created test user:', testUser);
    
    // Search for the user
    const searchResults = await userService.searchUsers('Ruairi Morgan');
    console.log('Search results:', searchResults);
    
    // List all users
    const allUsers = await userService.listAllUsers();
    console.log('All users:', allUsers);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAddFriendFunctionality();