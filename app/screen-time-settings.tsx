import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { screenTimeService } from '@/lib/screenTimeService';

export default function ScreenTimeSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(60);
  const [todayUsage, setTodayUsage] = useState(0);
  const [loading, setLoading] = useState(true);

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screen Time</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Usage Today */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Clock size={24} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Today's Usage</Text>
          <Text style={styles.usageTime}>{formatTime(todayUsage)}</Text>
          
          {enabled && (
            <>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(100, usagePercentage)}%`,
                      backgroundColor: usagePercentage >= 100 ? Colors.alert : Colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.remainingText}>
                {usagePercentage >= 100 ? 'Limit exceeded' : `${formatTime(remainingTime)} remaining`}
              </Text>
            </>
          )}
        </View>

        {/* Enable/Disable */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Daily Limit</Text>
              <Text style={styles.settingDescription}>
                Set a daily time limit for app usage
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: Colors.border.light, true: `${Colors.primary}40` }}
              thumbColor={enabled ? Colors.primary : Colors.text.tertiary}
            />
          </View>
        </View>

        {/* Time Limit Options */}
        {enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Limit</Text>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeOption,
                  dailyLimit === option.value && styles.timeOptionSelected
                ]}
                onPress={() => handleLimitChange(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.timeOptionText,
                  dailyLimit === option.value && styles.timeOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {dailyLimit === option.value && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info */}
        {enabled && (
          <View style={styles.infoCard}>
            <AlertCircle size={20} color={Colors.accent} />
            <Text style={styles.infoText}>
              When you reach your daily limit, you'll be prompted to close the app. 
              The timer resets at midnight each day.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.white,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  usageTime: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.background.secondary,
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
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border.lighter,
  },
  timeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  timeOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.accent}10`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.accent}20`,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
