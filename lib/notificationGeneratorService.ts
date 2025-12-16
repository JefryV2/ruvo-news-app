/**
 * Notification Generator Service
 * Generates personalized notifications based on user interests and signal activity
 */

import { Signal, UserProfile, Notification } from '@/types';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Check if we've exceeded our daily notification limit
   */
  private static async checkDailyLimit(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `daily_notification_count_${userId}_${today}`;
      
      const countStr = await AsyncStorage.getItem(key);
      const count = countStr ? parseInt(countStr, 10) : 0;
      
      // Limit to 10 notifications per day per user
      if (count >= 10) {
        return false; // Exceeded limit
      }
      
      // Increment count
      await AsyncStorage.setItem(key, (count + 1).toString());
      return true; // Within limit
    } catch (error) {
      console.error('Error checking daily limit:', error);
      return true; // Allow if error occurs
    }
  }
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

    console.log(`Generating notifications for user ${user.username} with ${user.interests.length} interests from ${newSignals.length} signals`);
    
    const notifications: Notification[] = [];
    const now = new Date();

    try {
      // Filter signals that match user interests
      const relevantSignals = newSignals.filter(signal =>
        this.signalMatchesUserInterests(signal, user.interests)
      );

      console.log(`Found ${relevantSignals.length} relevant signals out of ${newSignals.length} total signals for user ${user.username}`);

      // Sort signals by relevance score (highest first)
      const sortedSignals = relevantSignals.sort((a, b) => {
        const scoreA = (a as any).relevanceScore || 0;
        const scoreB = (b as any).relevanceScore || 0;
        return scoreB - scoreA;
      });

      // Limit to top 3 most relevant signals to reduce notification clutter
      const topSignals = sortedSignals.slice(0, 3);

      console.log(`Processing top ${topSignals.length} signals for notifications`);
      
      for (const signal of topSignals) {
        try {
          // Determine urgency based on relevance score and tags
          const urgency = this.determineUrgency(signal, user.interests);
          
          console.log(`Signal ${signal.id} has urgency level: ${urgency}`);
          
          // Only create notifications for medium or high urgency
          // Skip low priority notifications entirely unless they're breaking news
          if (urgency === 'low' && !(signal.tags && Array.isArray(signal.tags) && signal.tags.some(tag => 
            tag.toLowerCase().includes('breaking') || 
            tag.toLowerCase().includes('urgent') ||
            tag.toLowerCase().includes('critical')
          ))) {
            console.log(`Skipping low urgency signal ${signal.id} (not breaking news)`);
            continue;
          }

          // Skip medium priority if user has breaking news only enabled
          if (preferences?.breakingNews && urgency !== 'high') {
            console.log(`Skipping medium urgency signal ${signal.id} due to breakingNews preference`);
            continue;
          }

          const notification: Notification = {
            id: `notif_${signal.id}_${Date.now()}`,
            title: this.generateTitle(signal, user.interests),
            message: signal.summary || signal.title || 'New personalized update',
            category: this.determineCategory(signal, user.interests),
            urgency,
            timestamp: now,
            read: false,
            signalId: signal.id,
          };

          notifications.push(notification);
          console.log(`Created notification for signal ${signal.id} with urgency ${urgency}`);
        } catch (signalError) {
          console.error('Error processing signal:', signalError);
          // Continue with other signals instead of crashing
          continue;
        }
      }
      
      console.log(`Generated ${notifications.length} notifications for user ${user.username}`);
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

      // Require minimum relevance score for notifications
      const relevanceScore = (signal as any).relevanceScore || 0;
      if (relevanceScore < 0.7) { // Higher threshold for notifications
        console.log(`Signal ${signal.id} filtered out due to low relevance score: ${relevanceScore}`);
        return false;
      }

      // Check if signal tags match any user interests
      const signalTags = (signal.tags && Array.isArray(signal.tags)) ? signal.tags.map(t => t.toLowerCase()) : [];
      const interests = userInterests.map(i => i.toLowerCase());

      // Count matches to ensure strong relevance
      let matchCount = 0;
      
      for (const interest of interests) {
        // Check tags
        if (signalTags.some(tag => tag.includes(interest) || interest.includes(tag))) {
          matchCount++;
        }

        // Check title and summary
        const content = `${signal.title || ''} ${signal.summary || ''}`.toLowerCase();
        if (content.includes(interest)) {
          matchCount++;
        }
      }
      
      const hasMatch = matchCount >= 1;
      if (!hasMatch) {
        console.log(`Signal ${signal.id} filtered out due to no interest matches. Relevance score: ${relevanceScore}`);
      } else {
        console.log(`Signal ${signal.id} matched with ${matchCount} interest matches. Relevance score: ${relevanceScore}`);
      }
      
      // Require at least one strong match for notifications
      return hasMatch;
    } catch (error) {
      console.error('Error in signalMatchesUserInterests:', error);
      return false;
    }
  }

  /**
   * Determine notification urgency
   */
  private static determineUrgency(signal: Signal, userInterests: string[]): 'low' | 'medium' | 'high' {
    try {
      const relevanceScore = (signal as any).relevanceScore || 0;
      
      // High urgency: Extremely relevant (score > 0.95) AND matches user interests strongly, or breaking news
      if (relevanceScore > 0.95 && this.signalMatchesUserInterests(signal, userInterests) || 
          (signal.tags && Array.isArray(signal.tags) && signal.tags.some(tag => 
            tag.toLowerCase().includes('breaking') || 
            tag.toLowerCase().includes('urgent') ||
            tag.toLowerCase().includes('critical')
          ))) {
        return 'high';
      }

      // Medium urgency: Very good relevance (score > 0.9)
      if (relevanceScore > 0.9) {
        return 'medium';
      }

      // Low urgency: Good relevance (score > 0.8)
      if (relevanceScore > 0.8) {
        return 'low';
      }
    } catch (error) {
      console.error('Error in determineUrgency:', error);
    }

    // Moderate or low relevance: Don't create notification
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
        return `${interest} Alert`;
      }
    } catch (error) {
      console.error('Error in generateTitle:', error);
    }

    return 'Personal Alert';
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
      // Limit to maximum 5 notifications per save to prevent spam
      const limitedNotifications = notifications.slice(0, 5);
      
      const notificationData = limitedNotifications.map(notif => ({
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
        title: 'Your Personalized Digest',
        message: `${topSignals.length} important updates today based on your interests: ${Array.isArray(user.interests) ? user.interests.slice(0, 3).join(', ') : ''}`,
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
      title: '🔴 Breaking News Alert',
      message: signal.title || 'Important breaking news update',
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
    console.log('processNewSignals called with:', { user, newSignals, preferences });
    
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

      // Check daily limit
      if (user.id && !(await this.checkDailyLimit(user.id))) {
        console.log('Daily notification limit reached, skipping notification generation');
        return [];
      }

      console.log(`Processing ${newSignals.length} signals for user ${user.username} with ${user.interests.length} interests`);
      
      const notifications = await this.generateNotificationsForSignals(
        user,
        newSignals,
        preferences
      );

      console.log(`Generated ${notifications.length} personalized notifications`);
      
      // Save to database if configured
      if (user.id && notifications.length > 0) {
        await this.saveNotifications(user.id, notifications);
      }

      console.log('processNewSignals returning notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('Error in processNewSignals:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }
}

console.log('Exporting NotificationGeneratorService:', NotificationGeneratorService);

export default NotificationGeneratorService;