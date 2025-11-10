import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { 
  User as UserIcon, 
  ChevronLeft, 
  Moon, 
  Sun, 
  Settings as SettingsIcon, 
  LogOut, 
  Info, 
  MessageCircle, 
  Heart, 
  ChevronRight,
  Bell,
  Mail,
  Smartphone,
  Globe,
  TrendingUp,
  Bookmark,
  Eye,
  Calendar,
  Download,
  Trash2,
  Plus,
  X,
  Clock
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { INTERESTS } from '@/constants/mockData';
import { 
  useProfileStats, 
  useAccountSettings, 
  useUpdateAccountSettings,
  useSignOut,
  useDeleteAccount,
  useExportUserData
} from '@/lib/hooks';

export default function ProfileScreen() {
  const { user, signals, updateUserInterests, setEchoControlEnabled, echoControlEnabled, setEchoControlGrouping, echoControlGrouping, setCustomKeywords, customKeywords } = useApp();
  const { t } = useLanguage();
  const { mode, colors, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [showInterests, setShowInterests] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  
  // Backend hooks
  const { data: profileStats, isLoading: statsLoading } = useProfileStats(user?.id || '');
  const { data: accountSettings, isLoading: settingsLoading } = useAccountSettings();
  const updateSettings = useUpdateAccountSettings();
  const signOutMutation = useSignOut();
  const deleteAccountMutation = useDeleteAccount();
  const exportDataMutation = useExportUserData();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const interestsAnim = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  const userInterestCount = user?.interests?.length || 0;
  
  const toggleInterest = (interestId: string) => {
    const currentInterests = user?.interests || [];
    let newInterests: string[];
    
    if (currentInterests.includes(interestId)) {
      newInterests = currentInterests.filter(id => id !== interestId);
    } else {
      newInterests = [...currentInterests, interestId];
    }
    
    updateUserInterests(newInterests);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutMutation.mutateAsync();
              router.replace('/auth/sign-in');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete all your data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (user?.id) {
                        await deleteAccountMutation.mutateAsync(user.id);
                        router.replace('/auth/sign-in');
                      }
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      if (user?.id) {
        const data = await exportDataMutation.mutateAsync(user.id);
        Alert.alert(
          'Export Complete',
          'Your data has been exported. Check your downloads folder.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export data');
    }
  };

  const handleToggleSetting = async (setting: string, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [setting]: value });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update setting');
    }
  };

  const handleToggleStatus = () => {
    setIsActive(!isActive);
    // Here you could also save to backend if needed
  };

  const handleToggleEchoControl = (value: boolean) => {
    setEchoControlEnabled(value);
    // Here you could also save to backend if needed
  };

  const handleGroupingChange = (grouping: 'source' | 'topic' | 'title' | 'keyword') => {
    setEchoControlGrouping(grouping);
    // Here you could also save to backend if needed
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !customKeywords.includes(newKeyword.trim())) {
      setCustomKeywords([...customKeywords, newKeyword.trim()]);
      setNewKeyword('');
      // Here you could also save to backend if needed
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== keyword));
    // Here you could also save to backend if needed
  };

  const handleAccountSettings = () => {
    router.push('/account-settings');
  };

  useEffect(() => {
    // Stagger animations
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
      Animated.spring(avatarScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate interests section
  useEffect(() => {
    Animated.timing(interestsAnim, {
      toValue: showInterests ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showInterests]);

  // Animate settings section
  useEffect(() => {
    Animated.timing(settingsAnim, {
      toValue: showSettings ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSettings]);

  // Animate stats section
  useEffect(() => {
    Animated.timing(statsAnim, {
      toValue: showStats ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showStats]);

  // Filter liked and saved signals
  const likedSignals = signals.filter(signal => signal.liked).slice(0, 3); // Show only first 3
  const savedSignals = signals.filter(signal => signal.saved).slice(0, 3); // Show only first 3

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'Just now';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
        <Text style={[styles.headerTagline, { color: colors.text.secondary }]}>Cut the Noise. Catch the Signal.</Text>
      </View>
      
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navIcon}>
          <ChevronLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('profile.me')}</Text>
        <TouchableOpacity style={styles.navIcon} onPress={toggle}>
          {mode === 'dark' ? <Sun size={18} color={colors.text.primary} /> : <Moon size={18} color={colors.text.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 28 }}>
        <Animated.View 
          style={[
            styles.headerCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View 
            style={[
              styles.avatar,
              {
                transform: [{ scale: avatarScale }],
                backgroundColor: colors.card.secondary,
              },
            ]}
          > 
            <UserIcon size={28} color={colors.primary} />
          </Animated.View>
          <Text style={styles.username}>{user?.username || 'John Doe'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          {profileStats && (
            <TouchableOpacity 
              style={styles.statsButton}
              onPress={() => setShowStats(!showStats)}
              activeOpacity={0.7}
            >
              <Text style={styles.statsButtonText}>
                {showStats ? t('profile.hideStats') : t('profile.viewStats')}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: statsAnim,
              maxHeight: showStats ? 200 : 0,
              overflow: 'hidden',
            }
          ]}
        >
          {profileStats && (
            <>
              <Text style={styles.sectionLabel}>Activity Stats</Text>
              <View style={[styles.statsCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
                <View style={styles.statItem}>
                  <Heart size={20} color={colors.alert} />
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>{profileStats.totalLikes || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Likes</Text>
                </View>
                <View style={styles.statItem}>
                  <Bookmark size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>{profileStats.totalSaved || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Saved</Text>
                </View>
                <View style={styles.statItem}>
                  <Eye size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>{profileStats.totalRead || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Read</Text>
                </View>
                <View style={styles.statItem}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text.primary }]}> 
                    {profileStats.joinedDate ? new Date(profileStats.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Joined</Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>{t('profile.account')}</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={handleToggleStatus}>
              <Row 
                icon={<Dot />} 
                title={t('profile.activeStatus')} 
                subtitle={isActive ? t('profile.online') : t('profile.offline')} 
                trailing={<Switch
                  value={isActive}
                  onValueChange={handleToggleStatus}
                  trackColor={{ false: colors.border.lighter, true: colors.primary }}
                  thumbColor={colors.background.white}
                />}
              />
            </TouchableOpacity>
            <Row icon={<Dot />} title={t('profile.username')} subtitle={user?.username ? `${t('profile.anonymousUrl')}/${user.username}` : `${t('profile.anonymousUrl')}/username`} trailing={<Info size={16} color={colors.text.secondary} />} />
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>Library</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={() => router.push('/liked-articles')}>
              <Row 
                icon={<Heart size={16} color={colors.alert} />} 
                title="Liked Articles" 
                subtitle={`${profileStats?.totalLikes || 0} articles`}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/saved-articles')}>
              <Row 
                icon={<Bookmark size={16} color={colors.primary} />} 
                title="Saved Articles" 
                subtitle={`${profileStats?.totalSaved || 0} articles`}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Liked Articles Preview */}
        {likedSignals.length > 0 && (
          <Animated.View 
            style={[
              styles.sectionBlock,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Recently Liked</Text>
              <TouchableOpacity onPress={() => router.push('/liked-articles')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.articlesPreviewContainer, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
              {likedSignals.map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={styles.articlePreviewCard}
                  onPress={() => router.push(`/article-detail?id=${signal.id}`)}
                >
                  <View style={styles.articlePreviewContent}>
                    <Text style={[styles.articlePreviewTitle, { color: colors.text.primary }]} numberOfLines={2}>
                      {signal.title}
                    </Text>
                    <View style={styles.articlePreviewMeta}>
                      <Text style={[styles.articlePreviewSource, { color: colors.text.tertiary }]} numberOfLines={1}>
                        {signal.sourceName}
                      </Text>
                      <View style={styles.timeContainer}>
                        <Clock size={11} color={colors.text.tertiary} />
                        <Text style={[styles.articlePreviewTime, { color: colors.text.tertiary }]}>
                          {formatTimeAgo(signal.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.likedBadgeSmall, { backgroundColor: colors.card.light }]}>
                    <Heart size={12} color={colors.alert} fill={colors.alert} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Saved Articles Preview */}
        {savedSignals.length > 0 && (
          <Animated.View 
            style={[
              styles.sectionBlock,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Recently Saved</Text>
              <TouchableOpacity onPress={() => router.push('/saved-articles')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.articlesPreviewContainer, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
              {savedSignals.map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={styles.articlePreviewCard}
                  onPress={() => router.push(`/article-detail?id=${signal.id}`)}
                >
                  <View style={styles.articlePreviewContent}>
                    <Text style={[styles.articlePreviewTitle, { color: colors.text.primary }]} numberOfLines={2}>
                      {signal.title}
                    </Text>
                    <View style={styles.articlePreviewMeta}>
                      <Text style={[styles.articlePreviewSource, { color: colors.text.tertiary }]} numberOfLines={1}>
                        {signal.sourceName}
                      </Text>
                      <View style={styles.timeContainer}>
                        <Clock size={11} color={colors.text.tertiary} />
                        <Text style={[styles.articlePreviewTime, { color: colors.text.tertiary }]}>
                          {formatTimeAgo(signal.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.savedBadgeSmall, { backgroundColor: colors.card.light }]}>
                    <Bookmark size={12} color={colors.primary} fill={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>{t('profile.interests')}</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={() => setShowInterests(!showInterests)}>
              <Row 
                icon={<Heart size={16} color={colors.primary} />} 
                title={t('profile.interests')} 
                subtitle={`${userInterestCount} ${t('profile.selected')}`}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
          </View>
          
          <Animated.View 
            style={[
              {
                opacity: interestsAnim,
                maxHeight: showInterests ? 500 : 0,
                overflow: 'hidden',
              }
            ]}
          >
            <View style={styles.interestsGrid}>
              {INTERESTS.map((interest) => {
                const isSelected = user?.interests?.includes(interest.id);
                return (
                  <Pressable
                    key={interest.id}
                    style={[styles.interestChip, 
                      { backgroundColor: colors.background.tertiary, borderColor: colors.border.light },
                      isSelected && [styles.interestChipSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                    onPress={() => toggleInterest(interest.id)}
                    android_ripple={{ color: colors.primary + '40' }}
                  >
                    <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                    <Text style={[styles.interestText, 
                      { color: colors.text.primary },
                      isSelected && styles.interestTextSelected, 
                      isSelected && { color: colors.text.inverse }
                    ]}>
                      {interest.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>{t('profile.preferences')}</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
              <Row 
                icon={<Bell size={16} color={colors.primary} />} 
                title={t('profile.notifications')} 
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
            <Row 
              icon={<Globe size={16} color={colors.primary} />} 
              title={t('profile.language')} 
              subtitle={accountSettings?.language === 'en' ? 'English' : '한국어'}
            />
            <Row 
              icon={<TrendingUp size={16} color={colors.primary} />} 
              title="Echo Control" 
              subtitle={echoControlEnabled ? "Enabled" : "Disabled"}
              trailing={<Switch
                value={echoControlEnabled}
                onValueChange={handleToggleEchoControl}
                trackColor={{ false: colors.border.lighter, true: colors.primary }}
                thumbColor={colors.background.white}
              />}
            />
            {echoControlEnabled && (
              <>
                <View style={[styles.settingsCard, { backgroundColor: colors.card.elevated, borderColor: colors.border.lighter }]}> 
                  <View style={styles.settingRow}>
                    <Text style={[styles.settingText, { color: colors.text.primary }]}>Grouping Method</Text>
                    <View style={styles.settingsGroupingOptions}>
                      <TouchableOpacity 
                        style={[styles.settingsGroupingOption, 
                          { backgroundColor: colors.background.tertiary },
                          echoControlGrouping === 'source' && [styles.settingsGroupingOptionSelected, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => handleGroupingChange('source')}
                      >
                        <Text style={[styles.settingsGroupingOptionText, 
                          { color: colors.text.primary },
                          echoControlGrouping === 'source' && [styles.settingsGroupingOptionTextSelected, { color: colors.text.inverse }]
                        ]}>Source</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.settingsGroupingOption, 
                          { backgroundColor: colors.background.tertiary },
                          echoControlGrouping === 'topic' && [styles.settingsGroupingOptionSelected, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => handleGroupingChange('topic')}
                      >
                        <Text style={[styles.settingsGroupingOptionText, 
                          { color: colors.text.primary },
                          echoControlGrouping === 'topic' && [styles.settingsGroupingOptionTextSelected, { color: colors.text.inverse }]
                        ]}>Topic</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.settingsGroupingOption, 
                          { backgroundColor: colors.background.tertiary },
                          echoControlGrouping === 'title' && [styles.settingsGroupingOptionSelected, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => handleGroupingChange('title')}
                      >
                        <Text style={[styles.settingsGroupingOptionText, 
                          { color: colors.text.primary },
                          echoControlGrouping === 'title' && [styles.settingsGroupingOptionTextSelected, { color: colors.text.inverse }]
                        ]}>Title</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.settingsGroupingOption, 
                          { backgroundColor: colors.background.tertiary },
                          echoControlGrouping === 'keyword' && [styles.settingsGroupingOptionSelected, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => handleGroupingChange('keyword')}
                      >
                        <Text style={[styles.settingsGroupingOptionText, 
                          { color: colors.text.primary },
                          echoControlGrouping === 'keyword' && [styles.settingsGroupingOptionTextSelected, { color: colors.text.inverse }]
                        ]}>Keyword</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {echoControlGrouping === 'keyword' && (
                    <View style={[styles.settingsKeywordSection, { backgroundColor: colors.background.light }]}> 
                      <Text style={[styles.settingText, { color: colors.text.primary }]}>Custom Keywords</Text>
                      <View style={styles.settingsKeywordInputContainer}>
                        <TextInput
                          style={[styles.settingsKeywordInput, { 
                            backgroundColor: colors.background.white, 
                            color: colors.text.primary, 
                            borderColor: colors.border.lighter 
                          }]}
                          value={newKeyword}
                          onChangeText={setNewKeyword}
                          placeholder="Add keyword..."
                          placeholderTextColor={colors.text.tertiary}
                        />
                        <TouchableOpacity style={[styles.settingsKeywordAddButton, { backgroundColor: colors.primary }]} onPress={handleAddKeyword}>
                          <Plus size={16} color={colors.text.inverse} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.settingsKeywordList}>
                        {customKeywords.map((keyword, index) => (
                          <View key={index} style={[styles.settingsKeywordChip, { backgroundColor: colors.primary }]}> 
                            <Text style={styles.settingsKeywordChipText}>{keyword}</Text>
                            <TouchableOpacity onPress={() => handleRemoveKeyword(keyword)}>
                              <X size={14} color={colors.text.inverse} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
            <Row 
              icon={<MessageCircle size={16} color={colors.primary} />} 
              title={t('profile.help')} 
              trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
            />
          </View>

          <Animated.View 
            style={[
              {
                opacity: settingsAnim,
                maxHeight: showSettings ? 500 : 0,
                overflow: 'hidden',
              }
            ]}
          >
            {accountSettings && (
              <View style={[styles.settingsCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Smartphone size={18} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text.primary }]}>Push Notifications</Text>
                  </View>
                  <Switch
                    value={accountSettings.pushNotifications}
                    onValueChange={(value) => handleToggleSetting('pushNotifications', value)}
                    trackColor={{ false: colors.border.lighter, true: colors.primary }}
                    thumbColor={colors.background.white}
                  />
                </View>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Mail size={18} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text.primary }]}>Email Notifications</Text>
                  </View>
                  <Switch
                    value={accountSettings.emailNotifications}
                    onValueChange={(value) => handleToggleSetting('emailNotifications', value)}
                    trackColor={{ false: colors.border.lighter, true: colors.primary }}
                    thumbColor={colors.background.white}
                  />
                </View>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Smartphone size={18} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text.primary }]}>SMS Notifications</Text>
                  </View>
                  <Switch
                    value={accountSettings.smsNotifications}
                    onValueChange={(value) => handleToggleSetting('smsNotifications', value)}
                    trackColor={{ false: colors.border.lighter, true: colors.primary }}
                    thumbColor={colors.background.white}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>{t('profile.account')}</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={handleAccountSettings}>
              <Row 
                icon={<SettingsIcon size={16} color={colors.primary} />} 
                title={t('profile.accountSettings')} 
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportData} disabled={exportDataMutation.isPending}>
              <Row 
                icon={<Download size={16} color={colors.primary} />} 
                title={t('profile.exportData')} 
                trailing={exportDataMutation.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : <ChevronRight size={16} color={colors.text.secondary} />}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Row 
                icon={<Trash2 size={16} color={colors.alert} />} 
                title={t('profile.deleteAccount')} 
                titleStyle={{ color: colors.alert }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Row 
                icon={<LogOut size={16} color={colors.alert} />} 
                title={t('profile.logout')} 
                titleStyle={{ color: colors.alert }}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      <View style={{ height: (Platform.OS === 'web' ? 0 : 140 + insets.bottom), backgroundColor: colors.background.primary }} />
    </View>
  );
}

function Dot() {
  return (
    <View style={styles.dot} />
  );
}

type RowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  titleStyle?: any;
};

function Row({ icon, title, subtitle, trailing, titleStyle }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBubble}>{icon}</View>
        <View>
          <Text style={[styles.rowTitle, titleStyle]}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    // Ensure full height on web to avoid mid-page cutoff
    minHeight: (Platform.OS === 'web' ? (undefined as any) : undefined),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 28 : 36,
    fontWeight: '800' as const,
    fontFamily: Fonts.bold,
    color: 'inherit',
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: Fonts.regular,
    color: 'inherit',
    letterSpacing: 0.5,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.text.primary,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  statsButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
  },
  statsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    marginTop: 12,
    backgroundColor: Colors.background.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    padding: 16,
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  sectionBlock: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 8,
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.background.secondary,
  },
  interestChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestEmoji: {
    fontSize: 16,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  interestTextSelected: {
    color: Colors.text.inverse,
  },
  settingsGroupingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  settingsGroupingOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
  },
  settingsGroupingOptionSelected: {
    backgroundColor: Colors.primary,
  },
  settingsGroupingOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  settingsGroupingOptionTextSelected: {
    color: Colors.text.inverse,
  },
  settingsKeywordSection: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    marginTop: 12,
  },
  settingsKeywordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  settingsKeywordInput: {
    flex: 1,
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  settingsKeywordAddButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsKeywordAddButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  settingsKeywordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingsKeywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  settingsKeywordChipText: {
    color: Colors.text.inverse,
    fontSize: 13,
    fontWeight: '500',
  },
  settingsKeywordChipRemove: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  articlesPreviewContainer: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    padding: 12,
  },
  articlePreviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  articlePreviewContent: {
    flex: 1,
    marginRight: 12,
  },
  articlePreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  articlePreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articlePreviewSource: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.tertiary,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  articlePreviewTime: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  likedBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Remove last border from rows
const removeLastBorder = (index: number, total: number) => {
  return index === total - 1 ? { borderBottomWidth: 0 } : {};
};