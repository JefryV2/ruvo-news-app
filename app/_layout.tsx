// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Text, Modal, View, StyleSheet, TouchableOpacity, Alert, AppState } from 'react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { screenTimeService } from '@/lib/screenTimeService';
import { Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    // Start screen time session
    screenTimeService.startSession();

    // Check every minute if limit is exceeded
    const interval = setInterval(async () => {
      const exceeded = await screenTimeService.hasExceededLimit();
      if (exceeded && !showLimitModal) {
        setShowLimitModal(true);
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      screenTimeService.endSession();
    };
  }, []);

  const handleCloseApp = () => {
    Alert.alert(
      'Time Limit Reached',
      'You\'ve reached your daily time limit. The app will now close.',
      [
        {
          text: 'OK',
          onPress: () => {
            // On React Native, we can't truly close the app, but we can navigate away
            // In a real implementation, you might want to navigate to a "locked" screen
            AppState.currentState = 'background';
          }
        }
      ]
    );
  };

  const handleContinue = () => {
    setShowLimitModal(false);
  };

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#000000' }
          }} 
        />
        <Stack.Screen name="ask-ruvo" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="article-detail" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="account-settings" options={{ headerShown: false }} />
        <Stack.Screen name="screen-time-settings" options={{ headerShown: false }} />
        <Stack.Screen name="content-wellness-settings" options={{ headerShown: false }} />
        <Stack.Screen name="liked-articles" options={{ headerShown: false }} />
        <Stack.Screen name="saved-articles" options={{ headerShown: false }} />
      </Stack>

      {/* Screen Time Limit Modal */}
      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Clock size={48} color={Colors.alert} />
            </View>
            <Text style={styles.modalTitle}>Time Limit Reached</Text>
            <Text style={styles.modalMessage}>
              You've reached your daily screen time limit. Taking breaks is important for your well-being.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCloseApp}
            >
              <Text style={styles.primaryButtonText}>Close App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContinue}
            >
              <Text style={styles.secondaryButtonText}>Continue Anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <LanguageProvider>
            <RootLayoutNav />
          </LanguageProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.alert}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: Colors.alert,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
