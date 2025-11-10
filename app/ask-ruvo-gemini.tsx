/**
 * Ask Ruvo with Gemini AI Integration
 * 
 * This is the updated version of ask-ruvo.tsx with full Gemini AI support.
 * 
 * To use this version:
 * 1. Add your Gemini API key to .env: EXPO_PUBLIC_GEMINI_API_KEY=your_key
 * 2. Rename this file to replace app/ask-ruvo.tsx
 * 3. Test with natural language queries
 */

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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Send, Sparkles, Bell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { GeminiService } from '@/lib/geminiService';
import { CustomAlertsService } from '@/lib/customAlertsService';
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
  const { user } = useApp();
  const { colors, mode } = useTheme(); // Add theme context
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi there! I'm Ruvo, your personal news assistant.\n\nI can help you:\n• Create alerts for topics you're interested in\n• Answer questions about current events\n• Explain complex topics\n• Find news on any subject\n\nWhat can I help you with today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
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

    // Process the request with Gemini AI
    await processUserRequest(query);
    
    // Remove typing indicator
    setMessages((prev) => prev.filter(m => m.id !== 'typing'));
    setIsProcessing(false);
  };

  const processUserRequest = async (query: string) => {
    try {
      // Use Gemini AI to understand and respond to the user
      const geminiResponse = await GeminiService.chat(query, true);
      
      let responseText = geminiResponse.responseText;
      let alertCreated = false;
      let alertId: string | undefined;

      // If Gemini detected an alert creation intent
      if (geminiResponse.intent === 'create_alert' && geminiResponse.parsedData) {
        if (!user) {
          responseText = 'Please sign in to create custom alerts.';
        } else {
          try {
            // Create the alert using the parsed data from Gemini
            const alert = await CustomAlertsService.createAlert(
              user.id,
              geminiResponse.parsedData
            );
            alertCreated = true;
            alertId = alert.id;
            
            // Use Gemini's confirmation message
            responseText = geminiResponse.responseText;
          } catch (error) {
            console.error('Error creating alert:', error);
            responseText = 'Sorry, I had trouble creating that alert. Could you try rephrasing your request? For example: "Notify me about tech news" or "Alert me when Apple releases something new"';
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

    } catch (error: any) {
      console.error('Error processing request:', error);
      
      let errorMessage = 'Sorry, I had trouble with that request. Could you try asking in a different way?';
      
      if (error.message?.includes('API key not configured')) {
        errorMessage = '⚠️ Gemini API key is not configured yet!\n\nTo get smart AI responses:\n1. Visit: https://makersuite.google.com/app/apikey\n2. Create a free API key\n3. Add it to your .env file\n4. Restart the app\n\nI can still help create alerts! Try: "Notify me about [topic]"';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
          message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
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
        <View
          style={[
            styles.messageBubble,
            message.isUser ? 
              [styles.userBubble, { backgroundColor: colors.primary }] : 
              [styles.aiBubble, { backgroundColor: colors.card.light }]
          ]}
        >
          <Text style={[
            styles.messageText,
            message.isUser ? [styles.userText, { color: colors.text.inverse }] : [styles.aiText, { color: colors.text.primary }]
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
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => renderMessage(message))}
          <View style={{ height: 20 }} />
        </ScrollView>

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
            editable={!isProcessing}
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
