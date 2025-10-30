import { Signal } from '@/types';

const WEBZIO_API_KEY = process.env.EXPO_PUBLIC_WEBZIO_API_KEY;
const WEBZIO_API_URL = 'https://api.webz.io/newsApiLite';

export const webzioService = {
  /**
   * Fetch news articles from Webz.io
   */
  async fetchNews(query: string, size: number = 20): Promise<Signal[]> {
    if (!WEBZIO_API_KEY) {
      console.warn('Webz.io API key not configured');
      return [];
    }

    try {
      const url = `${WEBZIO_API_URL}?token=${WEBZIO_API_KEY}&q=${encodeURIComponent(query)}&size=${size}&sort=crawled:desc`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Webz.io API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.posts || data.posts.length === 0) {
        return [];
      }

      return this.convertToSignals(data.posts);
    } catch (error) {
      console.error('Webz.io fetch error:', error);
      return [];
    }
  },

  /**
   * Fetch personalized news based on user interests
   */
  async fetchPersonalizedNews(interests: string[]): Promise<Signal[]> {
    if (!interests || interests.length === 0) {
      // Default query for general news
      return this.fetchNews('news', 20);
    }

    try {
      // Build a query with OR operator for multiple interests
      const query = interests.map(interest => `"${interest}"`).join(' OR ');
      return await this.fetchNews(query, 30);
    } catch (error) {
      console.error('Personalized news error:', error);
      return [];
    }
  },

  /**
   * Fetch news by category
   */
  async fetchByCategory(category: string, size: number = 15): Promise<Signal[]> {
    const categoryQueries: { [key: string]: string } = {
      'technology': '(technology OR tech OR software OR AI OR "artificial intelligence")',
      'business': '(business OR finance OR market OR economy OR stock)',
      'sports': '(sports OR football OR basketball OR soccer OR tennis)',
      'health': '(health OR medical OR wellness OR fitness OR healthcare)',
      'science': '(science OR research OR discovery OR space OR innovation)',
      'entertainment': '(entertainment OR celebrity OR music OR movie OR film)',
      'general': 'news',
    };

    const query = categoryQueries[category.toLowerCase()] || categoryQueries['general'];
    return this.fetchNews(query, size);
  },

  /**
   * Search news articles
   */
  async searchNews(query: string, size: number = 20): Promise<Signal[]> {
    return this.fetchNews(query, size);
  },

  /**
   * Convert Webz.io posts to Signal format
   */
  convertToSignals(posts: any[]): Signal[] {
    return posts
      .filter(post => post.title && post.text)
      .map((post, index) => ({
        id: `webzio-${post.uuid || Date.now()}-${index}`,
        title: post.title || 'No title',
        summary: this.extractSummary(post.text),
        content: post.text || '',
        sourceId: `webzio-${post.thread?.site || 'unknown'}`,
        sourceName: post.thread?.site || post.author || 'Unknown Source',
        verified: this.isVerifiedSource(post.thread?.site),
        tags: this.extractTags(post),
        url: post.url || post.thread?.url || '',
        relevanceScore: this.calculateRelevance(post),
        timestamp: new Date(post.published || post.crawled),
        imageUrl: this.extractImage(post),
        saved: false,
        liked: false,
      }));
  },

  /**
   * Extract summary from full text
   */
  extractSummary(text: string): string {
    if (!text) return 'No description available';
    
    // Get first 2-3 sentences or first 200 characters
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 3).join(' ');
    
    if (summary.length > 250) {
      return summary.substring(0, 250) + '...';
    }
    
    return summary || text.substring(0, 200) + '...';
  },

  /**
   * Extract main image from post
   */
  extractImage(post: any): string | undefined {
    // Check main image
    if (post.thread?.main_image) {
      return post.thread.main_image;
    }

    // Check entities for images
    if (post.entities?.persons?.[0]?.image) {
      return post.entities.persons[0].image;
    }

    // Check media attachments
    if (post.media && post.media.length > 0) {
      return post.media[0].url;
    }

    return undefined;
  },

  /**
   * Extract tags from post
   */
  extractTags(post: any): string[] {
    const tags: string[] = [];

    // Add category if available
    if (post.thread?.section_title) {
      tags.push(post.thread.section_title);
    }

    // Add entities as tags
    if (post.entities) {
      if (post.entities.organizations) {
        post.entities.organizations.slice(0, 2).forEach((org: any) => {
          tags.push(org.name);
        });
      }
      
      if (post.entities.locations) {
        post.entities.locations.slice(0, 1).forEach((loc: any) => {
          tags.push(loc.name);
        });
      }
    }

    // Keyword-based tags
    const text = `${post.title || ''} ${post.text || ''}`.toLowerCase();
    
    if (text.includes('tech') || text.includes('ai') || text.includes('technology')) tags.push('Tech');
    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('blockchain')) tags.push('Crypto');
    if (text.includes('finance') || text.includes('market') || text.includes('stock')) tags.push('Finance');
    if (text.includes('health') || text.includes('medical')) tags.push('Health');
    if (text.includes('sport') || text.includes('football')) tags.push('Sports');
    if (text.includes('science') || text.includes('research')) tags.push('Science');

    // Remove duplicates and limit to 5 tags
    return [...new Set(tags)].slice(0, 5);
  },

  /**
   * Check if source is verified
   */
  isVerifiedSource(site: string): boolean {
    if (!site) return false;
    
    const verifiedDomains = [
      'reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com', 'theguardian.com',
      'washingtonpost.com', 'wsj.com', 'bloomberg.com', 'apnews.com', 'forbes.com',
      'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com'
    ];

    return verifiedDomains.some(domain => site.includes(domain));
  },

  /**
   * Calculate relevance score
   */
  calculateRelevance(post: any): number {
    let score = 0.7; // Base score

    // Boost for verified sources
    if (this.isVerifiedSource(post.thread?.site)) {
      score += 0.2;
    }

    // Boost for recent articles (within last 24 hours)
    const publishedDate = new Date(post.published || post.crawled);
    const hoursSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSincePublished < 24) {
      score += 0.1;
    }

    // Cap at 1.0
    return Math.min(score, 1.0);
  },
};
