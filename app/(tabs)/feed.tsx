import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, Bookmark, X, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { Signal } from '@/types';
import RuvoButton from '@/components/RuvoButton';
import { LinearGradient } from 'expo-linear-gradient';

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CAROUSEL_SLIDE_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen width
const CAROUSEL_SPACING = 12;

export default function FeedScreen() {
  const { signals, toggleSignalLike, toggleSignalSave, dismissSignal, refreshSignals } = useApp();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSignals();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshSignals]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshSignals();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderSignalCard = (signal: Signal) => (
    <View key={signal.id} style={styles.card}>
      {signal.imageUrl && (
        <Image source={{ uri: signal.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceName}>{signal.sourceName}</Text>
            {signal.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>{formatTimeAgo(signal.timestamp)}</Text>
        </View>

        <Text style={styles.title}>{signal.title}</Text>
        <Text style={styles.summary}>{signal.summary}</Text>

        <View style={styles.tagsContainer}>
          {signal.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reactionsRow}>
          <TouchableOpacity style={styles.reactionPill} activeOpacity={0.9} onPress={() => toggleSignalLike(signal.id)}>
            <Heart size={18} color={signal.liked ? Colors.alert : Colors.text.tertiary} fill={signal.liked ? Colors.alert : 'transparent'} />
            <Text style={styles.reactionText}>{signal.liked ? 1 : 0}</Text>
          </TouchableOpacity>
          <View style={styles.reactionPill}>
            <MessageCircle size={18} color={Colors.text.tertiary} />
            <Text style={styles.reactionText}>1</Text>
          </View>
          <TouchableOpacity style={styles.reactionPill} activeOpacity={0.9} onPress={() => toggleSignalSave(signal.id)}>
            <Bookmark size={18} color={signal.saved ? Colors.primary : Colors.text.tertiary} fill={signal.saved ? Colors.primary : 'transparent'} />
            <Text style={styles.reactionText}>{signal.saved ? 1 : 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePill} activeOpacity={0.8} onPress={() => dismissSignal(signal.id)}>
            <X size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const breakingSignals = signals.slice(0, Math.min(3, signals.length));
  const recommendations = signals.slice(Math.min(3, signals.length));

  const renderCarouselItem = (item: Signal, index: number) => (
    <View key={item.id} style={styles.slide}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.slideImage} resizeMode="cover" />
      ) : (
        <View style={[styles.slideImage, { backgroundColor: Colors.card.secondary }]} />
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.65)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.slideOverlay}
      />
      <View style={styles.slideContent}>
        {item.tags?.[0] && (
          <View style={styles.slideTag}><Text style={styles.slideTagText}>{item.tags[0]}</Text></View>
        )}
        <Text numberOfLines={2} style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideMeta}>{item.sourceName} · {formatTimeAgo(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RUVO</Text>
          <Text style={styles.headerTagline}>Cut the Noise. Catch the Signal.</Text>
        </View>
        
        {breakingSignals.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Breaking News</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.sectionLink}>View all</Text>
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
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.sectionLink}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.feed}>
              {recommendations.map((signal) => renderSignalCard(signal))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <RuvoButton
        title="Ask Ruvo"
        onPress={() => router.push('/ask-ruvo')}
        leftIcon={<MessageCircle size={20} color={Colors.text.inverse} />}
        style={styles.fab}
        textStyle={{ color: Colors.text.inverse }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
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
    height: 100,
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
    color: Colors.text.onLight,
    letterSpacing: -0.3,
  },
  sectionLink: {
    color: Colors.primary,
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
    backgroundColor: Colors.card.secondary,
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  slideTagText: {
    color: Colors.text.inverse,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  slideTitle: {
    color: Colors.text.inverse,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  slideMeta: {
    marginTop: 4,
    color: '#E6F3F0',
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
    backgroundColor: Colors.border.primary,
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
    backgroundColor: Colors.primary,
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
    color: Colors.text.onLight,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Fonts.regular,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  feed: {
    paddingHorizontal: 16,
    paddingTop: 0,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
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
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  summary: {
    fontSize: 15,
    color: Colors.text.secondary,
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
    backgroundColor: 'rgba(240,244,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  morePill: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  reactionText: {
    color: Colors.text.onLight,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: Colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    gap: 8,
  },
});
