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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Send, Sparkles, Bell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { GeminiService } from '@/lib/geminiService';
import { CustomAlertsService } from '@/lib/customAlertsService';
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
  const { user } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm Ruvo, your AI assistant powered by Gemini. I can help you:

• Create custom alerts (e.g., "Notify me when BTS drops an album")
• Search for specific topics
• Summarize your feed
• Answer questions

What can I help you with?`,
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
            responseText = 'Sorry, I had trouble creating that alert. Could you try rephrasing your request?';
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
      
      let errorMessage = 'Sorry, I encountered an error processing your request.';
      
      if (error.message?.includes('API key not configured')) {
        errorMessage = '⚠️ Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.\n\nGet your free API key at: https://makersuite.google.com/app/apikey';
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
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' || isProcessing) && styles.sendButtonDisabled
            ]}
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
