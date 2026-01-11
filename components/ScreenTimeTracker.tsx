import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  BackHandler,
  Platform,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { screenTimeService } from '@/lib/screenTimeService';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

// Import expo-application for app closing functionality
import * as Application from 'expo-application';

interface ScreenTimeTrackerProps {
  children: React.ReactNode;
}

export default function ScreenTimeTracker({ children }: ScreenTimeTrackerProps) {
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const { user } = useApp();
  const { colors, mode } = useTheme();

  useEffect(() => {
    // Start tracking when component mounts
    startTracking();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check screen time limits periodically
    const interval = setInterval(checkScreenTimeLimits, 60000); // Check every minute
    
    // Handle back button on Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // Cleanup
    return () => {
      subscription.remove();
      clearInterval(interval);
      backHandler.remove();
      endTracking();
    };
  }, [user?.id]);

  const startTracking = async () => {
    if (!user?.id) return;
    
    try {
      await screenTimeService.startSession();
    } catch (error) {
      console.error('Error starting screen time tracking:', error);
    }
  };

  const endTracking = async () => {
    try {
      await screenTimeService.endSession();
    } catch (error) {
      console.error('Error ending screen time tracking:', error);
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background, save current session
      await endTracking();
    } else if (nextAppState === 'active') {
      // App is coming to foreground, start new session
      await startTracking();
      // Check limits when app becomes active
      await checkScreenTimeLimits();
    }
  };

  const checkScreenTimeLimits = async () => {
    if (!user?.id) return;
    
    try {
      const limit = await screenTimeService.getLimit();
      if (!limit.enabled) {
        setShowLimitWarning(false);
        return;
      }
      
      const used = await screenTimeService.getTodayUsage();
      const remaining = Math.max(0, limit.dailyLimitMinutes - used);
      setRemainingTime(remaining);
      
      // Show warning when user has 5 minutes left
      if (remaining <= 5 && remaining > 0 && !showLimitWarning) {
        setLimitExceeded(false);
        setShowLimitWarning(true);
      }
      
      // Show limit exceeded warning
      if (remaining <= 0 && !showLimitWarning) {
        setLimitExceeded(true);
        setShowLimitWarning(true);
      }
    } catch (error) {
      console.error('Error checking screen time limits:', error);
    }
  };

  const handleLimitWarningClose = () => {
    setShowLimitWarning(false);
  };

  const handleCloseApp = () => {
    setShowLimitWarning(false);
    
    if (Platform.OS === 'android') {
      // Android: Use BackHandler to exit app
      BackHandler.exitApp();
    } else if (Platform.OS === 'ios') {
      // iOS: On iOS, we cannot programmatically close the app due to Apple's restrictions
      // The best we can do is to minimize the app by going to background
      // Using Linking to App-Prefs is not ideal as it takes user away from the app
      // Instead, we'll just let the app stay open but with the warning closed
      // iOS doesn't allow apps to close themselves programmatically
      
      // expo-application doesn't have a method to close the app on iOS
      // iOS apps cannot be programmatically closed due to platform restrictions
      // We'll just close the modal and let the user decide what to do
    } else {
      // Web: Try to close the window
      if (typeof window !== 'undefined') {
        // For web, try to close the window/tab
        // Note: This will only work if the window was opened by JavaScript
        window.close();
        
        // Fallback: redirect to a blank page or the root to effectively "close" the app
        window.location.href = 'about:blank';
      }
    }
  };

  const handleBackPress = () => {
    // If limit is exceeded and warning is shown, prevent back navigation
    if (showLimitWarning && limitExceeded) {
      return true; // Prevent default behavior
    }
    return false; // Allow default behavior
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      {children}
      
      <Modal
        visible={showLimitWarning}
        transparent
        animationType="fade"
        onRequestClose={handleLimitWarningClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: mode === 'dark' ? 'rgba(15, 15, 15, 0.9)' : 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.background.white,
            shadowColor: mode === 'dark' ? '#000' : '#000',
          }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {limitExceeded ? 'Daily Limit Reached' : 'Approaching Daily Limit'}
            </Text>
            
            <Text style={[styles.modalMessage, { color: colors.text.secondary }]}>
              {limitExceeded 
                ? `You've reached your daily screen time limit of ${formatTime(remainingTime + Math.abs(remainingTime))}.`
                : `You have ${remainingTime} minutes remaining for today.`}
            </Text>
            
            <Text style={[styles.modalDescription, { color: colors.text.tertiary }]}>
              {limitExceeded
                ? 'Taking a break can help you maintain a healthy balance with technology.'
                : 'Consider taking a break soon to maintain a healthy balance with technology.'}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.closeButton, { backgroundColor: colors.background.secondary }]}
                onPress={handleLimitWarningClose}
              >
                <Text style={[styles.closeButtonText, { color: colors.text.primary }]}>
                  {limitExceeded ? 'Continue Anyway' : 'Got it'}
                </Text>
              </TouchableOpacity>
              
              {limitExceeded && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.closeAppButton, { backgroundColor: colors.alert }]}
                  onPress={handleCloseApp}
                >
                  <Text style={[styles.closeAppButtonText, { color: colors.text.inverse }]}>Close App</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButton: {
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeAppButton: {
  },
  closeAppButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});