import { CustomAlert, CustomAlertType } from '@/types';

export type ParsedRequest = {
  intent: 'create_alert' | 'search' | 'summarize' | 'question' | 'unknown';
  alertType?: CustomAlertType;
  entities: {
    artists?: string[];
    companies?: string[];
    products?: string[];
    people?: string[];
    topics?: string[];
  };
  keywords: string[];
  rawQuery: string;
};

export class AIRequestParser {
  // Intent detection patterns
  private static alertPatterns = [
    /notify|alert|tell|let me know|inform|update/i,
    /when.*(?:release|drop|announce|launch)/i,
  ];

  private static searchPatterns = [
    /show|find|search|look for|get/i,
  ];

  private static summarizePatterns = [
    /summary|summarize|brief|overview/i,
  ];

  // Entity detection patterns
  private static artistPatterns = [
    /bts|blackpink|twice|exo|seventeen|itzy|aespa|newjeans|le sserafim|ive/i,
    /taylor swift|drake|beyonce|the weeknd|ariana grande/i,
  ];

  private static companyPatterns = [
    /apple|google|microsoft|amazon|meta|facebook|tesla|spacex|netflix|disney/i,
    /samsung|lg|sony|nvidia|intel|amd|qualcomm/i,
  ];

  private static productPatterns = [
    /iphone|ipad|macbook|airpods|apple watch|vision pro/i,
    /galaxy|pixel|surface|playstation|xbox|switch/i,
  ];

  // Alert type detection
  private static alertTypeMap: { pattern: RegExp; type: CustomAlertType }[] = [
    { pattern: /album|music|song|release|drop/i, type: 'album_release' },
    { pattern: /product|announce|launch|unveil/i, type: 'product_announcement' },
    { pattern: /earnings|quarterly|financial|report/i, type: 'earnings_report' },
    { pattern: /price|stock|crypto|bitcoin|ethereum/i, type: 'price_change' },
    { pattern: /event|concert|tour|conference/i, type: 'event' },
    { pattern: /news|mention|article|story/i, type: 'news_mention' },
  ];

  /**
   * Parse user query and extract intent and entities
   */
  static parseRequest(query: string): ParsedRequest {
    const lowerQuery = query.toLowerCase();
    
    // Detect intent
    const intent = this.detectIntent(lowerQuery);
    
    // Extract entities
    const entities = this.extractEntities(query);
    
    // Extract keywords
    const keywords = this.extractKeywords(lowerQuery);
    
    // Detect alert type if intent is create_alert
    let alertType: CustomAlertType | undefined;
    if (intent === 'create_alert') {
      alertType = this.detectAlertType(lowerQuery);
    }

    return {
      intent,
      alertType,
      entities,
      keywords,
      rawQuery: query,
    };
  }

  /**
   * Detect the user's intent from the query
   */
  private static detectIntent(query: string): ParsedRequest['intent'] {
    // Check for alert patterns
    if (this.alertPatterns.some(pattern => pattern.test(query))) {
      return 'create_alert';
    }

    // Check for search patterns
    if (this.searchPatterns.some(pattern => pattern.test(query))) {
      return 'search';
    }

    // Check for summarize patterns
    if (this.summarizePatterns.some(pattern => pattern.test(query))) {
      return 'summarize';
    }

    // If it ends with a question mark, it's likely a question
    if (query.includes('?')) {
      return 'question';
    }

    return 'unknown';
  }

  /**
   * Extract named entities from the query
   */
  private static extractEntities(query: string): ParsedRequest['entities'] {
    const entities: ParsedRequest['entities'] = {};

    // Extract artists
    const artists = this.extractMatches(query, this.artistPatterns);
    if (artists.length > 0) entities.artists = artists;

    // Extract companies
    const companies = this.extractMatches(query, this.companyPatterns);
    if (companies.length > 0) entities.companies = companies;

    // Extract products
    const products = this.extractMatches(query, this.productPatterns);
    if (products.length > 0) entities.products = products;

    // Extract quoted strings as potential custom entities
    const quotedMatches = query.match(/"([^"]+)"|'([^']+)'/g);
    if (quotedMatches) {
      const topics = quotedMatches.map(m => m.replace(/['"]/g, ''));
      if (topics.length > 0) entities.topics = topics;
    }

    return entities;
  }

  /**
   * Extract important keywords from the query
   */
  private static extractKeywords(query: string): string[] {
    // Remove common stop words
    const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                       'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
                       'can', 'could', 'may', 'might', 'must', 'when', 'me', 'my', 'about',
                       'notify', 'alert', 'tell', 'let', 'know', 'inform'];

    const words = query
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Detect the specific alert type
   */
  private static detectAlertType(query: string): CustomAlertType {
    for (const { pattern, type } of this.alertTypeMap) {
      if (pattern.test(query)) {
        return type;
      }
    }
    return 'general';
  }

  /**
   * Helper to extract matches from multiple patterns
   */
  private static extractMatches(text: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        matches.push(...match.map(m => this.capitalize(m)));
      }
    }
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Capitalize first letter of each word
   */
  private static capitalize(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate a human-readable description of the parsed request
   */
  static generateDescription(parsed: ParsedRequest): string {
    const { intent, alertType, entities } = parsed;

    if (intent === 'create_alert') {
      let description = 'Alert for ';

      const entityDescriptions: string[] = [];
      if (entities.artists && entities.artists.length > 0) {
        entityDescriptions.push(entities.artists.join(', '));
      }
      if (entities.companies && entities.companies.length > 0) {
        entityDescriptions.push(entities.companies.join(', '));
      }
      if (entities.products && entities.products.length > 0) {
        entityDescriptions.push(entities.products.join(', '));
      }
      if (entities.topics && entities.topics.length > 0) {
        entityDescriptions.push(entities.topics.join(', '));
      }

      if (entityDescriptions.length > 0) {
        description += entityDescriptions.join(' and ');
      } else {
        description += parsed.keywords.slice(0, 3).join(', ');
      }

      // Add alert type context
      switch (alertType) {
        case 'album_release':
          description += ' album releases';
          break;
        case 'product_announcement':
          description += ' product announcements';
          break;
        case 'earnings_report':
          description += ' earnings reports';
          break;
        case 'price_change':
          description += ' price changes';
          break;
        case 'event':
          description += ' events';
          break;
        case 'news_mention':
          description += ' news mentions';
          break;
      }

      return description;
    }

    return parsed.rawQuery;
  }
}
