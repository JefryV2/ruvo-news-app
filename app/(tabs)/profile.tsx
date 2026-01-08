import React, { useRef, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Clock,
  RefreshCw
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
  
  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
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
      color: colors.text.primary,
      letterSpacing: -1,
      marginBottom: 8,
    },
    headerTagline: {
      fontSize: 16,
      fontWeight: '400' as const,
      fontFamily: Fonts.regular,
      color: colors.text.secondary,
      letterSpacing: 0.5,
    },
    topTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: colors.text.primary,
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
      backgroundColor: colors.card.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    username: {
      fontSize: 20,
      fontWeight: '700' as const,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: colors.text.primary,
    },
    userEmail: {
      fontSize: 14,
      color: colors.text.tertiary,
      marginTop: 4,
    },
    statsButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.primary + '20',
      borderRadius: 12,
    },
    statsButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    statsCard: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card.secondary,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.lighter,
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
      color: colors.text.primary,
      marginTop: 4,
    },
    statLabel: {
      fontSize: 11,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingsCard: {
      marginTop: 12,
      backgroundColor: colors.card.secondary,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.lighter,
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
      color: colors.text.primary,
    },
    sectionBlock: {
      paddingHorizontal: 16,
      marginBottom: 18,
    },
    sectionLabel: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginBottom: 8,
      letterSpacing: 0.3,
      fontWeight: '600',
    },
    listCard: {
      backgroundColor: colors.card.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.lighter,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.lighter,
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
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
    },
    rowSubtitle: {
      fontSize: 12,
      color: colors.text.tertiary,
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
      backgroundColor: colors.background.tertiary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      gap: 6,
      borderWidth: 2,
      borderColor: colors.border.light,
    },
    interestChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    interestEmoji: {
      fontSize: 16,
    },
    interestText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
    interestTextSelected: {
      color: colors.text.inverse,
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
      backgroundColor: colors.background.secondary,
    },
    settingsGroupingOptionSelected: {
      backgroundColor: colors.primary,
    },
    settingsGroupingOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.primary,
    },
    settingsGroupingOptionTextSelected: {
      color: colors.text.inverse,
    },
    settingsKeywordSection: {
      padding: 16,
      backgroundColor: colors.background.secondary,
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
      backgroundColor: colors.background.white,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.border.lighter,
    },
    settingsKeywordAddButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsKeywordAddButtonText: {
      color: colors.text.inverse,
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
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 6,
    },
    settingsKeywordChipText: {
      color: colors.text.inverse,
      fontSize: 13,
      fontWeight: '500',
    },
    settingsKeywordChipRemove: {
      color: colors.text.inverse,
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
      color: colors.primary,
    },
    articlesPreviewContainer: {
      backgroundColor: colors.card.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.lighter,
      padding: 12,
    },
    articlePreviewCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.lighter,
    },
    articlePreviewContent: {
      flex: 1,
      marginRight: 12,
    },
    articlePreviewTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
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
      color: colors.text.tertiary,
      flex: 1,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    articlePreviewTime: {
      fontSize: 11,
      color: colors.text.tertiary,
    },
    likedBadgeSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.card.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedBadgeSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.card.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
  
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
              console.log('Initiating logout process');
              await signOutMutation.mutateAsync();
              console.log('Logout mutation successful, navigating to sign-in');
            } catch (error: any) {
              console.error('Logout error:', error);
              // Even if there's an error, still try to navigate to sign-in
            } finally {
              // Always navigate to sign-in screen
              setTimeout(() => {
                router.replace('/auth/sign-in');
              }, 150);
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
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
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
      Alert.alert('Error', 'Failed to reject friend request');
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
      Alert.alert('Error', 'Failed to remove friend');
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
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>RUVO</Text>
        <Text style={dynamicStyles.headerTagline}>Cut the Noise. Catch the Signal.</Text>
      </View>
      
      <View style={dynamicStyles.topBar}>
        <TouchableOpacity style={dynamicStyles.navIcon}>
          <ChevronLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={dynamicStyles.topTitle}>{t('profile.me')}</Text>
        <TouchableOpacity style={dynamicStyles.navIcon} onPress={toggle}>
          {mode === 'dark' ? <Sun size={18} color={colors.text.primary} /> : <Moon size={18} color={colors.text.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 28 }}>
        <Animated.View 
          style={[
            dynamicStyles.headerCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View 
            style={[
              dynamicStyles.avatar,
              {
                transform: [{ scale: avatarScale }],
              },
            ]}
          > 
            <UserIcon size={28} color={colors.primary} />
          </Animated.View>
          <Text style={dynamicStyles.username}>{user?.username || 'John Doe'}</Text>
          <Text style={dynamicStyles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          {profileStats && (
            <TouchableOpacity 
              style={dynamicStyles.statsButton}
              onPress={() => setShowStats(!showStats)}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.statsButtonText}>
                {showStats ? t('profile.hideStats') : t('profile.viewStats')}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View 
          style={[
            dynamicStyles.sectionBlock,
            {
              opacity: statsAnim,
              maxHeight: showStats ? 200 : 0,
              overflow: 'hidden',
            }
          ]}
        >
          {profileStats && (
            <>
              <Text style={dynamicStyles.sectionLabel}>Activity Stats</Text>
              <View style={dynamicStyles.statsCard}> 
                <View style={dynamicStyles.statItem}>
                  <Heart size={20} color={colors.alert} />
                  <Text style={dynamicStyles.statValue}>{profileStats.totalLikes || 0}</Text>
                  <Text style={dynamicStyles.statLabel}>Likes</Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Bookmark size={20} color={colors.primary} />
                  <Text style={dynamicStyles.statValue}>{profileStats.totalSaved || 0}</Text>
                  <Text style={dynamicStyles.statLabel}>Saved</Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Eye size={20} color={colors.primary} />
                  <Text style={dynamicStyles.statValue}>{profileStats.totalRead || 0}</Text>
                  <Text style={dynamicStyles.statLabel}>Read</Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={dynamicStyles.statValue}> 
                    {profileStats.joinedDate ? new Date(profileStats.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </Text>
                  <Text style={dynamicStyles.statLabel}>Joined</Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        <Animated.View 
          style={[
            dynamicStyles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.sectionLabel}>{t('profile.account')}</Text>
          <View style={dynamicStyles.listCard}> 
            <TouchableOpacity onPress={handleToggleStatus}>
              <Row 
                icon={<Dot />} 
                title={t('profile.activeStatus')} 
                subtitle={isActive ? t('profile.online') : t('profile.offline')} 
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
                trailing={<Switch
                  value={isActive}
                  onValueChange={handleToggleStatus}
                  trackColor={{ false: colors.border.lighter, true: colors.primary }}
                  thumbColor={colors.background.white}
                />}
              />
            </TouchableOpacity>
            <Row icon={<Dot />} title={t('profile.username')} subtitle={user?.username ? `${t('profile.anonymousUrl')}/${user.username}` : `${t('profile.anonymousUrl')}/username`} textColor={colors.text.primary} subtitleColor={colors.text.tertiary} trailing={<Info size={16} color={colors.text.secondary} />} />
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            dynamicStyles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.sectionLabel}>Library</Text>
          <View style={dynamicStyles.listCard}> 
            <TouchableOpacity onPress={() => router.push('/liked-articles')}>
              <Row 
                icon={<Heart size={16} color={colors.alert} />} 
                title="Liked Articles" 
                subtitle={`${profileStats?.totalLikes || 0} articles`}
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/saved-articles')}>
              <Row 
                icon={<Bookmark size={16} color={colors.primary} />} 
                title="Saved Articles" 
                subtitle={`${profileStats?.totalSaved || 0} articles`}
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Liked Articles Preview */}
        {likedSignals.length > 0 && (
          <Animated.View 
            style={[
              dynamicStyles.sectionBlock,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionLabel}>Recently Liked</Text>
              <TouchableOpacity onPress={() => router.push('/liked-articles')}>
                <Text style={dynamicStyles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.articlesPreviewContainer}>
              {likedSignals.map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={dynamicStyles.articlePreviewCard}
                  onPress={() => router.push(`/article-detail?id=${signal.id}`)}
                >
                  <View style={dynamicStyles.articlePreviewContent}>
                    <Text style={dynamicStyles.articlePreviewTitle} numberOfLines={2}>
                      {signal.title}
                    </Text>
                    <View style={dynamicStyles.articlePreviewMeta}>
                      <Text style={dynamicStyles.articlePreviewSource} numberOfLines={1}>
                        {signal.sourceName}
                      </Text>
                      <View style={dynamicStyles.timeContainer}>
                        <Clock size={11} color={colors.text.tertiary} />
                        <Text style={dynamicStyles.articlePreviewTime}>
                          {formatTimeAgo(signal.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={dynamicStyles.likedBadgeSmall}>
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
              dynamicStyles.sectionBlock,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionLabel}>Recently Saved</Text>
              <TouchableOpacity onPress={() => router.push('/saved-articles')}>
                <Text style={dynamicStyles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.articlesPreviewContainer}>
              {savedSignals.map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={dynamicStyles.articlePreviewCard}
                  onPress={() => router.push(`/article-detail?id=${signal.id}`)}
                >
                  <View style={dynamicStyles.articlePreviewContent}>
                    <Text style={dynamicStyles.articlePreviewTitle} numberOfLines={2}>
                      {signal.title}
                    </Text>
                    <View style={dynamicStyles.articlePreviewMeta}>
                      <Text style={dynamicStyles.articlePreviewSource} numberOfLines={1}>
                        {signal.sourceName}
                      </Text>
                      <View style={dynamicStyles.timeContainer}>
                        <Clock size={11} color={colors.text.tertiary} />
                        <Text style={dynamicStyles.articlePreviewTime}>
                          {formatTimeAgo(signal.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={dynamicStyles.savedBadgeSmall}>
                    <Bookmark size={12} color={colors.primary} fill={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View 
          style={[
            dynamicStyles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.sectionLabel}>{t('profile.interests')}</Text>
          <View style={dynamicStyles.listCard}> 
            <TouchableOpacity onPress={() => setShowInterests(!showInterests)}>
              <Row 
                icon={<Heart size={16} color={colors.primary} />} 
                title={t('profile.interests')} 
                subtitle={`${userInterestCount} ${t('profile.selected')}`}
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
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
            <View style={dynamicStyles.interestsGrid}>
              {INTERESTS.map((interest) => {
                const isSelected = user?.interests?.includes(interest.id);
                return (
                  <Pressable
                    key={interest.id}
                    style={[dynamicStyles.interestChip,
                      { backgroundColor: colors.background.tertiary, borderColor: colors.border.light },
                      isSelected && [dynamicStyles.interestChipSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                    onPress={() => toggleInterest(interest.id)}
                    android_ripple={{ color: colors.primary + '40' }}
                  >
                    <Text style={dynamicStyles.interestEmoji}>{interest.emoji}</Text>
                    <Text style={[dynamicStyles.interestText, 
                      { color: colors.text.primary },
                      isSelected && dynamicStyles.interestTextSelected,
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
            dynamicStyles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.sectionLabel}>{t('profile.preferences')}</Text>
          <View style={dynamicStyles.listCard}> 
            <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
              <Row 
                icon={<Bell size={16} color={colors.primary} />} 
                title={t('profile.notifications')} 
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
            <Row 
              icon={<Globe size={16} color={colors.primary} />} 
              title={t('profile.language')} 
              subtitle={accountSettings?.language === 'en' ? 'English' : '한국어'}
              textColor={colors.text.primary}
              subtitleColor={colors.text.tertiary}
            />
            <Row 
              icon={<TrendingUp size={16} color={colors.primary} />} 
              title="Echo Control" 
              subtitle={echoControlEnabled ? "Enabled" : "Disabled"}
              textColor={colors.text.primary}
              subtitleColor={colors.text.tertiary}
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
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
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
              <View style={dynamicStyles.settingsCard}> 
                <View style={dynamicStyles.settingRow}>
                  <View style={dynamicStyles.settingLeft}>
                    <Smartphone size={18} color={colors.primary} />
                    <Text style={dynamicStyles.settingText}>Push Notifications</Text>
                  </View>
                  <Switch
                    value={accountSettings.pushNotifications}
                    onValueChange={(value) => handleToggleSetting('pushNotifications', value)}
                    trackColor={{ false: colors.border.lighter, true: colors.primary }}
                    thumbColor={colors.background.white}
                  />
                </View>
                <View style={dynamicStyles.settingRow}>
                  <View style={dynamicStyles.settingLeft}>
                    <Mail size={18} color={colors.primary} />
                    <Text style={dynamicStyles.settingText}>Email Notifications</Text>
                  </View>
                  <Switch
                    value={accountSettings.emailNotifications}
                    onValueChange={(value) => handleToggleSetting('emailNotifications', value)}
                    trackColor={{ false: colors.border.lighter, true: colors.primary }}
                    thumbColor={colors.background.white}
                  />
                </View>
                <View style={dynamicStyles.settingRow}>
                  <View style={dynamicStyles.settingLeft}>
                    <Smartphone size={18} color={colors.primary} />
                    <Text style={dynamicStyles.settingText}>SMS Notifications</Text>
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
            dynamicStyles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.sectionLabel}>Community</Text>
          <View style={dynamicStyles.listCard}> 
            <TouchableOpacity onPress={() => setShowFriends(!showFriends)}>
              <Row 
                icon={<UserIcon size={16} color={colors.primary} />} 
                title="Friends" 
                subtitle={`${friends.length} friends, ${friendRequests.length} requests`}
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[dynamicStyles.listCard, { marginTop: 12 }]}
            onPress={handleAddFriend}
          >
            <Row 
              icon={<Plus size={16} color={colors.primary} />} 
              title="Add Friend" 
              textColor={colors.text.primary}
              subtitleColor={colors.text.tertiary}
              trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[dynamicStyles.listCard, { marginTop: 12 }]}
            onPress={refreshFriendsData}
          >
            <Row 
              icon={<RefreshCw size={16} color={colors.primary} />} 
              title="Refresh Friends" 
              textColor={colors.text.primary}
              subtitleColor={colors.text.tertiary}
              trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[dynamicStyles.listCard, { marginTop: 12 }]}
            onPress={() => router.push('/friend-requests')}
          >
            <Row 
              icon={<MessageCircle size={16} color={colors.primary} />} 
              title="Friend Requests" 
              subtitle={`${friendRequests.length} pending requests`}
              textColor={colors.text.primary}
              subtitleColor={colors.text.tertiary}
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
            <View style={dynamicStyles.settingsCard}>
              <Text style={[dynamicStyles.settingText, { marginBottom: 12 }]}>Friend Requests</Text>
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <View key={request.id} style={dynamicStyles.row}>
                    <View style={dynamicStyles.rowLeft}>
                      <View style={dynamicStyles.iconBubble}>
                        <UserIcon size={16} color={colors.primary} />
                      </View>
                      <Text style={dynamicStyles.rowTitle}>
                        {request.users?.username || 'Unknown User'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={[dynamicStyles.settingsKeywordAddButton, { paddingHorizontal: 12 }]}
                        onPress={() => handleAcceptFriendRequest(request.user_id)}
                      >
                        <Text style={dynamicStyles.settingsKeywordAddButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[dynamicStyles.settingsKeywordAddButton, { paddingHorizontal: 12 }]}
                        onPress={() => handleRejectFriendRequest(request.user_id)}
                      >
                        <Text style={dynamicStyles.settingsKeywordAddButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[dynamicStyles.rowSubtitle, { textAlign: 'center', padding: 16 }]}>
                  No pending friend requests
                </Text>
              )}
              
              <Text style={[dynamicStyles.settingText, { marginTop: 16, marginBottom: 12 }]}>Your Friends</Text>
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <View key={friend.id} style={dynamicStyles.row}>
                    <View style={dynamicStyles.rowLeft}>
                      <View style={dynamicStyles.iconBubble}>
                        <UserIcon size={16} color={colors.primary} />
                      </View>
                      <Text style={dynamicStyles.rowTitle}>
                        {friend.user_id === user?.id ? (friend.friend_user?.username || 'Unknown User') : (friend.user_user?.username || 'Unknown User')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[dynamicStyles.settingsKeywordAddButton, { paddingHorizontal: 12 }]}
                      onPress={() => handleRemoveFriend(friend.user_id === user?.id ? friend.friend_id : friend.user_id)}
                    >
                      <Text style={dynamicStyles.settingsKeywordAddButtonText}>Remove</Text>
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
            dynamicStyles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.sectionLabel}>{t('profile.account')}</Text>
          <View style={dynamicStyles.listCard}> 
            <TouchableOpacity onPress={handleAccountSettings}>
              <Row 
                icon={<SettingsIcon size={16} color={colors.primary} />} 
                title={t('profile.accountSettings')} 
                textColor={colors.text.primary}
                subtitleColor={colors.text.tertiary}
                trailing={<ChevronRight size={16} color={colors.text.secondary} />} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Row 
                icon={<Trash2 size={16} color={colors.alert} />} 
                title={t('profile.deleteAccount')} 
                textColor={colors.alert}
                subtitleColor={colors.text.tertiary}
                titleStyle={{ color: colors.alert }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Row 
                icon={<LogOut size={16} color={colors.alert} />} 
                title={t('profile.logout')} 
                textColor={colors.alert}
                subtitleColor={colors.text.tertiary}
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
  textColor?: string;
  subtitleColor?: string;
};

function Row({ icon, title, subtitle, trailing, titleStyle, textColor, subtitleColor }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBubble}>{icon}</View>
        <View>
          <Text style={[styles.rowTitle, titleStyle, { color: textColor }]}>{title}</Text>
          {subtitle ? <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    color: Colors.text.primary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: Fonts.regular,
    color: Colors.text.secondary,
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
    color: Colors.primary,
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


