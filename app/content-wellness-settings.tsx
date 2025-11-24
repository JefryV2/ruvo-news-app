import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Shield, AlertTriangle, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import contentWellnessService from '@/lib/contentWellnessService';
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
        <StatusBar barStyle="dark-content" translucent={true} />
        <Text style={{ color: colors.text.primary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle="dark-content" translucent={true} />
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
          </>
        )}

        {/* Reset History */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.resetButton, { 
              backgroundColor: colors.background.white,
              borderColor: colors.border.lighter
            }]}
            onPress={handleResetHistory}
            activeOpacity={0.7}
          >
            <RotateCcw size={20} color={colors.alert} />
            <Text style={[styles.resetButtonText, { color: colors.alert }]}>Reset History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.background.white,
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
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionSelected: {
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.background.white,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.alert,
    marginLeft: 8,
  },
});