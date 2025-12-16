import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animate in
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.lighter }]}> 
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 28 }}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.lastUpdated, { color: colors.text.tertiary }]}>
            Last Updated: December 16, 2025
          </Text>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Introduction</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              At RUVO, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
            </Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Information We Collect</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              We collect minimal information necessary to provide you with personalized news recommendations:
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Account Information:</Text> Username, email address, and selected interests
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Usage Data:</Text> Reading preferences, liked/saved articles, and interaction patterns
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Device Information:</Text> Device type, operating system, and app version for performance optimization
              </Text>
            </View>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>How We Use Your Information</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              We use your information solely to enhance your experience:
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Personalize your news feed based on your interests
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Improve our recommendation algorithms
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Optimize app performance and fix bugs
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Communicate important updates about our service
              </Text>
            </View>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Data Sharing & Disclosure</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              We do not sell, trade, or rent your personal information to third parties. We only share data in the following circumstances:
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Service Providers:</Text> Trusted partners who assist in operating our service (e.g., hosting, analytics)
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Legal Requirements:</Text> When required by law or to protect our rights and safety
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Business Transfers:</Text> In connection with a merger, acquisition, or sale of assets
              </Text>
            </View>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Data Security</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              We implement robust security measures to protect your data:
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Industry-standard encryption for data transmission and storage
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Regular security audits and vulnerability assessments
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                Strict access controls and authentication procedures
              </Text>
            </View>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Rights</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              You have the following rights regarding your personal data:
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Access:</Text> Request a copy of your personal data
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Correction:</Text> Update inaccurate or incomplete information
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Deletion:</Text> Request deletion of your account and associated data
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={[styles.bulletText, { color: colors.text.primary }]}>•</Text>
              <Text style={[styles.bulletContent, { color: colors.text.secondary }]}>
                <Text style={{ fontWeight: '600' }}>Portability:</Text> Export your data in a machine-readable format
              </Text>
            </View>
            
            <Text style={[styles.paragraph, { color: colors.text.secondary, marginTop: 12 }]}>
              To exercise these rights, contact us at privacy@ruvo.com or through the account settings in the app.
            </Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Cookies & Tracking</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              We use essential cookies to provide core functionality of our app. We do not use tracking cookies or share data with advertising networks. 
              Our analytics cookies are anonymized and used solely to improve our service.
            </Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Children's Privacy</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
              If you believe we have collected information from a child under 13, please contact us immediately.
            </Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Changes to This Policy</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page 
              and updating the "Last Updated" date. We encourage you to review this policy periodically.
            </Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Contact Us</Text>
            <Text style={[styles.paragraph, { color: colors.text.secondary }]}>
              If you have any questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={[styles.contactInfo, { color: colors.text.primary }]}>
              Email: privacy@ruvo.com{'\n'}
              Address: 123 Tech Street, San Francisco, CA 94107
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      <View style={{ height: 20, backgroundColor: colors.background.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Fonts.regular,
  },
  card: {
    backgroundColor: Colors.background.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.secondary,
    fontFamily: Fonts.regular,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginRight: 8,
    minWidth: 10,
  },
  bulletContent: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    marginTop: 8,
  },
});