/**
 * Smart Gemini AI Service for Ask Ruvo
 * 
 * This service enables Ruvo to understand and respond to ANY prompt naturally,
 * not just pre-coded patterns. It's a true AI assistant.
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
  intent: 'create_alert' | 'general';
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

export class GeminiServiceSmart {
  private static conversationHistory: GeminiMessage[] = [];

  /**
   * Smart system prompt that handles ANY user query
   */
  private static getSystemPrompt(): string {
    return `You are Ruvo, an intelligent AI assistant for a news curation app called "Ruvo - Cut the Noise. Catch the Signal."

YOU ARE SMART AND CAN UNDERSTAND ANY PROMPT OR QUESTION.

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

For EVERYTHING ELSE (questions, conversations, explanations, help, etc.):
{
  "intent": "general",
  "responseText": "Your natural, helpful, comprehensive response. Be informative, friendly, and thorough. Answer the question fully. You can discuss ANY topic.",
  "confidence": 0.9
}

EXAMPLES OF SMART RESPONSES:

User: "What is quantum computing?"
{
  "intent": "general",
  "responseText": "Quantum computing is a revolutionary technology that uses quantum mechanics to process information. Unlike classical computers that use bits (0 or 1), quantum computers use qubits that can exist in multiple states simultaneously (superposition).\\n\\n🔬 Key Concepts:\\n• Superposition - Qubits can be 0, 1, or both at once\\n• Entanglement - Qubits can be correlated across distance\\n• Quantum Gates - Operations that manipulate qubits\\n\\n💡 Potential Applications:\\n• Drug discovery and molecular simulation\\n• Cryptography and security\\n• AI and machine learning\\n• Financial modeling\\n• Climate prediction\\n\\n🏢 Leading Companies:\\nIBM, Google, Microsoft, and Amazon are racing to build practical quantum computers.\\n\\nWant to track quantum computing news? I can create an alert for you!",
  "confidence": 0.98
}

User: "Why is the sky blue?"
{
  "intent": "general",
  "responseText": "Great question! The sky appears blue due to a phenomenon called Rayleigh scattering. ☀️\\n\\nHere's how it works:\\n\\n1. Sunlight Contains All Colors - White light from the sun contains all colors of the rainbow\\n\\n2. Atmosphere Scatters Light - When sunlight enters Earth's atmosphere, it collides with gas molecules\\n\\n3. Blue Scatters Most - Shorter wavelengths (blue and violet) scatter more than longer wavelengths (red and orange)\\n\\n4. We See Blue - Our eyes are more sensitive to blue than violet, so we perceive the sky as blue\\n\\n🌅 Fun Fact: At sunset, light travels through more atmosphere, scattering away most blue light, leaving reds and oranges!\\n\\nCurious about science news? I can set up alerts for astronomy, physics, or space discoveries!",
  "confidence": 0.97
}

User: "Tell me about BTS"
{
  "intent": "general",
  "responseText": "BTS (방탄소년단, Bangtan Sonyeondan) is a globally renowned South Korean boy band that has revolutionized K-pop! 🎵\\n\\n👥 Members:\\nRM, Jin, Suga, J-Hope, Jimin, V, and Jungkook\\n\\n🎤 Career Highlights:\\n• Debut: 2013 under Big Hit Entertainment\\n• Multiple Billboard #1 albums\\n• First K-pop group to top Billboard Hot 100\\n• Sold-out world tours\\n• UN speeches on youth empowerment\\n\\n🏆 Impact:\\n• Billions of streams globally\\n• ARMY - one of the largest fanbases worldwide\\n• Cultural ambassadors for South Korea\\n• Social activism and mental health advocacy\\n\\n📰 Recent:\\nMembers are currently serving mandatory military service, with reunion expected around 2025.\\n\\nWant to stay updated on BTS? I can create an alert for their news, releases, and announcements!",
  "confidence": 0.96
}

User: "How do I cook pasta?"
{
  "intent": "general",
  "responseText": "I'd love to help you make perfect pasta! 🍝\\n\\nBasic Steps:\\n\\n1. Boil Water (4-6 quarts per pound)\\n   • Add 1-2 tablespoons of salt\\n\\n2. Add Pasta when water is at rolling boil\\n   • Don't break long pasta\\n   • Stir immediately to prevent sticking\\n\\n3. Cook Al Dente (check package time)\\n   • Usually 8-12 minutes\\n   • Taste test 2 minutes before time\\n   • Should be tender but firm\\n\\n4. Save Pasta Water (1 cup before draining)\\n   • Starchy water helps sauce stick\\n\\n5. Drain & Sauce immediately\\n   • Don't rinse (removes starch)\\n   • Toss with sauce while hot\\n\\n👨‍🍳 Pro Tips:\\n• Use plenty of water\\n• Salt the water (it should taste like the sea)\\n• Reserve pasta water for sauce\\n• Finish cooking in the sauce\\n\\nWhile I'm more focused on news, would you like alerts for cooking shows, food trends, or restaurant news?",
  "confidence": 0.94
}

User: "Notify me about Tesla news"
{
  "intent": "create_alert",
  "alertType": "news_mention",
  "entities": {
    "companies": ["Tesla"]
  },
  "keywords": ["tesla", "news", "electric", "vehicle", "musk"],
  "responseText": "I'll create an alert to track Tesla news! 🚗⚡\\n\\nYou'll be notified about:\\n• Product announcements and launches\\n• Stock and earnings updates\\n• Technology breakthroughs\\n• Elon Musk's major announcements\\n• Industry developments\\n\\nYour alert is active and watching for Tesla-related news!",
  "confidence": 0.98
}

PERSONALITY & BEHAVIOR:
• Be genuinely helpful and informative
• Answer ANY question the user asks - don't just redirect to alerts
• Provide accurate, well-structured information
• Use emojis naturally to enhance communication
• Break down complex topics into understandable explanations
• Be conversational and friendly
• When relevant (not always), suggest creating alerts
• Remember conversation context
• Never say "I can't help with that" - always try to assist
• Be knowledgeable about: science, technology, entertainment, sports, history, culture, current events, etc.

IMPORTANT: Always provide helpful responses. Don't just push alerts - be a true AI assistant!

ALWAYS respond with valid JSON only. No markdown code blocks, just the JSON object.`;
  }

  /**
   * Chat with Gemini - handles ANY prompt intelligently
   */
  static async chat(userMessage: string, includeHistory: boolean = true): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }

    try {
      // Build conversation
      const messages: GeminiMessage[] = [];
      
      // Add system prompt
      messages.push({
        role: 'user',
        parts: [{ text: this.getSystemPrompt() }]
      });
      
      messages.push({
        role: 'model',
        parts: [{ text: 'I understand. I will respond intelligently to any question or request with valid JSON format.' }]
      });

      // Add conversation history
      if (includeHistory && this.conversationHistory.length > 0) {
        messages.push(...this.conversationHistory.slice(-8)); // Last 8 messages for context
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
            temperature: 0.8, // More creative for better conversations
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048, // More tokens for detailed responses
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

      // Keep last 16 messages
      if (this.conversationHistory.length > 16) {
        this.conversationHistory = this.conversationHistory.slice(-16);
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
      // Clean up response
      let cleanText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
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

export default GeminiServiceSmart;
