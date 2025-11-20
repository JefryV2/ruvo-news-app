import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Text } from 'react-native';

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        if (hasCompletedOnboarding) {
          router.replace('/(tabs)/feed');
        } else {
          router.replace('/auth/sign-in');
        }
      }, 100);
    }
  }, [hasCompletedOnboarding, isLoading]);

  // Show loading indicator while determining route
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>RUVO</Text>
        <Text style={styles.tagline}>Cut the Noise. Catch the Signal.</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Preparing your experience...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text.onLight,
    letterSpacing: -1,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
});