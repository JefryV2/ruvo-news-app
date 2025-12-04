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
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, Chrome, Eye, EyeOff } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { authService } from '@/lib/authService';
import { useSignInWithGoogle } from '@/lib/hooks';
import { useTheme } from '@/contexts/ThemeContext';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const googleSignInMutation = useSignInWithGoogle();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  // Create separate animated values for interpolation to avoid conflicts
  const scaleInterpolated = useRef(new Animated.Value(1.1)).current;
  const glowInterpolated = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let isMounted = true;
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    // Start animations only if component is still mounted
    if (isMounted) {
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

      // Pulsating animation - using consistent useNativeDriver: true
      pulseAnimation = Animated.loop(
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
              useNativeDriver: true, // Changed from false to true
            }),
            // Animate the interpolated values separately
            Animated.timing(scaleInterpolated, {
              toValue: 1.4,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(glowInterpolated, {
              toValue: 0.7,
              duration: 2000,
              useNativeDriver: true,
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
              useNativeDriver: true, // Changed from false to true
            }),
            // Animate the interpolated values separately
            Animated.timing(scaleInterpolated, {
              toValue: 1.1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(glowInterpolated, {
              toValue: 0.4,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();
    }

    // Cleanup function to stop animations when component unmounts
    return () => {
      isMounted = false;
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, []);

  const handleSignIn = async () => {
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting sign in process...', { email });
      console.log('Environment variables:', {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        hasAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
      });
      
      const result = await authService.signIn({ email, password });
      console.log('Sign in result:', result);
      
      if (result.user) {
        try {
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
        } catch (redirectError) {
          console.error('Error during redirect:', redirectError);
          setError('Sign in successful but redirect failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Provide more user-friendly error messages
      if (err.message.includes('Network connection issue')) {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else if (err.message.includes('DNS Error')) {
        setError('Invalid Supabase project URL. Please check your .env file.');
      } else if (err.message.includes('Network error')) {
        setError('Network connection issue. Please check your internet connection.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.length > 0 && password.length > 0;

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await authService.resetPassword(resetEmail);
      setError('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        const response = await WebBrowser.openAuthSessionAsync(result.url, 'ruvo://auth/callback');
        console.log('OAuth response:', response);
        
        if (response.type === 'success') {
          // The user has successfully authenticated
          try {
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
          } catch (redirectError) {
            console.error('Error during redirect:', redirectError);
            setError('Authentication successful but redirect failed. Please try again.');
          }
        } else if (response.type === 'dismiss') {
          setError('Google sign in was cancelled');
        } else {
          setError('Google sign in failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setError(err.message || 'Failed to sign in with Google. Please check your configuration and try again.');
      
      // Show a more detailed error for redirect mismatches
      if (err.message && err.message.includes('Redirect URL mismatch')) {
        console.log('Redirect URL mismatch detected. Please ensure the redirect URLs are properly configured in Supabase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.dark} translucent={true} />
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
            colors={[
              `rgba(${mode === 'dark' ? '127, 234, 255' : '93, 202, 218'}, 0.3)`,
              `rgba(${mode === 'dark' ? '127, 234, 255' : '93, 202, 218'}, 0.15)`,
              `rgba(${mode === 'dark' ? '127, 234, 255' : '93, 202, 218'}, 0)`
            ]}
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.gradientOrb2,
            {
              transform: [{ scale: scaleInterpolated }],
              opacity: glowInterpolated,
            },
          ]} 
        >
          <LinearGradient
            colors={[
              `rgba(${mode === 'dark' ? '93, 202, 218' : '127, 234, 255'}, 0.4)`,
              `rgba(${mode === 'dark' ? '93, 202, 218' : '127, 234, 255'}, 0.2)`,
              `rgba(${mode === 'dark' ? '93, 202, 218' : '127, 234, 255'}, 0)`
            ]}
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
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }}
          >
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          </Animated.View>
          <Animated.Text 
            style={[
              styles.headerTitle,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                color: '#FFFFFF', // Explicitly set to white for better visibility
              }
            ]}
          >
            Welcome Back
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.headerSubtitle,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              }
            ]}
          >
            Sign in to continue
          </Animated.Text>
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
              {isForgotPassword ? (
                <>
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
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  
                  {error ? (
                    <View style={[styles.errorContainer, { 
                      backgroundColor: error.includes('sent') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                      borderColor: error.includes('sent') ? 'rgba(76, 175, 80, 0.3)' : 'rgba(248, 113, 113, 0.3)',
                    }]}>
                      <AlertCircle size={16} color={error.includes('sent') ? '#4CAF50' : colors.alert} />
                      <Text style={[styles.errorText, { color: error.includes('sent') ? '#4CAF50' : colors.alert }]}>{error}</Text>
                    </View>
                  ) : null}
                  
                  <TouchableOpacity
                    style={[styles.signInButton, !resetEmail && styles.signInButtonDisabled]}
                    onPress={handleForgotPassword}
                    disabled={!resetEmail || isLoading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.signInButtonGradient, { backgroundColor: colors.accent }]}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={colors.text.inverse} />
                      ) : (
                        <Text style={[styles.signInButtonText, { color: colors.text.inverse }]}>Send Reset Email</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.forgotButton}
                    onPress={() => {
                      setIsForgotPassword(false);
                      setError('');
                    }}
                  >
                    <Text style={[styles.forgotButtonText, { color: colors.accent }]}>Back to Sign In</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
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
                      editable={!isLoading}
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
                      style={[styles.input, { flex: 1, color: colors.text.primary }]}
                      placeholder="Password"
                      placeholderTextColor={colors.text.tertiary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={colors.text.tertiary} />
                      ) : (
                        <Eye size={20} color={colors.text.tertiary} />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.forgotButton}
                    onPress={() => setIsForgotPassword(true)}
                  >
                    <Text style={[styles.forgotButtonText, { color: colors.accent }]}>Forgot password?</Text>
                  </TouchableOpacity>
                  
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
                    style={[styles.signInButton, !isFormValid && styles.signInButtonDisabled]}
                    onPress={handleSignIn}
                    disabled={!isFormValid || isLoading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.signInButtonGradient, { backgroundColor: colors.accent }]}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={colors.text.inverse} />
                      ) : (
                        <>
                          <Text style={[styles.signInButtonText, { color: colors.text.inverse }]}>Sign In</Text>
                          <ArrowRight size={20} color={colors.text.inverse} strokeWidth={2.5} />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Google Sign In Button */}
                  <TouchableOpacity
                    style={[styles.googleSignInButton, { borderColor: colors.border.light }]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.googleSignInButtonContent, { backgroundColor: colors.card.light }]}>
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
                      <Text style={[styles.googleSignInButtonText, { color: colors.text.primary }]}>Continue with Google</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
              <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
            </View>

            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/auth/sign-up')}>
                <Text style={[styles.footerLink, { color: colors.accent }]}>Sign up</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 40,
    padding: 20,
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
  eyeIcon: {
    padding: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  forgotButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    borderRadius: 24,
  },
  signInButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
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
});