/**
 * Simple Notification Integration
 * Drop-in integration for generating notifications based on user interests
 */

import { Signal, UserProfile, Notification } from '@/types';
import { NotificationGeneratorService } from './notificationGeneratorService';

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
    // Default notification preferences
    const preferences = {
      pushNotifications: true,
      emailNotifications: false,
      breakingNews: false, // Set to true to only get high-urgency notifications
      dailyDigest: false,
      interestAlerts: true,
      customAlerts: true,
    };

    console.log(`Generating notifications for ${user.username || 'Unknown User'} with interests:`, user.interests);
    
    // Ensure NotificationGeneratorService exists and has the method
    if (!NotificationGeneratorService || typeof NotificationGeneratorService.processNewSignals !== 'function') {
      console.error('NotificationGeneratorService not properly initialized');
      return [];
    }
    
    const notifications = await NotificationGeneratorService.processNewSignals(
      user,
      signals,
      preferences
    );

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
    return [];
  }

  return signals.filter(signal => {
    // Validate signal structure
    if (!signal || !signal.tags || !Array.isArray(signal.tags)) {
      return false;
    }
    
    const signalTags = signal.tags?.map(t => t.toLowerCase()) || [];
    const interests = userInterests.map(i => i.toLowerCase());
    const content = `${signal.title || ''} ${signal.summary || ''}`.toLowerCase();

    // Check if any interest matches tags or content
    return interests.some(interest => 
      signalTags.some(tag => tag.includes(interest) || interest.includes(tag)) ||
      content.includes(interest)
    );
  });
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
  return {
    id: `mock_${Date.now()}`,
    title: title || 'Untitled',
    message: message || '',
    category: category || 'General',
    urgency,
    timestamp: new Date(),
    read: false,
  };
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