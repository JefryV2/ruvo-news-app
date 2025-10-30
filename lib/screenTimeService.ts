import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const SCREEN_TIME_KEY = 'screen_time_data';
const SCREEN_TIME_LIMIT_KEY = 'screen_time_limit';
const DEFAULT_LIMIT = 60; // 60 minutes default

export interface ScreenTimeData {
  date: string; // YYYY-MM-DD format
  minutesUsed: number;
  lastActiveTime: number;
}

export interface ScreenTimeLimit {
  enabled: boolean;
  dailyLimitMinutes: number;
}

class ScreenTimeService {
  private sessionStartTime: number | null = null;
  private currentData: ScreenTimeData | null = null;
  private appStateSubscription: any = null;

  async getLimit(): Promise<ScreenTimeLimit> {
    try {
      const data = await AsyncStorage.getItem(SCREEN_TIME_LIMIT_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return { enabled: false, dailyLimitMinutes: DEFAULT_LIMIT };
    } catch (error) {
      console.error('Error getting screen time limit:', error);
      return { enabled: false, dailyLimitMinutes: DEFAULT_LIMIT };
    }
  }

  async setLimit(limit: ScreenTimeLimit): Promise<void> {
    try {
      await AsyncStorage.setItem(SCREEN_TIME_LIMIT_KEY, JSON.stringify(limit));
    } catch (error) {
      console.error('Error setting screen time limit:', error);
    }
  }

  async getTodayUsage(): Promise<number> {
    const today = this.getTodayDate();
    const data = await this.getScreenTimeData();
    
    if (data && data.date === today) {
      return data.minutesUsed;
    }
    return 0;
  }

  async getRemainingTime(): Promise<number> {
    const limit = await this.getLimit();
    const used = await this.getTodayUsage();
    return Math.max(0, limit.dailyLimitMinutes - used);
  }

  async hasExceededLimit(): Promise<boolean> {
    const limit = await this.getLimit();
    if (!limit.enabled) return false;
    
    const used = await this.getTodayUsage();
    return used >= limit.dailyLimitMinutes;
  }

  async startSession(): Promise<void> {
    this.sessionStartTime = Date.now();
    this.currentData = await this.getScreenTimeData();
    
    // Subscribe to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  async endSession(): Promise<void> {
    if (this.sessionStartTime) {
      await this.saveSessionTime();
      this.sessionStartTime = null;
    }
    
    // Unsubscribe from app state changes
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      await this.saveSessionTime();
    } else if (nextAppState === 'active') {
      this.sessionStartTime = Date.now();
    }
  };

  private async saveSessionTime(): Promise<void> {
    if (!this.sessionStartTime) return;

    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000 / 60); // Convert to minutes
    const today = this.getTodayDate();

    let data = this.currentData;
    
    if (!data || data.date !== today) {
      // New day, reset
      data = {
        date: today,
        minutesUsed: 0,
        lastActiveTime: Date.now(),
      };
    }

    data.minutesUsed += sessionDuration;
    data.lastActiveTime = Date.now();

    await this.setScreenTimeData(data);
    this.currentData = data;
    this.sessionStartTime = Date.now(); // Reset for next interval
  }

  private async getScreenTimeData(): Promise<ScreenTimeData | null> {
    try {
      const data = await AsyncStorage.getItem(SCREEN_TIME_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error getting screen time data:', error);
      return null;
    }
  }

  private async setScreenTimeData(data: ScreenTimeData): Promise<void> {
    try {
      await AsyncStorage.setItem(SCREEN_TIME_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting screen time data:', error);
    }
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

export const screenTimeService = new ScreenTimeService();
