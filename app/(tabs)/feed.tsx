import React, { useState, useEffect, useRef } from 'react';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Heart, Bookmark, X, ExternalLink, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Signal } from '@/types';
import { echoControlService } from '@/lib/echoControlService';
import { LinearGradient } from 'expo-linear-gradient';

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CAROUSEL_SLIDE_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen width
const CAROUSEL_SPACING = 12;

export default function FeedScreen() {
  const { signals, toggleSignalLike, toggleSignalSave, dismissSignal, refreshSignals, echoControlEnabled, echoControlGrouping, customKeywords, isLoading } = useApp();
  const { t } = useLanguage();
  const { colors, mode } = useTheme();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation values keyed by signal ID to avoid undefined entries when the feed changes
  const cardAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Ensure we always have animation values for current signals and clean up removed ones
  useEffect(() => {
    signals.forEach((signal) => {
      if (!cardAnimations[signal.id]) {
        cardAnimations[signal.id] = new Animated.Value(0);
      }
    });

    Object.keys(cardAnimations).forEach((id) => {
      if (!signals.find((signal) => signal.id === id)) {
        delete cardAnimations[id];
      }
    });
  }, [signals, cardAnimations]);

  useEffect(() => {
    // Animate cards when they appear
    signals.forEach((signal, index) => {
      const animation = cardAnimations[signal.id];
      if (!animation) return;

      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
    
    const interval = setInterval(() => {
      refreshSignals();
    }, 30000); // Refresh every 30 seconds instead of 10

    return () => clearInterval(interval);
  }, [refreshSignals, signals]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshSignals();
    setTimeout(() => setRefreshing(false), 1500);
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
    } catch (error) {
      return 'Just now';
    }
  };

  const renderSignalCard = (signal: Signal, index: number) => {
    const isExpanded = expandedArticleId === signal.id;
    const animation = cardAnimations[signal.id] || new Animated.Value(1);
    
    // Create a separate animated value for interpolation to avoid conflicts
    const translateYAnim = useRef(new Animated.Value(20)).current;
    
    // Update the animated value when the main animation changes
    useEffect(() => {
      animation.addListener(({ value }) => {
        const interpolatedValue = 20 - (value * 20); // Map 0-1 to 20-0
        translateYAnim.setValue(interpolatedValue);
      });
      
      return () => {
        animation.removeAllListeners();
      };
    }, [animation]);

    // Find related articles using the improved service based on user's grouping preference
    const relatedArticles = echoControlEnabled ? 
      echoControlService.findRelatedArticles(signal, signals, echoControlGrouping, customKeywords, 3) : [];
    
    // Debug logs
    if (relatedArticles.length > 0) {
      console.log('Feed - Found related articles for:', signal.title);
      console.log('Feed - Related articles count:', relatedArticles.length);
      console.log('Feed - Current article tags:', signal.tags);
      console.log('Feed - Grouping method:', echoControlGrouping);
    }

    return (
      <Animated.View 
        key={signal.id} 
        style={[
          styles.card,
          {
            opacity: animation,
            transform: [{ translateY: translateYAnim }]
          }
        ]}
      >
        {signal.imageUrl && (
          <TouchableOpacity onPress={() => router.push(`/article-detail?id=${signal.id}`)}>
            <Image source={{ uri: signal.imageUrl }} style={styles.cardImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.cardContent, { backgroundColor: colors.card.primary }]}
          activeOpacity={0.95}
          onPress={() => router.push(`/article-detail?id=${signal.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.sourceInfo}>
              <Text style={[styles.sourceName, { color: colors.text.primary }]}>{signal.sourceName}</Text>
              {signal.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}> 
                  <Text style={[styles.verifiedText, { color: colors.text.inverse }]}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={[styles.timestamp, { color: colors.text.tertiary }]}>{formatTimeAgo(signal.timestamp)}</Text>
              {relatedArticles.length > 0 && echoControlEnabled && (
                <View style={[styles.relatedBadge, { backgroundColor: colors.primary }]}> 
                  <Text style={[styles.relatedBadgeText, { color: colors.text.inverse }]}>{relatedArticles.length}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>{signal.title}</Text>
          
          <Text style={[styles.summary, { color: colors.text.secondary }]} numberOfLines={isExpanded ? undefined : 3}>
            {signal.summary}
          </Text>
          
          {isExpanded && signal.content && signal.content !== signal.summary && (
            <View style={[styles.expandedContent, { borderTopColor: colors.border.lighter }]}> 
              <Text style={[styles.fullText, { color: colors.text.primary }]}>{signal.content}</Text>
            </View>
          )}
          
          {!isExpanded && (
            <Text style={[styles.tapToExpand, { color: colors.primary }]}>Tap to read more...</Text>
          )}

          <View style={styles.tagsContainer}>
            {signal.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.card.light }]}> 
                <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>

        </TouchableOpacity>
        
        <View style={styles.reactionsRow}>
          <TouchableOpacity 
            style={[styles.reactionPill, { backgroundColor: colors.card.white }]} 
            activeOpacity={0.9} 
            onPress={() => {
              console.log('Like button pressed for signal:', signal.id, 'Current liked state:', signal.liked);
              toggleSignalLike(signal.id);
            }}
          >
            <Heart size={18} color={signal.liked ? colors.alert : colors.text.tertiary} fill={signal.liked ? colors.alert : 'transparent'} />
            <Text style={[styles.reactionText, { color: signal.liked ? colors.alert : colors.text.tertiary }]}>{signal.liked ? 1 : 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.reactionPill, { backgroundColor: colors.card.white }]} 
            activeOpacity={0.9} 
            onPress={() => {
              console.log('Save button pressed for signal:', signal.id, 'Current saved state:', signal.saved);
              toggleSignalSave(signal.id);
            }}
          >
            <Bookmark size={18} color={signal.saved ? colors.primary : colors.text.tertiary} fill={signal.saved ? colors.primary : 'transparent'} />
            <Text style={[styles.reactionText, { color: signal.saved ? colors.primary : colors.text.tertiary }]}>{signal.saved ? 1 : 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.morePill, { backgroundColor: colors.card.white }]} activeOpacity={0.8} onPress={() => dismissSignal(signal.id)}>
            <X size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const breakingSignals = signals.slice(0, Math.min(3, signals.length));
  const recommendations = signals.slice(Math.min(3, signals.length));

  const renderCarouselItem = (item: Signal, index: number) => (
    <Pressable 
      key={item.id} 
      style={styles.slide}
      onPress={() => router.push(`/article-detail?id=${item.id}`)}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.slideImage} resizeMode="cover" />
      ) : (
        <View style={[styles.slideImage, { backgroundColor: colors.card.secondary }]} />
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.65)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.slideOverlay}
      />
      <View style={styles.slideContent}>
        {item.tags?.[0] && (
          <View style={[styles.slideTag, { backgroundColor: 'rgba(0,0,0,0.35)' }]}><Text style={[styles.slideTagText, { color: colors.text.inverse }]}>{item.tags[0]}</Text></View>
        )}
        <Text numberOfLines={2} style={[styles.slideTitle, { color: colors.text.inverse }]}>{item.title}</Text>
        <Text style={[styles.slideMeta, { color: '#E6F3F0' }]}>{item.sourceName} · {formatTimeAgo(item.timestamp)}</Text>
      </View>
    </Pressable>
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
          <Text style={[styles.headerTagline, { color: colors.text.secondary }]}>Cut the Noise. Catch the Signal.</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading your personalized feed...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <Animated.ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
          <Text style={[styles.headerTagline, { color: colors.text.secondary }]}>Cut the Noise. Catch the Signal.</Text>
        </View>
        
        {breakingSignals.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('feed.breakingNews')}</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>{t('actions.view')} all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CAROUSEL_SLIDE_WIDTH + CAROUSEL_SPACING}
              decelerationRate="fast"
              onScroll={(e) => {
                const offset = e.nativeEvent.contentOffset.x;
                const i = Math.round(offset / (CAROUSEL_SLIDE_WIDTH + CAROUSEL_SPACING));
                if (!Number.isNaN(i) && i !== carouselIndex) setCarouselIndex(i);
              }}
              scrollEventThrottle={16}
              contentContainerStyle={styles.carouselContainer}
            >
              {breakingSignals.map(renderCarouselItem)}
            </ScrollView>
            
            <View style={styles.dots}>
              {breakingSignals.map((_, i) => (
                <View key={i} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Recommendations</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>{t('actions.view')} all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.feed}>
              {recommendations.map((signal, index) => renderSignalCard(signal, index))}
            </View>
          </View>
        )}

        {recommendations.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Sparkles size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>No articles yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>We're curating your personalized feed. Check back soon!</Text>
          </View>
        )}

        <View style={[styles.bottomPadding, { height: (Platform.OS === 'web' ? 0 : 140 + insets.bottom) }]} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  carouselSection: {
    marginBottom: 0,
  },
  recommendationsSection: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 140,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    letterSpacing: -0.3,
  },
  sectionLink: {
    color: 'inherit',
    fontWeight: '700',
  },
  carouselContainer: {
    paddingHorizontal: 20,
    paddingVertical: 0,
  },
  slide: {
    width: CAROUSEL_SLIDE_WIDTH,
    height: 200,
    marginRight: CAROUSEL_SPACING,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  slideContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  slideTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  slideTagText: {
    color: 'inherit',
    fontWeight: '700',
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  slideTitle: {
    color: 'inherit',
    fontWeight: '800',
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  slideMeta: {
    marginTop: 4,
    color: 'inherit',
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'inherit',
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
    backgroundColor: 'inherit',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
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
  },
  feed: {
    paddingHorizontal: 16,
    paddingTop: 0,
    gap: 16,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '700',
    color: 'inherit',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'inherit',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: 'inherit',
    fontSize: 11,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    color: 'inherit',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relatedBadge: {
    backgroundColor: 'inherit',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  relatedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'inherit',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'inherit',
    marginBottom: 8,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  summary: {
    fontSize: 15,
    color: 'inherit',
    lineHeight: 22,
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'inherit',
    letterSpacing: -0.1,
  },
  reactionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  morePill: {
    marginLeft: 'auto',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  reactionText: {
    color: 'inherit',
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.lighter,
  },
  fullText: {
    fontSize: 15,
    color: 'inherit',
    lineHeight: 24,
  },
  tapToExpand: {
    fontSize: 13,
    fontWeight: '600',
    color: 'inherit',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'inherit',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: 'inherit',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 16,
    color: 'inherit',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});