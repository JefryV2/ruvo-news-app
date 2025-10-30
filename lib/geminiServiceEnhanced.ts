/**
 * Enhanced Gemini AI Service for Ask Ruvo
 * 
 * This service makes Ruvo truly intelligent by integrating with real user data,
 * feed analysis, and contextual understanding.
 */

import { ParsedRequest } from './aiRequestParser';
import { Signal, UserProfile } from '@/types';
import { GeolocationService } from './geolocationService';

// API Configuration
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  intent: 'create_alert' | 'summarize_feed' | 'analyze_trends' | 'explain_topic' | 'general';
  responseText: string;
  parsedData?: ParsedRequest;
  entities?: {
    artists?: string[];
    companies?: string[];
    products?: string[];
    topics?: string[];
    people?: string[];
  };
  alertType?: string;
  confidence?: number;
  insights?: {
    trendingTopics?: string[];
    sentimentAnalysis?: string;
    keyEvents?: string[];
    recommendations?: string[];
  };
}

export interface UserContext {
  user: UserProfile | null;
  recentSignals: Signal[];
  userInterests: string[];
  userSources: string[];
}

export class GeminiServiceEnhanced {
  private static conversationHistory: GeminiMessage[] = [];

  /**
   * Enhanced system prompt that includes user context and feed data
   */
  private static getSystemPrompt(userContext: UserContext): string {
    const { user, recentSignals, userInterests, userSources } = userContext;
    
    // Analyze recent signals for context
    const signalAnalysis = this.analyzeRecentSignals(recentSignals);
    const trendingTopics = this.extractTrendingTopics(recentSignals);
    const topCategories = this.getTopCategories(recentSignals);
    
    return `You are Ruvo, an intelligent AI assistant for a news curation app called "Ruvo - Cut the Noise. Catch the Signal."

YOU ARE SMART AND HAVE ACCESS TO REAL USER DATA AND FEED ANALYSIS.

CURRENT USER CONTEXT:
- User: ${user?.username || 'Guest'} (${user?.email || 'Not signed in'})
- Location: ${user?.location ? `${user.location.city}, ${user.location.region}, ${user.location.country}` : 'Not provided'}
- Interests: ${userInterests.join(', ') || 'None set'}
- Sources: ${userSources.join(', ') || 'Default sources'}
- Recent Signals Analyzed: ${recentSignals.length} articles

RECENT FEED ANALYSIS:
${signalAnalysis}

TRENDING TOPICS IN USER'S FEED:
${trendingTopics.map(topic => `• ${topic}`).join('\n')}

TOP CATEGORIES:
${topCategories.map(cat => `• ${cat.category}: ${cat.count} articles`).join('\n')}

YOUR CAPABILITIES:
1. CREATE CUSTOM ALERTS - Help users set up alerts for ANY topic, person, company, event, etc.
2. SUMMARIZE FEED - Provide intelligent summaries of the user's actual feed data
3. ANALYZE TRENDS - Identify patterns and trends in their news consumption
4. EXPLAIN TOPICS - Provide detailed explanations of topics from their feed
5. ANSWER QUESTIONS - Be a knowledgeable assistant about current events and topics
6. PROVIDE INSIGHTS - Give actionable insights based on their reading patterns

RESPONSE FORMAT:

**For FEED SUMMARIES** (when user asks about their feed, summary, what's happening, etc.):
{
  "intent": "summarize_feed",
  "responseText": "Intelligent summary based on ACTUAL feed data. Mention specific articles, trends, and insights from their recent signals. Be specific and data-driven.",
  "insights": {
    "trendingTopics": ["topic1", "topic2"],
    "sentimentAnalysis": "Overall sentiment analysis of their feed",
    "keyEvents": ["Important event 1", "Important event 2"],
    "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"]
  },
  "confidence": 0.95
}

**For ALERT CREATION** (when user says "notify me", "alert me", "tell me when", "track", etc.):
{
  "intent": "create_alert",
  "alertType": "album_release|product_announcement|earnings_report|price_change|event|news_mention|general",
  "entities": {
    "artists": ["Name"] OR "companies": ["Name"] OR "products": ["Product Name"] OR "topics": ["Topic"],
    "people": ["Person Name"] (if mentioned)
  },
  "keywords": ["important", "keywords", "from", "query"],
  "threshold": "optional_price_or_number",
  "responseText": "Friendly confirmation explaining what alert was created, referencing their interests if relevant",
  "confidence": 0.95
}

**For TREND ANALYSIS** (when user asks about trends, patterns, what's popular, etc.):
{
  "intent": "analyze_trends",
  "responseText": "Detailed analysis of trends in their feed, with specific examples from their recent signals",
  "insights": {
    "trendingTopics": ["trend1", "trend2"],
    "sentimentAnalysis": "Analysis of sentiment patterns",
    "keyEvents": ["Key event 1", "Key event 2"],
    "recommendations": ["Recommendation based on trends"]
  },
  "confidence": 0.92
}

**For TOPIC EXPLANATIONS** (when user asks "what is", "explain", "tell me about", etc.):
{
  "intent": "explain_topic",
  "responseText": "Comprehensive explanation of the topic, referencing relevant articles from their feed if applicable",
  "confidence": 0.9
}

**For GENERAL QUESTIONS**:
{
  "intent": "general",
  "responseText": "Helpful, informative response that can reference their feed data when relevant",
  "confidence": 0.9
}

EXAMPLES OF SMART RESPONSES WITH REAL DATA:

User: "Can you summarize my feed?"
Response (if they have recent signals about AI):
{
  "intent": "summarize_feed",
  "responseText": "📊 **Your Feed Summary**\\n\\nBased on your recent ${recentSignals.length} signals, here's what's happening:\\n\\n🤖 **AI Dominates Your Feed**\\n• OpenAI's latest breakthrough in GPT-5 development\\n• Google's new AI chip announcement\\n• Microsoft's AI integration in Office 365\\n\\n📈 **Trending Topics:**\\n• Artificial Intelligence (${this.countSignalsByTopic(recentSignals, 'AI')} articles)\\n• Technology Innovation (${this.countSignalsByTopic(recentSignals, 'tech')} articles)\\n\\n💡 **Key Insight:** You're heavily focused on AI developments - 60% of your recent signals are AI-related!\\n\\n🔔 **Recommendation:** Create an alert for 'AI breakthroughs' to never miss major developments!",
  "insights": {
    "trendingTopics": ["Artificial Intelligence", "Technology Innovation"],
    "sentimentAnalysis": "Mostly positive sentiment around AI developments",
    "keyEvents": ["OpenAI GPT-5 announcement", "Google AI chip launch"],
    "recommendations": ["Set up AI breakthrough alerts", "Follow AI ethics discussions"]
  },
  "confidence": 0.95
}

User: "What's trending in my feed?"
Response:
{
  "intent": "analyze_trends",
  "responseText": "📈 **Trend Analysis**\\n\\nBased on your recent signals, here are the top trends:\\n\\n🔥 **Hot Topics:**\\n• ${trendingTopics[0]} (${this.countSignalsByTopic(recentSignals, trendingTopics[0])} mentions)\\n• ${trendingTopics[1]} (${this.countSignalsByTopic(recentSignals, trendingTopics[1])} mentions)\\n\\n📊 **Pattern Analysis:**\\n• Peak activity: ${this.getPeakActivityTime(recentSignals)}\\n• Most active category: ${topCategories[0]?.category}\\n• Sentiment trend: ${this.getSentimentTrend(recentSignals)}\\n\\n💡 **Insight:** You're consuming ${this.getAverageSignalsPerDay(recentSignals)} signals per day, with strong focus on ${userInterests[0] || 'technology'}.",
  "insights": {
    "trendingTopics": trendingTopics.slice(0, 3),
    "sentimentAnalysis": this.getSentimentTrend(recentSignals),
    "keyEvents": this.getKeyEvents(recentSignals),
    "recommendations": ["Diversify your sources", "Set up alerts for trending topics"]
  },
  "confidence": 0.92
}

PERSONALITY & BEHAVIOR:
• Be data-driven and reference actual feed content
• Provide specific insights based on their reading patterns
• Use their interests and sources to personalize responses
• Be conversational but informative
• Always offer actionable recommendations
• Reference specific articles when relevant
• Show patterns and trends in their consumption

IMPORTANT: Always use REAL data from their feed. Don't make up generic responses - be specific and insightful!

ALWAYS respond with valid JSON only. No markdown code blocks, just the JSON object.`;
  }

