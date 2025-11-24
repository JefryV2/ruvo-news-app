import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  RefreshControl,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  TextInput,
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
  const { colors, mode } = useTheme();
  
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
          <TouchableOpacity style={styles.seeAllButton}>
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
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.header, { backgroundColor: colors.background.primary }]}> 
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>Cut the Noise. Catch the Signal.</Text>
        </View>

        <View style={styles.searchSection}>
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
          <View style={styles.searchResultsList}>
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
          <View style={styles.content}>
            {userInterests.length > 0 ? (
              userInterests.map((interest: any) => renderInterestSection(interest))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.text.primary }]}>{t('discover.noInterests')}</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.secondary }]}>{t('discover.addInterests')}</Text>
              </View>
            )}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
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
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Fonts.regular,
    color: 'inherit',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'inherit',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'inherit',
    fontFamily: Fonts.regular,
  },
  searchIcon: {
    opacity: 0.7,
  },
  clearButton: {
    padding: 4,
  },
  sectionContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'inherit',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'inherit',
  },
  articlesRow: {
    gap: 16,
  },
  articleCard: {
    width: CARD_WIDTH,
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  articleImage: {
    width: '100%',
    height: 140,
  },
  articleContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'inherit',
    lineHeight: 24,
    marginBottom: 10,
    fontFamily: Fonts.semiBold,
    letterSpacing: -0.2,
  },
  articleDescription: {
    fontSize: 14,
    color: 'inherit',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: 'inherit',
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleSource: {
    fontSize: 13,
    color: 'inherit',
    fontFamily: Fonts.regular,
    fontWeight: '500',
  },
  articleTime: {
    fontSize: 12,
    color: 'inherit',
    fontFamily: Fonts.regular,
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchResultImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  searchResultContent: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  searchResultCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: 'inherit',
    marginBottom: 6,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchResultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'inherit',
    lineHeight: 24,
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
    fontSize: 12,
    color: 'inherit',
    fontFamily: Fonts.regular,
    fontWeight: '500',
  },
  newsDot: {
    fontSize: 12,
    color: 'inherit',
  },
  searchResultTime: {
    fontSize: 12,
    color: 'inherit',
    fontFamily: Fonts.regular,
  },
  loadingText: {
    fontSize: 17,
    color: 'inherit',
    textAlign: 'center',
    paddingVertical: 60,
    fontFamily: Fonts.regular,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'inherit',
    marginBottom: 14,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyStateSubtext: {
    fontSize: 17,
    color: 'inherit',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 140,
    backgroundColor: 'transparent',
  },
  searchResultsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
});
