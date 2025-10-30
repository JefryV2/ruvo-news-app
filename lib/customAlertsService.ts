import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert, Signal, Notification } from '@/types';
import { AIRequestParser, ParsedRequest } from './aiRequestParser';

const ALERTS_STORAGE_KEY = 'custom_alerts';

export class CustomAlertsService {
  /**
   * Create a new custom alert from a parsed request
   */
  static async createAlert(userId: string, parsed: ParsedRequest): Promise<CustomAlert> {
    if (parsed.intent !== 'create_alert') {
      throw new Error('Cannot create alert from non-alert intent');
    }

    const alert: CustomAlert = {
      id: Date.now().toString(),
      userId,
      type: parsed.alertType || 'general',
      title: this.generateTitle(parsed),
      description: AIRequestParser.generateDescription(parsed),
      keywords: parsed.keywords,
      entities: parsed.entities,
      isActive: true,
      createdAt: new Date(),
      triggeredCount: 0,
    };

    await this.saveAlert(alert);
    return alert;
  }

  /**
   * Get all alerts for a user
   */
  static async getUserAlerts(userId: string): Promise<CustomAlert[]> {
    try {
      const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      if (!alertsJson) return [];

      const allAlerts: CustomAlert[] = JSON.parse(alertsJson);
      return allAlerts
        .filter(alert => alert.userId === userId)
        .map(alert => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          lastTriggered: alert.lastTriggered ? new Date(alert.lastTriggered) : undefined,
        }));
    } catch (error) {
      console.error('Error getting user alerts:', error);
      return [];
    }
  }

  /**
   * Get active alerts for a user
   */
  static async getActiveAlerts(userId: string): Promise<CustomAlert[]> {
    const alerts = await this.getUserAlerts(userId);
    return alerts.filter(alert => alert.isActive);
  }

  /**
   * Save an alert
   */
  static async saveAlert(alert: CustomAlert): Promise<void> {
    try {
      const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      const alerts: CustomAlert[] = alertsJson ? JSON.parse(alertsJson) : [];

      const existingIndex = alerts.findIndex(a => a.id === alert.id);
      if (existingIndex >= 0) {
        alerts[existingIndex] = alert;
      } else {
        alerts.push(alert);
      }

      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  }

  /**
   * Delete an alert
   */
  static async deleteAlert(alertId: string): Promise<void> {
    try {
      const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      if (!alertsJson) return;

      const alerts: CustomAlert[] = JSON.parse(alertsJson);
      const filtered = alerts.filter(alert => alert.id !== alertId);

      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  /**
   * Toggle alert active status
   */
  static async toggleAlert(alertId: string): Promise<void> {
    try {
      const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      if (!alertsJson) return;

      const alerts: CustomAlert[] = JSON.parse(alertsJson);
      const alert = alerts.find(a => a.id === alertId);
      
      if (alert) {
        alert.isActive = !alert.isActive;
        await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      throw error;
    }
  }

  /**
   * Check if a signal matches any active alerts
   */
  static async checkSignalAgainstAlerts(
    userId: string,
    signal: Signal
  ): Promise<CustomAlert[]> {
    const activeAlerts = await this.getActiveAlerts(userId);
    const matchedAlerts: CustomAlert[] = [];

    for (const alert of activeAlerts) {
      if (this.doesSignalMatchAlert(signal, alert)) {
        matchedAlerts.push(alert);
        
        // Update triggered count and timestamp
        alert.triggeredCount += 1;
        alert.lastTriggered = new Date();
        await this.saveAlert(alert);
      }
    }

    return matchedAlerts;
  }

  /**
   * Check if a signal matches an alert's criteria
   */
  private static doesSignalMatchAlert(signal: Signal, alert: CustomAlert): boolean {
    const signalText = `${signal.title} ${signal.summary} ${signal.content || ''} ${signal.tags.join(' ')}`.toLowerCase();
    
    let matchScore = 0;
    let requiredMatches = 0;

    // Check keywords
    if (alert.keywords.length > 0) {
      requiredMatches += 1;
      const keywordMatches = alert.keywords.filter(keyword => 
        signalText.includes(keyword.toLowerCase())
      );
      if (keywordMatches.length > 0) {
        matchScore += keywordMatches.length / alert.keywords.length;
      }
    }

    // Check artists
    if (alert.entities.artists && alert.entities.artists.length > 0) {
      requiredMatches += 1;
      const artistMatches = alert.entities.artists.filter(artist =>
        signalText.includes(artist.toLowerCase())
      );
      if (artistMatches.length > 0) {
        matchScore += 1;
      }
    }

    // Check companies
    if (alert.entities.companies && alert.entities.companies.length > 0) {
      requiredMatches += 1;
      const companyMatches = alert.entities.companies.filter(company =>
        signalText.includes(company.toLowerCase())
      );
      if (companyMatches.length > 0) {
        matchScore += 1;
      }
    }

    // Check products
    if (alert.entities.products && alert.entities.products.length > 0) {
      requiredMatches += 1;
      const productMatches = alert.entities.products.filter(product =>
        signalText.includes(product.toLowerCase())
      );
      if (productMatches.length > 0) {
        matchScore += 1;
      }
    }

    // Check topics
    if (alert.entities.topics && alert.entities.topics.length > 0) {
      requiredMatches += 1;
      const topicMatches = alert.entities.topics.filter(topic =>
        signalText.includes(topic.toLowerCase())
      );
      if (topicMatches.length > 0) {
        matchScore += 1;
      }
    }

    // Match if at least 60% of criteria are met
    const matchThreshold = 0.6;
    return requiredMatches > 0 && (matchScore / requiredMatches) >= matchThreshold;
  }

  /**
   * Create a notification from a matched alert
   */
  static createNotificationFromMatch(alert: CustomAlert, signal: Signal): Notification {
    return {
      id: `alert_${alert.id}_${signal.id}`,
      title: `🎯 ${alert.title}`,
      message: signal.title,
      category: 'Custom Alert',
      urgency: 'high',
      timestamp: new Date(),
      read: false,
      signalId: signal.id,
    };
  }

  /**
   * Generate a title for the alert
   */
  private static generateTitle(parsed: ParsedRequest): string {
    const { entities, keywords } = parsed;

    // Use entity names if available
    if (entities.artists && entities.artists.length > 0) {
      return entities.artists[0];
    }
    if (entities.companies && entities.companies.length > 0) {
      return entities.companies[0];
    }
    if (entities.products && entities.products.length > 0) {
      return entities.products[0];
    }
    if (entities.topics && entities.topics.length > 0) {
      return entities.topics[0];
    }

    // Fall back to first few keywords
    return keywords.slice(0, 2).join(' ') || 'Custom Alert';
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(userId: string): Promise<{
    total: number;
    active: number;
    triggered: number;
  }> {
    const alerts = await this.getUserAlerts(userId);
    return {
      total: alerts.length,
      active: alerts.filter(a => a.isActive).length,
      triggered: alerts.filter(a => a.triggeredCount > 0).length,
    };
  }
}
