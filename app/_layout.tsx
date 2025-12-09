import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Text, Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScreenTimeTracker from '@/components/ScreenTimeTracker';
import * as Linking from 'expo-linking';
import { useAuthListener } from '@/hooks/useAuthListener';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Define the linking configuration
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      'reset-password': 'reset-password',
      auth: {
        screens: {
          'sign-in': 'sign-in',
          'sign-up': 'sign-up',
        },
      },
    },
  },
};

function RootLayoutNav() {
  const router = useRouter();
  useAuthListener();
  
  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('Received deep link:', url);
      
      // Parse the URL to extract the path
      const { hostname, path } = Linking.parse(url);
      console.log('Parsed deep link:', { hostname, path });
      
      // Handle reset password links
      if (path && path.includes('reset-password')) {
        console.log('Navigating to reset password screen');
        router.push('/reset-password');
      }
      
      // Handle auth callback links
      if (path && path.includes('auth/callback')) {
        console.log('Navigating to auth callback');
        // The auth callback is handled by Supabase and Expo WebBrowser
        // We don't need to navigate anywhere specific here
        // The WebBrowser.openAuthSessionAsync will handle the callback
      }
    };
    
    // Get the initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
    
    // Listen for URL changes
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, []);

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
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
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

  // Add status bar configuration for better mobile experience
  useEffect(() => {
    // Configure status bar for both Android and iOS
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

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