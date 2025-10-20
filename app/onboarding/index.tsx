import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Cpu, DollarSign, Music, Newspaper, FlaskConical, Dumbbell, Utensils, Plane, Gamepad2, Shirt, HeartPulse, Guitar, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { INTERESTS, SOURCES } from '@/constants/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import RuvoButton from '@/components/RuvoButton';

type OnboardingStep = 'welcome' | 'interests' | 'alerts' | 'complete';

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  React.useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [currentStep, fadeAnim]);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('interests');
    } else if (currentStep === 'interests' && selectedInterests.length > 0) {
      setCurrentStep('alerts');
    } else if (currentStep === 'alerts') {
      setCurrentStep('complete');
    } else if (currentStep === 'complete') {
      completeOnboarding({
        id: '1',
        username: 'User',
        email: 'user@ruvo.app',
        interests: selectedInterests,
        sources: selectedSources,
        isPremium: false,
        language: 'en',
      });
      router.replace('/feed');
    }
  };

  const handleBack = () => {
    if (currentStep === 'welcome') {
      router.back();
      return;
    }
    if (currentStep === 'interests') setCurrentStep('welcome');
    if (currentStep === 'alerts') setCurrentStep('interests');
    if (currentStep === 'complete') setCurrentStep('alerts');
  };

  const handleSkip = () => {
    completeOnboarding({
      id: '1',
      username: 'User',
      email: 'user@ruvo.app',
      interests: selectedInterests,
      sources: selectedSources,
      isPremium: false,
      language: 'en',
    });
    router.replace('/feed');
  };

  const canProceed = () => {
    if (currentStep === 'interests') return selectedInterests.length > 0;
    if (currentStep === 'sources') return selectedSources.length > 0;
    return true;
  };

  const renderWelcome = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Sparkles size={48} color={Colors.primary} />
        </View>
      </View>
      <Text style={styles.heroTitle}>RUVO</Text>
      <Text style={styles.heroTagline}>Cut the Noise. Catch the Signal.</Text>
      <Text style={styles.heroSubtitle}>Get personalized news that matters to you, delivered in real-time.</Text>
      <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>AI‑Powered Curation</Text></View>
      <Text style={styles.heroHelper}>Personalized updates delivered instantly</Text>
    </Animated.View>
  );

  const renderInterests = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
      <Text style={styles.stepTitle}>What’s on your mind?</Text>
      <Text style={styles.stepSubtitle}>Your selections won’t limit access to any features.</Text>
      <View style={styles.pillList}>
        {INTERESTS.map((interest) => {
          const active = selectedInterests.includes(interest.id);
          const scale = new Animated.Value(1);
          const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
          const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 10 }).start();
          const Icon = getInterestIcon(interest.name);
          return (
            <Animated.View key={interest.id} style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={pressIn}
                onPressOut={pressOut}
                style={[styles.pillRow, active && styles.pillRowActive]}
                onPress={() => toggleInterest(interest.id)}
              >
                <View style={[styles.pillIcon, active && styles.pillIconActive]}>
                  <Icon size={18} color={active ? Colors.text.inverse : Colors.text.light} />
                </View>
                <View style={styles.pillContent}>
                  <Text style={[styles.pillTitle, active && styles.pillTitleActive]}>{interest.name}</Text>
                  {active && <Text numberOfLines={2} style={styles.pillSubtitle}>We’ll prioritize high‑quality updates on {interest.name.toLowerCase()} and cut the noise.</Text>}
                </View>
                {active && (
                  <View style={styles.pillCheck}>
                    <Check size={16} color={Colors.text.inverse} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderAlerts = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
      <Text style={styles.stepTitle}>Stay in the loop</Text>
      <Text style={styles.stepSubtitle}>Get real‑time alerts for what matters most</Text>
      <View style={styles.sampleCard}>
        <View style={styles.sampleIcon}><Text>🔔</Text></View>
        <View style={styles.sampleContent}>
          <Text style={styles.sampleTitle}>Breaking News</Text>
          <Text style={styles.sampleDesc}>New AI breakthrough announced today</Text>
          <Text style={styles.sampleTime}>Just now</Text>
        </View>
      </View>
      <View style={styles.sampleCardMuted}>
        <View style={styles.sampleIcon}><Text>🔔</Text></View>
        <View style={styles.sampleContent}>
          <Text style={styles.sampleTitle}>Market Update</Text>
          <Text style={styles.sampleDesc}>Tech stocks surge on earnings report</Text>
          <Text style={styles.sampleTime}>2 min ago</Text>
        </View>
      </View>
      <View style={styles.pushRow}>
        <View>
          <Text style={styles.pushTitle}>Push Notifications</Text>
          <Text style={styles.pushDesc}>Get alerts instantly on your device</Text>
        </View>
        <TouchableOpacity onPress={() => setPushEnabled(!pushEnabled)} activeOpacity={0.8} style={[styles.toggle, pushEnabled && styles.toggleOn]}>
          <View style={[styles.knob, pushEnabled && styles.knobOn]} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderComplete = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Sparkles size={48} color={Colors.primary} />
        </View>
      </View>
      <Text style={styles.title}>All Set!</Text>
      <Text style={styles.subtitle}>
        Your personalized feed is ready
      </Text>
      <Text style={styles.description}>
        {`We've curated ${selectedInterests.length} topics from ${selectedSources.length} trusted sources just for you.`}
      </Text>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome();
      case 'interests':
        return renderInterests();
      case 'sources':
        return renderSources();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  const getProgress = () => {
    const steps: OnboardingStep[] = ['welcome', 'interests', 'sources', 'complete'];
    return (steps.indexOf(currentStep) + 1) / steps.length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bgGradient}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.8} style={styles.topBarButton}>
            <Text style={styles.topBarText}>{currentStep === 'welcome' ? 'Back' : 'Back'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.8} style={styles.topBarButton}>
            <Text style={styles.topBarText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
        </View>
        <View style={styles.content}>{
          currentStep === 'alerts' ? renderAlerts() : renderCurrentStep()
        }</View>
        <View style={styles.footer}>
          <RuvoButton
            title={currentStep === 'complete' ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            disabled={!canProceed()}
            style={{ opacity: canProceed() ? 1 : 0.6 }}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  bgGradient: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  topBarButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)'
  },
  topBarText: {
    color: Colors.text.inverse,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border.light,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800' as const,
    fontFamily: Fonts.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '400' as const,
    fontFamily: Fonts.regular,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: Colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 24,
  },
  heroBadge: {
    alignSelf: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  heroBadgeText: {
    color: Colors.text.inverse,
    fontWeight: '700' as const,
    fontFamily: Fonts.bold,
  },
  heroHelper: {
    marginTop: 10,
    textAlign: 'center',
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  // Alerts step styles
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.white,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  sampleCardMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.secondary,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  sampleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.secondary, marginRight: 12 },
  sampleContent: { flex: 1 },
  sampleTitle: { fontWeight: '800' as const, color: Colors.text.primary },
  sampleDesc: { color: Colors.text.light, marginTop: 4 },
  sampleTime: { color: Colors.text.tertiary, marginTop: 2, fontSize: 12 },
  pushRow: {
    marginTop: 16,
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    backgroundColor: Colors.card.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pushTitle: { fontWeight: '800' as const, color: Colors.text.primary },
  pushDesc: { color: Colors.text.light, marginTop: 4 },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border.primary,
    padding: 3,
  },
  toggleOn: { backgroundColor: Colors.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.card.white },
  knobOn: { marginLeft: 20 },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text.light,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.text.gray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text.light,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.text.gray,
    marginBottom: 32,
  },
  pillList: {
    gap: 10,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.card.white,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    gap: 12,
  },
  pillRowActive: {
    backgroundColor: Colors.text.primary,
    borderColor: Colors.text.primary,
  },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card.secondary,
  },
  pillIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pillContent: {
    flex: 1,
  },
  pillTitle: {
    color: Colors.text.light,
    fontWeight: '700' as const,
  },
  pillTitleActive: {
    color: Colors.text.inverse,
  },
  pillSubtitle: {
    marginTop: 4,
    color: Colors.text.secondary,
  },
  pillCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.light,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  sourcesContainer: {
    gap: 12,
  },
  sourceItem: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  sourceItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: Colors.primary,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.light,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  footer: {
    padding: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});


