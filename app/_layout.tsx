// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Text } from 'react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScreenTimeTracker from '@/components/ScreenTimeTracker';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
      <Stack.Screen name="liked-articles" options={{ headerShown: false }} />
      <Stack.Screen name="saved-articles" options={{ headerShown: false }} />
    </Stack>
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
            <ThemeProvider>
              <ScreenTimeTracker>
                <RootLayoutNav />
              </ScreenTimeTracker>
            </ThemeProvider>
          </LanguageProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}