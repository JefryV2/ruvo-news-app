import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Send, Sparkles, Bell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AIRequestParser } from '@/lib/aiRequestParser';
import { CustomAlertsService } from '@/lib/customAlertsService';
import { GeminiServiceEnhanced } from '@/lib/geminiServiceEnhanced';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  alertCreated?: boolean;
  alertId?: string;
};

export default function AskRuvoScreen() {
  const { user, signals } = useApp();
  const { colors, mode } = useTheme(); // Add theme context
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize with contextual welcome message
  useEffect(() => {
    const welcomeMessage = user 
      ? `Hi ${user.username}! 👋 I'm Ruvo, your personal news assistant.\n\nI see you're interested in ${user.interests?.slice(0, 3).join(', ') || 'various topics'} and you have ${signals.length} recent articles in your feed.\n\nI can help you:\n• Find more stories on topics you care about\n• Create alerts so you never miss important updates\n• Summarize what's been happening lately\n\nWhat would you like to know?`
      : `Hi there! I'm Ruvo, your personal news assistant.\n\nI can help you:\n• Create alerts for topics you're interested in\n• Answer questions about current events\n• Explain complex topics\n• Find news on any subject\n\nWhat can I help you with today?`;

    setMessages([{
      id: '1',
      text: welcomeMessage,
      isUser: false,
      timestamp: new Date(),
    }]);
  }, [user, signals]);

  // Animate welcome message
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === '' || isProcessing) return;

    const query = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: query,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Show typing indicator
    const typingMessage: Message = {
      id: 'typing',
      text: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    // Process the request
    await processUserRequest(query);
    
    // Remove typing indicator
    setMessages((prev) => prev.filter(m => m.id !== 'typing'));
    setIsProcessing(false);
  };

  const processUserRequest = async (query: string) => {
    try {
      let responseText = '';
      let alertCreated = false;
      let alertId: string | undefined;

      // Prepare user context for enhanced AI
      const userContext = {
        user,
        recentSignals: signals.slice(0, 20), // Last 20 signals
        userInterests: user?.interests || [],
        userSources: user?.sources || []
      };

      // Try Enhanced Gemini AI first
      try {
        const geminiResponse = await GeminiServiceEnhanced.chat(query, userContext, true);
        
        if (geminiResponse.intent === 'create_alert' && geminiResponse.parsedData) {
          // User wants to create an alert
          if (!user) {
            responseText = 'Please sign in to create custom alerts. You can sign in from the Profile tab to start tracking news that matters to you!';
          } else {
            try {
              const alert = await CustomAlertsService.createAlert(user.id, geminiResponse.parsedData);
              alertCreated = true;
              alertId = alert.id;
              responseText = geminiResponse.responseText;
            } catch (error) {
              console.error('Error creating alert:', error);
              responseText = 'I understood your request, but had trouble creating the alert. Try using this format:\n\n"Notify me about [topic]"\n\nExamples:\n• "Notify me about Tesla news"\n• "Alert me about AI developments"\n• "Track Apple product launches"';
            }
          }
        } else {
          // General response - Enhanced Gemini handled it with context
          responseText = geminiResponse.responseText;
        }
      } catch (geminiError: any) {
        // Fallback to pattern matching if Gemini fails
        console.warn('Gemini failed, using fallback:', geminiError);
        
        if (geminiError.message?.includes('API key not configured')) {
          // Better response for common queries even without API
          const lowerQuery = query.toLowerCase();
          
          if (lowerQuery.includes('summarize') || lowerQuery.includes('summary')) {
            responseText = `📊 Feed Summary

Your personalized feed shows news based on your ${user?.interests.length || 0} interests. To get the most from Ruvo:

✨ Add more interests in Profile
🔔 Create alerts for topics you follow
📰 Browse Discover for trending stories

💡 Tip: For AI-powered summaries and conversations, add a Gemini API key (free!) - check the documentation!`;
          } else if (lowerQuery.includes('what') || lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('explain') || lowerQuery.includes('tell me')) {
            responseText = `💡 I can answer any question with Gemini AI!

Quick Setup (2 minutes):
1. Get free API key: https://makersuite.google.com/app/apikey
2. Add to .env: EXPO_PUBLIC_GEMINI_API_KEY=your_key
3. Restart app

Without API key, I can help with:
• Creating alerts: "Notify me about [topic]"
• Basic assistance

With API key, I can:
• Answer any question
• Explain concepts
• Have natural conversations
• Provide detailed information`;
          } else {
            responseText = `⚠️ Gemini AI is not configured yet!

Get intelligent responses:
1. Visit: https://makersuite.google.com/app/apikey
2. Create free API key
3. Add to .env file
4. Restart app

I can still help create alerts! Try:
"Notify me about [topic]"`;
          }
        } else {
          const parsed = AIRequestParser.parseRequest(query);
          
          if (parsed.intent === 'create_alert') {
            if (!user) {
              responseText = 'Please sign in to create custom alerts.';
            } else {
              try {
                const alert = await CustomAlertsService.createAlert(user.id, parsed);
                alertCreated = true;
                alertId = alert.id;
                responseText = `✅ Alert created!

${alert.title}
${alert.description}

I'll notify you when relevant news appears.`;
              } catch (error) {
                responseText = 'Sorry, I had trouble creating that alert. Try: "Notify me about [topic]"';
              }
            }
          } else if (parsed.intent === 'search') {
            responseText = `I can help you track news about that topic!

Try creating an alert:
"Notify me about ${parsed.keywords.slice(0, 2).join(' ')}"

💡 Want smarter responses? Add Gemini API key (free!) for AI-powered answers to any question!`;
          } else if (parsed.intent === 'summarize') {
            responseText = `📊 Quick Summary

Your feed is curated based on your interests. Check:
• Feed tab for latest signals
• Discover tab for trending news
• Profile to manage interests

🔔 Create alerts to never miss important updates!`;
          } else {
            responseText = "I'm working in limited mode right now.\n\n✅ I can help create alerts:\n\"Notify me about [topic]\"\n\n🤖 For AI-powered conversations:\nAdd Gemini API key (see docs)";
          }
        }
      }

      // Apply human-like filtering to make responses feel more natural
      responseText = humanizeResponse(responseText);

      // Add AI response
      const aiResponse: Message = {
        id: Date.now().toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        alertCreated,
        alertId,
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, aiResponse]);
      }, 800);

    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again or check your internet connection.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const renderMessage = (message: Message) => {
    if (message.isTyping) {
      return (
        <View key={message.id} style={[styles.messageContainer, styles.aiMessageContainer]}>
          <View style={[styles.aiAvatar, { backgroundColor: mode === 'dark' ? `${colors.primary}20` : `${colors.primary}15` }]}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.card.light }]}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.text.secondary }]}>Ruvo is thinking...</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View 
        key={message.id} 
        style={[
          styles.messageContainer, 
          message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
        ]}
      >
        {!message.isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: mode === 'dark' ? `${colors.primary}20` : `${colors.primary}15` }]}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          message.isUser ? 
            [styles.userBubble, { backgroundColor: colors.primary }] : 
            [styles.aiBubble, { backgroundColor: colors.card.light }]
        ]}>
          <Text style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.aiText,
            message.isUser ? { color: colors.text.inverse } : { color: colors.text.primary }
          ]}>
            {message.text}
          </Text>
          
          {message.alertCreated && message.alertId && (
            <TouchableOpacity 
              style={[styles.alertBadge, { backgroundColor: `${colors.accent}20` }]}
              onPress={() => router.push('/custom-alerts')}
            >
              <Bell size={14} color={colors.accent} />
              <Text style={[styles.alertBadgeText, { color: colors.accent }]}>Alert Created!</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {message.isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: mode === 'dark' ? `${colors.primary}20` : `${colors.primary}15` }]}>
            <Sparkles size={16} color={colors.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.light }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: mode === 'dark' ? `${colors.primary}20` : `${colors.primary}15` }]}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Ask Ruvo</Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>Powered by Gemini AI</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.messagesBackground, { backgroundColor: colors.background.primary }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) => renderMessage(message))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>

        <View style={[styles.inputContainer, { borderTopColor: colors.border.light, backgroundColor: colors.background.primary }]}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card.light, 
              color: colors.text.primary,
              borderColor: colors.border.lighter
            }]}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, 
              (inputText.trim() === '' || isProcessing) && styles.sendButtonDisabled,
              { backgroundColor: colors.primary }
            ]}
            onPress={handleSend}
            disabled={inputText.trim() === '' || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Send size={20} color={colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  messagesBackground: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    borderBottomRightRadius: 8,
  },
  aiBubble: {
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    fontWeight: '500' as const,
  },
  aiText: {
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  alertBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

// Helper function to make responses more human-like
const humanizeResponse = (responseText: string): string => {
  // Remove any remaining markdown bold formatting
  let humanizedText = responseText.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Replace markdown-style headers with more natural formatting
  humanizedText = humanizedText.replace(/^(#+)\s*(.*?)$/gm, '$2');
  
  // Add more natural sentence structures
  humanizedText = humanizedText.replace(/\. \[/g, '.\n['); // Add line breaks before lists
  
  // Ensure proper spacing after punctuation
  humanizedText = humanizedText.replace(/\s*\.\s*/g, '. ');
  humanizedText = humanizedText.replace(/\s*,\s*/g, ', ');
  humanizedText = humanizedText.replace(/\s*;\s*/g, '; ');
  
  // Trim extra whitespace
  humanizedText = humanizedText.replace(/^\s+|\s+$/gm, '');
  
  return humanizedText;
};
