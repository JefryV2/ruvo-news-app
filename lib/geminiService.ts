/**
 * Gemini AI Service for Ask Ruvo
 * 
 * This service integrates Google's Gemini AI to power natural language
 * conversations for the Ask Ruvo feature.
 */

import { ParsedRequest } from './aiRequestParser';

// API Configuration
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  intent: 'create_alert' | 'search' | 'summarize' | 'question' | 'general';
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
}

export class GeminiService {
  private static conversationHistory: GeminiMessage[] = [];

  /**
   * System prompt that defines Ruvo's personality and capabilities
   */
  private static getSystemPrompt(): string {
    return `You are Ruvo, an AI assistant for a news curation app called "Ruvo - Cut the Noise. Catch the Signal."

YOU ARE SMART AND CAN UNDERstand ANY PROMPT OR QUESTION.

Your capabilities:
1. CREATE CUSTOM ALERTS - Help users set up alerts for ANY topic, person, company, event, etc.
2. ANSWER ANY QUESTION - Provide helpful, accurate answers on any topic (science, tech, history, culture, etc.)
3. HAVE NATURAL CONVERSATIONS - Chat naturally about anything
4. PROVIDE INFORMATION - Be educational and informative
5. HELP WITH NEWS - Explain how Ruvo works and help users get the most from it

RESPONSE FORMAT:

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

For SEARCH QUERIES (when user asks about specific topics):
{
  "intent": "search",
  "responseText": "Helpful response about the topic with suggestions",
  "confidence": 0.9
}

For SUMMARIZATION (when user asks for summaries):
{
  "intent": "summarize",
  "responseText": "Clear summary with key points",
  "confidence": 0.85
}

For QUESTIONS (when user asks specific questions):
{
  "intent": "question",
  "responseText": "Comprehensive, helpful answer",
  "confidence": 0.9
}

For EVERYTHING ELSE (conversations, help, etc.):
{
  "intent": "general",
  "responseText": "Your natural, helpful, comprehensive response. Be informative, friendly, and thorough. Answer the question fully. You can discuss ANY topic.",
  "confidence": 0.9
}

EXAMPLE RESPONSES:
{
  "intent": "general",
  "responseText": "Here's what's trending today:\n\n📊 Top Signals\n• Technology: Major AI breakthroughs\n• Finance: Market updates\n• Entertainment: New releases\n\nWould you like me to create alerts for any of these topics?",
  "confidence": 0.95
}`;
  }

  /**
   * Send a message to Gemini and get a response
   */
  static async chat(userMessage: string, includeHistory: boolean = true): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }

    try {
      // Build conversation with system prompt
      const messages: GeminiMessage[] = [];
      
      // Add system prompt as first user message
      messages.push({
        role: 'user',
        parts: [{ text: this.getSystemPrompt() }]
      });
      
      // Add model acknowledgment
      messages.push({
        role: 'model',
        parts: [{ text: 'I understand. I will respond only with valid JSON following the specified format.' }]
      });

      // Add conversation history if requested
      if (includeHistory && this.conversationHistory.length > 0) {
        messages.push(...this.conversationHistory.slice(-10)); // Last 10 messages for context
      }

      // Add current user message
      messages.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      // Make API request
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Extract response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      // Parse JSON response
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

      // Keep only last 20 messages
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return parsedResponse;

    } catch (error) {
      console.error('Gemini Service Error:', error);
      throw error;
    }
  }

  /**
   * Parse Gemini's JSON response
   */
  private static parseGeminiResponse(responseText: string): GeminiResponse {
    try {
      // Remove markdown code blocks if present
      let cleanText = responseText.trim();
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
      
      // Fallback to general response
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

  /**
   * Simple test function
   */
  static async test(): Promise<void> {
    console.log('Testing Gemini Service...');
    
    const testQueries = [
      "Notify me when BTS drops an album",
      "Alert me about Apple product announcements",
      "Tell me when Tesla releases earnings",
      "Show me news about AI",
    ];

    for (const query of testQueries) {
      console.log(`\nTest Query: "${query}"`);
      try {
        const response = await this.chat(query, false);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
}

export default GeminiService;
