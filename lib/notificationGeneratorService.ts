/**
 * Notification Generator Service
 * Generates personalized notifications based on user interests and signal activity
 */

import { Signal, UserProfile, Notification } from '@/types';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  breakingNews: boolean;
  dailyDigest: boolean;
  interestAlerts: boolean;
  customAlerts: boolean;
}

export class NotificationGeneratorService {
  /**
   * Generate notifications based on new signals matching user interests
   */
  static async generateNotificationsForSignals(
    user: UserProfile,
    newSignals: Signal[],
    preferences?: NotificationPreferences
  ): Promise<Notification[]> {
    // Validate inputs
    if (!user || !Array.isArray(user.interests) || user.interests.length === 0) {
      console.warn('Invalid user or no interests provided');
      return [];
    }

    // Validate signals
    if (!Array.isArray(newSignals) || newSignals.length === 0) {
      console.warn('No signals provided');
      return [];
    }

    const notifications: Notification[] = [];
    const now = new Date();

    try {
      // Filter signals that match user interests
      const relevantSignals = newSignals.filter(signal =>
        this.signalMatchesUserInterests(signal, user.interests)
      );

      for (const signal of relevantSignals) {
        try {
          // Determine urgency based on relevance score and tags
          const urgency = this.determineUrgency(signal, user.interests);
          
          // Skip low priority if user has breaking news only enabled
          if (preferences?.breakingNews && urgency === 'low') {
            continue;
          }

          const notification: Notification = {
            id: `notif_${signal.id}_${Date.now()}`,
            title: this.generateTitle(signal, user.interests),
            message: signal.summary || signal.title || 'No content available',
            category: this.determineCategory(signal, user.interests),
            urgency,
            timestamp: now,
            read: false,
            signalId: signal.id,
          };

          notifications.push(notification);
        } catch (signalError) {
          console.error('Error processing signal:', signalError);
          // Continue with other signals instead of crashing
          continue;
        }
      }
    } catch (error) {
      console.error('Error in generateNotificationsForSignals:', error);
    }

    return notifications;
  }

