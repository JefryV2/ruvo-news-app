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
import { useTheme } from '@/contexts/ThemeContext';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { signals, toggleSignalLike, toggleSignalSave, echoControlEnabled, echoControlGrouping, customKeywords } = useApp();
  const { colors, mode } = useTheme();
  
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
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.primary }}>Article not found</Text>
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.lighter }]}>
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
              style={[styles.actionButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }]}
              activeOpacity={0.8}
            >
              <Share2 size={22} color={colors.text.primary} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Share</Text>
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
});
