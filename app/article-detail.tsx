import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ExternalLink, Heart, Bookmark, Share2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { echoControlService } from '@/lib/echoControlService';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { signals, toggleSignalLike, toggleSignalSave, echoControlEnabled, echoControlGrouping, customKeywords } = useApp();
  
  // Find the signal by ID
  const signal = signals.find(s => s.id === id);

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
      <View style={styles.container}>
        <Text>Article not found</Text>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Article</Text>
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
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.title}>{signal.title}</Text>

          {/* Meta */}
          <View style={styles.meta}>
            <Text style={styles.source}>{signal.sourceName}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.time}>{formatTimeAgo(signal.timestamp)}</Text>
            {signal.verified && (
              <>
                <Text style={styles.dot}>•</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              </>
            )}
          </View>

          {/* Summary */}
          <Text style={styles.summary}>{signal.summary}</Text>

          {/* Full Content (if available) */}
          {signal.content && signal.content.length > signal.summary.length && (
            <View style={styles.fullContentSection}>
              <Text style={styles.fullContentLabel}>Full Article</Text>
              <Text style={styles.fullContent}>{signal.content}</Text>
            </View>
          )}

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && echoControlEnabled && (
            <View style={styles.relatedArticlesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Different Perspectives</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{relatedArticles.length}</Text>
                </View>
              </View>
              <Text style={styles.relatedArticlesDescription}>
                See how other sources are covering this story
              </Text>
              
              <View style={styles.relatedArticlesList}>
                {relatedArticles.map((article, index) => (
                  <TouchableOpacity 
                    key={article.id} 
                    style={styles.relatedArticle}
                    onPress={() => {
                      router.push({
                        pathname: '/article-detail',
                        params: { id: article.id }
                      });
                    }}
                  >
                    <View style={styles.relatedArticleContent}>
                      <Text style={styles.relatedArticleSource} numberOfLines={1}>
                        {article.sourceName}
                      </Text>
                      <Text style={styles.relatedArticleTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                    </View>
                    {article.verified && (
                      <View style={styles.verifiedBadgeSmall}>
                        <Text style={styles.verifiedTextSmall}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Read Full Article Button */}
          <TouchableOpacity 
            style={styles.readMoreButton}
            onPress={handleOpenUrl}
            activeOpacity={0.8}
          >
            <ExternalLink size={20} color={Colors.text.inverse} />
            <Text style={styles.readMoreText}>Read Full Article</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, signal.liked && styles.actionButtonActive]}
              onPress={() => {
                console.log('Article Detail - Like pressed:', signal.id, 'Current state:', signal.liked);
                toggleSignalLike(signal.id);
              }}
              activeOpacity={0.8}
            >
              <Heart 
                size={22} 
                color={signal.liked ? Colors.alert : Colors.text.primary} 
                fill={signal.liked ? Colors.alert : 'transparent'}
              />
              <Text style={[styles.actionText, signal.liked && styles.actionTextActive]}>Like</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, signal.saved && styles.actionButtonActive]}
              onPress={() => {
                console.log('Article Detail - Save pressed:', signal.id, 'Current state:', signal.saved);
                toggleSignalSave(signal.id);
              }}
              activeOpacity={0.8}
            >
              <Bookmark 
                size={22} 
                color={signal.saved ? Colors.primary : Colors.text.primary} 
                fill={signal.saved ? Colors.primary : 'transparent'}
              />
              <Text style={[styles.actionText, signal.saved && styles.actionTextActive]}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <Share2 size={22} color={Colors.text.primary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom Padding for Safe Area */}
          <View style={styles.bottomSpacer} />
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
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
    backgroundColor: Colors.card.secondary,
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
    backgroundColor: 'rgba(240,244,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
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
    color: Colors.text.primary,
  },
  dot: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginHorizontal: 8,
  },
  time: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  verifiedBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  summary: {
    fontSize: 18,
    color: Colors.text.secondary,
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
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fullContent: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 26,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  readMoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
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
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(240,244,255,0.8)',
    borderColor: Colors.primary,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  actionTextActive: {
    color: Colors.primary,
  },
  bottomSpacer: {
    height: 60,
  },
  relatedArticlesSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border.lighter,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
  },
  badge: {
    backgroundColor: Colors.primary,
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
    color: Colors.text.inverse,
  },
  relatedArticlesDescription: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginBottom: 16,
  },
  relatedArticlesList: {
    gap: 12,
  },
  relatedArticle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  relatedArticleContent: {
    flex: 1,
    marginRight: 12,
  },
  relatedArticleSource: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  relatedArticleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  verifiedBadgeSmall: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTextSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
});
