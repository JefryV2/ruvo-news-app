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
import { useTheme } from '@/contexts/ThemeContext';

export default function ContentWellnessSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.primary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background.primary,
        borderBottomColor: colors.border.light
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Content Wellness</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable/Disable */}
        <View style={styles.section}>
          <View style={[styles.settingRow, { 
            backgroundColor: colors.background.white,
            borderColor: colors.border.lighter
          }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Content Wellness</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Get notified when you're reading potentially sensitive content
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border.light, true: `${colors.primary}40` }}
              thumbColor={settings.enabled ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* Daily Limit */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Daily Limit</Text>
              <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                Number of sensitive articles before getting a wellness reminder
              </Text>
              {limitOptions.map((limit) => (
                <TouchableOpacity
                  key={limit}
                  style={[
                    styles.option,
                    settings.dailyLimit === limit && styles.optionSelected,
                    { 
                      backgroundColor: settings.dailyLimit === limit ? `${colors.primary}08` : colors.background.white,
                      borderColor: settings.dailyLimit === limit ? colors.primary : colors.border.lighter
                    }
                  ]}
                  onPress={() => handleDailyLimitChange(limit)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    settings.dailyLimit === limit && styles.optionTextSelected,
                    { 
                      color: settings.dailyLimit === limit ? colors.primary : colors.text.primary,
                      fontWeight: settings.dailyLimit === limit ? '600' : '500'
                    }
                  ]}>
                    {limit} {limit === 1 ? 'article' : 'articles'}
                  </Text>
                  {settings.dailyLimit === limit && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cooldown Period */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Reminder Cooldown</Text>
              <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                Minimum time between wellness reminders
              </Text>
              {cooldownOptions.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.option,
                    settings.cooldownPeriod === hours && styles.optionSelected,
                    { 
                      backgroundColor: settings.cooldownPeriod === hours ? `${colors.primary}08` : colors.background.white,
                      borderColor: settings.cooldownPeriod === hours ? colors.primary : colors.border.lighter
                    }
                  ]}
                  onPress={() => handleCooldownChange(hours)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    settings.cooldownPeriod === hours && styles.optionTextSelected,
                    { 
                      color: settings.cooldownPeriod === hours ? colors.primary : colors.text.primary,
                      fontWeight: settings.cooldownPeriod === hours ? '600' : '500'
                    }
                  ]}>
                    {hours} {hours === 1 ? 'hour' : 'hours'}
                  </Text>
                  {settings.cooldownPeriod === hours && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset History */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={[styles.resetButton, { 
                  backgroundColor: colors.background.white,
                  borderColor: colors.border.lighter
                }]}
                onPress={handleResetHistory}
              >
                <RotateCcw size={20} color={colors.alert} />
                <Text style={[styles.resetButtonText, { color: colors.alert }]}>Reset History</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Info */}
        <View style={[styles.infoCard, { 
          backgroundColor: `${colors.accent}10`,
          borderColor: `${colors.accent}20`
        }]}>
          <AlertTriangle size={20} color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
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
    padding: 4,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
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
  },
  optionText: {
    fontSize: 16,
  },
  optionTextSelected: {
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    lineHeight: 20,
  },
});