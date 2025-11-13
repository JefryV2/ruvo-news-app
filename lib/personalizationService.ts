import { supabase } from './supabase';
import { NewsArticle, UserInterest } from './newsService';

export interface UserProfile {
  id: string;
  interests: UserInterest[];
  readingHistory: string[]; // article IDs
  likedArticles: string[];
  savedArticles: string[];
  dismissedArticles: string[];
  readingTime: { [articleId: string]: number }; // time spent reading each article
  clickBehavior: { [category: string]: number }; // clicks per category
  timePreferences: {
    preferredReadingTimes: string[]; // e.g., ['morning', 'evening']
    timezone: string;
  };
  sourcePreferences: {
    [sourceId: string]: number; // preference score 0-1
  };
}

export interface RecommendationEngine {
  // Content-based filtering
  getContentBasedRecommendations(
    userProfile: UserProfile,
    articles: NewsArticle[],
    limit: number
  ): NewsArticle[];

  // Collaborative filtering
  getCollaborativeRecommendations(
    userId: string,
    articles: NewsArticle[],
    limit: number
  ): Promise<NewsArticle[]>;

  // Hybrid approach combining both methods
  getHybridRecommendations(
    userProfile: UserProfile,
    articles: NewsArticle[],
    limit: number
  ): Promise<NewsArticle[]>;
}

class PersonalizationService implements RecommendationEngine {
  private readonly MIN_RELEVANCE_SCORE = 0.3;
  private readonly MAX_ARTICLES_PER_CATEGORY = 5;

  // Get content-based recommendations
  getContentBasedRecommendations(
    userProfile: UserProfile,
    articles: NewsArticle[],
    limit: number
  ): NewsArticle[] {
    const scoredArticles = articles.map(article => ({
      article,
      score: this.calculateContentScore(article, userProfile)
    }));

    return scoredArticles
      .filter(item => item.score >= this.MIN_RELEVANCE_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }

  // Calculate content-based relevance score
  private calculateContentScore(article: NewsArticle, userProfile: UserProfile): number {
    let score = 0;

    // Interest matching
    const interestScore = this.calculateInterestScore(article, userProfile.interests);
    score += interestScore * 0.4;

    // Source preference
    const sourceScore = userProfile.sourcePreferences[article.source.id] || 0.5;
    score += sourceScore * 0.2;

    // Category preference based on reading history
    const categoryScore = this.calculateCategoryScore(article, userProfile);
    score += categoryScore * 0.2;

    // Recency and trending
    const trendingScore = this.calculateTrendingScore(article);
    score += trendingScore * 0.1;

    // Avoid recently dismissed articles
    if (userProfile.dismissedArticles.includes(article.id)) {
      score *= 0.1;
    }

    // Boost for liked/saved articles from same source
    const similarLikedArticles = userProfile.likedArticles.filter(likedId => {
      // This would require fetching the liked article details
      // For now, we'll use a simple heuristic
      return Math.random() > 0.8; // Placeholder
    }).length;
    score += similarLikedArticles * 0.1;

    return Math.min(score, 1);
  }

  // Calculate interest matching score
  private calculateInterestScore(article: NewsArticle, interests: UserInterest[]): number {
    let maxScore = 0;

    interests.forEach(interest => {
      let interestScore = 0;

      // Category match
      if (article.category === interest.category) {
        interestScore += 0.3;
      }

      // Keyword matching
      const keywordMatches = this.countKeywordMatches(article, interest.keywords);
      interestScore += keywordMatches * 0.4;

      // Source preference within interest
      if (interest.sources.includes(article.source.id)) {
        interestScore += 0.3;
      }

      // Apply interest weight
      const weightedScore = interestScore * interest.weight;
      maxScore = Math.max(maxScore, weightedScore);
    });

    return maxScore;
  }

  // Count keyword matches between article and interest keywords
  private countKeywordMatches(article: NewsArticle, keywords: string[]): number {
    const articleText = `${article.title} ${article.description}`.toLowerCase();
    const matches = keywords.filter(keyword => 
      articleText.includes(keyword.toLowerCase())
    ).length;
    
    return Math.min(matches / keywords.length, 1);
  }

  // Calculate category preference score
  private calculateCategoryScore(article: NewsArticle, userProfile: UserProfile): number {
    const categoryClicks = userProfile.clickBehavior[article.category] || 0;
    const totalClicks = Object.values(userProfile.clickBehavior).reduce((sum, clicks) => sum + clicks, 1);
    
    return categoryClicks / totalClicks;
  }

  // Calculate trending score
  private calculateTrendingScore(article: NewsArticle): number {
    const now = new Date();
    const published = new Date(article.publishedAt);
    const hoursAgo = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
    
    // More recent articles get higher scores
    return Math.max(0, 1 - (hoursAgo / 48)); // Decay over 48 hours
  }

  // Get collaborative filtering recommendations
  async getCollaborativeRecommendations(
    userId: string,
    articles: NewsArticle[],
    limit: number
  ): Promise<NewsArticle[]> {
    try {
      // Find similar users based on reading behavior
      const similarUsers = await this.findSimilarUsers(userId);
      
      if (similarUsers.length === 0) {
        return [];
      }

      // Get articles liked by similar users that current user hasn't seen
      const recommendedArticles = await this.getArticlesFromSimilarUsers(
        userId,
        similarUsers,
        articles
      );

      return recommendedArticles.slice(0, limit);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  // Find users with similar reading patterns
  private async findSimilarUsers(userId: string): Promise<string[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data: userInteractions, error } = await supabase
        .from('user_signals')
        .select('user_id, signal_id, action')
        .eq('action', 'like');

      if (error) throw error;

      // Simple collaborative filtering based on liked articles
      const userLikes = userInteractions?.filter(item => item.user_id === userId) || [];
      const otherUsers = userInteractions?.filter(item => item.user_id !== userId) || [];

      const similarUsers = otherUsers
        .reduce((acc, interaction) => {
          const userId = interaction.user_id;
          if (!acc[userId]) {
            acc[userId] = { userId, commonLikes: 0 };
          }
          
          if (userLikes.some(like => like.signal_id === interaction.signal_id)) {
            acc[userId].commonLikes++;
          }
          
          return acc;
        }, {} as { [userId: string]: { userId: string; commonLikes: number } });

      return Object.values(similarUsers)
        .filter(user => user.commonLikes > 0)
        .sort((a, b) => b.commonLikes - a.commonLikes)
        .slice(0, 10)
        .map(user => user.userId);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  // Get articles from similar users
  private async getArticlesFromSimilarUsers(
    userId: string,
    similarUsers: string[],
    allArticles: NewsArticle[]
  ): Promise<NewsArticle[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data: similarUserLikes, error } = await supabase
        .from('user_signals')
        .select('signal_id')
        .in('user_id', similarUsers)
        .eq('action', 'like');

      if (error) throw error;

      const likedSignalIds = similarUserLikes?.map(item => item.signal_id) || [];
      
      // Get user's already seen articles
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data: userInteractions } = await supabase
        .from('user_signals')
        .select('signal_id')
        .eq('user_id', userId);

      const seenSignalIds = userInteractions?.map(item => item.signal_id) || [];
      
      // Filter articles that similar users liked but current user hasn't seen
      return allArticles.filter(article => 
        likedSignalIds.includes(article.id) && 
        !seenSignalIds.includes(article.id)
      );
    } catch (error) {
      console.error('Error getting articles from similar users:', error);
      return [];
    }
  }

