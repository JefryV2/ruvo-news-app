/**
 * Simple Notification Integration
 * Drop-in integration for generating notifications based on user interests
 */

import { Signal, UserProfile, Notification } from '@/types';
import { NotificationGeneratorService } from './notificationGeneratorService';
console.log('Imported NotificationGeneratorService:', NotificationGeneratorService);

/**
 * Generate notifications for new signals matching user interests
 * 
 * @example
 * const user = { id: '1', username: 'John', interests: ['Tech', 'AI'], ... };
 * const signals = [...]; // Your new signals
 * const notifications = await generateInterestNotifications(user, signals);
 */
export async function generateInterestNotifications(
  user: UserProfile | null,
  signals: Signal[]
): Promise<Notification[]> {
  console.log('generateInterestNotifications called with:', { user, signals });
  
  // Handle null or undefined user gracefully
  if (!user || !user.interests || !Array.isArray(user.interests) || user.interests.length === 0) {
    console.log('No user or interests found');
    return [];
  }

  // Handle empty or invalid signals array
  if (!Array.isArray(signals) || signals.length === 0) {
    console.log('No signals to process');
    return [];
  }

  try {
    // Default notification preferences - focus on important notifications only
    const preferences = {
      pushNotifications: true,
      emailNotifications: false,
      breakingNews: true, // Set to true to only get high-urgency notifications
      dailyDigest: false,
      interestAlerts: true,
      customAlerts: true,
    };

    console.log(`Generating personalized notifications for ${user.username || 'Unknown User'} with interests:`, user.interests);
    console.log(`Processing ${signals.length} signals for notification generation`);
    
    // Ensure NotificationGeneratorService exists and has the method
    console.log('NotificationGeneratorService:', NotificationGeneratorService);
    if (!NotificationGeneratorService) {
      console.error('NotificationGeneratorService is null or undefined');
      return [];
    }
    
    if (typeof NotificationGeneratorService.processNewSignals !== 'function') {
      console.error('NotificationGeneratorService.processNewSignals is not a function');
      console.log('NotificationGeneratorService keys:', Object.keys(NotificationGeneratorService));
      return [];
    }
    
    console.log('Calling NotificationGeneratorService.processNewSignals');
    const notifications = await NotificationGeneratorService.processNewSignals(
      user,
      signals,
      preferences
    );
    console.log('NotificationGeneratorService.processNewSignals returned:', notifications);

    console.log(`Generated ${notifications.length} notifications`);
    return notifications || []; // Ensure we always return an array
  } catch (error) {
    console.error('Error generating notifications:', error);
    return []; // Return empty array on error to prevent app crash
  }
}

/**
 * Filter signals by user interests
 * Returns only signals that match the user's interests
 */
