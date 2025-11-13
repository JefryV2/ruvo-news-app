import { supabase } from './supabase';
import { GeolocationService } from './geolocationService';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
    domain: string;
    credibilityScore: number;
    category: string;
  };
  category: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  trendingScore: number;
}

export interface NewsSource {
  id: string;
  name: string;
  domain: string;
  credibilityScore: number;
  category: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface UserInterest {
  id: string;
  name: string;
  category: string;
  weight: number; // 0-1, how much user cares about this interest
  keywords: string[];
  sources: string[]; // source IDs user wants to follow
}

export interface PersonalizedNewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

class NewsService {
  private readonly NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
  private readonly NEWS_API_BASE_URL = 'https://newsapi.org/v2';
  private readonly CREDIBLE_SOURCES = [
    'bbc.com', 'cnn.com', 'reuters.com', 'ap.org', 'npr.org',
    'wsj.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com',
    'bloomberg.com', 'ft.com', 'economist.com', 'techcrunch.com',
    'wired.com', 'arstechnica.com', 'verge.com'
  ];

  // Get personalized news based on user interests and location
  async getPersonalizedNews(
    userId: string,
    interests: UserInterest[],
    page: number = 1,
    limit: number = 20,
    includeLocation: boolean = true
  ): Promise<PersonalizedNewsResponse> {
    try {
      // Get user's preferred sources
      const userSources = await this.getUserSources(userId);
      
      // Get location-based sources if enabled
      let allSources = [...userSources];
      if (includeLocation) {
        try {
          const countryCode = await GeolocationService.getCountryCodeForNews();
          const regionalSources = await GeolocationService.getRegionalNewsSources(countryCode);
          
          // Add regional sources that aren't already included
          const regionalSourceObjects = regionalSources
            .filter(sourceId => !userSources.some(s => s.id === sourceId))
            .map(sourceId => ({
              id: sourceId,
              name: sourceId.replace('-', ' ').toUpperCase(),
              domain: `${sourceId}.com`,
              credibilityScore: 0.8,
              category: 'regional',
              isActive: true,
              lastUpdated: new Date().toISOString()
            }));
          
          allSources = [...userSources, ...regionalSourceObjects];
        } catch (error) {
          console.warn('Could not get location-based sources:', error);
        }
      }
      
      // Get news from multiple sources
      const newsPromises = allSources.map(source => 
        this.fetchNewsFromSource(source, interests, page, limit)
      );
      
      const newsResults = await Promise.allSettled(newsPromises);
      const allArticles = newsResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<NewsArticle[]>).value);

      // Apply personalization algorithm
      const personalizedArticles = this.personalizeNews(allArticles, interests);
      
      // Sort by relevance and trending score
      const sortedArticles = personalizedArticles
        .sort((a, b) => (b.relevanceScore + b.trendingScore) - (a.relevanceScore + a.trendingScore))
        .slice(0, limit);

