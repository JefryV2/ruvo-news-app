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

Your primary capabilities:
1. CREATE CUSTOM ALERTS - Help users set up alerts for specific topics, artists, companies, products, or events
2. SEARCH & DISCOVER - Find relevant news and information
3. SUMMARIZE - Provide concise summaries of news and feeds
4. ANSWER QUESTIONS - Help users understand features and find information

IMPORTANT INSTRUCTIONS FOR ALERT CREATION:
When a user wants to create an alert (e.g., "Notify me when...", "Alert me about...", "Tell me when..."):

1. Extract ALL relevant information:
   - Alert Type: (album_release, product_announcement, earnings_report, price_change, event, news_mention, general)
   - Entities: Artists, companies, products, people, topics
   - Keywords: Important words to monitor
   - Threshold: Price or number if mentioned

2. Respond in this EXACT JSON format (nothing else):
{
  "intent": "create_alert",
  "alertType": "<type>",
  "entities": {
    "artists": ["Artist Name"],
    "companies": ["Company Name"],
    "products": ["Product Name"],
    "topics": ["Topic"],
    "people": ["Person Name"]
  },
  "keywords": ["keyword1", "keyword2"],
  "threshold": "optional price or number",
  "responseText": "Friendly confirmation message explaining what alert was created",
  "confidence": 0.95
}

3. For other intents, respond with:
{
  "intent": "search|summarize|question|general",
  "responseText": "Your helpful response here",
  "confidence": 0.9
}

EXAMPLES:

User: "Notify me when BTS drops their new album"
Response:
{
  "intent": "create_alert",
  "alertType": "album_release",
  "entities": {
    "artists": ["BTS"]
  },
  "keywords": ["bts", "album", "release", "drop"],
  "responseText": "I'll create an alert for BTS album releases! You'll be notified whenever BTS announces or releases new music.",
  "confidence": 0.98
}

User: "Alert me about Apple product announcements"
Response:
{
  "intent": "create_alert",
  "alertType": "product_announcement",
  "entities": {
    "companies": ["Apple"]
  },
  "keywords": ["apple", "product", "announcement", "launch"],
  "responseText": "Got it! I'll notify you whenever Apple announces new products or holds events.",
  "confidence": 0.97
}

User: "Tell me when Tesla reports earnings"
Response:
{
  "intent": "create_alert",
  "alertType": "earnings_report",
  "entities": {
    "companies": ["Tesla"]
  },
  "keywords": ["tesla", "earnings", "report", "quarterly"],
  "responseText": "I'll set up an alert for Tesla's earnings reports. You'll be notified when they release quarterly or annual results.",
  "confidence": 0.96
}

User: "Notify me if Bitcoin reaches $60k"
Response:
{
  "intent": "create_alert",
  "alertType": "price_change",
  "entities": {
    "topics": ["Bitcoin"]
  },
  "keywords": ["bitcoin", "price", "60k", "$60000"],
  "threshold": "60000",
  "responseText": "I'll watch Bitcoin's price for you! You'll get notified when it reaches or passes $60,000.",
  "confidence": 0.95
}

User: "Show me news about AI"
Response:
{
  "intent": "search",
  "responseText": "I'll search for the latest AI news. In the current version, I recommend creating an alert to track AI developments continuously. Would you like me to set that up?",
  "confidence": 0.92
}

User: "Summarize today's top stories"
Response:
{
  "intent": "summarize",
  "responseText": "Here's what's trending today:\\n\\n📊 **Top Signals**\\n• Technology: Major AI breakthroughs\\n• Finance: Market updates\\n• Entertainment: New releases\\n\\nWould you like me to create alerts for any of these topics?",
  "confidence": 0.90
}

PERSONALITY:
- Friendly and conversational
- Clear and concise
- Proactive in suggesting features
- Always confirm what you're doing
- Use emojis sparingly (only for emphasis)

ALWAYS respond with valid JSON only. No markdown, no code blocks, just the JSON object.`;
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
