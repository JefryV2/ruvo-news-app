import { Signal } from '@/types';

export interface ArticleGroup {
  id: string;
  primaryArticle: Signal;
  relatedArticles: Signal[];
  topic: string;
  count: number;
}

type GroupingType = 'source' | 'topic' | 'title' | 'keyword';

export const echoControlService = {
  /**
   * Group similar articles based on user's selected grouping method
   */
  groupSimilarArticles(signals: Signal[], grouping: GroupingType, customKeywords: string[] = []): ArticleGroup[] {
    const groups: ArticleGroup[] = [];
    const processedIds = new Set<string>();
    
    signals.forEach(signal => {
      // Skip if already processed
      if (processedIds.has(signal.id)) return;
      
      // Find similar articles based on selected grouping method
      const similarArticles = signals.filter(otherSignal => 
        !processedIds.has(otherSignal.id) &&
        otherSignal.id !== signal.id &&
        this.areArticlesRelated(signal, otherSignal, grouping, customKeywords)
      );
      
      // If we found similar articles, create a group
      if (similarArticles.length > 0) {
        // Mark all articles in this group as processed
        processedIds.add(signal.id);
        similarArticles.forEach(article => processedIds.add(article.id));
        
        // Extract common topic from titles
        const topic = this.extractCommonTopic([signal, ...similarArticles]);
        
        groups.push({
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          primaryArticle: signal,
          relatedArticles: similarArticles,
          topic,
          count: similarArticles.length + 1
        });
      }
    });
    
    return groups;
  },
  
  /**
   * Check if two articles are related based on selected grouping method
   */
  areArticlesRelated(
    article1: Signal, 
    article2: Signal, 
    grouping: GroupingType, 
    customKeywords: string[] = [],
    threshold: number = 0.3
  ): boolean {
    switch (grouping) {
      case 'source':
        // Group by source name
        return article1.sourceName === article2.sourceName;
        
      case 'topic':
        // Group by shared tags/topics
        const commonTags = article1.tags.filter(tag => article2.tags.includes(tag));
        return commonTags.length > 0;
        
      case 'title':
        // Group by title similarity
        const title1Words = article1.title.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const title2Words = article2.title.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const commonTitleWords = title1Words.filter(word => title2Words.includes(word));
        const titleSimilarity = commonTitleWords.length / Math.max(title1Words.length, title2Words.length);
        return titleSimilarity >= threshold;
        
      case 'keyword':
        // Group by custom keywords
        if (customKeywords.length === 0) return false;
        
        const hasCommonKeyword = customKeywords.some(keyword => 
          article1.title.toLowerCase().includes(keyword.toLowerCase()) &&
          article2.title.toLowerCase().includes(keyword.toLowerCase())
        );
        return hasCommonKeyword;
        
      default:
        // Default to topic-based grouping
        const commonTagsDefault = article1.tags.filter(tag => article2.tags.includes(tag));
        return commonTagsDefault.length > 0;
    }
  },
  
  /**
   * Extract common topic from a group of articles
   */
  extractCommonTopic(articles: Signal[]): string {
    if (articles.length === 0) return 'General';
    
    // Combine all tags
    const allTags: string[] = [];
    articles.forEach(article => {
      allTags.push(...article.tags);
    });
    
    // Count tag frequencies
    const tagCount: { [key: string]: number } = {};
    allTags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    
    // Find the most frequent tag
    let commonTag = 'General';
    let maxCount = 0;
    
    Object.entries(tagCount).forEach(([tag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        commonTag = tag;
      }
    });
    
    // If no tags, fallback to title-based topic extraction
    if (commonTag === 'General') {
      // Combine all titles
      const allTitles = articles.map(a => a.title.toLowerCase()).join(' ');
      const words = allTitles.split(/\W+/).filter(w => w.length > 4);
      
      // Count word frequencies
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      // Find the most frequent word that isn't a stop word
      const stopWords = new Set([
        'about', 'after', 'before', 'their', 'these', 'those', 'where', 'which', 
        'while', 'would', 'could', 'should', 'with', 'from', 'have', 'will', 
        'they', 'this', 'that', 'what', 'when', 'there', 'here', 'been', 'were', 
        'been', 'says', 'said', 'report', 'news', 'update', 'latest'
      ]);
      
      Object.entries(wordCount).forEach(([word, count]) => {
        if (count > maxCount && !stopWords.has(word)) {
          maxCount = count;
          commonTag = word.charAt(0).toUpperCase() + word.slice(1);
        }
      });
    }
    
    return commonTag;
  },
  
  /**
   * Sort articles by source credibility
   */
  sortArticlesByCredibility(articles: Signal[]): Signal[] {
    // For now, we'll sort by source name alphabetically as a placeholder
    // In a real implementation, we would have a credibility scoring system
    return [...articles].sort((a, b) => {
      // Verified sources first
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      
      // Then alphabetically by source name
      return a.sourceName.localeCompare(b.sourceName);
    });
  },
  
  /**
   * Find related articles for a specific article based on selected grouping method
   */
  findRelatedArticles(
    article: Signal, 
    allArticles: Signal[], 
    grouping: GroupingType, 
    customKeywords: string[] = [],
    limit: number = 3
  ): Signal[] {
    const result = allArticles
      .filter(otherArticle => 
        otherArticle.id !== article.id && 
        this.areArticlesRelated(article, otherArticle, grouping, customKeywords)
      )
      .sort((a, b) => {
        // Verified sources first
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        
        // Then by timestamp (newer first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, limit);
      
    // Debug log
    if (result.length > 0) {
      console.log('Found', result.length, 'related articles for:', article.title);
      console.log('Related articles:', result.map(a => ({
        title: a.title,
        tags: a.tags,
        source: a.sourceName
      })));
    }
    
    return result;
  }
};