      return {
        articles: sortedArticles,
        totalCount: personalizedArticles.length,
        hasMore: personalizedArticles.length > limit,
        nextCursor: page.toString()
      };
    } catch (error) {
      console.error('Error fetching personalized news:', error);
      return { articles: [], totalCount: 0, hasMore: false };
    }
  }

  // Fetch news from a specific source
  private async fetchNewsFromSource(
    source: NewsSource,
    interests: UserInterest[],
    page: number,
    limit: number
  ): Promise<NewsArticle[]> {
    try {
      const response = await fetch(
        `${this.NEWS_API_BASE_URL}/everything?sources=${source.id}&page=${page}&pageSize=${limit}&apiKey=${this.NEWS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.articles?.map((article: any) => this.transformArticle(article, source)) || [];
    } catch (error) {
      console.error(`Error fetching news from ${source.name}:`, error);
      return [];
    }
  }

  // Transform API article to our format
  private transformArticle(apiArticle: any, source: NewsSource): NewsArticle {
    return {
      id: `${source.id}-${apiArticle.publishedAt}-${Math.random().toString(36).substr(2, 9)}`,
      title: apiArticle.title,
      description: apiArticle.description || '',
      content: apiArticle.content || '',
      url: apiArticle.url,
      imageUrl: apiArticle.urlToImage,
      publishedAt: apiArticle.publishedAt,
      source: {
        id: source.id,
        name: source.name,
        domain: source.domain,
        credibilityScore: source.credibilityScore,
        category: source.category
      },
      category: this.categorizeArticle(apiArticle.title, apiArticle.description),
      tags: this.extractTags(apiArticle.title, apiArticle.description),
      sentiment: this.analyzeSentiment(apiArticle.title, apiArticle.description),
      relevanceScore: 0, // Will be calculated in personalization
      trendingScore: 0 // Will be calculated based on recency and engagement
    };
  }

  // Personalize news based on user interests
  private personalizeNews(articles: NewsArticle[], interests: UserInterest[]): NewsArticle[] {
    return articles.map(article => {
      let relevanceScore = 0;
      
      // Calculate relevance based on interests
      interests.forEach(interest => {
        const categoryMatch = article.category === interest.category ? 0.3 : 0;
        const keywordMatches = this.calculateKeywordMatches(article, interest.keywords);
        const sourceMatch = interest.sources.includes(article.source.id) ? 0.2 : 0;
        
        const interestScore = (categoryMatch + keywordMatches + sourceMatch) * interest.weight;
        relevanceScore += interestScore;
      });
      
      // Calculate trending score based on recency and engagement
      const trendingScore = this.calculateTrendingScore(article);
      
      return {
        ...article,
        relevanceScore: Math.min(relevanceScore, 1), // Cap at 1
        trendingScore
      };
    });
  }

  // Calculate keyword matches between article and interest keywords
  private calculateKeywordMatches(article: NewsArticle, keywords: string[]): number {
    const articleText = `${article.title} ${article.description}`.toLowerCase();
    const matches = keywords.filter(keyword => 
      articleText.includes(keyword.toLowerCase())
    ).length;
    
    return Math.min(matches / keywords.length, 0.5); // Max 0.5 for keyword matches
  }

  // Calculate trending score based on recency and other factors
  private calculateTrendingScore(article: NewsArticle): number {
    const now = new Date();
    const published = new Date(article.publishedAt);
    const hoursAgo = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
    
    // More recent articles get higher trending scores
    const recencyScore = Math.max(0, 1 - (hoursAgo / 24)); // Decay over 24 hours
    
    // Source credibility affects trending score
    const credibilityBonus = article.source.credibilityScore * 0.2;
    
    return Math.min(recencyScore + credibilityBonus, 1);
  }

  // Categorize article based on title and description
  private categorizeArticle(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('politics') || text.includes('government') || text.includes('election')) {
      return 'politics';
    } else if (text.includes('technology') || text.includes('tech') || text.includes('ai') || text.includes('software')) {
      return 'technology';
    } else if (text.includes('business') || text.includes('economy') || text.includes('finance') || text.includes('market')) {
      return 'business';
    } else if (text.includes('sports') || text.includes('football') || text.includes('basketball') || text.includes('soccer')) {
      return 'sports';
    } else if (text.includes('health') || text.includes('medical') || text.includes('covid') || text.includes('vaccine')) {
      return 'health';
    } else if (text.includes('science') || text.includes('research') || text.includes('study')) {
      return 'science';
    } else {
      return 'general';
    }
  }

  // Extract relevant tags from article content
  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const commonTags = [
      'breaking', 'urgent', 'exclusive', 'analysis', 'opinion',
      'investigation', 'report', 'update', 'alert', 'news'
    ];
    
    return commonTags.filter(tag => text.includes(tag));
  }

  // Simple sentiment analysis
  private analyzeSentiment(title: string, description: string): 'positive' | 'negative' | 'neutral' {
    const text = `${title} ${description}`.toLowerCase();
    
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'win', 'achievement'];
    const negativeWords = ['bad', 'terrible', 'negative', 'failure', 'lose', 'crisis', 'problem'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Get user's preferred sources
  private async getUserSources(userId: string): Promise<NewsSource[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data, error } = await supabase
        .from('user_sources')
        .select(`
          *,
          sources (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return data?.map((item: any) => ({
        id: item.sources.id,
        name: item.sources.name,
        domain: item.sources.domain,
        credibilityScore: item.sources.credibility_score,
        category: item.sources.category,
        isActive: item.is_active,
        lastUpdated: item.updated_at
      })) || [];
    } catch (error) {
      console.error('Error fetching user sources:', error);
      return [];
    }
  }

  // Get trending topics (location-aware)
  async getTrendingTopics(limit: number = 10, includeLocation: boolean = true): Promise<string[]> {
    try {
      let trendingTopics: string[] = [];
      
      // Get global trending topics
      const globalTopics = [
        'AI Technology', 'Climate Change', 'Space Exploration', 'Cryptocurrency',
        'Healthcare Innovation', 'Renewable Energy', 'Global Economy', 'Cybersecurity',
        'Social Media', 'Electric Vehicles'
      ];
      
      trendingTopics = [...globalTopics];
      
      // Add location-specific topics if enabled
      if (includeLocation) {
        try {
          const countryCode = await GeolocationService.getCountryCodeForNews();
          const regionalTopics = await GeolocationService.getRegionalTrendingTopics(countryCode);
          
          // Mix regional topics with global ones
          trendingTopics = [...regionalTopics.slice(0, 3), ...globalTopics.slice(0, 7)];
        } catch (error) {
          console.warn('Could not get regional trending topics:', error);
        }
      }
      
      return trendingTopics.slice(0, limit);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  // Get credible sources
  async getCredibleSources(): Promise<NewsSource[]> {
    return this.CREDIBLE_SOURCES.map((domain, index) => ({
      id: domain.replace('.com', ''),
      name: domain.split('.')[0].toUpperCase(),
      domain,
      credibilityScore: 0.9 - (index * 0.05), // Slightly decreasing credibility
      category: this.getSourceCategory(domain),
      isActive: true,
      lastUpdated: new Date().toISOString()
    }));
  }

  private getSourceCategory(domain: string): string {
    if (['techcrunch.com', 'wired.com', 'arstechnica.com', 'verge.com'].includes(domain)) {
      return 'technology';
    } else if (['wsj.com', 'ft.com', 'bloomberg.com', 'economist.com'].includes(domain)) {
      return 'business';
    } else if (['bbc.com', 'cnn.com', 'reuters.com', 'ap.org'].includes(domain)) {
      return 'general';
    } else {
      return 'general';
    }
  }
}

export const newsService = new NewsService();


