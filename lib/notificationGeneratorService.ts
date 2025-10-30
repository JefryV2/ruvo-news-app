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
    if (!user || !user.interests || user.interests.length === 0) {
      return [];
    }

    const notifications: Notification[] = [];
    const now = new Date();

    // Filter signals that match user interests
    const relevantSignals = newSignals.filter(signal =>
      this.signalMatchesUserInterests(signal, user.interests)
    );

    for (const signal of relevantSignals) {
      // Determine urgency based on relevance score and tags
      const urgency = this.determineUrgency(signal, user.interests);
      
      // Skip low priority if user has breaking news only enabled
      if (preferences?.breakingNews && urgency === 'low') {
        continue;
      }

      const notification: Notification = {
        id: `notif_${signal.id}_${Date.now()}`,
        title: this.generateTitle(signal, user.interests),
        message: signal.summary || signal.title,
        category: this.determineCategory(signal, user.interests),
        urgency,
        timestamp: now,
        read: false,
        signalId: signal.id,
      };

      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Check if a signal matches user interests
   */
  private static signalMatchesUserInterests(signal: Signal, userInterests: string[]): boolean {
    // Check if signal tags match any user interests
    const signalTags = signal.tags?.map(t => t.toLowerCase()) || [];
    const interests = userInterests.map(i => i.toLowerCase());

    for (const interest of interests) {
      // Check tags
      if (signalTags.some(tag => tag.includes(interest) || interest.includes(tag))) {
        return true;
      }

      // Check title and summary
      const content = `${signal.title} ${signal.summary || ''}`.toLowerCase();
      if (content.includes(interest)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine notification urgency
   */
  private static determineUrgency(signal: Signal, userInterests: string[]): 'low' | 'medium' | 'high' {
    const relevanceScore = signal.relevanceScore || 0;
    
    // High urgency: Very relevant (score > 0.9) or breaking news
    if (relevanceScore > 0.9 || signal.tags?.some(tag => 
      tag.toLowerCase().includes('breaking') || 
      tag.toLowerCase().includes('urgent')
    )) {
      return 'high';
    }

    // Medium urgency: Good relevance (score > 0.7)
    if (relevanceScore > 0.7) {
      return 'medium';
    }

    // Low urgency: Default
    return 'low';
  }

  /**
   * Generate notification title based on signal and user interests
   */
  private static generateTitle(signal: Signal, userInterests: string[]): string {
    const matchedInterest = this.findMatchedInterest(signal, userInterests);
    
    if (matchedInterest) {
      const interest = matchedInterest.charAt(0).toUpperCase() + matchedInterest.slice(1);
      return `${interest} Update`;
    }

    return 'New Signal';
  }

  /**
   * Find which user interest this signal matches
   */
  private static findMatchedInterest(signal: Signal, userInterests: string[]): string | null {
    const signalTags = signal.tags?.map(t => t.toLowerCase()) || [];
    const content = `${signal.title} ${signal.summary || ''}`.toLowerCase();

    for (const interest of userInterests) {
      const lowerInterest = interest.toLowerCase();
      
      if (signalTags.some(tag => tag.includes(lowerInterest))) {
        return interest;
      }
      
      if (content.includes(lowerInterest)) {
        return interest;
      }
    }

    return null;
  }

  /**
   * Determine notification category
   */
  private static determineCategory(signal: Signal, userInterests: string[]): string {
    const matchedInterest = this.findMatchedInterest(signal, userInterests);
    return matchedInterest || signal.tags?.[0] || 'General';
  }

  /**
   * Save notifications to database
   */
  static async saveNotifications(userId: string, notifications: Notification[]): Promise<void> {
    if (!IS_SUPABASE_CONFIGURED || !supabase || notifications.length === 0) {
      return;
    }

    try {
      const notificationData = notifications.map(notif => ({
        user_id: userId,
        title: notif.title,
        message: notif.message,
        category: notif.category,
        urgency: notif.urgency,
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
    if (!signals || signals.length === 0) {
      return null;
    }

    const topSignals = signals
      .filter(s => this.signalMatchesUserInterests(s, user.interests))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);

    if (topSignals.length === 0) {
      return null;
    }

    return {
      id: `digest_${Date.now()}`,
      title: 'Your Daily Digest',
      message: `${topSignals.length} signals today from your interests: ${user.interests.slice(0, 3).join(', ')}`,
      category: 'Digest',
      urgency: 'low',
      timestamp: new Date(),
      read: false,
    };
  }

  /**
   * Generate breaking news notification
   */
  static generateBreakingNews(signal: Signal): Notification {
    return {
      id: `breaking_${signal.id}_${Date.now()}`,
      title: '🔴 Breaking News',
      message: signal.title,
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
    if (!preferences?.pushNotifications) {
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
  }
}

export default NotificationGeneratorService;
