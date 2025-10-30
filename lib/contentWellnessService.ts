import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTENT_WELLNESS_KEY = 'content_wellness_settings';
const SENSITIVE_TOPICS_HISTORY_KEY = 'sensitive_topics_history';

// Sensitive topics that might affect mental health or cause stress
const SENSITIVE_TOPICS = [
  'war', 'violence', 'death', 'suicide', 'depression', 'anxiety', 
  'politics', 'conflict', 'terrorism', 'crime', 'abuse', 'trauma',
  'divorce', 'bankruptcy', 'layoff', 'addiction', 'mental health',
  'election', 'protest', 'riot', 'disaster', 'pandemic'
];

export interface ContentWellnessSettings {
  enabled: boolean;
  sensitiveTopics: string[];
  dailyLimit: number; // Number of sensitive articles before warning
  cooldownPeriod: number; // Hours to wait before showing another warning
}

export interface TopicHistory {
  topic: string;
  count: number;
  lastSeen: number; // timestamp
}

class ContentWellnessService {
  private defaultSettings: ContentWellnessSettings = {
    enabled: true,
    sensitiveTopics: SENSITIVE_TOPICS,
    dailyLimit: 3,
    cooldownPeriod: 24, // 24 hours
  };

  async getSettings(): Promise<ContentWellnessSettings> {
    try {
      const data = await AsyncStorage.getItem(CONTENT_WELLNESS_KEY);
      if (data) {
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
      return this.defaultSettings;
    } catch (error) {
      console.error('Error getting content wellness settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(settings: Partial<ContentWellnessSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(CONTENT_WELLNESS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating content wellness settings:', error);
    }
  }

  async getTopicHistory(): Promise<TopicHistory[]> {
    try {
      const data = await AsyncStorage.getItem(SENSITIVE_TOPICS_HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting topic history:', error);
      return [];
    }
  }

  async updateTopicHistory(topic: string): Promise<void> {
    try {
      const history = await this.getTopicHistory();
      const existingIndex = history.findIndex(item => item.topic === topic);
      
      if (existingIndex >= 0) {
        history[existingIndex].count += 1;
        history[existingIndex].lastSeen = Date.now();
      } else {
        history.push({
          topic,
          count: 1,
          lastSeen: Date.now(),
        });
      }
      
      // Keep only recent history (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filteredHistory = history.filter(item => item.lastSeen > thirtyDaysAgo);
      
      await AsyncStorage.setItem(SENSITIVE_TOPICS_HISTORY_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Error updating topic history:', error);
    }
  }

  async shouldShowWarning(signal: any): Promise<boolean> {
    const settings = await this.getSettings();
    
    if (!settings.enabled) return false;
    
    // Check if the article contains sensitive topics
    const hasSensitiveContent = this.containsSensitiveTopics(signal, settings.sensitiveTopics);
    if (!hasSensitiveContent) return false;
    
    // Update topic history
    for (const topic of settings.sensitiveTopics) {
      if (this.textContainsTopic(signal.title, topic) || this.textContainsTopic(signal.summary, topic)) {
        await this.updateTopicHistory(topic);
      }
    }
    
    // Check if we've exceeded the daily limit
    const todayCount = await this.getTodaySensitiveCount();
    if (todayCount < settings.dailyLimit) return false;
    
    // Check cooldown period
    const lastWarning = await this.getLastWarningTime();
    const cooldownMs = settings.cooldownPeriod * 60 * 60 * 1000;
    if (lastWarning && (Date.now() - lastWarning) < cooldownMs) return false;
    
    return true;
  }

  async recordWarningShown(): Promise<void> {
    try {
      await AsyncStorage.setItem('last_content_warning', Date.now().toString());
    } catch (error) {
      console.error('Error recording warning time:', error);
    }
  }

  private async getTodaySensitiveCount(): Promise<number> {
    try {
      const history = await this.getTopicHistory();
      const today = new Date().toDateString();
      
      return history
        .filter(item => new Date(item.lastSeen).toDateString() === today)
        .reduce((sum, item) => sum + item.count, 0);
    } catch (error) {
      console.error('Error getting today\'s sensitive count:', error);
      return 0;
    }
  }

  private async getLastWarningTime(): Promise<number | null> {
    try {
      const time = await AsyncStorage.getItem('last_content_warning');
      return time ? parseInt(time, 10) : null;
    } catch (error) {
      console.error('Error getting last warning time:', error);
      return null;
    }
  }

  private containsSensitiveTopics(signal: any, sensitiveTopics: string[]): boolean {
    const title = signal.title || '';
    const summary = signal.summary || '';
    const content = signal.content || '';
    const tags = signal.tags || [];
    
    const fullText = `${title} ${summary} ${content} ${tags.join(' ')}`.toLowerCase();
    
    return sensitiveTopics.some(topic => 
      this.textContainsTopic(fullText, topic)
    );
  }

  private textContainsTopic(text: string, topic: string): boolean {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const lowerTopic = topic.toLowerCase();
    
    // Check for exact word matches
    const words = lowerText.split(/\s+/);
    return words.some(word => 
      word.includes(lowerTopic) || 
      lowerTopic.includes(word.replace(/[^\w]/g, ''))
    );
  }

  async resetHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SENSITIVE_TOPICS_HISTORY_KEY);
      await AsyncStorage.removeItem('last_content_warning');
    } catch (error) {
      console.error('Error resetting content wellness history:', error);
    }
  }
}

export const contentWellnessService = new ContentWellnessService();
