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
import { MapPin, ArrowRight, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { GeolocationService } from '@/lib/geolocationService';

interface LocationPermissionProps {
  onPermissionGranted: (location: any) => void;
  onSkip: () => void;
}

export default function LocationPermissionScreen({ 
  onPermissionGranted, 
  onSkip 
}: LocationPermissionProps) {
  const [isRequesting, setIsRequesting] = useState(false);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <X size={24} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MapPin size={64} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Get Local News</Text>
          <Text style={styles.subtitle}>
            Allow Ruvo to access your location for personalized regional news
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitTitle}>Regional News</Text>
              <Text style={styles.benefitDescription}>
                Get news from your country and region
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitTitle}>Local Trends</Text>
              <Text style={styles.benefitDescription}>
                See what's trending in your area
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitTitle}>Privacy First</Text>
              <Text style={styles.benefitDescription}>
                Your location is only used for news personalization
              </Text>
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 Your location data is stored locally and only used to fetch relevant news. 
              We never share your location with third parties.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRequestPermission}
          disabled={isRequesting}
        >
          <Text style={styles.primaryButtonText}>
            {isRequesting ? 'Requesting...' : 'Allow Location Access'}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Fonts.bold,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: Fonts.regular,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  benefitItem: {
    backgroundColor: Colors.background.white,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 3,
    fontFamily: Fonts.semiBold,
  },
  benefitDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  privacyNote: {
    backgroundColor: `${Colors.primary}08`,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 12,
    marginHorizontal: 8,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: Colors.background.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: Colors.text.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
    fontFamily: Fonts.bold,
  },
});