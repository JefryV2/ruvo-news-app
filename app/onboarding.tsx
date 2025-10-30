import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { INTERESTS } from '@/constants/mockData';
import LocationPermissionScreen from '@/components/LocationPermissionScreen';
import { GeolocationService } from '@/lib/geolocationService';

type OnboardingStep = 'welcome' | 'location' | 'interests' | 'subcategories' | 'custom' | 'alerts' | 'complete';

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<{ [key: string]: string[] }>({});
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [expandedInterest, setExpandedInterest] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0.3));

  React.useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, [currentStep, fadeAnim]);

  React.useEffect(() => {
    // Continuous pulsating animation
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

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleSubcategory = (interestId: string, subcategory: string) => {
    setSelectedSubcategories((prev) => {
      const current = prev[interestId] || [];
      const updated = current.includes(subcategory)
        ? current.filter((s) => s !== subcategory)
        : [...current, subcategory];
      return { ...prev, [interestId]: updated };
    });
  };

  const addCustomInterest = () => {
    if (customInputValue.trim() && !customInterests.includes(customInputValue.trim())) {
      setCustomInterests((prev) => [...prev, customInputValue.trim()]);
      setCustomInputValue('');
    }
  };

  const removeCustomInterest = (interest: string) => {
    setCustomInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      setCurrentStep('interests');
    } else if (currentStep === 'interests' && selectedInterests.length > 0) {
      setCurrentStep('subcategories');
    } else if (currentStep === 'subcategories') {
      setCurrentStep('custom');
    } else if (currentStep === 'custom') {
      setCurrentStep('alerts');
    } else if (currentStep === 'alerts') {
      setCurrentStep('complete');
    } else if (currentStep === 'complete') {
      completeOnboarding({
        id: '1',
        username: 'User',
        email: 'user@ruvo.app',
        interests: selectedInterests,
        sources: [],
        isPremium: false,
        language: 'en',
        location: userLocation,
      });
      router.replace('/(tabs)/feed');
    }
  };

  const handleSkip = () => {
    completeOnboarding({
      id: '1',
      username: 'User',
      email: 'user@ruvo.app',
      interests: selectedInterests,
      sources: [],
      isPremium: false,
      language: 'en',
      location: userLocation,
    });
    router.replace('/(tabs)/feed');
  };

  const handleLocationPermission = (location: any) => {
    setUserLocation(location);
    setCurrentStep('interests');
  };

  const handleLocationSkip = () => {
    setCurrentStep('interests');
  };

  const canProceed = () => {
    if (currentStep === 'welcome') return true;
    if (currentStep === 'location') return true; // Handled by LocationPermissionScreen
    if (currentStep === 'interests') return selectedInterests.length > 0;
    if (currentStep === 'subcategories') return true; // Optional
    if (currentStep === 'custom') return true; // Optional
    return true;
  };

  // Sub-categories for each interest
  const getSubcategories = (interestId: string): string[] => {
    const subcategoriesMap: { [key: string]: string[] } = {
      '1': ['AI/ML', 'Cybersecurity', 'Blockchain', 'Mobile Apps', 'Web Dev', 'Hardware', 'Cloud'],
      '2': ['Stocks', 'Crypto', 'Real Estate', 'Personal Finance', 'Economics', 'Banking'],
      '3': ['K-Pop', 'Hip-Hop', 'R&B', 'Indie', 'Pop', 'Electronic'],
      '4': ['Concerts', 'Festivals', 'Markets', 'Sports Events', 'Community', 'Exhibitions'],
      '5': ['Space', 'Physics', 'Biology', 'Chemistry', 'Environment', 'Research'],
      '6': ['Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 'F1', 'MMA'],
      '7': ['Recipes', 'Restaurants', 'Cuisines', 'Food News', 'Cooking Tips'],
      '8': ['Destinations', 'Travel Tips', 'Adventure', 'Luxury Travel', 'Budget Travel'],
      '9': ['PC Gaming', 'Console', 'Mobile Games', 'Esports', 'Game Dev', 'Reviews'],
      '10': ['Streetwear', 'Haute Couture', 'Sustainable Fashion', 'Trends', 'Beauty'],
      '11': ['Fitness', 'Nutrition', 'Mental Health', 'Wellness', 'Medical News'],
      '12': ['Rock', 'Jazz', 'Classical', 'EDM', 'Country', 'Blues', 'Folk'],
    };
    return subcategoriesMap[interestId] || [];
  };

  const renderWelcome = () => (
    <View style={styles.welcomeFullScreen}>
      <View style={styles.websiteBackground}>
        {/* Animated Gradient Orbs - Matching Website */}
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
            colors={['rgba(93, 202, 218, 0.4)', 'rgba(93, 202, 218, 0.2)', 'rgba(93, 202, 218, 0)']}  
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
                outputRange: [0.5, 0.8],
              }),
            },
          ]} 
        >
          <LinearGradient
            colors={['rgba(127, 234, 255, 0.5)', 'rgba(127, 234, 255, 0.3)', 'rgba(127, 234, 255, 0)']}  
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.gradientOrb3,
            {
              transform: [{ scale: pulseAnim.interpolate({
                inputRange: [1, 1.3],
                outputRange: [1, 1.3],
              })}],
              opacity: glowAnim.interpolate({
                inputRange: [0.3, 0.6],
                outputRange: [0.3, 0.6],
              }),
            },
          ]} 
        >
          <LinearGradient
            colors={['rgba(0, 191, 255, 0.6)', 'rgba(0, 191, 255, 0.4)', 'rgba(0, 191, 255, 0)']}  
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View style={[styles.websiteContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Main Content - Centered like website */}
          <View style={styles.websiteMainContent}>
            <Text style={styles.ruvoHeading}>RUVO</Text>
            <Text style={styles.websiteTagline}>Cut the Noise. Catch the Signal.</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );

  const renderSubcategories = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.interestsTitle}>Refine your interests</Text>
      <Text style={styles.interestsSubtitle}>Choose specific topics you care about (optional)</Text>
      
      <ScrollView style={styles.interestsScroll} showsVerticalScrollIndicator={false}>
        {selectedInterests.map((interestId) => {
          const interest = INTERESTS.find((i) => i.id === interestId);
          const subcategories = getSubcategories(interestId);
          
          if (!interest || subcategories.length === 0) return null;
          
          return (
            <View key={interestId} style={styles.subcategorySection}>
              <View style={styles.subcategoryHeader}>
                <Text style={styles.subcategoryEmoji}>{interest.emoji}</Text>
                <Text style={styles.subcategoryTitle}>{interest.name}</Text>
              </View>
              
              <View style={styles.subcategoriesGrid}>
                {subcategories.map((sub) => {
                  const isSelected = selectedSubcategories[interestId]?.includes(sub);
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.subcategoryChip, isSelected && styles.subcategoryChipActive]}
                      onPress={() => toggleSubcategory(interestId, sub)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.subcategoryText, isSelected && styles.subcategoryTextActive]}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </Animated.View>
  );

  const renderCustom = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.interestsTitle}>Your unique interests</Text>
        <Text style={styles.interestsSubtitle}>Add any topics we might have missed</Text>
        
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="e.g., Sustainable Living, Podcasts, Photography..."
            placeholderTextColor={Colors.text.tertiary}
            value={customInputValue}
            onChangeText={setCustomInputValue}
            onSubmitEditing={addCustomInterest}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, !customInputValue.trim() && styles.addButtonDisabled]}
            onPress={addCustomInterest}
            disabled={!customInputValue.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.customInterestsScroll} showsVerticalScrollIndicator={false}>
          {customInterests.length > 0 ? (
            <View style={styles.customInterestsGrid}>
              {customInterests.map((interest, index) => (
                <View key={index} style={styles.customInterestChip}>
                  <Text style={styles.customInterestText}>{interest}</Text>
                  <TouchableOpacity
                    onPress={() => removeCustomInterest(interest)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCustomState}>
              <Text style={styles.emptyCustomText}>💡</Text>
              <Text style={styles.emptyCustomSubtext}>No custom interests yet</Text>
              <Text style={styles.emptyCustomHint}>Add topics that matter to you</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );

  const renderInterests = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.interestsTitle}>What interests you?</Text>
      <Text style={styles.interestsSubtitle}>Pick your topics. We'll handle the rest.</Text>
      
      <ScrollView style={styles.interestsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.interestsGrid}>
          {INTERESTS.map((interest) => {
            const active = selectedInterests.includes(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                activeOpacity={0.8}
                style={[styles.interestCard, active && styles.interestCardActive]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Image 
                  source={{ uri: interest.imageUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop' }}
                  style={styles.interestImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                  style={styles.interestGradient}
                />
                <View style={styles.interestContent}>
                  <Text style={[styles.interestName, active && styles.interestNameActive]}>{interest.name}</Text>
                </View>
                {active && (
                  <View style={styles.interestCheckmark}>
                    <Check size={18} color={Colors.text.inverse} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderAlerts = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.alertsTitle}>Stay informed</Text>
      <Text style={styles.alertsSubtitle}>Only get notified about what matters</Text>
      
      <View style={styles.notificationOptions}>
        <View style={styles.notificationCard}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Push Notifications</Text>
            <Text style={styles.notificationDesc}>Get timely updates on your curated feed</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setPushEnabled(!pushEnabled)} 
            activeOpacity={0.8} 
            style={[styles.modernToggle, pushEnabled && styles.modernToggleOn]}
          >
            <View style={[styles.modernKnob, pushEnabled && styles.modernKnobOn]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationCard}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Daily Digest</Text>
            <Text style={styles.notificationDesc}>Morning summary of your top stories</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.modernToggle, styles.modernToggleOn]}
          >
            <View style={[styles.modernKnob, styles.modernKnobOn]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationCard}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Breaking News</Text>
            <Text style={styles.notificationDesc}>Urgent updates on major events</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.modernToggle, styles.modernToggleOn]}
          >
            <View style={[styles.modernKnob, styles.modernKnobOn]} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💡 You can adjust these anytime in Settings</Text>
      </View>
    </Animated.View>
  );

  const renderComplete = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.completeScrollContent}>
        <View style={styles.completeIconContainer}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.completeLogoImage}
            resizeMode="contain"
          />
          <View style={styles.checkmarkBadge}>
            <Check size={20} color={Colors.text.inverse} strokeWidth={3} />
          </View>
        </View>
        <Text style={styles.readyText}>READY</Text>
        <Text style={styles.welcomeTitle}>You're All Set</Text>
        <Text style={styles.welcomeSubtitle}>Curating your feed based on {selectedInterests.length} interests</Text>
        
        <View style={styles.featuresRow}>
          <View style={styles.featureDot}>
            <Text style={styles.featureLabel}>Curated</Text>
          </View>
          <View style={styles.featureDot}>
            <Text style={styles.featureLabel}>Smart</Text>
          </View>
          <View style={styles.featureDot}>
            <Text style={styles.featureLabel}>Fast</Text>
          </View>
        </View>
        
        <View style={styles.askRuvoTip}>
          <View style={styles.askRuvoIconWrapper}>
            <Sparkles size={22} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.askRuvoTitle}>Ask Ruvo Anything</Text>
          <Text style={styles.askRuvoDescription}>
            Create smart alerts by simply asking. For example:
          </Text>
          <View style={styles.askRuvoExamples}>
            <Text style={styles.exampleText}>"Notify me about BTS news"</Text>
            <Text style={styles.exampleText}>"Alert me on Apple releases"</Text>
            <Text style={styles.exampleText}>"Track Tesla earnings"</Text>
          </View>
        </View>
        
        <Text style={styles.welcomeFooterText}>Welcome to mindful information</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome();
      case 'location':
        return (
          <LocationPermissionScreen
            onPermissionGranted={handleLocationPermission}
            onSkip={handleLocationSkip}
          />
        );
      case 'interests':
        return renderInterests();
      case 'subcategories':
        return renderSubcategories();
      case 'custom':
        return renderCustom();
      case 'alerts':
        return renderAlerts();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, currentStep === 'welcome' && styles.containerDark]}>
      <StatusBar 
        barStyle={currentStep === 'welcome' ? 'light-content' : 'dark-content'} 
        translucent 
        backgroundColor="transparent"
      />
      {currentStep !== 'welcome' && (
        <View style={styles.topBar}>
          <View style={styles.progressDots}>
            {['location', 'interests', 'subcategories', 'custom', 'alerts', 'complete'].map((step, index) => (
              <View 
                key={step} 
                style={[
                  styles.progressDot,
                  ['location', 'interests', 'subcategories', 'custom', 'alerts', 'complete'].indexOf(currentStep) >= index && styles.progressDotActive
                ]} 
              />
            ))}
          </View>
          {currentStep !== 'complete' && (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.8}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {currentStep === 'welcome' ? (
        <>
          {renderCurrentStep()}
          <View style={styles.welcomeFooter}>
        <TouchableOpacity 
          style={[
            currentStep === 'welcome' ? styles.getStartedButton : styles.continueButton,
            !canProceed() && styles.continueButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.8}
        >
          <Text style={currentStep === 'welcome' ? styles.getStartedButtonText : styles.continueButtonText}>
            {currentStep === 'welcome' ? 'Get Started' : currentStep === 'complete' ? 'Start Exploring' : 'Continue'}
          </Text>
        </TouchableOpacity>
          </View>
        </>
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>{renderCurrentStep()}</View>
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {currentStep === 'complete' ? 'Start Exploring' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.lighter,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: Colors.text.primary,
  },
  skipText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
  },
  
  // Interests Step
  interestsTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  interestsSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  interestsScroll: {
    flex: 1,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  interestCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.border.lighter,
    overflow: 'hidden',
    position: 'relative',
  },
  interestCardActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  interestImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  interestGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  interestContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  interestEmoji: {
    fontSize: 40,
  },
  interestName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  interestNameActive: {
    fontWeight: '700',
    fontSize: 19,
  },
  interestCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Alerts Step
  alertsTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  alertsSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 32,
  },
  notificationOptions: {
    gap: 16,
    marginBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 20,
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  modernToggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: Colors.border.light,
    padding: 2,
    justifyContent: 'center',
  },
  modernToggleOn: {
    backgroundColor: Colors.text.primary,
  },
  modernKnob: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: Colors.background.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modernKnobOn: {
    alignSelf: 'flex-end',
  },
  infoBox: {
    backgroundColor: 'rgba(32, 178, 170, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Complete Step
  completeIconContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  completeLogoImage: {
    width: 100,
    height: 100,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  readyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Fonts.bold,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 40,
  },
  featureDot: {
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  welcomeFooterText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
  },
  completeScrollContent: {
    paddingBottom: 20,
  },
  askRuvoTip: {
    backgroundColor: Colors.background.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 2,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  askRuvoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  askRuvoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  askRuvoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  askRuvoDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  askRuvoExamples: {
    gap: 6,
    alignItems: 'center',
  },
  exampleText: {
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Welcome Screen - Website Style
  welcomeFullScreen: {
    flex: 1,
  },
  websiteBackground: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientOrb1: {
    position: 'absolute',
    width: 400,
    height: 400,
    top: -150,
    left: -100,
  },
  gradientOrb2: {
    position: 'absolute',
    width: 450,
    height: 450,
    bottom: -150,
    right: -100,
  },
  gradientOrb3: {
    position: 'absolute',
    width: 350,
    height: 350,
    top: '40%',
    left: '30%',
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  websiteContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  websiteMainContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ruvoHeading: {
    fontSize: 80,
    fontWeight: '300',
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Fonts.regular,
    letterSpacing: 8,
  },
  websiteTagline: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '300',
    fontFamily: Fonts.regular,
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  welcomeFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 48,
  },
  continueButton: {
    backgroundColor: Colors.text.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  getStartedButton: {
    backgroundColor: Colors.accent,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },

  // Subcategories Step
  subcategorySection: {
    marginBottom: 32,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  subcategoryEmoji: {
    fontSize: 28,
  },
  subcategoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
  },
  subcategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subcategoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.background.secondary,
  },
  subcategoryChipActive: {
    backgroundColor: Colors.text.primary,
    borderColor: Colors.text.primary,
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  subcategoryTextActive: {
    color: Colors.text.inverse,
  },

  // Custom Interests Step
  customInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  customInput: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 2,
    borderColor: Colors.background.secondary,
  },
  addButton: {
    backgroundColor: Colors.text.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  customInterestsScroll: {
    flex: 1,
  },
  customInterestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  customInterestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  customInterestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  removeButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    opacity: 0.6,
  },
  emptyCustomState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCustomText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCustomSubtext: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  emptyCustomHint: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
});
