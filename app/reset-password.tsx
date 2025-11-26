import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authService } from '@/lib/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';

export default function ResetPasswordScreen() {
  const { colors, mode } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  
  const params = useLocalSearchParams();
  const router = useRouter();

  // Check if we have access token from deep link
  useEffect(() => {
    // Handle both deep link parameters and web URL parameters
    const accessToken = params.access_token;
    if (accessToken && typeof accessToken === 'string' && supabase) {
      setHasToken(true);
      // Set the session in Supabase
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: (params.refresh_token as string) || ''
      });
    } else if (Object.keys(params).length > 0) {
      // If we have parameters but no access token, it might be a web URL
      // Check if any parameter contains token information
      const hasTokenParams = Object.keys(params).some(key => 
        key.includes('access_token') || key.includes('refresh_token')
      );
      
      if (!hasTokenParams) {
        setHasToken(false);
      }
    } else {
      // Check if we're on web and have URL parameters
      if (Platform.OS === 'web') {
        // Get the current URL
        Linking.getInitialURL().then(url => {
          if (url) {
            // Parse query parameters from URL
            const urlObj = new URL(url);
            const searchParams = new URLSearchParams(urlObj.search);
            
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            
            if (accessToken && supabase) {
              setHasToken(true);
              // Set the session in Supabase
              supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
            }
          }
        });
      }
    }
  }, [params]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Update the user's password
      await authService.updatePassword(newPassword);
      setSuccess(true);
      Alert.alert(
        'Success', 
        'Your password has been updated successfully!',
        [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If we don't have a token, show a message
  if (!hasToken && (Object.keys(params).length > 0 || Platform.OS === 'web')) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.dark }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card.light }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Invalid Link</Text>
            <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
              This password reset link is invalid or has expired. Please request a new password reset link.
            </Text>
            <TouchableOpacity 
              onPress={() => router.replace('/auth/sign-in')}
              style={[styles.button, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.dark }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card.light }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Password Updated!</Text>
            <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
              Your password has been successfully updated. You can now sign in with your new password.
            </Text>
            <TouchableOpacity 
              onPress={() => router.replace('/auth/sign-in')}
              style={[styles.button, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.dark }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.content}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 0 : 20 }]}>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Reset Password</Text>
          <Text style={[styles.headerSubtitle, { color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>Enter your new password below</Text>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card.light }]}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={colors.accent} strokeWidth={2} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              placeholder="New Password"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={[styles.inputContainer, { marginTop: 16 }]}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={colors.accent} strokeWidth={2} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {error ? (
            <View style={[styles.errorContainer, { 
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              borderColor: 'rgba(248, 113, 113, 0.3)',
            }]}>
              <Text style={[styles.errorText, { color: colors.alert }]}>{error}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            style={[styles.button, { backgroundColor: colors.accent }, isLoading && styles.buttonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    fontWeight: '400',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginVertical: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    marginLeft: 8,
  },
  button: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
});