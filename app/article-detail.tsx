import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ExternalLink, Heart, Bookmark, Share2, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { echoControlService } from '@/lib/echoControlService';
import { communityService, Friend } from '@/lib/communityService';
import { contentWellbeingService } from '@/lib/contentWellbeingService';
import { useWellbeingPreferences } from '@/lib/contentWellbeingPreferences';
import { signalService } from '@/lib/services';
import type { Signal as SupabaseSignal } from '@/lib/supabase';
import { Signal } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { eventEmitter, EVENTS } from '@/lib/eventEmitter';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id, url: urlParam, article: articleParam } = useLocalSearchParams<{ id?: string; url?: string; article?: string }>();
  const insets = useSafeAreaInsets();
  const { signals, user, toggleSignalLike, toggleSignalSave, echoControlEnabled, echoControlGrouping, customKeywords } = useApp();
  const { colors, mode } = useTheme();
  
  const decodedArticle = useMemo(() => {
    if (!articleParam) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(articleParam));
      return {
        ...parsed,
        timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
      } as Signal;
    } catch (error) {
      console.warn('Failed to parse article param:', error);
      return null;
    }
  }, [articleParam]);

  const localSignal = useMemo(() => {
    if (id) {
      return signals.find((s) => s.id === id);
    }
    if (urlParam) {
      return signals.find((s) => s.url === urlParam);
    }
    return null;
  }, [id, urlParam, signals]);

  const [remoteSignal, setRemoteSignal] = useState<typeof localSignal | null>(decodedArticle);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const mapSupabaseSignal = (supabaseSignal: SupabaseSignal): typeof localSignal => ({
    id: supabaseSignal.id,
    title: supabaseSignal.title,
    summary: supabaseSignal.summary,
    content: supabaseSignal.content || '',
    sourceId: supabaseSignal.source_name,
    sourceName: supabaseSignal.source_name,
    verified: supabaseSignal.verified,
    tags: supabaseSignal.tags || [],
    url: supabaseSignal.source_url,
    relevanceScore: 0,
    timestamp: new Date(supabaseSignal.created_at),
    imageUrl: supabaseSignal.image_url || undefined,
    saved: false,
    liked: false,
  });

  useEffect(() => {
    if (!id || localSignal || decodedArticle) return;
    let isMounted = true;
    setIsRemoteLoading(true);
    setRemoteError(null);
    signalService
      .getSignalById(id)
      .then((dbSignal) => {
        if (!isMounted) return;
        if (dbSignal) {
          setRemoteSignal(mapSupabaseSignal(dbSignal));
        } else {
          setRemoteError('Article not found');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setRemoteError(error.message || 'Failed to load article');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRemoteLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, localSignal]);

  type FriendProfile = {
    username?: string | null;
    email?: string | null;
  };
  type FriendWithProfile = Friend & {
    user_user?: FriendProfile | null;
    friend_user?: FriendProfile | null;
  };
  type ShareOption = {
    key: string;
    label: string;
    description?: string;
    successMessage: string;
    action: () => Promise<void>;
  };

  const signal = localSignal || remoteSignal;

  const { preferences: wellbeingPreferences } = useWellbeingPreferences();
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOption[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareProcessing, setShareProcessing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!shareFeedback) return;
    const timeout = setTimeout(() => setShareFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [shareFeedback]);

  const distressInfo = React.useMemo(() => {
    if (!signal || !wellbeingPreferences.showSensitiveBanner) {
      return { isDistressing: false, reasons: [] as string[] };
    }
    return contentWellbeingService.evaluateSignal(signal);
  }, [signal?.id, wellbeingPreferences.showSensitiveBanner]);

  useEffect(() => {
    if (!signal || !wellbeingPreferences.trackingEnabled) return;
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      if (duration > 0 && wellbeingPreferences.trackingEnabled) {
        contentWellbeingService.logArticleView(signal, duration).catch((err) =>
          console.warn('Failed logging article dwell time', err),
        );
      }
    };
  }, [signal?.id, wellbeingPreferences.trackingEnabled]);

  // Find related articles using the improved service based on user's grouping preference
  const relatedArticles = signal && echoControlEnabled ? 
    echoControlService.findRelatedArticles(signal, signals, echoControlGrouping, customKeywords, 5) : [];
  
  // Debug logs
  console.log('=== Article Detail Debug Info ===');
  console.log('Echo Control Enabled:', echoControlEnabled);
  console.log('Echo Control Grouping:', echoControlGrouping);
  console.log('Custom Keywords:', customKeywords);
  console.log('Total Signals Available:', signals.length);
  console.log('Current Signal:', signal?.title);
  console.log('Current Signal Tags:', signal?.tags);
  console.log('Related Articles Count:', relatedArticles.length);
  if (relatedArticles.length > 0) {
    console.log('Related Articles:', relatedArticles.map(a => ({
      title: a.title,
      tags: a.tags,
      source: a.sourceName
    })));
  }
  console.log('==============================');

  if (!signal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' }]}>
        {isRemoteLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Text style={{ color: colors.text.primary }}>
            {remoteError || 'Article not found'}
          </Text>
        )}
      </View>
    );
  }

  const handleOpenUrl = async () => {
    try {
      const url = signal.url || `https://google.com/search?q=${encodeURIComponent(signal.title)}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
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

  const handleShareArticle = async (signalToShare: Signal | undefined) => {
    console.log('=== Article Detail: Share Button Pressed ===');
    console.log('Signal ID:', signalToShare?.id);
    console.log('Current user:', user);

    if (!signalToShare) {
      setShareFeedback({ type: 'error', message: 'Unable to share this article.' });
      return;
    }
    
    if (!user?.id) {
      console.log('User not logged in');
      setShareFeedback({ type: 'error', message: 'You must be logged in to share articles' });
      return;
    }

    try {
      setShareLoading(true);
      console.log('Fetching friends for user:', user.id);
      // Get friends
      const friendsData = await communityService.getFriends(user.id);
      console.log('Friends data received:', friendsData);

      const normalizedFriends = (friendsData as FriendWithProfile[]).map((friend) => {
        const isSender = friend.user_id === user.id;
        const friendId = isSender ? friend.friend_id : friend.user_id;
        const friendProfile = (isSender ? friend.friend_user : friend.user_user) || {};
        const friendName =
          friendProfile?.username ||
          friendProfile?.email ||
          (friendId ? `Friend ${friendId.substring(0, 4)}` : 'Friend');
        return {
          id: friendId,
          name: friendName,
        };
      });

      const message = 'Check out this article!';
      const options: ShareOption[] = [
        {
          key: 'community',
          label: 'Share to Community Feed',
          description: 'Make this article visible to everyone in RUVO community.',
          successMessage: 'Article shared to community feed',
          action: async () => {
            await communityService.shareArticleToCommunity(user.id, signalToShare, message);
            return Promise.resolve();
          },
        },
      ];

      if (normalizedFriends.length > 0) {
        options.push({
          key: 'all-friends',
          label: 'Share with all friends',
          description: 'Send to all friends and the community feed in one tap.',
          successMessage: 'Article shared with all friends and the community feed',
          action: async () => {
            await communityService.shareArticleWithAllFriends(user.id, signalToShare, message);
            return Promise.resolve();
          },
        });

        normalizedFriends.forEach((friend) => {
          if (!friend.id) {
            return;
          }
          options.push({
            key: `friend-${friend.id}`,
            label: `Share with ${friend.name}`,
            description: 'Send privately to this friend.',
            successMessage: `Article shared with ${friend.name}`,
            action: async () => {
              await communityService.shareArticleWithFriend(user.id, signalToShare, friend.id!, message);
              return Promise.resolve();
            },
          });
        });
      }

      setShareOptions(options);
      setShareModalVisible(true);
    } catch (error) {
      console.error('Error loading friends:', error);
      setShareFeedback({ type: 'error', message: 'Failed to load friends list. Please try again.' });
    }
    finally {
      setShareLoading(false);
    }
  };

  const handleShareSelection = async (option: ShareOption) => {
    setShareModalVisible(false);
    setShareProcessing(true);
    try {
      await option.action();
      eventEmitter.emit(EVENTS.ARTICLE_SHARED);
      setShareFeedback({ type: 'success', message: option.successMessage });
    } catch (error: any) {
      console.error('Error sharing article:', error);
      setShareFeedback({
        type: 'error',
        message: error?.message || 'Failed to share article. Please try again.',
      });
    } finally {
      setShareProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background.primary,
        borderBottomColor: colors.border.lighter 
      }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
          activeOpacity={0.8}
        >
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Article</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {signal.imageUrl && (
          <Image 
            source={{ uri: signal.imageUrl }} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Tags */}
          <View style={styles.tagsContainer}>
            {signal.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: mode === 'dark' ? 'rgba(32, 178, 170, 0.2)' : 'rgba(240,244,255,0.8)' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>{signal.title}</Text>

          {distressInfo.isDistressing && wellbeingPreferences.showSensitiveBanner && (
            <View style={[styles.distressBanner, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }]}>
              <AlertCircle size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.distressTitle, { color: colors.accent }]}>Sensitive Topic</Text>
                <Text style={[styles.distressText, { color: colors.text.secondary }]}>
                  This article covers potentially distressing themes. Consider taking breaks if you start feeling overwhelmed.
                </Text>
              </View>
            </View>
          )}

          {/* Meta */}
          <View style={styles.meta}>
            <Text style={[styles.source, { color: colors.text.primary }]}>{signal.sourceName}</Text>
            <Text style={[styles.dot, { color: colors.text.tertiary }]}>•</Text>
            <Text style={[styles.time, { color: colors.text.tertiary }]}>{formatTimeAgo(signal.timestamp)}</Text>
            {signal.verified && (
              <>
                <Text style={[styles.dot, { color: colors.text.tertiary }]}>•</Text>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.verifiedText, { color: colors.text.inverse }]}>✓ Verified</Text>
                </View>
              </>
            )}
          </View>

          {/* Summary */}
          <Text style={[styles.summary, { color: colors.text.secondary }]}>{signal.summary}</Text>

          {/* Full Content (if available) */}
          {signal.content && signal.content.length > signal.summary.length && (
            <View style={styles.fullContentSection}>
              <Text style={[styles.fullContentLabel, { color: colors.text.tertiary }]}>Full Article</Text>
              <Text style={[styles.fullContent, { color: colors.text.primary }]}>{signal.content}</Text>
            </View>
          )}

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && echoControlEnabled && (
            <View style={[styles.relatedArticlesSection, { borderTopColor: colors.border.lighter }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Different Perspectives</Text>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.text.inverse }]}>{relatedArticles.length}</Text>
                </View>
              </View>
              <Text style={[styles.relatedArticlesDescription, { color: colors.text.tertiary }]}>
                See how other sources are covering this story
              </Text>
              
              <View style={styles.relatedArticlesList}>
                {relatedArticles.map((article, index) => (
                  <TouchableOpacity 
                    key={article.id} 
                    style={[styles.relatedArticle, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }]}
                    onPress={() => {
                      router.push({
                        pathname: '/article-detail',
                        params: { id: article.id }
                      });
                    }}
                  >
                    <View style={styles.relatedArticleContent}>
                      <Text style={[styles.relatedArticleSource, { color: colors.primary }]} numberOfLines={1}>
                        {article.sourceName}
                      </Text>
                      <Text style={[styles.relatedArticleTitle, { color: colors.text.primary }]} numberOfLines={2}>
                        {article.title}
                      </Text>
                    </View>
                    {article.verified && (
                      <View style={[styles.verifiedBadgeSmall, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.verifiedTextSmall, { color: colors.text.inverse }]}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Read Full Article Button */}
          <TouchableOpacity 
            style={[styles.readMoreButton, { backgroundColor: colors.accent }]}
            onPress={handleOpenUrl}
            activeOpacity={0.8}
          >
            <ExternalLink size={20} color={colors.text.inverse} />
            <Text style={[styles.readMoreText, { color: colors.text.inverse }]}>Read Full Article</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, signal.liked && styles.actionButtonActive, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }, signal.liked && { backgroundColor: mode === 'dark' ? 'rgba(32, 178, 170, 0.2)' : 'rgba(240,244,255,0.8)', borderColor: colors.primary }]}
              onPress={() => {
                console.log('Article Detail - Like pressed:', signal.id, 'Current state:', signal.liked);
                toggleSignalLike(signal.id);
              }}
              activeOpacity={0.8}
            >
              <Heart 
                size={22} 
                color={signal.liked ? colors.alert : colors.text.primary} 
                fill={signal.liked ? colors.alert : 'transparent'}
              />
              <Text style={[styles.actionText, { color: colors.text.primary }, signal.liked && { color: colors.primary }]}>Like</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, signal.saved && styles.actionButtonActive, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }, signal.saved && { backgroundColor: mode === 'dark' ? 'rgba(32, 178, 170, 0.2)' : 'rgba(240,244,255,0.8)', borderColor: colors.primary }]}
              onPress={() => {
                console.log('Article Detail - Save pressed:', signal.id, 'Current state:', signal.saved);
                toggleSignalSave(signal.id);
              }}
              activeOpacity={0.8}
            >
              <Bookmark 
                size={22} 
                color={signal.saved ? colors.primary : colors.text.primary} 
                fill={signal.saved ? colors.primary : 'transparent'}
              />
              <Text style={[styles.actionText, { color: colors.text.primary }, signal.saved && { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter },
            (shareLoading || shareProcessing) && styles.actionButtonDisabled,
          ]}
            onPress={() => handleShareArticle(signal)}
              activeOpacity={0.8}
          disabled={shareLoading || shareProcessing}
            >
          {shareLoading || shareProcessing ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <>
              <Share2 size={22} color={colors.text.primary} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Share</Text>
            </>
          )}
            </TouchableOpacity>
          </View>
          
          {/* Bottom Padding for Safe Area */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShareModalVisible(false)}>
          <View style={styles.shareModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.shareModalContainer, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
                <View style={styles.shareModalHandle} />
                <Text style={[styles.shareModalTitle, { color: colors.text.primary }]}>Share Article</Text>
                <Text style={[styles.shareModalSubtitle, { color: colors.text.secondary }]}>
                  Choose how you want to share this article.
                </Text>
                {shareOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.shareOption, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }]}
                    activeOpacity={0.85}
                    onPress={() => handleShareSelection(option)}
                  >
                    <Text style={[styles.shareOptionLabel, { color: colors.text.primary }]}>{option.label}</Text>
                    {option.description ? (
                      <Text style={[styles.shareOptionDescription, { color: colors.text.secondary }]}>{option.description}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.shareModalCloseButton, { backgroundColor: colors.card.primary, borderColor: colors.border.lighter }]}
                  onPress={() => setShareModalVisible(false)}
                >
                  <Text style={[styles.shareModalCloseText, { color: colors.text.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {shareProcessing && (
        <View style={styles.shareProcessingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {shareFeedback && (
        <View
          style={[
            styles.shareFeedbackContainer,
            shareFeedback.type === 'success' ? styles.shareFeedbackSuccess : styles.shareFeedbackError,
            { bottom: 24 + insets.bottom },
          ]}
        >
          <Text style={styles.shareFeedbackText}>{shareFeedback.message}</Text>
        </View>
      )}
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
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 36,
    fontFamily: Fonts.bold,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  source: {
    fontSize: 14,
    fontWeight: '700',
  },
  dot: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  time: {
    fontSize: 14,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summary: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 24,
    fontWeight: '400',
  },
  fullContentSection: {
    marginBottom: 24,
  },
  fullContentLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fullContent: {
    fontSize: 16,
    lineHeight: 26,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  readMoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 40,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonActive: {
    borderWidth: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionTextActive: {
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 140,
  },
  relatedArticlesSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  relatedArticlesDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  relatedArticlesList: {
    gap: 12,
  },
  relatedArticle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  relatedArticleContent: {
    flex: 1,
    marginRight: 12,
  },
  relatedArticleSource: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  relatedArticleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadgeSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTextSmall: {
    fontSize: 12,
    fontWeight: '700',
  },
  shareFeedbackContainer: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: '70%',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shareFeedbackText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  shareFeedbackSuccess: {
    backgroundColor: Colors.success,
  },
  shareFeedbackError: {
    backgroundColor: Colors.alert,
  },
  distressBanner: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  distressTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  distressText: {
    fontSize: 13,
    lineHeight: 18,
  },
  shareModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  shareModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24 + 16,
    borderWidth: 1,
    gap: 12,
  },
  shareModalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.border.light,
    marginBottom: 12,
  },
  shareModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  shareModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  shareOption: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    gap: 4,
  },
  shareOptionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  shareOptionDescription: {
    fontSize: 13,
  },
  shareModalCloseButton: {
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  shareModalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  shareProcessingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
