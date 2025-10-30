import { Signal } from '@/types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface UserPreferences {
  interests: string[];
  sources?: string[];
  language?: string;
}

export const aiNewsService = {
  /**
   * Fetch personalized news using Gemini AI
   */
  async fetchPersonalizedNews(preferences: UserPreferences, limit: number = 10): Promise<Signal[]> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Create a detailed prompt for Gemini
      const prompt = this.createNewsPrompt(preferences, limit);

      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0]?.content?.parts[0]?.text;

      if (!generatedText) {
        throw new Error('No content generated');
      }

      // Parse the JSON response from Gemini
      const signals = this.parseGeminiResponse(generatedText);
      return signals;

    } catch (error) {
      console.error('AI News fetch error:', error);
      throw error;
    }
  },

  /**
   * Create a detailed prompt for Gemini to generate news
   */
  createNewsPrompt(preferences: UserPreferences, limit: number): string {
    const interestsStr = preferences.interests.join(', ');
    const currentDate = new Date().toISOString().split('T')[0];

    return `You are a news curator AI for RUVO, a personalized news app. Your job is to find and curate the most relevant, high-quality news articles for users.

USER PREFERENCES:
- Interests: ${interestsStr}
- Language: ${preferences.language || 'en'}
- Date: ${currentDate}

TASK:
Generate ${limit} highly relevant news articles based on the user's interests. For each article:

1. Find REAL, RECENT news (from the last 24-48 hours) related to their interests
2. Prioritize: Breaking news, trending topics, and significant developments
3. Ensure diversity - cover different aspects of their interests
4. Verify sources are credible (major news outlets, tech blogs, financial publications)
5. Include a mix of urgency levels

RESPONSE FORMAT (JSON array):
Return ONLY a valid JSON array with this exact structure:

[
  {
    "id": "unique-id",
    "title": "Article headline (concise, engaging)",
    "summary": "2-3 sentence summary of the key points",
    "content": "Brief article content (3-4 paragraphs)",
    "source_name": "Source name (e.g., TechCrunch, BBC, Bloomberg)",
    "source_url": "https://example.com/article",
    "image_url": "https://images.unsplash.com/photo-relevant-image",
    "tags": ["tag1", "tag2", "tag3"],
    "verified": true,
    "priority": "high|medium|low|urgent",
    "category": "category matching user interests",
    "created_at": "${new Date().toISOString()}"
  }
]

IMPORTANT:
- Return ONLY the JSON array, no other text
- Use real news from reputable sources
- Ensure all URLs are valid
- Make titles compelling but accurate
- Summaries should be informative and concise
- Tags should be relevant and specific
- Priority: urgent (breaking), high (important), medium (interesting), low (background)
- Use high-quality Unsplash images related to the topic

Generate ${limit} diverse, high-quality news articles now:`;
  },

  /**
   * Parse Gemini's response into Signal objects
   */
  parseGeminiResponse(text: string): Signal[] {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanText);
      
      // Ensure it's an array
      const articles = Array.isArray(parsed) ? parsed : [parsed];

      // Convert to Signal format and add client-side properties
      return articles.map((article, index) => ({
        id: article.id || `ai-${Date.now()}-${index}`,
        title: article.title,
        summary: article.summary,
        sourceId: `source-${index}`,
        sourceName: article.source_name,
        verified: article.verified ?? true,
        tags: article.tags || [],
        url: article.source_url,
        relevanceScore: 0.9 - (index * 0.05), // Decreasing relevance
        timestamp: new Date(article.created_at || Date.now()),
        imageUrl: article.image_url,
        saved: false,
        liked: false,
      }));
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', text);
      throw new Error('Failed to parse AI response');
    }
  },

  /**
   * Analyze user behavior to improve recommendations
   */
  async getAIRecommendations(
    preferences: UserPreferences,
    userHistory: { liked: string[], saved: string[], dismissed: string[] }
  ): Promise<Signal[]> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are analyzing user behavior for personalized news recommendations.

USER PROFILE:
- Interests: ${preferences.interests.join(', ')}
- Liked topics: ${userHistory.liked.join(', ') || 'None yet'}
- Saved topics: ${userHistory.saved.join(', ') || 'None yet'}
- Dismissed topics: ${userHistory.dismissed.join(', ') || 'None yet'}

Based on their behavior patterns, what news topics should we recommend?
Consider:
1. Their explicit interests
2. Topics they've engaged with positively
3. Avoid topics they've dismissed
4. Suggest related but new topics they might enjoy

Generate 5 highly relevant news articles following the same JSON format as before.`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
          },
        }),
      });

      const data = await response.json();
      const generatedText = data.candidates[0]?.content?.parts[0]?.text;
      
      return this.parseGeminiResponse(generatedText);
    } catch (error) {
      console.error('AI Recommendations error:', error);
      throw error;
    }
  },

  /**
   * Summarize multiple articles into a daily digest
   */
  async generateDailyDigest(signals: Signal[]): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const articlesText = signals.map(s => 
      `- ${s.title}\n  Source: ${s.sourceName}\n  Summary: ${s.summary}`
    ).join('\n\n');

    const prompt = `Create a concise, engaging daily digest from these news articles:

${articlesText}

Write a 3-4 paragraph digest that:
1. Highlights the most important stories
2. Connects related topics
3. Provides context and analysis
4. Ends with a forward-looking statement

Keep it conversational, informative, and under 200 words.`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      console.error('Daily digest error:', error);
      throw error;
    }
  },

  /**
   * Get trending topics using AI analysis
   */
  async analyzeTrendingTopics(recentSignals: Signal[]): Promise<string[]> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const titlesAndTags = recentSignals.map(s => 
      `${s.title} [${s.tags.join(', ')}]`
    ).join('\n');

    const prompt = `Analyze these recent news headlines and identify the top 5 trending topics:

${titlesAndTags}

Return ONLY a JSON array of trending topic names, like:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 512,
          },
        }),
      });

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '[]';
      
      // Parse the JSON array
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Trending topics error:', error);
      return [];
    }
  },
};
