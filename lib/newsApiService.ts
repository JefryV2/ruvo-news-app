import { Signal } from '@/types';

const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2';

export const newsApiService = {
  /**
   * Fetch top headlines
   */
  async fetchTopHeadlines(country: string = 'us', category?: string): Promise<Signal[]> {
    if (!NEWS_API_KEY) {
      throw new Error('News API key not configured');
    }

    try {
      let url = `${NEWS_API_URL}/top-headlines?country=${country}&pageSize=20&apiKey=${NEWS_API_KEY}`;
      
      if (category) {
        url += `&category=${category}`;
      }

      // Add timeout wrapper for fetch requests
      const fetchWithTimeout = async (url: string, timeout: number = 10000): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const response = await fetchWithTimeout(url);
      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(data.message || 'Failed to fetch news');
      }

      return this.convertToSignals(data.articles);
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  },

  /**
   * Search news by query
   */
  async searchNews(query: string, sortBy: string = 'publishedAt'): Promise<Signal[]> {
    if (!NEWS_API_KEY) {
      throw new Error('News API key not configured');
    }

    try {
      const url = `${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&sortBy=${sortBy}&pageSize=20&apiKey=${NEWS_API_KEY}`;
      
      // Add timeout wrapper for fetch requests
      const fetchWithTimeout = async (url: string, timeout: number = 10000): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const response = await fetchWithTimeout(url);
      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(data.message || 'Failed to search news');
      }

      return this.convertToSignals(data.articles);
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  },

  /**
   * Fetch news based on user interests
   */
  async fetchPersonalizedNews(interests: string[]): Promise<Signal[]> {
    if (!interests || interests.length === 0) {
      return this.fetchTopHeadlines();
    }

    try {
      // Fetch news for each interest and combine
      const newsPromises = interests.map(interest => 
        this.searchNews(interest).catch(() => [])
      );

      const results = await Promise.all(newsPromises);
      const allNews = results.flat();

      // Remove duplicates and sort by date
      const uniqueNews = Array.from(
        new Map(allNews.map(item => [item.id, item])).values()
      );

      return uniqueNews.sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Personalized news error:', error);
      return this.fetchTopHeadlines();
    }
  },

  /**
   * Convert News API articles to Signal format
   */
  convertToSignals(articles: any[]): Signal[] {
    return articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map((article, index) => ({
        id: `news-${Date.now()}-${index}`,
        title: article.title,
        summary: article.description || article.content || 'No description available',
        content: article.content || article.description || '',
        sourceId: `source-${index}`,
        sourceName: article.source?.name || 'Unknown',
        verified: true,
        tags: this.extractTags(article),
        url: article.url,
        relevanceScore: 0.9 - (index * 0.01),
        timestamp: new Date(article.publishedAt),
        imageUrl: article.urlToImage || undefined,
        saved: false,
        liked: false,
      }));
  },

  /**
   * Extract tags from article
   */
  extractTags(article: any): string[] {
    const tags: string[] = [];
    
    if (article.source?.name) {
      tags.push(article.source.name);
    }
    
    // Add category if available
    const title = article.title?.toLowerCase() || '';
    const description = article.description?.toLowerCase() || '';
    const text = `${title} ${description}`;
    
    // Simple keyword extraction
    if (text.includes('tech') || text.includes('ai') || text.includes('technology')) tags.push('Tech');
    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('blockchain')) tags.push('Crypto');
    if (text.includes('finance') || text.includes('market') || text.includes('stock')) tags.push('Finance');
    if (text.includes('health') || text.includes('medical')) tags.push('Health');
    if (text.includes('sport') || text.includes('football') || text.includes('soccer')) tags.push('Sports');
    if (text.includes('politics') || text.includes('government')) tags.push('Politics');
    if (text.includes('science') || text.includes('research')) tags.push('Science');
    
    return tags.slice(0, 3);
  },
};
