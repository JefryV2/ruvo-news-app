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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { INTERESTS } from '@/constants/mockData';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrendingByCategory, useSearchArticles } from '@/lib/hooks';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { t, language } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const InterestSection = ({ interest, apiCategory, formatTimeAgo }: any) => {
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
          <Text style={styles.loadingText}>{t('feed.loading')}</Text>
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
            <Text style={styles.sectionTitle}>{t(getInterestTranslation(interest.name))}</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>{t('actions.view')} All</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
                 {articles.map((article: any, index: number) => (
                   <TouchableOpacity
                     key={`${article.url}-${index}`}
                     style={styles.articleCard}
                     onPress={() => router.push(`/article-detail?url=${encodeURIComponent(article.url)}`)}
                   >
                     <Image 
                       source={{ 
                         uri: article.imageUrl || article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'
                       }} 
                       style={styles.articleImage}
                       defaultSource={{ uri: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop' }}
                     />
                     <View style={styles.articleContent}>
                       <Text style={styles.articleTitle} numberOfLines={3}>
                         {article.title}
                       </Text>
                       <Text style={styles.articleDescription} numberOfLines={2}>
                         {article.description}
                       </Text>
                       <View style={styles.articleMeta}>
                         <Text style={styles.articleSource}>{article.source?.name || article.source || 'Unknown'}</Text>
                         <Text style={styles.articleTime}>
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
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('discover.title')}</Text>
        <Text style={styles.headerSubtitle}>Explore news by your interests</Text>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('discover.search')}
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery.length > 2 ? (
          // Search Results
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>{t('discover.search')} Results</Text>
            {searchLoading ? (
              <Text style={styles.loadingText}>{t('feed.loading')}</Text>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No results found</Text>
                <Text style={styles.emptyStateSubtext}>Try different keywords</Text>
              </View>
            ) : (
              <View style={styles.searchResultsList}>
                {searchResults.slice(0, 20).map((article) => (
                  <TouchableOpacity key={article.id} style={styles.searchResultCard} activeOpacity={0.9}>
                    {article.imageUrl && (
                      <Image source={{ uri: article.imageUrl }} style={styles.searchResultImage} resizeMode="cover" />
                    )}
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultCategory}>{article.category}</Text>
                      <Text numberOfLines={2} style={styles.searchResultTitle}>{article.title}</Text>
                      <View style={styles.searchResultMeta}>
                        <Text style={styles.searchResultSource}>{article.source}</Text>
                        <Text style={styles.newsDot}>•</Text>
                        <Text style={styles.searchResultTime}>{formatTimeAgo(article.publishedAt)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : userInterests.length === 0 ? (
          // No interests selected
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No interests selected</Text>
            <Text style={styles.emptyStateSubtext}>
              Go to your profile and select interests to see personalized content
            </Text>
          </View>
        ) : (
          // Show articles grouped by interests
          <>
            {userInterests.map(interest => renderInterestSection(interest))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.background.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontFamily: Fonts.regular,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: Fonts.regular,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  articlesRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  articleCard: {
    width: CARD_WIDTH * 0.9,
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  articleImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.background.secondary,
  },
  articleContent: {
    padding: 12,
  },
  articleSource: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: Fonts.bold,
  },
  articleDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: Fonts.regular,
  },
  articleTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: Fonts.regular,
  },
  searchResultsList: {
    gap: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.background.secondary,
  },
  searchResultContent: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 12,
    justifyContent: 'center',
  },
  searchResultCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: Fonts.semiBold,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchResultSource: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: Fonts.regular,
  },
  newsDot: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  searchResultTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: Fonts.regular,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 40,
    fontFamily: Fonts.regular,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
