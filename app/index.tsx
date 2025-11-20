import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Text } from 'react-native';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = useApp();
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const translateYValue = useRef(new Animated.Value(50)).current;

  // Animation effects
  useEffect(() => {
    // Initial fade in
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        speed: 12,
        useNativeDriver: true,
      }),
      Animated.timing(translateYValue, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();

    // Continuous pulsing animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      {/* Gradient background similar to the website */}
      <View style={styles.gradientBackground} />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: opacityValue,
            transform: [
              { scale: scaleValue },
              { translateY: translateYValue }
            ],
          }
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseValue }],
            }
          ]}
        >
          <Text style={styles.logo}>RUVO</Text>
        </Animated.View>
        <Text style={styles.tagline}>Cut the Noise. Catch the Signal.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background like the website
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    // Creating a gradient-like effect with layered colors similar to the website
    backgroundColor: '#000000',
    // We'll simulate the gradient with a subtle overlay
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    // Adding a subtle overlay to mimic the website's grainy gradient effect
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: width < 400 ? 56 : 64, // Responsive font size
    fontWeight: '300', // Light weight like Cormorant Garamond
    color: '#FFFFFF', // White text like the website
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_400Regular', // Closest to serif font we have
  },
  tagline: {
    fontSize: width < 400 ? 16 : 18,
    color: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white like the website
    marginBottom: 50,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '300', // Light weight
    fontFamily: 'PlayfairDisplay_400Regular', // Serif font
  },
});