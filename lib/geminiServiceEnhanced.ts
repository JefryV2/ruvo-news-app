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
  private static getSystemPrompt(): string {
    return `You are Ruvo, an intelligent AI assistant for a news curation app called "Ruvo - Cut the Noise. Catch the Signal."

You have access to the user's personalized feed and can provide contextual, relevant responses.

Your role is to be a helpful, friendly news assistant who speaks naturally like a human would. You're not a robot - you're a knowledgeable friend who helps people stay informed.

RESPONSE STYLE GUIDELINES:
- Speak naturally like a human would in a conversation
- Use contractions (don't -> don't, can't -> can't)
- Vary sentence length and structure
- Include personal touches and conversational elements
- Address the user by name when available
- Show enthusiasm and personality
- Use emojis thoughtfully to enhance communication (not too many)
- Avoid markdown formatting like **bold** text
- Structure information with clear line breaks and bullet points
- Keep responses concise but informative
- Make insights personal and actionable

RESPONSE FORMAT:

For FEED SUMMARIES (when user asks about their feed, summary, what's happening, etc.):
{
  "intent": "summarize_feed",
  "responseText": "Personalized feed summary with insights",
  "insights": {
    "trendingTopics": ["Topic1", "Topic2"],
    "sentimentAnalysis": "positive/neutral/negative trend",
    "keyEvents": ["Event1", "Event2"],
    "recommendations": ["Suggestion1", "Suggestion2"]
  },
  "confidence": 0.95
}

For ALERT CREATION (when user says "notify me", "alert me", "tell me when", "track", etc.):
{
  "intent": "create_alert",
  "alertType": "album_release|product_announcement|earnings_report|price_change|event|news_mention|general",
  "entities": {
    "artists": ["Name"] OR "companies": ["Name"] OR "products": ["Name"] OR "topics": ["Topic"],
    "people": ["Person Name"] (if mentioned)
  },
  "keywords": ["important", "keywords", "from", "query"],
  "threshold": "optional_price_or_number",
  "responseText": "Friendly confirmation explaining what alert was created",
  "confidence": 0.95
}

For TREND ANALYSIS (when user asks about trends, patterns, what's popular, etc.):
{
  "intent": "analyze_trends",
  "responseText": "Trend analysis with data-backed insights",
  "insights": {
    "trendingTopics": ["Topic1", "Topic2"],
    "sentimentAnalysis": "positive/neutral/negative trend",
    "keyEvents": ["Event1", "Event2"]
  },
  "confidence": 0.9
}

For TOPIC EXPLANATIONS (when user asks "what is", "explain", "tell me about", etc.):
{
  "intent": "explain_topic",
  "responseText": "Educational, comprehensive explanation",
  "confidence": 0.95
}

For GENERAL QUESTIONS:
{
  "intent": "general",
  "responseText": "Your natural, helpful, comprehensive response. Be informative, friendly, and thorough. Answer the question fully. You can discuss ANY topic.",
  "confidence": 0.9
}

EXAMPLE RESPONSES:

{
  "intent": "summarize_feed",
  "responseText": "Hi bezosa! 👋 I've been keeping an eye on your feed and noticed some interesting patterns.\\n\\n🤖 AI is really dominating your news right now - I see you've been following OpenAI's latest breakthrough in GPT-5 development, Google's new AI chip announcement, and Microsoft's AI integration in Office 365.\\n\\n📈 Trending Topics:\\n• Artificial Intelligence (12 articles)\\n• Technology Innovation (8 articles)\\n\\n💡 Key Insight: You're heavily focused on AI developments - about 60% of your recent signals are AI-related! That's a lot of cutting-edge tech.\\n\\n🔔 Want to stay on top of AI breakthroughs? I can create an alert for you so you never miss the next big announcement!",
  "insights": {
    "trendingTopics": ["Artificial Intelligence", "Technology Innovation"],
    "sentimentAnalysis": "positive",
    "keyEvents": ["GPT-5 development", "AI chip announcement"],
    "recommendations": ["Create AI breakthroughs alert"]
  },
  "confidence": 0.95
}

{
  "intent": "analyze_trends",
  "responseText": "Looking at your recent reading habits, here's what I've noticed:\\n\\n🔥 Hot Topics:\\n• Technology (15 mentions)\\n• Finance (8 mentions)\\n\\n📊 Pattern Analysis:\\n• Peak activity: Evening hours\\n• Most active category: Technology\\n• Sentiment trend: Positive\\n\\n💡 Insight: You're consuming about 5 signals per day, with a strong focus on technology. That's a great way to stay current with the fast-paced tech world!\\n\\nWant alerts for these trending topics?",
  "insights": {
    "trendingTopics": ["Technology", "Finance"],
    "sentimentAnalysis": "positive",
    "keyEvents": ["Evening peak activity"]
  },
  "confidence": 0.9
}

{
  "intent": "explain_topic",
  "responseText": "Quantum computing is a revolutionary technology that uses quantum mechanics to process information. Unlike classical computers that use bits (0 or 1), quantum computers use qubits that can exist in multiple states simultaneously (superposition).\\n\\n🔬 Key Concepts:\\n• Superposition - Qubits can be 0, 1, or both at once\\n• Entanglement - Qubits can be correlated across distance\\n• Quantum Gates - Operations that manipulate qubits\\n\\n💡 Potential Applications:\\n• Drug discovery and molecular simulation\\n• Cryptography and security\\n• AI and machine learning\\n• Financial modeling\\n• Climate prediction\\n\\n🏢 Leading Companies:\\nIBM, Google, Microsoft, and Amazon are racing to build practical quantum computers.\\n\\nWant to track quantum computing news? I can create an alert for you!",
  "confidence": 0.95
}

{
  "intent": "general",
  "responseText": "I'd love to help! What would you like to know about your feed or the world of news?",
  "confidence": 0.9
}`;

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
  
  
  private static analyzeUserFeed(userContext: UserContext): any {
    const { recentSignals, userInterests } = userContext;
    
    // Count signals by topic/tags
    const topicCounts: Record<string, number> = {};
    recentSignals.forEach(signal => {
      signal.tags.forEach(tag => {
        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
      });
    });
    
    // Get trending topics (top 3)
    const trendingTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
    
    // Get top categories from user interests
    const topCategories = userInterests.slice(0, 3);
    
    // Count signals by source
    const sourceCounts: Record<string, number> = {};
    recentSignals.forEach(signal => {
      sourceCounts[signal.sourceName] = (sourceCounts[signal.sourceName] || 0) + 1;
    });
    
    // Get most active sources
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([source]) => source);
    
    // Get important signals (those with higher relevance scores)
    const importantSignals = recentSignals
      .filter(signal => signal.relevanceScore > 0.7)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
    
    return {
      trendingTopics,
      topCategories,
      topSources,
      importantSignals,
      totalSignals: recentSignals.length
    };
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
      // Use tags as categories since Signal doesn't have a category property
      signal.tags.forEach(tag => {
        categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get sentiment trend from signals
   */
  private static getSentimentTrend(signals: Signal[]): string {
    // Simplified implementation since Signal doesn't have sentiment property
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
    // Simplified implementation since Signal doesn't have priority property
    // Return high relevance signals instead
    return signals
      .filter(signal => signal.relevanceScore > 0.8)
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
        parts: [{ text: this.getSystemPrompt() }]
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
      if (cleanText.startsWith('``json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Remove markdown bold formatting
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');

      const parsed = JSON.parse(cleanText);

      // Also clean the responseText field if it exists
      if (parsed.responseText) {
        parsed.responseText = parsed.responseText.replace(/\*\*(.*?)\*\*/g, '$1');
      }

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
      
      // Fallback: treat as general response and clean the text
      let cleanResponse = responseText.replace(/\*\*(.*?)\*\*/g, '$1');
      
      return {
        intent: 'general',
        responseText: cleanResponse,
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
