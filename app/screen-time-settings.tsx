import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { screenTimeService } from '@/lib/screenTimeService';
import { useTheme } from '@/contexts/ThemeContext';
import { useWellbeingPreferences } from '@/lib/contentWellbeingPreferences';

export default function ScreenTimeSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(60);
  const [todayUsage, setTodayUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { preferences: wellbeingPreferences, setPreference, loading: prefsLoading } = useWellbeingPreferences();

  const timeOptions = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const limit = await screenTimeService.getLimit();
      const usage = await screenTimeService.getTodayUsage();
      
      setEnabled(limit.enabled);
      setDailyLimit(limit.dailyLimitMinutes);
      setTodayUsage(usage);
    } catch (error) {
      console.error('Error loading screen time settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await screenTimeService.setLimit({
      enabled: value,
      dailyLimitMinutes: dailyLimit,
    });
  };

  const handleLimitChange = async (minutes: number) => {
    setDailyLimit(minutes);
    await screenTimeService.setLimit({
      enabled,
      dailyLimitMinutes: minutes,
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const remainingTime = Math.max(0, dailyLimit - todayUsage);
  const usagePercentage = (todayUsage / dailyLimit) * 100;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.primary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>      
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />

      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background.primary,
        borderBottomColor: colors.border.light
      }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
          activeOpacity={0.85}
        >
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Screen Time</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Usage Today */}
        <View style={[styles.card, { 
          backgroundColor: colors.card.secondary,
          borderColor: colors.border.lighter
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Clock size={24} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>Today's Usage</Text>
          <Text style={[styles.usageTime, { color: colors.text.primary }]}>{formatTime(todayUsage)}</Text>
          
          {enabled && (
            <>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.background.secondary }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(100, usagePercentage)}%`,
                      backgroundColor: usagePercentage >= 100 ? colors.alert : colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.remainingText, { color: colors.text.secondary }]}>
                {usagePercentage >= 100 ? 'Limit exceeded' : `${formatTime(remainingTime)} remaining`}
              </Text>
            </>
          )}
        </View>

        {/* Enable/Disable */}
        <View style={styles.section}>
          <View style={[styles.settingRow, { 
            backgroundColor: colors.card.secondary,
            borderColor: colors.border.lighter
          }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Daily Limit</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Set a daily time limit for app usage
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border.light, true: `${colors.primary}40` }}
              thumbColor={enabled ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* Time Limit Options */}
        {enabled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Daily Limit</Text>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeOption,
                  dailyLimit === option.value && styles.timeOptionSelected,
                  { 
                    backgroundColor: dailyLimit === option.value ? `${colors.primary}15` : colors.card.secondary,
                    borderColor: dailyLimit === option.value ? colors.primary : colors.border.lighter
                  }
                ]}
                onPress={() => handleLimitChange(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.timeOptionText,
                  dailyLimit === option.value && styles.timeOptionTextSelected,
                  { 
                    color: dailyLimit === option.value ? colors.primary : colors.text.primary,
                    fontWeight: dailyLimit === option.value ? '600' : '500'
                  }
                ]}>
                  {option.label}
                </Text>
                {dailyLimit === option.value && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info */}
        {enabled && (
          <View style={[styles.infoCard, { 
            backgroundColor: colors.card.secondary,
            borderColor: colors.border.lighter
          }]}>
            <AlertCircle size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              When you reach your daily limit, you'll be prompted to close the app. 
              The timer resets at midnight each day.
            </Text>
          </View>
        )}

        {/* Wellbeing Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Wellbeing</Text>
          <View style={[styles.settingRow, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Track reading patterns</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Log time spent per category to understand your habits.
              </Text>
            </View>
            <Switch
              value={wellbeingPreferences.trackingEnabled}
              onValueChange={(value) => {
                setPreference({ trackingEnabled: value });
              }}
              disabled={prefsLoading}
              trackColor={{ false: colors.border.light, true: `${colors.primary}40` }}
              thumbColor={wellbeingPreferences.trackingEnabled ? colors.primary : colors.text.tertiary}
            />
          </View>

          <View style={[styles.settingRow, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter, marginTop: 12 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Sensitive content warnings</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Show alerts when articles may be emotionally heavy.
              </Text>
            </View>
            <Switch
              value={wellbeingPreferences.showSensitiveBanner}
              onValueChange={(value) => {
                setPreference({ showSensitiveBanner: value });
              }}
              disabled={prefsLoading}
              trackColor={{ false: colors.border.light, true: `${colors.primary}40` }}
              thumbColor={wellbeingPreferences.showSensitiveBanner ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  usageTime: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
  },
  timeOptionSelected: {
  },
  timeOptionText: {
    fontSize: 16,
  },
  timeOptionTextSelected: {
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});