  /**
   * Check if a signal matches user interests
   */
  private static signalMatchesUserInterests(signal: Signal, userInterests: string[]): boolean {
    try {
      // Validate inputs
      if (!signal || !Array.isArray(userInterests) || userInterests.length === 0) {
        return false;
      }

      // Check if signal tags match any user interests
      const signalTags = (signal.tags && Array.isArray(signal.tags)) ? signal.tags.map(t => t.toLowerCase()) : [];
      const interests = userInterests.map(i => i.toLowerCase());

      for (const interest of interests) {
        // Check tags
        if (signalTags.some(tag => tag.includes(interest) || interest.includes(tag))) {
          return true;
        }

        // Check title and summary
        const content = `${signal.title || ''} ${signal.summary || ''}`.toLowerCase();
        if (content.includes(interest)) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error in signalMatchesUserInterests:', error);
    }

    return false;
  }

  /**
   * Determine notification urgency
   */
  private static determineUrgency(signal: Signal, userInterests: string[]): 'low' | 'medium' | 'high' {
    try {
      const relevanceScore = (signal as any).relevanceScore || 0;
      
      // High urgency: Very relevant (score > 0.9) or breaking news
      if (relevanceScore > 0.9 || (signal.tags && Array.isArray(signal.tags) && signal.tags.some(tag => 
        tag.toLowerCase().includes('breaking') || 
        tag.toLowerCase().includes('urgent')
      ))) {
        return 'high';
      }

      // Medium urgency: Good relevance (score > 0.7)
      if (relevanceScore > 0.7) {
        return 'medium';
      }
    } catch (error) {
      console.error('Error in determineUrgency:', error);
    }

    // Low urgency: Default
    return 'low';
  }

  /**
   * Generate notification title based on signal and user interests
   */
  private static generateTitle(signal: Signal, userInterests: string[]): string {
    try {
      const matchedInterest = this.findMatchedInterest(signal, userInterests);
      
      if (matchedInterest) {
        const interest = matchedInterest.charAt(0).toUpperCase() + matchedInterest.slice(1);
        return `${interest} Update`;
      }
    } catch (error) {
      console.error('Error in generateTitle:', error);
    }

    return 'New Signal';
  }

  /**
   * Find which user interest this signal matches
   */
  private static findMatchedInterest(signal: Signal, userInterests: string[]): string | null {
    try {
      // Validate inputs
      if (!signal || !Array.isArray(userInterests) || userInterests.length === 0) {
        return null;
      }

      const signalTags = (signal.tags && Array.isArray(signal.tags)) ? signal.tags.map(t => t.toLowerCase()) : [];
      const content = `${signal.title || ''} ${signal.summary || ''}`.toLowerCase();

      for (const interest of userInterests) {
        const lowerInterest = interest.toLowerCase();
        
        if (signalTags.some(tag => tag.includes(lowerInterest))) {
          return interest;
        }
        
        if (content.includes(lowerInterest)) {
          return interest;
        }
      }
    } catch (error) {
      console.error('Error in findMatchedInterest:', error);
    }

    return null;
  }

  /**
   * Determine notification category
   */
  private static determineCategory(signal: Signal, userInterests: string[]): string {
    try {
      const matchedInterest = this.findMatchedInterest(signal, userInterests);
      if (matchedInterest) {
        return matchedInterest;
      }
      
      if (signal.tags && Array.isArray(signal.tags) && signal.tags.length > 0) {
        return signal.tags[0];
      }
    } catch (error) {
      console.error('Error in determineCategory:', error);
    }

    return 'General';
  }

  /**
   * Save notifications to database
   */
  static async saveNotifications(userId: string, notifications: Notification[]): Promise<void> {
    // Validate inputs
    if (!userId || !Array.isArray(notifications) || notifications.length === 0) {
      console.warn('Invalid inputs for saveNotifications');
      return;
    }

    if (!IS_SUPABASE_CONFIGURED || !supabase) {
      console.warn('Supabase not configured, skipping notification save');
      return;
    }

    try {
      const notificationData = notifications.map(notif => ({
        user_id: userId,
        title: notif.title || 'Untitled',
        message: notif.message || '',
        category: notif.category || 'General',
        urgency: notif.urgency || 'low',
        read: false,
        signal_id: notif.signalId,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (error) {
        console.error('Error saving notifications:', error);
      }
    } catch (error) {
      console.error('Error in saveNotifications:', error);
    }
  }

  /**
   * Generate daily digest notification
   */
  static generateDailyDigest(
    user: UserProfile,
    signals: Signal[]
  ): Notification | null {
    try {
      // Validate inputs
      if (!user || !Array.isArray(signals) || signals.length === 0) {
        return null;
      }

      const topSignals = signals
        .filter(s => this.signalMatchesUserInterests(s, user.interests))
        .sort((a, b) => ((b as any).relevanceScore || 0) - ((a as any).relevanceScore || 0))
        .slice(0, 5);

      if (topSignals.length === 0) {
        return null;
      }

      return {
        id: `digest_${Date.now()}`,
        title: 'Your Daily Digest',
        message: `${topSignals.length} signals today from your interests: ${Array.isArray(user.interests) ? user.interests.slice(0, 3).join(', ') : ''}`,
        category: 'Digest',
        urgency: 'low',
        timestamp: new Date(),
        read: false,
      };
    } catch (error) {
      console.error('Error in generateDailyDigest:', error);
      return null;
    }
  }

  /**
   * Generate breaking news notification
   */
  static generateBreakingNews(signal: Signal): Notification {
    return {
      id: `breaking_${signal.id}_${Date.now()}`,
      title: '🔴 Breaking News',
      message: signal.title || 'No title available',
      category: 'Breaking',
      urgency: 'high',
      timestamp: new Date(),
      read: false,
      signalId: signal.id,
    };
  }

  /**
   * Process and generate notifications for new signals
   */
  static async processNewSignals(
    user: UserProfile,
    newSignals: Signal[],
    preferences?: NotificationPreferences
  ): Promise<Notification[]> {
    try {
      // Validate inputs
      if (!user) {
        console.warn('No user provided to processNewSignals');
        return [];
      }

      if (!preferences?.pushNotifications) {
        console.log('Push notifications disabled, skipping notification generation');
        return [];
      }

      const notifications = await this.generateNotificationsForSignals(
        user,
        newSignals,
        preferences
      );

      // Save to database if configured
      if (user.id && notifications.length > 0) {
        await this.saveNotifications(user.id, notifications);
      }

      return notifications;
    } catch (error) {
      console.error('Error in processNewSignals:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }
}

export default NotificationGeneratorService;