import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Shield, AlertTriangle, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { contentWellnessService, ContentWellnessSettings } from '@/lib/contentWellnessService';

export default function ContentWellnessSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<ContentWellnessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await contentWellnessService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading content wellness settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (!settings) return;
    
    const newSettings = { ...settings, enabled: value };
    setSettings(newSettings);
    await contentWellnessService.updateSettings({ enabled: value });
  };

  const handleDailyLimitChange = async (limit: number) => {
    if (!settings) return;
    
    const newSettings = { ...settings, dailyLimit: limit };
    setSettings(newSettings);
    await contentWellnessService.updateSettings({ dailyLimit: limit });
  };

  const handleCooldownChange = async (hours: number) => {
    if (!settings) return;
    
    const newSettings = { ...settings, cooldownPeriod: hours };
    setSettings(newSettings);
    await contentWellnessService.updateSettings({ cooldownPeriod: hours });
  };

  const handleResetHistory = () => {
    Alert.alert(
      'Reset History',
      'Are you sure you want to reset your content wellness history? This will clear all tracked data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await contentWellnessService.resetHistory();
            Alert.alert('Success', 'History has been reset.');
          },
        },
      ]
    );
  };

  const limitOptions = [1, 2, 3, 5, 10];
  const cooldownOptions = [6, 12, 24, 48];

  if (loading || !settings) {
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
        <Text style={styles.headerTitle}>Content Wellness</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable/Disable */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Content Wellness</Text>
              <Text style={styles.settingDescription}>
                Get notified when you're reading potentially sensitive content
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggle}
              trackColor={{ false: Colors.border.light, true: `${Colors.primary}40` }}
              thumbColor={settings.enabled ? Colors.primary : Colors.text.tertiary}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* Daily Limit */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Limit</Text>
              <Text style={styles.sectionDescription}>
                Number of sensitive articles before getting a wellness reminder
              </Text>
              {limitOptions.map((limit) => (
                <TouchableOpacity
                  key={limit}
                  style={[
                    styles.option,
                    settings.dailyLimit === limit && styles.optionSelected
                  ]}
                  onPress={() => handleDailyLimitChange(limit)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    settings.dailyLimit === limit && styles.optionTextSelected
                  ]}>
                    {limit} {limit === 1 ? 'article' : 'articles'}
                  </Text>
                  {settings.dailyLimit === limit && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cooldown Period */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Cooldown</Text>
              <Text style={styles.sectionDescription}>
                Minimum time between wellness reminders
              </Text>
              {cooldownOptions.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.option,
                    settings.cooldownPeriod === hours && styles.optionSelected
                  ]}
                  onPress={() => handleCooldownChange(hours)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    settings.cooldownPeriod === hours && styles.optionTextSelected
                  ]}>
                    {hours} {hours === 1 ? 'hour' : 'hours'}
                  </Text>
                  {settings.cooldownPeriod === hours && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset History */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetHistory}
              >
                <RotateCcw size={20} color={Colors.alert} />
                <Text style={styles.resetButtonText}>Reset History</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <AlertTriangle size={20} color={Colors.accent} />
          <Text style={styles.infoText}>
            This feature helps you maintain a healthy reading balance by monitoring 
            exposure to potentially sensitive topics like violence, politics, or mental health.
          </Text>
        </View>

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
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
  option: {
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
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.alert,
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
