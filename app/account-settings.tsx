import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Globe, 
  Bell, 
  Smartphone, 
  Shield, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccountSettings, useUpdateAccountSettings, useUpdateUser } from '@/lib/hooks';

export default function AccountSettingsScreen() {
  const { user } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    language: language,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });
  
  // Backend hooks
  const { data: accountSettings, isLoading } = useAccountSettings();
  const updateSettings = useUpdateAccountSettings();
  const updateUser = useUpdateUser();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (accountSettings) {
      setFormData({
        username: user?.username || '',
        email: user?.email || '',
        language: accountSettings.language || 'en',
        pushNotifications: accountSettings.pushNotifications ?? true,
        emailNotifications: accountSettings.emailNotifications ?? true,
        smsNotifications: accountSettings.smsNotifications ?? false,
      });
    }
  }, [accountSettings, user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = async () => {
    try {
      // Update user profile data
      if (user?.id) {
        await updateUser.mutateAsync({
          id: user.id,
          updates: {
            username: formData.username,
            email: formData.email,
            language: formData.language,
          }
        });
      }
      
      // Update account settings
      await updateSettings.mutateAsync({
        language: formData.language,
        pushNotifications: formData.pushNotifications,
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
      });
      
      setIsEditing(false);
      Alert.alert(t('common.success'), t('account.settingsSaved'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('account.settingsError'));
    }
  };

  const handleCancel = () => {
    if (accountSettings) {
      setFormData({
        username: user?.username || '',
        email: user?.email || '',
        language: accountSettings.language || 'en',
        pushNotifications: accountSettings.pushNotifications ?? true,
        emailNotifications: accountSettings.emailNotifications ?? true,
        smsNotifications: accountSettings.smsNotifications ?? false,
      });
    }
    setIsEditing(false);
  };

  const handleToggleSetting = (setting: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [setting]: value }));
    setIsEditing(true);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setFormData(prev => ({ ...prev, language: newLanguage }));
    setLanguage(newLanguage as 'en' | 'ko');
    setIsEditing(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
        <View style={styles.headerRight}>
          {isEditing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
                disabled={updateSettings.isPending}
              >
                <Save size={16} color={Colors.text.inverse} />
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Profile Information */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('account.profile')}</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <User size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>{t('account.username')}</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={formData.username}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, username: text }));
                    setIsEditing(true);
                  }}
                  placeholder={t('account.username')}
                  placeholderTextColor={Colors.text.tertiary}
                />
              ) : (
                <Text style={styles.infoValue}>{formData.username}</Text>
              )}
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Mail size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>{t('account.email')}</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    setIsEditing(true);
                  }}
                  placeholder={t('account.email')}
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{formData.email}</Text>
              )}
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Globe size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>{t('account.language')}</Text>
              </View>
              {isEditing ? (
                <View style={styles.languageSelector}>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      formData.language === 'en' && styles.languageOptionSelected
                    ]}
                    onPress={() => handleLanguageChange('en')}
                  >
                    <Text style={[
                      styles.languageText,
                      formData.language === 'en' && styles.languageTextSelected
                    ]}>English</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      formData.language === 'ko' && styles.languageOptionSelected
                    ]}
                    onPress={() => handleLanguageChange('ko')}
                  >
                    <Text style={[
                      styles.languageText,
                      formData.language === 'ko' && styles.languageTextSelected
                    ]}>한국어</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.infoValue}>
                  {formData.language === 'en' ? 'English' : '한국어'}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Notification Settings */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
                <Text style={styles.sectionTitle}>{t('account.notifications')}</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>{t('account.pushNotifications')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.pushDesc')}
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.pushNotifications}
                onValueChange={(value) => handleToggleSetting('pushNotifications', value)}
                trackColor={{ false: Colors.border.lighter, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Mail size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>{t('account.emailNotifications')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.emailDesc')}
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.emailNotifications}
                onValueChange={(value) => handleToggleSetting('emailNotifications', value)}
                trackColor={{ false: Colors.border.lighter, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Smartphone size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>{t('account.smsNotifications')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.smsDesc')}
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.smsNotifications}
                onValueChange={(value) => handleToggleSetting('smsNotifications', value)}
                trackColor={{ false: Colors.border.lighter, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>
          </View>
        </Animated.View>

        {/* Privacy & Security */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('account.privacy')}</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Shield size={20} color={Colors.primary} />
                <Text style={styles.actionTitle}>{t('account.changePassword')}</Text>
              </View>
              <ChevronLeft size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Eye size={20} color={Colors.primary} />
                <Text style={styles.actionTitle}>{t('account.privacySettings')}</Text>
              </View>
              <ChevronLeft size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    fontFamily: Fonts.semiBold,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
    fontFamily: Fonts.semiBold,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
    fontFamily: Fonts.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    fontFamily: Fonts.semiBold,
  },
  card: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
    minHeight: 48,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    fontFamily: Fonts.medium,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontFamily: Fonts.regular,
  },
  textInput: {
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background.secondary,
    minWidth: 100,
    maxWidth: 150,
    textAlign: 'right',
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  languageOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  languageText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: Fonts.regular,
  },
  languageTextSelected: {
    color: Colors.text.inverse,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    fontFamily: Fonts.medium,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    fontFamily: Fonts.medium,
  },
});
