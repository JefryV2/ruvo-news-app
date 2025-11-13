import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Users as UsersIcon, 
  Heart, 
  Bookmark, 
  Clock,
  ChevronLeft,
  Sun,
  Moon,
  Share2,
  RefreshCw
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { communityService } from '@/lib/communityService';
import { eventEmitter, EVENTS } from '@/lib/eventEmitter';

export default function CommunityScreen() {
  const { user, signals } = useApp();
  const { t } = useLanguage();
  const { mode, colors, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [sharedArticles, setSharedArticles] = useState<any[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load shared articles
  useEffect(() => {
    loadSharedArticles();
    
    // Animate in
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
  }, [user?.id]); // Add user ID as dependency to reload when user changes

  // Refresh shared articles periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadSharedArticles();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]); // Add user ID as dependency

  // Listen for article shared events
  useEffect(() => {
    const handleArticleShared = () => {
      console.log('Article shared event received, refreshing community feed');
      loadSharedArticles();
    };
    
    eventEmitter.on(EVENTS.ARTICLE_SHARED, handleArticleShared);
    
    return () => {
      eventEmitter.off(EVENTS.ARTICLE_SHARED, handleArticleShared);
    };
  }, []);

  const loadSharedArticles = async () => {
    console.log('=== Community Screen: Loading Shared Articles ===');
    
    if (!user?.id) {
      console.log('No user ID, cannot load shared articles');
      return;
    }
    
    console.log('Loading shared articles for user:', user.id);
    setIsLoading(true);
    try {
      const articles = await communityService.getSharedArticlesForUser(user.id);
      console.log('Received shared articles:', articles);
      console.log('Number of articles received:', articles.length);
      
      setSharedArticles(articles);
      
      // Get unique user IDs from shared articles
      const userIds = [...new Set(articles.map(article => article.user_id))];
      console.log('User IDs to fetch:', userIds);
      console.log('Number of unique user IDs:', userIds.length);
      
      if (userIds.length > 0) {
        const users = await communityService.getUsersByIds(userIds);
        console.log('Fetched users:', users);
        const userMap: Record<string, string> = {};
        users.forEach(u => {
          userMap[u.id] = u.username || u.email || `User ${u.id.substring(0, 8)}`;
        });
        setUsernames(userMap);
      }
      
      console.log('=== Community Screen: Loading Complete ===');
    } catch (error) {
      console.error('Error loading shared articles:', error);
      // Show error to user
      Alert.alert('Error', 'Failed to load shared articles. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSharedArticles();
  };

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Community</Text>
        <Text style={[styles.headerTagline, { color: colors.text.secondary }]}>See what your friends are reading</Text>
      </View>
      
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navIcon}>
          <ChevronLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Shared Articles</Text>
        <TouchableOpacity style={styles.navIcon} onPress={toggle}>
          {mode === 'dark' ? <Sun size={18} color={colors.text.primary} /> : <Moon size={18} color={colors.text.primary} />}
        </TouchableOpacity>
      </View>
      
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.topAddButton, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => router.push('/add-friend')}
          >
            <Text style={[styles.topAddButtonText, { color: colors.text.inverse }]}>Add Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topAddButton, { backgroundColor: colors.card.secondary, borderWidth: 1, borderColor: colors.border.lighter }]}
            onPress={loadSharedArticles}
          >
            <RefreshCw size={16} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 28 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View 
          style={[
            styles.sectionBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.articlesContainer}>
            {sharedArticles.length > 0 ? (
              sharedArticles.map((sharedArticle) => {
                // For API-based signals, we need to find the signal in the app's signals
                const signal = signals.find(s => s.id === sharedArticle.signal_id) || sharedArticle.signal;
                
                // Display the shared article even if we don't have the full signal data
                // We can still show basic information about the shared article
                const isCommunityShare = sharedArticle.friend_id === null;
                const sharerName = usernames[sharedArticle.user_id] || (sharedArticle.user_id === user?.id ? 'You' : 'A friend');
                
                return (
                  <TouchableOpacity
                    key={sharedArticle.id}
                    style={[styles.articleCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}
                    onPress={() => router.push(`/article-detail?id=${sharedArticle.signal_id}`)}
                  >
                    <View style={styles.articleContent}>
                      <Text style={[styles.articleTitle, { color: colors.text.primary }]} numberOfLines={2}>
                        {signal?.title || 'Shared Article'}
                      </Text>
                      <View style={styles.articleMeta}>
                        <Text style={[styles.articleSource, { color: colors.text.tertiary }]} numberOfLines={1}>
                          {usernames[sharedArticle.user_id] || 'A user'}
                        </Text>
                        <View style={styles.timeContainer}>
                          <Clock size={11} color={colors.text.tertiary} />
                          <Text style={[styles.articleTime, { color: colors.text.tertiary }]}>
                            {formatTimeAgo(sharedArticle.created_at)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.sharingInfo}>
                        <Text style={[styles.sharedByText, { color: colors.text.secondary }]}>
                          Shared by {usernames[sharedArticle.user_id] || (sharedArticle.user_id === user?.id ? 'You' : 'A friend')}
                          {sharedArticle.friend_id === null ? ' to community' : ''}
                        </Text>
                      </View>
                      {sharedArticle.message ? (
                        <View style={[styles.messageContainer, { backgroundColor: colors.background.light }]}>
                          <Text style={[styles.messageText, { color: colors.text.secondary }]}>
                            "{sharedArticle.message}"
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
                <UsersIcon size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Shared Articles</Text>
                <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
                  {isLoading ? 'Loading...' : 'Your friends haven\'t shared any articles with you yet. Share an article to the community to get started!'}
                </Text>
                {!isLoading && (
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/')}
                  >
                    <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>Browse Articles</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={{ height: (Platform.OS === 'web' ? 0 : 140 + insets.bottom), backgroundColor: colors.background.primary }} />
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
  sectionBlock: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  articlesContainer: {
    gap: 16,
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    overflow: 'hidden',
  },
  articleContent: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleSource: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  articleTime: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  sharingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sharedByText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  messageContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  messageText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.text.secondary,
  },
  articleImage: {
    width: 80,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  emptyState: {
    backgroundColor: Colors.background.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.inverse,
    textAlign: 'center',
  },
  topAddButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});