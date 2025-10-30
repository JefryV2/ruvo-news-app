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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Send, Sparkles, Bell, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AIRequestParser } from '@/lib/aiRequestParser';
import { CustomAlertsService } from '@/lib/customAlertsService';
import { GeminiServiceEnhanced } from '@/lib/geminiServiceEnhanced';
import { useApp } from '@/contexts/AppContext';

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
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize with contextual welcome message
  useEffect(() => {
    const welcomeMessage = user 
      ? `Hello ${user.username}! 👋 I'm Ruvo, your intelligent AI assistant powered by Gemini.\n\nI've analyzed your feed and can help you with:\n\n• 📊 Summarizing your ${signals.length} recent signals\n• 🔔 Creating smart alerts based on your interests: ${user.interests?.slice(0, 3).join(', ') || 'None set'}\n• 📈 Analyzing trends in your news consumption\n• 💡 Answering questions about topics in your feed\n• 🎯 Providing personalized insights\n\nWhat would you like to know about your feed?`
      : `Hello! I'm Ruvo, your intelligent AI assistant powered by Gemini. I can help you with:\n\n• Creating custom alerts for any topic\n• Answering questions about anything\n• Explaining complex concepts\n• Having natural conversations\n• Finding and tracking news\n\nAsk me anything - I'm here to help! 💡`;

    setMessages([{
      id: '1',
      text: welcomeMessage,
      isUser: false,
      timestamp: new Date(),
    }]);
  }, [user, signals]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
            responseText = `📊 **Feed Summary**\n\nYour personalized feed shows news based on your ${user?.interests.length || 0} interests. To get the most from Ruvo:\n\n✨ Add more interests in Profile\n🔔 Create alerts for topics you follow\n📰 Browse Discover for trending stories\n\n💡 **Tip:** For AI-powered summaries and conversations, add a Gemini API key (free!) - check the documentation!`;
          } else if (lowerQuery.includes('what') || lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('explain') || lowerQuery.includes('tell me')) {
            responseText = '💡 I can answer any question with Gemini AI!\n\n**Quick Setup (2 minutes):**\n1. Get free API key: https://makersuite.google.com/app/apikey\n2. Add to .env: EXPO_PUBLIC_GEMINI_API_KEY=your_key\n3. Restart app\n\n**Without API key**, I can help with:\n• Creating alerts: "Notify me about [topic]"\n• Basic assistance\n\n**With API key**, I can:\n• Answer any question\n• Explain concepts\n• Have natural conversations\n• Provide detailed information';
          } else {
            responseText = '⚠️ Gemini AI is not configured yet!\n\n**Get intelligent responses:**\n1. Visit: https://makersuite.google.com/app/apikey\n2. Create free API key\n3. Add to .env file\n4. Restart app\n\nI can still help create alerts! Try:\n"Notify me about [your topic]"';
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
                responseText = `✅ Alert created!\n\n**${alert.title}**\n${alert.description}\n\nI'll notify you when relevant news appears.`;
              } catch (error) {
                responseText = 'Sorry, I had trouble creating that alert. Try: "Notify me about [topic]"';
              }
            }
                    } else if (parsed.intent === 'search') {
            responseText = `I can help you track news about that topic!\n\nTry creating an alert:\n"Notify me about ${parsed.keywords.slice(0, 2).join(' ')}"\n\n💡 **Want smarter responses?** Add Gemini API key (free!) for AI-powered answers to any question!`;
          } else if (parsed.intent === 'summarize') {
            responseText = `📊 **Quick Summary**\n\nYour feed is curated based on your interests. Check:\n• Feed tab for latest signals\n• Discover tab for trending news\n• Profile to manage interests\n\n🔔 Create alerts to never miss important updates!`;
          } else {
            responseText = 'I\'m working in limited mode right now.\n\n✅ I can help create alerts:\n"Notify me about [topic]"\n\n🤖 For AI-powered conversations:\nAdd Gemini API key (see docs)';
          }
        }
      }

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
          <View style={styles.aiAvatar}>
            <Sparkles size={16} color={Colors.primary} />
          </View>
          <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color={Colors.text.secondary} />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!message.isUser && (
          <View style={styles.aiAvatar}>
            <Sparkles size={16} color={Colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.isUser ? styles.userText : styles.aiText,
            ]}
          >
            {message.text}
          </Text>
          {message.alertCreated && (
            <View style={styles.alertBadge}>
              <Bell size={14} color={Colors.accent} />
              <Text style={styles.alertBadgeText}>Alert Active</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
                    <View style={styles.headerIcon}>
            <Sparkles size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Ask Ruvo</Text>
            <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
          </View>
        </View>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
                <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => renderMessage(message))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={Colors.text.secondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
                    <TouchableOpacity
            style={[styles.sendButton, (inputText.trim() === '' || isProcessing) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={inputText.trim() === '' || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
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
    backgroundColor: Colors.background.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
        headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
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
    gap: 8,
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
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.card.light,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
    aiText: {
    color: Colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.light,
  },
    input: {
    flex: 1,
    backgroundColor: Colors.card.light,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
    sendButtonDisabled: {
    opacity: 0.5,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: `${Colors.accent}20`,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
    alertBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
});