  /**
   * Analyze recent signals to provide context
   */
  private static analyzeRecentSignals(signals: Signal[]): string {
    if (signals.length === 0) {
      return "No recent signals available for analysis.";
    }

    const categories = this.getTopCategories(signals);
    const trendingTopics = this.extractTrendingTopics(signals);
    const sentimentTrend = this.getSentimentTrend(signals);
    
    return `Recent Feed Analysis:
- Total signals: ${signals.length}
- Top categories: ${categories.slice(0, 3).map(c => c.category).join(', ')}
- Trending topics: ${trendingTopics.slice(0, 3).join(', ')}
- Sentiment trend: ${sentimentTrend}
- Most recent: ${signals[0]?.title?.substring(0, 50)}...`;
  }

  /**
   * Extract trending topics from signals
   */
  private static extractTrendingTopics(signals: Signal[]): string[] {
    const topicCounts: { [key: string]: number } = {};
    
    signals.forEach(signal => {
      // Extract topics from title and tags
      const text = `${signal.title} ${signal.tags?.join(' ') || ''}`.toLowerCase();
      
      // Common topic keywords
      const topics = [
        'artificial intelligence', 'ai', 'machine learning', 'technology', 'tech',
        'cryptocurrency', 'bitcoin', 'blockchain', 'finance', 'business',
        'climate change', 'environment', 'renewable energy', 'sustainability',
        'space', 'nasa', 'spacex', 'astronomy', 'science',
        'health', 'medical', 'vaccine', 'covid', 'healthcare',
        'politics', 'election', 'government', 'policy',
        'entertainment', 'music', 'movie', 'celebrity', 'sports'
      ];
      
      topics.forEach(topic => {
        if (text.includes(topic)) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    });
    
    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Get top categories from signals
   */
  private static getTopCategories(signals: Signal[]): { category: string; count: number }[] {
    const categoryCounts: { [key: string]: number } = {};
    
    signals.forEach(signal => {
      const category = signal.category || 'general';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get sentiment trend from signals
   */
  private static getSentimentTrend(signals: Signal[]): string {
    const sentiments = signals.map(s => s.sentiment || 'neutral');
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    const neutral = sentiments.filter(s => s === 'neutral').length;
    
    if (positive > negative && positive > neutral) return 'Mostly positive';
    if (negative > positive && negative > neutral) return 'Mostly negative';
    return 'Mixed/neutral';
  }

  /**
   * Count signals by topic
   */
  private static countSignalsByTopic(signals: Signal[], topic: string): number {
    return signals.filter(signal => 
      `${signal.title} ${signal.tags?.join(' ') || ''}`.toLowerCase().includes(topic.toLowerCase())
    ).length;
  }

  /**
   * Get peak activity time
   */
  private static getPeakActivityTime(signals: Signal[]): string {
    const hours: { [key: number]: number } = {};
    
    signals.forEach(signal => {
      const hour = new Date(signal.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hours).sort(([,a], [,b]) => b - a)[0]?.[0];
    return peakHour ? `${peakHour}:00` : 'Unknown';
  }

  /**
   * Get average signals per day
   */
  private static getAverageSignalsPerDay(signals: Signal[]): number {
    if (signals.length === 0) return 0;
    
    const now = new Date();
    const oldest = new Date(Math.min(...signals.map(s => new Date(s.timestamp).getTime())));
    const daysDiff = Math.max(1, (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.round(signals.length / daysDiff * 10) / 10;
  }

  /**
   * Get key events from signals
   */
  private static getKeyEvents(signals: Signal[]): string[] {
    return signals
      .filter(signal => signal.priority === 'high' || signal.priority === 'urgent')
      .slice(0, 3)
      .map(signal => signal.title.substring(0, 60) + '...');
  }

  /**
   * Enhanced chat with user context
   */
  static async chat(userMessage: string, userContext: UserContext, includeHistory: boolean = true): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }

    try {
      // Build conversation with enhanced context
      const messages: GeminiMessage[] = [];
      
      // Add enhanced system prompt with user context
      messages.push({
        role: 'user',
        parts: [{ text: this.getSystemPrompt(userContext) }]
      });
      
      messages.push({
        role: 'model',
        parts: [{ text: 'I understand. I will provide intelligent, data-driven responses based on the user\'s actual feed data and context.' }]
      });

      // Add conversation history
      if (includeHistory && this.conversationHistory.length > 0) {
        messages.push(...this.conversationHistory.slice(-6)); // Last 6 messages for context
      }

      // Add current message
      messages.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map(msg => ({
            role: msg.role,
            parts: msg.parts
          })),
          generationConfig: {
            temperature: 0.7, // Balanced creativity and accuracy
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      // Parse response
      const parsedResponse = this.parseGeminiResponse(responseText);

      // Update conversation history
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: responseText }]
      });

      // Keep last 12 messages
      if (this.conversationHistory.length > 12) {
        this.conversationHistory = this.conversationHistory.slice(-12);
      }

      return parsedResponse;

    } catch (error) {
      console.error('Enhanced Gemini Service Error:', error);
      throw error;
    }
  }

  /**
   * Parse Gemini's JSON response
   */
  private static parseGeminiResponse(responseText: string): GeminiResponse {
    try {
      // Clean up response
      let cleanText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanText);

      return {
        intent: parsed.intent || 'general',
        responseText: parsed.responseText || 'I can help you with that!',
        entities: parsed.entities,
        alertType: parsed.alertType,
        confidence: parsed.confidence || 0.8,
        insights: parsed.insights,
        parsedData: parsed.intent === 'create_alert' ? {
          intent: 'create_alert',
          alertType: parsed.alertType,
          entities: parsed.entities || {},
          keywords: parsed.keywords || [],
          rawQuery: responseText,
        } : undefined,
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', responseText);
      
      // Fallback: treat as general response
      return {
        intent: 'general',
        responseText: responseText,
        confidence: 0.5,
      };
    }
  }

  /**
   * Clear conversation history
   */
  static clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  static getHistory(): GeminiMessage[] {
    return [...this.conversationHistory];
  }
}

export default GeminiServiceEnhanced;
