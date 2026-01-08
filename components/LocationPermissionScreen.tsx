/**
 * Location Permission Component
 * 
 * This component handles the location permission request during onboarding
 * and explains why location access is beneficial for news personalization.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, ArrowRight, Shield, TrendingUp, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { GeolocationService } from '@/lib/geolocationService';
import { useTheme } from '@/contexts/ThemeContext';

interface LocationPermissionProps {
  onPermissionGranted: (location: any) => void;
  onSkip: () => void;
  fullscreen?: boolean;
}

export default function LocationPermissionScreen({ 
  onPermissionGranted, 
  onSkip,
  fullscreen = false,
}: LocationPermissionProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const { colors } = useTheme();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      // Request location permission
      const permissionResult = await GeolocationService.requestLocationPermission();
      
      if (permissionResult.granted) {
        // Get current location
        const location = await GeolocationService.getCurrentLocation();
        
        if (location) {
          onPermissionGranted(location);
        } else {
          Alert.alert(
            'Location Error',
            'Could not determine your location. You can still use Ruvo with general news.',
            [{ text: 'OK', onPress: onSkip }]
          );
        }
      } else {
        // Permission denied
        if (permissionResult.canAskAgain) {
          Alert.alert(
            'Location Permission Denied',
            'Ruvo works better with location access to show you relevant regional news. You can enable it later in Settings.',
            [
              { text: 'Skip', onPress: onSkip },
              { text: 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
        } else {
          Alert.alert(
            'Location Permission Blocked',
            'Location access has been permanently denied. You can enable it in your device Settings > Privacy > Location Services.',
            [
              { text: 'Skip', onPress: onSkip },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Something went wrong while requesting location access. You can skip this step.',
        [{ text: 'Skip', onPress: onSkip }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const benefitCards = [
    {
      title: 'Regional Signal',
      description: 'Daily briefings tailored to your city and country.',
      icon: Globe,
    },
    {
      title: 'Local Momentum',
      description: 'Catch nearby events, markets, and cultural buzz.',
      icon: TrendingUp,
    },
    {
      title: 'Privacy First',
      description: 'Location only lives on your device. Never sold or shared.',
      icon: Shield,
    },
  ];

  const backgroundColor = fullscreen ? '#050505' : colors.background.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      {fullscreen && (
        <View style={styles.gradientBackground} pointerEvents="none">
          <LinearGradient
            colors={['rgba(32,178,170,0.25)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBlobOne}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBlobTwo}
          />
      </View>
      )}

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.alignTop, fullscreen && styles.alignTopHidden]}>
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.text.tertiary }]}>Skip</Text>
          </TouchableOpacity>
          </View>

        <View
          style={[
            styles.heroCard,
            {
              borderColor: 'rgba(255,255,255,0.05)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            },
          ]}
        >
          <View style={[styles.heroBadge, { backgroundColor: `${colors.primary}18` }]}>
            <MapPin size={30} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>Get Local News</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Grant access once to unlock thoughtful regional coverage, tailored around where you live and travel.
              </Text>
            </View>

        <View style={styles.benefitsContainer}>
          {benefitCards.map(({ title, description, icon: Icon }) => (
            <View
              key={title}
              style={[
                styles.benefitCard,
                {
                  backgroundColor: 'rgba(255,255,255,0.015)',
                  borderColor: 'rgba(255,255,255,0.05)',
                },
              ]}
            >
              <View style={[styles.benefitIconWrap, { backgroundColor: `${colors.primary}12` }]}>
                <Icon size={18} color={colors.primary} />
            </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.benefitTitle, { color: colors.text.primary }]}>{title}</Text>
                <Text style={[styles.benefitDescription, { color: colors.text.secondary }]}>{description}</Text>
            </View>
            </View>
          ))}
          </View>

        <View
          style={[
            styles.privacyNote,
            {
              backgroundColor: 'rgba(255,255,255,0.015)',
              borderColor: 'rgba(255,255,255,0.07)',
            },
          ]}
        >
          <Text style={[styles.privacyTitle, { color: colors.text.primary }]}>Private by Design</Text>
          <Text style={[styles.privacyText, { color: colors.text.secondary }]}>
            🔒 Location never leaves your device. We only use it to curate nearby stories and alerts. You can disable it anytime
            in Settings.
            </Text>
          </View>

        <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleRequestPermission}
          disabled={isRequesting}
            activeOpacity={0.85}
        >
            <Text style={[styles.primaryButtonText, { color: colors.text.inverse }]}>{isRequesting ? 'Requesting…' : 'Allow Location Access'}</Text>
            <ArrowRight size={18} color={colors.text.inverse} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.linkButton]} onPress={onSkip} activeOpacity={0.85}>
            <Text style={[styles.linkText, { color: colors.text.secondary }]}>Continue without location</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  gradientBlobOne: {
    position: 'absolute',
    width: 400,
    height: 400,
    top: -80,
    left: -120,
    borderRadius: 200,
  },
  gradientBlobTwo: {
    position: 'absolute',
    width: 380,
    height: 380,
    bottom: -120,
    right: -100,
    borderRadius: 190,
  },
  alignTop: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  alignTopHidden: {
    opacity: 0,
    height: 0,
  },
  skipButton: {
    padding: 6,
  },
  skipText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
    justifyContent: 'space-between',
  },
  heroCard: {
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 12,
  },
  heroBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: Fonts.regular,
  },
  benefitsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  benefitCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  benefitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 3,
  },
  benefitDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  privacyNote: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Fonts.semiBold,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  buttonGroup: {
    marginTop: 16,
    marginBottom: 20,
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    height: 56,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.text.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.inverse,
    fontFamily: Fonts.bold,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  linkButton: {
    backgroundColor: 'transparent',
    height: 'auto',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});