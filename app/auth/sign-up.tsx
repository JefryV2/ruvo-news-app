import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, Chrome } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { authService } from '@/lib/authService';
import { useTheme } from '@/contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { useSignInWithGoogle } from '@/lib/hooks';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const googleSignInMutation = useSignInWithGoogle();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsating animation
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
      ])
    );
    animation.start();
    
    pulseAnimation = animation;

    // Cleanup function to stop animations when component unmounts
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, []);

  const handleSignUp = async () => {
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.signUp({ 
        email, 
        password,
        name 
      });
      
      if (result.user) {
        // New user - go to onboarding
        router.replace('/onboarding');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    name.length > 0 &&
    email.length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Starting Google sign in process...');
      
      // Get the OAuth URL from Supabase
      const result = await authService.signInWithGoogle();
      console.log('Google OAuth result:', result);
      
      // Open the OAuth URL in a browser
      if (result.url) {
        const response = await WebBrowser.openAuthSessionAsync(result.url);
        console.log('OAuth response:', response);
        
        if (response.type === 'success') {
          // The user has successfully authenticated
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
        } else if (response.type === 'dismiss') {
          setError('Google sign in was cancelled');
        } else {
          setError('Google sign in failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View 
          style={[
            styles.gradientOrb1,
            {
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(93, 202, 218, 0.3)', 'rgba(93, 202, 218, 0.15)', 'rgba(93, 202, 218, 0)']}  
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.gradientOrb2,
            {
              transform: [{ scale: pulseAnim.interpolate({
                inputRange: [1, 1.3],
                outputRange: [1.1, 1.4],
              })}],
              opacity: glowAnim.interpolate({
                inputRange: [0.3, 0.6],
                outputRange: [0.4, 0.7],
              }),
            },
          ]} 
        >
          <LinearGradient
            colors={['rgba(127, 234, 255, 0.4)', 'rgba(127, 234, 255, 0.2)', 'rgba(127, 234, 255, 0)']}  
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Create Account</Text>
          <Text style={[styles.headerSubtitle, { color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>Join RUVO today</Text>
        </View>

        <View
          style={styles.scrollView}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                shadowColor: mode === 'dark' ? '#000' : '#000',
              },
            ]}
          >
          <View style={styles.formContainer}>
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card.light,
              borderColor: colors.border.light,
            }]}> 
              <View style={styles.inputIconContainer}>
                <User size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="Full name"
                placeholderTextColor={colors.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card.light,
              borderColor: colors.border.light,
            }]}> 
              <View style={styles.inputIconContainer}>
                <Mail size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="Email address"
                placeholderTextColor={colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card.light,
              borderColor: colors.border.light,
            }]}> 
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="Password (min. 6 characters)"
                placeholderTextColor={colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card.light,
              borderColor: colors.border.light,
            }]}> 
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="Confirm password"
                placeholderTextColor={colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <View style={[styles.errorContainer, { 
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                borderColor: 'rgba(248, 113, 113, 0.3)',
              }]}> 
                <AlertCircle size={16} color={colors.alert} />
                <Text style={[styles.errorText, { color: colors.alert }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.signUpButton, !isFormValid && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              <View style={[styles.signUpButtonGradient, { backgroundColor: colors.accent }]}> 
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <>
                    <Text style={[styles.signUpButtonText, { color: colors.text.inverse }]}>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
                    <ArrowRight size={20} color={colors.text.inverse} strokeWidth={2.5} />
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.googleSignInButton, { 
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : '#dadce0',
                backgroundColor: mode === 'dark' ? '#19242b' : '#FFFFFF',
              }]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={[styles.googleSignInButtonContent, { 
                backgroundColor: mode === 'dark' ? '#19242b' : '#FFFFFF',
              }]}> 
                {googleSignInMutation.isPending || isLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <SvgXml 
                      xml={`<svg viewBox="0 0 256 262" preserveAspectRatio="xMidYMid" xmlns="http://www.w3.org/2000/svg">
                        <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
                        <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
                        <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
                        <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
                      </svg>`}
                      width={24}
                      height={24}
                    />
                    <Text style={[styles.googleSignInButtonText, { 
                      color: mode === 'dark' ? '#c4d2dc' : '#3c4043' 
                    }]}>Sign in with Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <Text style={[styles.termsText, { color: colors.text.primary }]}> 
              By creating an account, you agree to our{' '}
              <Text style={[styles.termsLink, { color: colors.accent }]}>Terms of Service</Text> and{' '}
              <Text style={[styles.termsLink, { color: colors.accent }]}>Privacy Policy</Text>
            </Text>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.text.primary }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/sign-in')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
          <View style={{ height: 40 }} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOrb1: {
    position: 'absolute',
    width: 350,
    height: 350,
    top: -100,
    right: -80,
  },
  gradientOrb2: {
    position: 'absolute',
    width: 400,
    height: 400,
    bottom: -150,
    left: -100,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    borderRadius: 40,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  formContainer: {
    gap: 12,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.5,
  },
  signUpButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    borderRadius: 24,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '600' as const,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  googleSignInButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleSignInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    borderRadius: 24,
  },
  googleSignInButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: -0.2,
  },
});
