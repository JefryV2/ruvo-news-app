import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        if (!hasCompletedOnboarding) {
          router.replace('/auth/sign-in');
        } else {
          router.replace('/(tabs)/feed');
        }
      }, 100);
    }
  }, [hasCompletedOnboarding, isLoading]);

  // Show loading indicator while determining route
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}