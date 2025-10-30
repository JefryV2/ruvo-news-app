import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';

export default function LikedArticlesScreen() {
  const insets = useSafeAreaInsets();
  const { signals } = useApp();

  // Filter liked signals
  const likedSignals = signals.filter(signal => signal.liked);

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
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Articles</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {likedSignals.length > 0 ? (
          <View style={styles.articlesContainer}>
            {likedSignals.map((signal) => (
              <TouchableOpacity
                key={signal.id}
                style={styles.articleCard}
                onPress={() => router.push(`/article-detail?id=${signal.id}`)}
                activeOpacity={0.8}
              >
                {signal.imageUrl && (
                  <Image 
                    source={{ uri: signal.imageUrl }} 
                    style={styles.articleImage} 
                    resizeMode="cover"
                  />
                )}
                <View style={styles.articleContent}>
                  <View style={styles.tagsContainer}>
                    {signal.tags.slice(0, 2).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={styles.articleTitle} numberOfLines={2}>{signal.title}</Text>
                  <Text style={styles.articleSummary} numberOfLines={2}>{signal.summary}</Text>
                  
                  <View style={styles.articleMeta}>
                    <Text style={styles.source}>{signal.sourceName}</Text>
                    <View style={styles.timeContainer}>
                      <Clock size={11} color={Colors.text.tertiary} />
                      <Text style={styles.time}>{formatTimeAgo(signal.timestamp)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.likedBadge}>
                  <Heart size={14} color={Colors.alert} fill={Colors.alert} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Heart size={48} color={Colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Liked Articles</Text>
            <Text style={styles.emptyMessage}>
              Start liking articles that you enjoy
            </Text>
          </View>
        )}
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
  backButton: {
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
  articlesContainer: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.card.secondary,
  },
  articleContent: {
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: 'rgba(240,244,255,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Fonts.bold,
  },
  articleSummary: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  source: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  likedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
