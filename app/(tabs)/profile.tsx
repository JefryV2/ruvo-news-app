import React, { useRef, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Switch,
  TextInput,
  Pressable,
  Platform,
  StatusBar,
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
  Clock,
  RefreshCw,
  ChevronUp,
  ChevronDown,
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
import { communityService } from '@/lib/communityService';
import { showPrompt, showAlert } from '@/lib/alertService';
import { ConfirmationModal } from '@/components/ConfirmationModal';

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
  const [showFriends, setShowFriends] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // Backend hooks
  const { data: profileStats, isLoading: statsLoading } = useProfileStats(user?.id || '');
  const { data: accountSettings, isLoading: settingsLoading } = useAccountSettings();
  const updateSettings = useUpdateAccountSettings();
  const signOutMutation = useSignOut();
  const deleteAccountMutation = useDeleteAccount();
  const exportDataMutation = useExportUserData();
  
  // Community hooks
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  
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
    setShowLogoutModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const handleExportData = async () => {
    try {
      if (user?.id) {
        const data = await exportDataMutation.mutateAsync(user.id);
        showAlert(
          'Export Complete',
          'Your data has been exported. Check your downloads folder.'
        );
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to export data');
    }
  };

  const handleToggleSetting = async (setting: string, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [setting]: value });
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to update setting');
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

  const handleAddFriend = () => {
    router.push('/add-friend');
  };

  const handleAcceptFriendRequest = async (friendId: string) => {
    try {
      await communityService.acceptFriendRequest(friendId, user?.id || '');
      // Refresh friends data
      const [friendsData, requestsData] = await Promise.all([
        communityService.getFriends(user?.id || ''),
        communityService.getFriendRequests(user?.id || '')
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
      showAlert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showAlert('Error', 'Failed to accept friend request');
    }
  };

  const refreshFriendsData = async () => {
    if (user?.id) {
      try {
        const [friendsData, requestsData] = await Promise.all([
          communityService.getFriends(user.id),
          communityService.getFriendRequests(user.id)
        ]);
        setFriends(friendsData);
        setFriendRequests(requestsData);
      } catch (error) {
        console.error('Error refreshing friends data:', error);
      }
    }
  };

  const handleRejectFriendRequest = async (friendId: string) => {
    try {
      await communityService.rejectFriendRequest(friendId, user?.id || '');
      // Refresh friend requests
      const requestsData = await communityService.getFriendRequests(user?.id || '');
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      showAlert('Error', 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await communityService.removeFriend(user?.id || '', friendId);
      // Refresh friends data
      const friendsData = await communityService.getFriends(user?.id || '');
      setFriends(friendsData);
    } catch (error) {
      console.error('Error removing friend:', error);
      showAlert('Error', 'Failed to remove friend');
    }
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

  // Load friends and friend requests
  useEffect(() => {
    const loadFriendsData = async () => {
      if (user?.id) {
        setIsLoadingFriends(true);
        try {
          const [friendsData, requestsData] = await Promise.all([
            communityService.getFriends(user.id),
            communityService.getFriendRequests(user.id)
          ]);
          setFriends(friendsData);
          setFriendRequests(requestsData);
        } catch (error) {
          console.error('Error loading friends data:', error);
        } finally {
          setIsLoadingFriends(false);
        }
      }
    };
    
    loadFriendsData();
  }, [user?.id]);
  
  // Refresh friend requests when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadFriendRequests = async () => {
        if (user?.id) {
          try {
            const requestsData = await communityService.getFriendRequests(user.id);
            setFriendRequests(requestsData);
          } catch (error) {
            console.error('Error loading friend requests:', error);
          }
        }
      };
      
      loadFriendRequests();
    }, [user?.id])
  );

  // Refresh friends data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFriendsData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]);

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
      if (seconds < 86600) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      <View style={[styles.header, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
        <Text style={[styles.headerTagline, { color: colors.text.tertiary }]}>Cut the Noise. Catch the Signal.</Text>
      </View>
      
      <View style={[styles.topBar, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity style={styles.navIcon}>
          <ChevronLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text.primary }]}>{t('profile.me')}</Text>
        <TouchableOpacity style={styles.navIcon} onPress={toggle}>
          {mode === 'dark' ? <Sun size={18} color={colors.text.primary} /> : <Moon size={18} color={colors.text.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 120 : 28 }]}>
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
              styles.avatarContainer,
              {
                transform: [{ scale: avatarScale }],
                backgroundColor: colors.card.secondary,
                borderColor: colors.primary,
              },
            ]}
          > 
            <UserIcon size={28} color={colors.primary} />
          </Animated.View>
          <Text style={[styles.username, { color: colors.text.onDark }]}>{user?.username || 'John Doe'}</Text>
          <Text style={[styles.userEmail, { color: colors.text.tertiary }]}>{user?.email || 'user@example.com'}</Text>
          
          {profileStats && (
            <TouchableOpacity 
              style={[styles.statsButton, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}
              onPress={() => setShowStats(!showStats)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statsButtonText, { color: colors.text.onDark }]}>
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
              <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Activity Stats</Text>
              <View style={[styles.statsCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
                <View style={styles.statItem}>
                  <Heart size={20} color={colors.alert} />
                  <Text style={[styles.statValue, { color: colors.text.onDark }]}>{profileStats.totalLikes || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Likes</Text>
                </View>
                <View style={styles.statItem}>
                  <Bookmark size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text.onDark }]}>{profileStats.totalSaved || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Saved</Text>
                </View>
                <View style={styles.statItem}>
                  <Eye size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text.onDark }]}>{profileStats.totalRead || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Read</Text>
                </View>
                <View style={styles.statItem}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text.onDark }]}> 
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
          <Text style={[styles.sectionLabel, { color: colors.text.onDark }]}>{t('profile.account')}</Text>
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
            <Row 
              icon={<Dot />} 
              title={t('profile.username')} 
              subtitle={user?.username ? `${t('profile.anonymousUrl')}/${user.username}` : `${t('profile.anonymousUrl')}/username`} 
              trailing={<Info size={16} color={colors.text.secondary} />} 
            />
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
          <Text style={[styles.sectionLabel, { color: colors.text.onDark }]}>Library</Text>
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
              <Text style={[styles.sectionLabel, { color: colors.text.onDark }]}>Recently Liked</Text>
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
                    <Text style={[styles.articlePreviewTitle, { color: colors.text.onDark }]} numberOfLines={2}>
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
                  <View style={[styles.likedBadgeSmall, { backgroundColor: colors.card.light, borderColor: colors.border.lighter }]}>
                    <Heart size={14} color={colors.alert} />
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Interests</Text>
            <TouchableOpacity onPress={() => setShowInterests(!showInterests)}>
              {showInterests ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          
          <Animated.View 
            style={[
              styles.interestsContainer,
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
                      { color: colors.text.onDark },
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text.onDark }]}>{t('profile.preferences')}</Text>
            <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
              {showSettings ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
              <Row 
                icon={<Bell size={16} color={colors.primary} />} 
                title={t('profile.notifications')} 
                trailing={showSettings ? <ChevronUp size={16} color={colors.text.secondary} /> : <ChevronDown size={16} color={colors.text.secondary} />}
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
            <TouchableOpacity onPress={() => router.push('/screen-time-settings')}>
              <Row 
                icon={<Clock size={16} color={colors.primary} />} 
                title="Screen Time" 
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
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
                    <Text style={[styles.settingText, { color: colors.text.onDark }]}>Push Notifications</Text>
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
                    <Text style={[styles.settingText, { color: colors.text.onDark }]}>Email Notifications</Text>
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
                    <Text style={[styles.settingText, { color: colors.text.onDark }]}>SMS Notifications</Text>
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text.onDark }]}>Community</Text>
            <TouchableOpacity onPress={() => setShowFriends(!showFriends)}>
              {showFriends ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}> 
            <TouchableOpacity onPress={() => setShowFriends(!showFriends)}>
              <Row 
                icon={<UserIcon size={16} color={colors.primary} />} 
                title="Friends" 
                subtitle={`${friends.length} friends, ${friendRequests.length} requests`}
                trailing={showFriends ? <ChevronUp size={16} color={colors.text.secondary} /> : <ChevronDown size={16} color={colors.text.secondary} />}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter, marginTop: 12 }]}
            onPress={handleAddFriend}
          >
            <Row 
              icon={<Plus size={16} color={colors.primary} />} 
              title="Add Friend" 
              trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter, marginTop: 12 }]}
            onPress={refreshFriendsData}
          >
            <Row 
              icon={<RefreshCw size={16} color={colors.primary} />} 
              title="Refresh Friends" 
              trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.listCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter, marginTop: 12 }]}
            onPress={() => router.push('/friend-requests')}
          >
            <Row 
              icon={<MessageCircle size={16} color={colors.primary} />} 
              title="Friend Requests" 
              subtitle={`${friendRequests.length} pending requests`}
              trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
            />
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              {
                opacity: interestsAnim,
                maxHeight: showFriends ? 500 : 0,
                overflow: 'hidden',
              }
            ]}
          >
            <View style={[styles.settingsCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
              <Text style={[styles.settingText, { color: colors.text.onDark, marginBottom: 12 }]}>Friend Requests</Text>
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <View key={request.id} style={[styles.row, { borderBottomColor: colors.border.lighter }]}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconBubble, { backgroundColor: colors.primary + '20' }]}>
                        <UserIcon size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.rowTitle, { color: colors.text.onDark }]}>
                        {request.users?.username || 'Unknown User'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={[styles.settingsKeywordAddButton, { backgroundColor: colors.primary, paddingHorizontal: 12 }]}
                        onPress={() => handleAcceptFriendRequest(request.user_id)}
                      >
                        <Text style={[styles.settingsKeywordAddButtonText, { color: colors.text.inverse }]}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.settingsKeywordAddButton, { backgroundColor: colors.alert, paddingHorizontal: 12 }]}
                        onPress={() => handleRejectFriendRequest(request.user_id)}
                      >
                        <Text style={[styles.settingsKeywordAddButtonText, { color: colors.text.inverse }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.rowSubtitle, { color: colors.text.tertiary, textAlign: 'center', padding: 16 }]}>
                  No pending friend requests
                </Text>
              )}
              
              <Text style={[styles.settingText, { color: colors.text.onDark, marginTop: 16, marginBottom: 12 }]}>Your Friends</Text>
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <View key={friend.id} style={[styles.row, { borderBottomColor: colors.border.lighter }]}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconBubble, { backgroundColor: colors.primary + '20' }]}>
                        <UserIcon size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.rowTitle, { color: colors.text.onDark }]}>
                        {friend.user_id === user?.id ? (friend.friend_user?.username || 'Unknown User') : (friend.user_user?.username || 'Unknown User')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.settingsKeywordAddButton, { backgroundColor: colors.alert, paddingHorizontal: 12 }]}
                      onPress={() => handleRemoveFriend(friend.user_id === user?.id ? friend.friend_id : friend.user_id)}
                    >
                      <Text style={[styles.settingsKeywordAddButtonText, { color: colors.text.inverse }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={[styles.rowSubtitle, { color: colors.text.tertiary, textAlign: 'center', padding: 16 }]}>
                  You haven't added any friends yet
                </Text>
              )}
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
          <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>{t('profile.account')}</Text>
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
      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          try {
            console.log('Initiating logout process');
            await signOutMutation.mutateAsync();
            console.log('Logout mutation successful');
            // Don't navigate here - let the auth listener handle navigation
          } catch (error: any) {
            console.error('Logout error:', error);
            // Even if there's an error, still try to navigate to sign-in
            router.replace('/auth/sign-in');
          }
        }}
      />
      <ConfirmationModal
        visible={showDeleteAccountModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        onCancel={() => setShowDeleteAccountModal(false)}
        onConfirm={() => {
          setShowDeleteAccountModal(false);
          showPrompt(
            'Confirm Deletion',
            'This will permanently delete all your data. Are you absolutely sure?',
            [
              { text: 'Cancel' },
              {
                text: 'Delete Permanently',
                onPress: async () => {
                  try {
                    if (user?.id) {
                      await deleteAccountMutation.mutateAsync(user.id);
                      router.replace('/auth/sign-in');
                    }
                  } catch (error: any) {
                    showAlert('Error', error.message || 'Failed to delete account');
                  }
                },
              },
            ]
          );
        }}
      />
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
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBubble}>{icon}</View>
        <View>
          <Text style={[styles.rowTitle, { color: colors.text.onDark }, titleStyle]}>{title}</Text>
          {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.text.tertiary }]}>{subtitle}</Text> : null}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Add padding for bottom navigation
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  userHandle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'inherit',
    marginBottom: 16,
    opacity: 0.8,
  },
  userBio: {
    fontSize: 16,
    color: 'inherit',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 30,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'inherit',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'inherit',
    opacity: 0.7,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'inherit',
    minWidth: 80,
    alignItems: 'center',
  },
  interestEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  interestName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'inherit',
  },
  interestSelected: {
    backgroundColor: 'inherit',
    borderColor: 'transparent',
  },
  interestSelectedText: {
    color: 'inherit',
  },
  settingsCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'inherit',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'inherit',
  },
  settingsLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: 'inherit',
  },
  settingsValue: {
    fontSize: 16,
    color: 'inherit',
    opacity: 0.8,
  },
  settingsSwitch: {
    transform: [{ scale: 1.1 }],
  },
  settingsGroupingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  settingsGroupingOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'inherit',
  },
  settingsGroupingOptionSelected: {
    backgroundColor: 'inherit',
    borderColor: 'transparent',
  },
  settingsGroupingText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'inherit',
  },
  settingsGroupingTextSelected: {
    color: 'inherit',
  },
  settingsKeywordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  keywordInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'inherit',
    fontSize: 16,
    color: 'inherit',
  },
  addKeywordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'inherit',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsKeywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  settingsKeywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'inherit',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  settingsKeywordChipText: {
    color: 'inherit',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsKeywordChipRemove: {
    color: 'inherit',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '600',
    color: 'inherit',
  },
  articlesPreviewContainer: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'inherit',
    padding: 16,
  },
  articlePreviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'inherit',
  },
  articlePreviewContent: {
    flex: 1,
    marginRight: 14,
  },
  articlePreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'inherit',
    marginBottom: 6,
    lineHeight: 22,
  },
  articlePreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articlePreviewSource: {
    fontSize: 13,
    fontWeight: '500',
    color: 'inherit',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  articlePreviewTime: {
    fontSize: 12,
    color: 'inherit',
  },
  likedBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'inherit',
  },
  savedBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'inherit',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'inherit',
    gap: 12,
  },
  actionButtonPrimary: {
    backgroundColor: 'inherit',
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'inherit',
  },
  actionButtonTextPrimary: {
    color: 'inherit',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'inherit',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'inherit',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'inherit',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'inherit',
  },
  modalButtonTextCancel: {
    color: 'inherit',
  },
  // Add missing styles
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Fonts.regular,
    color: 'inherit',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  navIcon: {
    padding: 8,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'inherit',
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: 'inherit',
    marginTop: 16,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'inherit',
    opacity: 0.7,
    marginBottom: 20,
  },
  statsButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'inherit',
  },
  statsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'inherit',
  },
  sectionBlock: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'inherit',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'inherit',
    marginVertical: 4,
  },
  listCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'inherit',
    overflow: 'hidden',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'inherit',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 14,
    color: 'inherit',
    opacity: 0.7,
  },
  // Add missing styles for interest chips
  interestsContainer: {
    marginBottom: 24,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'inherit',
  },
  interestChipSelected: {
    backgroundColor: 'inherit',
    borderColor: 'inherit',
  },
  interestText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'inherit',
  },
  interestTextSelected: {
    color: 'inherit',
  },
  // Add missing styles for settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'inherit',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'inherit',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'inherit',
  },
  settingsKeywordAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'inherit',
  },
  settingsKeywordAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'inherit',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'inherit',
  },
});
// Remove last border from rows
const removeLastBorder = (index: number, total: number) => {
  return index === total - 1 ? { borderBottomWidth: 0 } : {};
};


