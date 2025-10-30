import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { authService } from '@/lib/authService';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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
    Animated.loop(
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
    ).start();
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

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join RUVO today</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={Colors.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Mail size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password (min. 6 characters)"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={Colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={Colors.alert} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.signUpButton, !isFormValid && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.signUpButtonGradient}>
                <Text style={styles.signUpButtonText}>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
                {!isLoading && (<ArrowRight size={20} color={Colors.text.inverse} strokeWidth={2.5} />)}
              </View>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    marginBottom: 32,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  formContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
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
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text.inverse,
    letterSpacing: -0.2,
  },
  termsText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.text.tertiary,
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
    color: Colors.text.secondary,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.alert,
  },
});