export function filterSignalsByInterests(
  signals: Signal[],
  userInterests: string[]
): Signal[] {
  // Validate inputs
  if (!Array.isArray(signals) || !Array.isArray(userInterests) || userInterests.length === 0) {
    console.log('Invalid inputs to filterSignalsByInterests');
    return [];
  }

  console.log(`Filtering ${signals.length} signals for user interests:`, userInterests);

  // Check if signals have relevance scores
  signals.forEach((signal, index) => {
    if (!(signal as any).relevanceScore) {
      console.log(`Signal ${signal.id} at index ${index} missing relevanceScore`);
    }
  });

  // First sort signals by relevance score (highest first)
  const sortedSignals = signals.sort((a, b) => {
    const scoreA = (a as any).relevanceScore || 0;
    const scoreB = (b as any).relevanceScore || 0;
    return scoreB - scoreA;
  });

  // Take only top 5 most relevant signals with high relevance scores
  const highRelevanceSignals = sortedSignals.filter(signal => {
    const relevanceScore = (signal as any).relevanceScore || 0;
    console.log(`Signal ${signal.id} has relevance score: ${relevanceScore}`);
    return relevanceScore >= 0.75; // Higher threshold for notifications
  });
  
  console.log(`Found ${highRelevanceSignals.length} signals with high relevance scores`);
  
  // Limit to top 5
  const topSignals = highRelevanceSignals.slice(0, 5);

  const filteredSignals = topSignals.filter(signal => {
    // Validate signal structure
    if (!signal) {
      console.log(`Signal filtered out due to null signal`);
      return false;
    }
    
    if (!signal.tags) {
      console.log(`Signal ${signal.id} filtered out due to missing tags`);
      return false;
    }
    
    if (!Array.isArray(signal.tags)) {
      console.log(`Signal ${signal.id} filtered out due to invalid tags structure`);
      return false;
    }
    
    const signalTags = signal.tags?.map(t => t.toLowerCase()) || [];
    const interests = userInterests.map(i => i.toLowerCase());
    const content = `${signal.title || ''} ${signal.summary || ''}`.toLowerCase();

    // Require strong matching for notifications
    let matchCount = 0;
    for (const interest of interests) {
      if (signalTags.some(tag => tag.includes(interest) || interest.includes(tag))) {
        matchCount++;
      }
      if (content.includes(interest)) {
        matchCount++;
      }
    }
    
    const hasMatch = matchCount >= 1;
    console.log(`Signal ${signal.id} has ${matchCount} matches with user interests`);
    
    // Require at least one strong match
    return hasMatch;
  });

  console.log(`Returning ${filteredSignals.length} filtered signals`);
  return filteredSignals;
}

/**
 * Get notification summary for user
 * Returns counts by urgency level
 */
export function getNotificationSummary(notifications: Notification[]): {
  total: number;
  unread: number;
  high: number;
  medium: number;
  low: number;
} {
  // Validate input
  if (!Array.isArray(notifications)) {
    return {
      total: 0,
      unread: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  }
  
  return {
    total: notifications.length,
    unread: notifications.filter(n => n && !n.read).length,
    high: notifications.filter(n => n && n.urgency === 'high').length,
    medium: notifications.filter(n => n && n.urgency === 'medium').length,
    low: notifications.filter(n => n && n.urgency === 'low').length,
  };
}

/**
 * Create a mock notification for testing
 */
export function createMockNotification(
  title: string,
  message: string,
  category: string,
  urgency: 'low' | 'medium' | 'high' = 'medium'
): Notification {
  console.log('createMockNotification called with:', { title, message, category, urgency });
  const notification = {
    id: `mock_${Date.now()}`,
    title: title || 'Untitled',
    message: message || '',
    category: category || 'General',
    urgency,
    timestamp: new Date(),
    read: false,
  };
  console.log('createMockNotification returning:', notification);
  return notification;
}

/**
 * Create test notifications for debugging
 */
export function createTestNotifications(): Notification[] {
  console.log('createTestNotifications called');
  const notifications = [
    createMockNotification('Test Alert 1', 'This is a test notification for debugging purposes', 'Test', 'high'),
    createMockNotification('Test Alert 2', 'Another test notification to verify the system is working', 'Test', 'medium'),
    createMockNotification('Personal Alert', 'Sample personalized notification based on your interests', 'Personal', 'low'),
  ];
  console.log('createTestNotifications returning:', notifications);
  return notifications;
}

/**
 * Example usage:
 * 
 * import { generateInterestNotifications, filterSignalsByInterests } from '@/lib/notificationIntegration';
 * 
 * // In your component or context:
 * useEffect(() => {
 *   async function checkForNewNotifications() {
 *     if (user && signals.length > 0) {
 *       // Generate notifications
 *       const newNotifications = await generateInterestNotifications(user, signals);
 *       
 *       // Update state
 *       setNotifications(prev => [...newNotifications, ...prev]);
 *     }
 *   }
 *   
 *   checkForNewNotifications();
 * }, [user, signals]);
 */