  // Get hybrid recommendations combining content-based and collaborative filtering
  async getHybridRecommendations(
    userProfile: UserProfile,
    articles: NewsArticle[],
    limit: number
  ): Promise<NewsArticle[]> {
    const contentBased = this.getContentBasedRecommendations(userProfile, articles, limit * 2);
    const collaborative = await this.getCollaborativeRecommendations(
      userProfile.id,
      articles,
      limit * 2
    );

    // Combine and deduplicate
    const combined = [...contentBased];
    collaborative.forEach(article => {
      if (!combined.some(existing => existing.id === article.id)) {
        combined.push(article);
      }
    });

    // Re-score combined articles
    const rescored = combined.map(article => ({
      article,
      score: this.calculateHybridScore(article, userProfile, contentBased, collaborative)
    }));

    return rescored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }

  // Calculate hybrid score combining both approaches
  private calculateHybridScore(
    article: NewsArticle,
    userProfile: UserProfile,
    contentBased: NewsArticle[],
    collaborative: NewsArticle[]
  ): number {
    const contentScore = this.calculateContentScore(article, userProfile);
    const isContentBased = contentBased.some(cb => cb.id === article.id);
    const isCollaborative = collaborative.some(cb => cb.id === article.id);

    let hybridScore = contentScore;

    // Boost if article appears in both approaches
    if (isContentBased && isCollaborative) {
      hybridScore *= 1.5;
    }

    // Slight boost for collaborative recommendations
    if (isCollaborative) {
      hybridScore *= 1.2;
    }

    return Math.min(hybridScore, 1);
  }

  // Update user profile based on interactions
  async updateUserProfile(
    userId: string,
    articleId: string,
    action: 'like' | 'save' | 'dismiss' | 'read',
    readingTime?: number
  ): Promise<void> {
    try {
      const updateData: any = {
        user_id: userId,
        signal_id: articleId,
        action,
        created_at: new Date().toISOString()
      };

      if (readingTime) {
        updateData.reading_time = readingTime;
      }

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { error } = await supabase
        .from('user_signals')
        .upsert(updateData);

      if (error) throw error;

      // Update user profile cache if needed
      await this.updateUserProfileCache(userId, articleId, action, readingTime);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Update user profile cache
  private async updateUserProfileCache(
    userId: string,
    articleId: string,
    action: 'like' | 'save' | 'dismiss' | 'read',
    readingTime?: number
  ): Promise<void> {
    // This would typically update a cached user profile
    // For now, we'll just log the update
    console.log(`Updated user ${userId} profile: ${action} article ${articleId}`);
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('*')
        .eq('user_id', userId);

      if (interestsError) throw interestsError;

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_signals')
        .select('signal_id, action, reading_time')
        .eq('user_id', userId);

      if (interactionsError) throw interactionsError;

      const profile: UserProfile = {
        id: userId,
        interests: interests || [],
        readingHistory: interactions?.map(i => i.signal_id) || [],
        likedArticles: interactions?.filter(i => i.action === 'like').map(i => i.signal_id) || [],
        savedArticles: interactions?.filter(i => i.action === 'save').map(i => i.signal_id) || [],
        dismissedArticles: interactions?.filter(i => i.action === 'dismiss').map(i => i.signal_id) || [],
        readingTime: interactions?.reduce((acc, i) => {
          if (i.reading_time) acc[i.signal_id] = i.reading_time;
          return acc;
        }, {} as { [articleId: string]: number }) || {},
        clickBehavior: {}, // Would be calculated from reading history
        timePreferences: {
          preferredReadingTimes: ['morning', 'evening'],
          timezone: 'UTC'
        },
        sourcePreferences: {} // Would be calculated from reading history
      };

      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}

export const personalizationService = new PersonalizationService();


