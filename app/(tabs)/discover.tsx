import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, ChevronRight, X, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { INTERESTS } from '@/constants/mockData';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTrendingByCategory, useSearchArticles } from '@/lib/hooks';
import { Signal } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Map interests to News API categories
  const categoryMap: { [key: string]: string } = {
    'Tech': 'technology',
    'Finance': 'business',
    'Sports': 'sports',
    'Health': 'health',
    'Science': 'science',
    'Entertainment': 'entertainment',
    'Music': 'entertainment',
    'Gaming': 'technology',
    'Fashion': 'entertainment',
    'K-Pop': 'entertainment',
    'Food': 'general',
    'Travel': 'general',
    'Local Events': 'general',
  };

  // Map interest names to translation keys
  const getInterestTranslation = (interestName: string) => {
    const translationMap: { [key: string]: string } = {
      'Tech': 'category.tech',
      'Finance': 'category.finance',
      'Sports': 'category.sports',
      'Health': 'category.health',
      'Science': 'category.science',
      'Entertainment': 'category.entertainment',
      'Music': 'category.music',
      'Gaming': 'category.gaming',
      'Fashion': 'category.fashion',
      'K-Pop': 'category.kpop',
      'Food': 'category.food',
      'Travel': 'category.travel',
      'Local Events': 'category.localEvents',
    };
    return translationMap[interestName] || interestName;
  };

  // Get user's interests
  const userInterests = useMemo(() => {
    const interests = user?.interests || [];
    return interests
      .map(interestId => INTERESTS.find(i => i.id === interestId))
      .filter(Boolean);
  }, [user?.interests]);

  // Search articles when user types in search bar (only when query length > 2)
  const { data: searchResults = [], isLoading: searchLoading } = useSearchArticles(
    searchQuery.length > 2 ? searchQuery : '',
    undefined,
    language
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTimeAgo = (publishedAt: string) => {
    try {
      const date = new Date(publishedAt);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch (error) {
      return 'Just now';
    }
  };

  const mapArticleToSignalPayload = (article: any): Signal => {
    const source =
      typeof article.source === 'string'
        ? { name: article.source }
        : article.source || { name: 'Discover' };

    return {
      id: article.id || article.url || `discover-${Date.now()}`,
      title: article.title || 'Untitled',
      summary: article.description || article.summary || '',
      content: article.content || article.description || '',
      sourceId: source.id || source.name || 'discover',
      sourceName: source.name || 'Discover',
      verified: false,
      tags: Array.isArray(article.category)
        ? article.category
        : article.category
          ? [article.category]
          : [],
      url: article.url,
      relevanceScore: 0,
      timestamp: article.publishedAt || new Date().toISOString(),
      imageUrl: article.imageUrl || article.urlToImage,
      saved: false,
      liked: false,
    };
  };

  const openArticleDetail = (article: any) => {
    const payload = mapArticleToSignalPayload(article);
    router.push({
      pathname: '/article-detail',
      params: {
        article: encodeURIComponent(JSON.stringify(payload)),
      },
    });
  };

  const InterestSection = ({ interest, apiCategory, formatTimeAgo, colors }: any) => {
    const { data: articles = [], isLoading } = useTrendingByCategory(apiCategory, language);

    if (isLoading) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>{interest.emoji}</Text>
              <Text style={styles.sectionTitle}>{t(getInterestTranslation(interest.name))}</Text>
            </View>
          </View>
          <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>{t('feed.loading')}</Text>
        </View>
      );
    }

    if (articles.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>{interest.emoji}</Text>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t(getInterestTranslation(interest.name))}</Text>
          </View>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => setSearchQuery(interest.name)}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('actions.view')} All</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.articlesRow}
        >
                 {articles.map((article: any, index: number) => (
                   <TouchableOpacity
                     key={`${article.url}-${index}`}
                     style={[styles.articleCard, { backgroundColor: colors.card.secondary }]}
                    onPress={() => openArticleDetail(article)}
                   >
                    <Image 
                      source={{ 
                        uri: article.imageUrl || article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'
                      }} 
                      style={styles.articleImage}
                    />
                     <View style={styles.articleContent}>
                       <Text style={[styles.articleTitle, { color: colors.text.primary }]} numberOfLines={3}>
                         {article.title}
                       </Text>
                       <Text style={[styles.articleDescription, { color: colors.text.secondary }]} numberOfLines={2}>
                         {article.description}
                       </Text>
                       <View style={styles.articleTimeContainer}>
                         <Text style={[styles.articleSource, { color: colors.primary }]}>{article.source?.name || article.source || 'Unknown'}</Text>
                         <Text style={[styles.articleTime, { color: colors.text.tertiary }]}> 
                           {formatTimeAgo(new Date(article.publishedAt))}
                         </Text>
                       </View>
                     </View>
                   </TouchableOpacity>
                 ))}
        </ScrollView>
      </View>
    );
  };

  const renderInterestSection = (interest: any) => {
    const apiCategory = categoryMap[interest.name] || 'general';
    
    return (
      <InterestSection
        key={interest.id}
        interest={interest}
        apiCategory={apiCategory}
        formatTimeAgo={formatTimeAgo}
        colors={colors}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.header, { backgroundColor: colors.background.primary }]}> 
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>Cut the Noise. Catch the Signal.</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.lighter }]}> 
            <SearchIcon size={20} color={colors.text.tertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder={t('discover.searchPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchQuery.length > 2 ? (
          <View style={styles.content}>
            {searchLoading ? (
              <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>{t('feed.loading')}</Text>
            ) : searchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {searchResults.map((article: any, index: number) => (
                  <TouchableOpacity
                    key={`${article.url}-${index}`}
                    style={[styles.searchResultCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}
                    onPress={() => openArticleDetail(article)}
                  >
                    <Image 
                      source={{ 
                        uri: article.imageUrl || article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'
                      }} 
                      style={styles.searchResultImage}
                    />
                    <View style={styles.searchResultContent}>
                      <Text style={[styles.searchResultCategory, { color: colors.text.tertiary }]}> 
                        {article.source?.name || article.source || 'News'}
                      </Text>
                      <Text style={[styles.searchResultTitle, { color: colors.text.primary }]} numberOfLines={3}>
                        {article.title}
                      </Text>
                      <View style={styles.searchResultMeta}>
                        <Text style={[styles.searchResultSource, { color: colors.text.tertiary }]}> 
                          {article.source?.name || article.source || 'Unknown'}
                        </Text>
                        <Text style={[styles.newsDot, { color: colors.text.tertiary }]}>•</Text>
                        <Text style={[styles.searchResultTime, { color: colors.text.tertiary }]}> 
                          {formatTimeAgo(article.publishedAt)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.text.primary }]}>{t('discover.noResults')}</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.secondary }]}>{t('discover.tryDifferent')}</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {userInterests.length > 0 ? (
              userInterests.map((interest: any) => renderInterestSection(interest))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.text.primary }]}>{t('discover.noInterests')}</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.secondary }]}>{t('discover.addInterests')}</Text>
              </View>
            )}
          </>
        )}

        <View style={[styles.bottomPadding, { height: (Platform.OS === 'web' ? 0 : 140 + insets.bottom) }]} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'inherit',
    fontFamily: Fonts.regular,
    letterSpacing: 0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'inherit',
    fontFamily: Fonts.regular,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'inherit',
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'inherit',
    fontFamily: Fonts.semiBold,
  },
  articlesRow: {
    paddingHorizontal: 16,
    gap: 16,
    paddingVertical: 8,
  },
  articleCard: {
    width: CARD_WIDTH * 0.9,
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  articleImage: {
    width: '100%',
    height: 160,
    backgroundColor: 'transparent',
  },
  articleContent: {
    padding: 16,
  },
  articleSource: {
    fontSize: 13,
    fontWeight: '700',
    color: 'inherit',
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: 'inherit',
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  articleDescription: {
    fontSize: 14,
    color: 'inherit',
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: Fonts.regular,
  },
  articleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  articleTime: {
    fontSize: 13,
    color: 'inherit',
    fontFamily: Fonts.regular,
  },
  searchResultsList: {
    gap: 20,
    paddingTop: 8,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  searchResultImage: {
    width: 120,
    height: 120,
    backgroundColor: 'transparent',
  },
  searchResultContent: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    justifyContent: 'center',
  },
  searchResultCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: 'inherit',
    marginBottom: 6,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchResultTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'inherit',
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
    letterSpacing: -0.2,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  searchResultSource: {
    fontSize: 13,
    color: 'inherit',
    fontFamily: Fonts.regular,
  },
  newsDot: {
    fontSize: 13,
    color: 'inherit',
  },
  searchResultTime: {
    fontSize: 13,
    color: 'inherit',
    fontFamily: Fonts.regular,
  },
  loadingText: {
    fontSize: 16,
    color: 'inherit',
    textAlign: 'center',
    paddingVertical: 50,
    fontFamily: Fonts.regular,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '800',
    color: 'inherit',
    marginBottom: 12,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: 'inherit',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 140,
    backgroundColor: 'transparent',
  },
});