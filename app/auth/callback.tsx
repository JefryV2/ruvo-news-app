import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // This screen is just a placeholder
    // The actual OAuth callback is handled by Expo WebBrowser
    // We'll redirect to the feed or onboarding as appropriate
    
    const checkAuthStatus = async () => {
      try {
        console.log('Auth callback screen mounted, checking auth status...');
        
        // Small delay to ensure auth state is updated
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user has completed onboarding
        const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
        console.log('Onboarding complete status:', onboardingComplete);
        
        if (onboardingComplete === 'true') {
          console.log('User has completed onboarding, redirecting to feed');
          router.replace('/(tabs)/feed');
        } else {
          console.log('User has not completed onboarding, redirecting to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        console.error('Error details:', {
          name: (error as any).name,
          message: (error as any).message,
          stack: (error as any).stack
        });
        // Redirect to sign in on error
        router.replace('/auth/sign-in');
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.text, { color: colors.text.primary }]}>Completing authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});