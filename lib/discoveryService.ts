import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import { webzioService } from './webzioService';

const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

export interface TrendingTopic {
  id: string;
  name: string;
  count: number;
  category: string;
  imageUrl?: string;
  articles?: any[];
}

export interface DiscoveryArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  category: string;
}

export const discoveryService = {
  /**
   * Get trending topics from News API based on user interests
   */
  async getTrendingTopics(userInterests: string[] = []): Promise<TrendingTopic[]> {
    if (!NEWS_API_KEY) {
      console.warn('News API key not configured');
      return [];
    }

    try {
      let articles: any[] = [];
      
      // If user has interests, fetch personalized topics
      if (userInterests.length > 0) {
        const query = userInterests.slice(0, 3).join(' OR ');
        const response = await fetch(
          `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=popularity&pageSize=50&apiKey=${NEWS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      } else {
        // Fallback to top headlines if no interests
        const response = await fetch(
          `${NEWS_API_BASE_URL}/top-headlines?country=us&pageSize=50&apiKey=${NEWS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      }
      
      // Extract trending topics from articles
      const topics = this.extractTopicsFromArticles(articles, userInterests);
      
      return topics;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  },

  /**
   * Search for articles based on query
   */
  async searchArticles(query: string, category?: string, language: string = 'en'): Promise<DiscoveryArticle[]> {
    if (!NEWS_API_KEY) {
      console.warn('News API key not configured');
      return [];
    }

    try {
      let url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
      
      if (category && category !== 'All') {
        url += `&category=${category.toLowerCase()}`;
      }

      // Use country parameter for Korean content
      if (language === 'ko') {
        url += '&sources=bbc-korean,cnn-korean,reuters-korean';
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to search articles');
      }

      const data = await response.json();
      const articles = data.articles.map((article: any) => this.mapArticleToDiscovery(article, [], language));
      
      // Filter articles by language on client side
      return this.filterArticlesByLanguage(articles, language);
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  },

  /**
   * Get personalized recommendations based on user interests
   */
  async getPersonalizedRecommendations(userInterests: string[]): Promise<DiscoveryArticle[]> {
    if (!NEWS_API_KEY) {
      console.warn('News API key not configured');
      return [];
    }

    try {
      let articles: any[] = [];
      
      if (userInterests.length === 0) {
        // If no interests, fetch general top headlines
        const response = await fetch(
          `${NEWS_API_BASE_URL}/top-headlines?country=us&pageSize=20&apiKey=${NEWS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      } else {
        // Fetch articles for each interest and combine
        const promises = userInterests.slice(0, 3).map(interest => 
          fetch(
            `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(interest)}&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
          ).then(res => res.ok ? res.json() : null)
        );
        
        const results = await Promise.all(promises);
        
        // Combine and deduplicate articles
        const seenUrls = new Set<string>();
        results.forEach(result => {
          if (result?.articles) {
            result.articles.forEach((article: any) => {
              if (!seenUrls.has(article.url)) {
                seenUrls.add(article.url);
                articles.push(article);
              }
            });
          }
        });
      }
      
      return articles.map((article: any) => this.mapArticleToDiscovery(article, userInterests));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  },

  /**
   * Get trending topics by category
   */
  async getTrendingByCategory(category: string, language: string = 'en'): Promise<DiscoveryArticle[]> {
    if (!category) {
      return [];
    }

    try {
      const promises: Promise<DiscoveryArticle[]>[] = [];
      
      // Fetch from News API if available
      if (NEWS_API_KEY) {
        // Use country parameter for Korean content instead of language
        const countryParam = language === 'ko' ? '&country=kr' : '&country=us';
        const url = `${NEWS_API_BASE_URL}/top-headlines?category=${category.toLowerCase()}&pageSize=15${countryParam}&apiKey=${NEWS_API_KEY}`;
        
        promises.push(
          fetch(url)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            const articles = data ? data.articles.map((article: any) => this.mapArticleToDiscovery(article, [category], language)) : [];
            // Filter articles by language on client side
            return this.filterArticlesByLanguage(articles, language);
          })
          .catch((error) => {
            console.error(`News API error for ${category}:`, error);
            return [];
          })
        );
      }
      
      // Fetch from Webz.io
      promises.push(
        webzioService.fetchByCategory(category, 15)
          .then(signals => signals.map(signal => ({
            id: signal.id,
            title: signal.title,
            description: signal.summary,
            url: signal.url,
            imageUrl: signal.imageUrl,
            source: signal.sourceName,
            publishedAt: signal.timestamp instanceof Date ? signal.timestamp.toISOString() : signal.timestamp,
            category: category,
          })))
          .catch(() => [])
      );
      
      const results = await Promise.all(promises);
      const combined = results.flat();
      
      // Remove duplicates
      const unique = combined.filter((article, index, self) =>
        index === self.findIndex((a) => 
          a.title.toLowerCase().trim() === article.title.toLowerCase().trim()
        )
      );
      
      return unique.slice(0, 20);
    } catch (error) {
      console.error('Error fetching category articles:', error);
      return [];
    }
  },

  /**
   * Helper: Extract topics from articles
   */
  extractTopicsFromArticles(articles: any[], userInterests: string[]): TrendingTopic[] {
    const topicsMap = new Map<string, { count: number; category: string; articles: any[] }>();
    const stopWords = new Set(['about', 'after', 'before', 'their', 'these', 'those', 'where', 'which', 'while', 'would', 'could', 'should']);

    articles.forEach((article) => {
      // Extract keywords from title and description
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      const words = text.split(/\W+/);
      const relevantWords = words.filter((w: string) => w.length > 4 && !stopWords.has(w));

      // Count word frequencies
      const wordCounts = new Map<string, number>();
      relevantWords.forEach((word: string) => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });

      // Only keep words that appear multiple times (more significant)
      wordCounts.forEach((count, word) => {
        if (count >= 1) {
          const current = topicsMap.get(word) || { count: 0, category: 'General', articles: [] };
          topicsMap.set(word, {
            count: current.count + count,
            category: this.categorizeWord(word, userInterests),
            articles: [...current.articles, article].slice(0, 5),
          });
        }
      });
    });

    // Convert to array and sort by count
    const topics = Array.from(topicsMap.entries())
      .map(([name, data]) => ({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: data.count * 850, // Simulate mention count
        category: data.category,
        articles: data.articles,
      }))
      .filter(topic => topic.count >= 1700) // Filter low-frequency topics
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return topics;
  },

  /**
   * Helper: Categorize a word based on user interests
   */
  categorizeWord(word: string, userInterests: string[]): string {
    const categories: { [key: string]: string[] } = {
      Tech: ['tech', 'ai', 'software', 'digital', 'crypto', 'bitcoin'],
      Finance: ['market', 'stocks', 'finance', 'economy', 'trading'],
      Sports: ['sports', 'football', 'basketball', 'soccer', 'game'],
      Entertainment: ['music', 'movie', 'celebrity', 'show', 'entertainment'],
      Politics: ['politics', 'election', 'government', 'president'],
      Health: ['health', 'medical', 'covid', 'vaccine', 'wellness'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => word.includes(k))) {
        return category;
      }
    }

    // Check user interests
    for (const interest of userInterests) {
      if (word.includes(interest.toLowerCase())) {
        return interest;
      }
    }

    return 'General';
  },

  /**
   * Helper: Map News API article to our format
   */
  mapArticleToDiscovery(article: any, userInterests: string[] = [], language: string = 'en'): DiscoveryArticle {
    // Determine category based on content
    let category = 'General';
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    // Check user interests first
    for (const interest of userInterests) {
      if (text.includes(interest.toLowerCase())) {
        category = interest;
        break;
      }
    }
    
    // If no match, use keyword-based categorization
    if (category === 'General') {
      category = this.categorizeWord(text, userInterests);
    }
    
    return {
      id: article.url || article.title,
      title: article.title || 'No title',
      description: article.description || article.content || '',
      url: article.url,
      imageUrl: article.urlToImage || this.getDefaultImageForCategory(category),
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      category: category,
    };
  },

  /**
   * Helper: Filter articles by language on client side
   */
  filterArticlesByLanguage(articles: DiscoveryArticle[], language: string): DiscoveryArticle[] {
    if (language === 'en') {
      return articles; // Return all articles for English
    }
    
    if (language === 'ko') {
      // Filter for Korean articles by checking for Korean characters
      return articles.filter(article => {
        const text = `${article.title} ${article.description}`;
        // Check if text contains Korean characters (Hangul)
        return /[\u3131-\u3163\uac00-\ud7a3]/.test(text);
      });
    }
    
    return articles;
  },

  /**
   * Helper: Get default image for category when no image is available
   */
  getDefaultImageForCategory(category: string): string {
    const defaultImages: { [key: string]: string } = {
      'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
      'business': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop',
      'sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      'health': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop',
      'science': 'https://images.unsplash.com/photo-1532094349884-543bc87b0a51?w=400&h=200&fit=crop',
      'entertainment': 'https://images.unsplash.com/photo-1489599801030-0b4b7b4b4b4b?w=400&h=200&fit=crop',
      'general': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop',
    };
    
    return defaultImages[category.toLowerCase()] || defaultImages['general'];
  },
};
