import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Signal, Notification } from '@/types';
import { MOCK_SIGNALS, MOCK_NOTIFICATIONS } from '@/constants/mockData';
import { useCurrentUser, useSignalsForUser, useNotificationsForUser, useToggleLike, useToggleSave, useDismissSignal, useMarkNotificationAsRead, useAIPersonalizedNews, useNewsAPIPersonalized, useTopHeadlines, useUpdateInterests, useUpdateSources, useWebzioPersonalized, useUserSignalInteractions } from '@/lib/hooks';
import { NotificationGeneratorService } from '@/lib/notificationGeneratorService';
import { useAuthListener } from '@/lib/hooks';

type AppState = {
  user: UserProfile | null;
  signals: Signal[];
  notifications: Notification[];
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  echoControlEnabled: boolean;
  echoControlGrouping: 'source' | 'topic' | 'title' | 'keyword';
  customKeywords: string[];
  setEchoControlEnabled: (enabled: boolean) => void;
  setEchoControlGrouping: (grouping: 'source' | 'topic' | 'title' | 'keyword') => void;
  setCustomKeywords: (keywords: string[]) => void;
  setUser: (user: UserProfile | null) => void;
  updateUserInterests: (interests: string[]) => void;
  updateUserSources: (sources: string[]) => void;
  toggleSignalLike: (signalId: string) => void;
  toggleSignalSave: (signalId: string) => void;
  dismissSignal: (signalId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  completeOnboarding: (user: UserProfile) => void;
  refreshSignals: () => void;
};

export const [AppProvider, useApp] = createContextHook<AppState>(() => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSignals, setLocalSignals] = useState<Signal[]>(MOCK_SIGNALS);
  const [generatedNotifications, setGeneratedNotifications] = useState<Notification[]>([]);
  const [echoControlEnabled, setEchoControlEnabled] = useState<boolean>(true);
  const [echoControlGrouping, setEchoControlGrouping] = useState<'source' | 'topic' | 'title' | 'keyword'>('topic');
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  
  // Backend integration hooks
  const { data: backendUser, isLoading: userLoading, error: userError } = useCurrentUser();
  
  // Listen for auth state changes
  useAuthListener();
  
  // Convert backend User to UserProfile format
  const user: UserProfile | null = useMemo(() => {
    if (!backendUser) return null;
    return {
      id: backendUser.id,
      username: backendUser.username,
      email: backendUser.email,
      interests: backendUser.interests || [],
      sources: backendUser.sources || [],
      isPremium: backendUser.is_premium || false,
      language: (backendUser.language as 'en' | 'ko') || 'en',
      location: (backendUser as any).location,
      profileImage: (backendUser as any).profile_image,
    };
  }, [backendUser]);
  
  // Only fetch user interactions if we have a valid user ID
  const { data: userInteractions = {}, isLoading: interactionsLoading, error: interactionsError } = useUserSignalInteractions(user?.id || '');
  
  // Fetch real news using News API
  const userInterests = user?.interests || [];
  
  // Use News API to fetch personalized or top headlines
  const { data: newsApiSignals, isLoading: newsApiLoading, error: newsApiError } = userInterests.length > 0
    ? useNewsAPIPersonalized(userInterests)
    : useTopHeadlines('us');
  
  // Use Webz.io for additional news sources
  const { data: webzioSignals, isLoading: webzioLoading, error: webzioError } = useWebzioPersonalized(userInterests);
  
  // AI-Powered News (optional, if Gemini key is set)
  const userPreferences = {
    interests: userInterests,
    language: user?.language || 'en',
  };
  
  const { data: aiSignals, isLoading: aiLoading, error: aiError } = useAIPersonalizedNews(
    userPreferences,
    20
  );
  
  // Fallback chain: AI → News API → Database → Mock Data
  const { data: dbSignals, isLoading: dbLoading, error: dbError } = useSignalsForUser(user?.id || '', 20);
  
  // Combine multiple news sources and merge with user interactions
  const combinedSignals = useMemo(() => {
    // Handle errors gracefully
    if (aiError || newsApiError || webzioError || dbError) {
      console.warn('Data fetching errors:', { aiError, newsApiError, webzioError, dbError });
    }
    
    const allSignals = [
      ...(aiSignals || []),
      ...(newsApiSignals || []),
      ...(webzioSignals || []),
      ...(dbSignals || []),
    ];
    
    // Remove duplicates based on title similarity
    const unique = allSignals.filter((signal, index, self) =>
      index === self.findIndex((s) => 
        s.title.toLowerCase().trim() === signal.title.toLowerCase().trim()
      )
    );
    
    // Merge with user interactions from database
    const withUserState = unique.map(signal => {
      const interaction = userInteractions[signal.id];
      if (interaction) {
        // Signal has user interaction in database - use that state
        return {
          ...signal,
          liked: interaction.liked || false,
          saved: interaction.saved || false,
        };
      }
      // No interaction yet - default to false
      return {
        ...signal,
        liked: (signal as any).liked || false,
        saved: (signal as any).saved || false,
      };
    });
    
    // Sort by relevance score and timestamp
    return withUserState.sort((a, b) => {
      const scoreA = (a as any).relevanceScore || 0;
      const scoreB = (b as any).relevanceScore || 0;
      
      if (Math.abs(scoreA - scoreB) > 0.1) {
        return scoreB - scoreA;
      }
      
      const timestampA = (a as any).timestamp || (a as any).created_at;
      const timestampB = (b as any).timestamp || (b as any).created_at;
      const dateA = timestampA instanceof Date ? timestampA : new Date(timestampA);
      const dateB = timestampB instanceof Date ? timestampB : new Date(timestampB);
      return dateB.getTime() - dateA.getTime();
    });
  }, [aiSignals, newsApiSignals, webzioSignals, dbSignals, userInteractions, aiError, newsApiError, webzioError, dbError]);
  
  const signals = combinedSignals.length > 0 ? combinedSignals : localSignals;
  const signalsLoading = aiLoading || newsApiLoading || webzioLoading || dbLoading || interactionsLoading;
  
  const { data: dbNotifications = [], isLoading: notificationsLoading, error: notificationsError } = useNotificationsForUser(user?.id || '', 50);
  
  // Generate notifications based on user interests and signals
  useEffect(() => {
    async function generateNotifications() {
      if (!user || !user.interests || user.interests.length === 0) {
        console.log('No user or interests - skipping notification generation');
        return;
      }

      if (signals.length === 0) {
        console.log('No signals available - skipping notification generation');
        return;
      }

      try {
        // Import the notification integration helper
        const { generateInterestNotifications } = await import('@/lib/notificationIntegration');
        
        console.log(`Generating notifications for user: ${user.username}`);
        console.log(`User interests: ${user.interests.join(', ')}`);
        console.log(`Processing ${signals.length} signals`);
        
        const newNotifications = await generateInterestNotifications(user, signals as any);
        
        if (newNotifications.length > 0) {
          console.log(`✅ Generated ${newNotifications.length} new notifications!`);
          setGeneratedNotifications(newNotifications);
        } else {
          console.log('No matching notifications generated');
        }
      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    }

    generateNotifications();
  }, [user, signals]);
  
  // Combine generated notifications with database and mock notifications
  const notifications = useMemo(() => {
    // Handle notification errors gracefully
    if (notificationsError) {
      console.warn('Notifications error:', notificationsError);
    }
    
    const allNotifications: Notification[] = [
      ...generatedNotifications,
      ...dbNotifications,
      ...MOCK_NOTIFICATIONS,
    ];
    
    // Remove duplicates by ID
    const uniqueNotifications = allNotifications.filter(
      (notif, index, self) => index === self.findIndex(n => n.id === notif.id)
    );
    
    // Sort by timestamp (newest first)
    return uniqueNotifications.sort((a, b) => {
      const timestampA = (a as any).timestamp || (a as any).created_at;
      const timestampB = (b as any).timestamp || (b as any).created_at;
      const dateA = timestampA instanceof Date ? timestampA : new Date(timestampA);
      const dateB = timestampB instanceof Date ? timestampB : new Date(timestampB);
      return dateB.getTime() - dateA.getTime();
    });
  }, [generatedNotifications, dbNotifications, notificationsError]);
  
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  const dismissSignalMutation = useDismissSignal();
  const markNotificationReadMutation = useMarkNotificationAsRead();
  const updateInterestsMutation = useUpdateInterests();
  const updateSourcesMutation = useUpdateSources();

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      console.log('AppContext - Loading onboarding status:', onboardingComplete);
      if (onboardingComplete === 'true') {
        console.log('AppContext - User has completed onboarding');
        setHasCompletedOnboarding(true);
      } else {
        console.log('AppContext - User has not completed onboarding');
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = useCallback(async (newUser: UserProfile | null) => {
    // This is now handled by Supabase auth, but we keep it for compatibility
    console.log('User set:', newUser);
  }, []);

  const updateUserInterests = useCallback(async (interests: string[]) => {
    if (user?.id) {
      updateInterestsMutation.mutate({ userId: user.id, interests });
    }
  }, [user?.id, updateInterestsMutation]);

  const updateUserSources = useCallback(async (sources: string[]) => {
    if (user?.id) {
      updateSourcesMutation.mutate({ userId: user.id, sources });
    }
  }, [user?.id, updateSourcesMutation]);

  const toggleSignalLike = useCallback((signalId: string) => {
    console.log('🔄 Toggle Like called for signal:', signalId);
    
    // Optimistic update for local state
    setLocalSignals(prev => {
      const updated = prev.map(s => {
        if (s.id === signalId) {
          console.log('✅ Found signal in local, toggling liked from', s.liked, 'to', !s.liked);
          return { ...s, liked: !s.liked };
        }
        return s;
      });
      return updated;
    });
    
    // Update backend if user is logged in
    if (user?.id) {
      console.log('📡 Syncing like to backend for user:', user.id);
      toggleLikeMutation.mutate({ userId: user.id, signalId });
    } else {
      console.log('⚠️ No user logged in, only updating local state');
    }
  }, [user?.id, toggleLikeMutation]);

  const toggleSignalSave = useCallback((signalId: string) => {
    console.log('💾 Toggle Save called for signal:', signalId);
    
    // Optimistic update for local state
    setLocalSignals(prev => {
      const updated = prev.map(s => {
        if (s.id === signalId) {
          console.log('✅ Found signal in local, toggling saved from', s.saved, 'to', !s.saved);
          return { ...s, saved: !s.saved };
        }
        return s;
      });
      return updated;
    });
    
    // Update backend if user is logged in
    if (user?.id) {
      console.log('📡 Syncing save to backend for user:', user.id);
      toggleSaveMutation.mutate({ userId: user.id, signalId });
    } else {
      console.log('⚠️ No user logged in, only updating local state');
    }
  }, [user?.id, toggleSaveMutation]);

  const dismissSignal = useCallback((signalId: string) => {
    // Remove from local state
    setLocalSignals(prev => prev.filter(s => s.id !== signalId));
    
    // Update backend if user is logged in
    if (user?.id) {
      dismissSignalMutation.mutate({ userId: user.id, signalId });
    }
  }, [user?.id, dismissSignalMutation]);

  const markNotificationRead = useCallback((notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  }, [markNotificationReadMutation]);

  const completeOnboarding = useCallback(async (newUser: UserProfile) => {
    try {
      console.log('Completing onboarding and setting flag');
      await AsyncStorage.setItem('onboardingComplete', 'true');
      console.log('Onboarding flag set successfully');
      await setUser(newUser);
      setHasCompletedOnboarding(true);
      console.log('Onboarding completion status updated in context');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, [setUser]);

  const refreshSignals = useCallback(() => {
    // Refresh AI news or reset to mock data
    if (combinedSignals.length === 0) {
      setLocalSignals([...MOCK_SIGNALS]);
    }
    console.log('Refreshing signals...');
  }, [combinedSignals]);

  const combinedIsLoading = isLoading || userLoading || signalsLoading || notificationsLoading;

  // Add error handling for the entire context
  useEffect(() => {
    if (userError) {
      console.error('User context error:', userError);
    }
    if (interactionsError) {
      console.error('Interactions error:', interactionsError);
    }
    if (newsApiError) {
      console.error('News API error:', newsApiError);
    }
    if (webzioError) {
      console.error('Webz.io error:', webzioError);
    }
    if (aiError) {
      console.error('AI service error:', aiError);
    }
    if (dbError) {
      console.error('Database error:', dbError);
    }
    if (notificationsError) {
      console.error('Notifications error:', notificationsError);
    }
  }, [userError, interactionsError, newsApiError, webzioError, aiError, dbError, notificationsError]);

  return useMemo(() => ({
    user,
    signals: signals as Signal[],
    notifications: notifications as Notification[],
    hasCompletedOnboarding,
    isLoading: combinedIsLoading,
    echoControlEnabled,
    echoControlGrouping,
    customKeywords,
    setEchoControlEnabled,
    setEchoControlGrouping,
    setCustomKeywords,
    setUser,
    updateUserInterests,
    updateUserSources,
    toggleSignalLike,
    toggleSignalSave,
    dismissSignal,
    markNotificationRead,
    completeOnboarding,
    refreshSignals,
  }), [
    user,
    signals,
    notifications,
    hasCompletedOnboarding,
    combinedIsLoading,
    echoControlEnabled,
    echoControlGrouping,
    customKeywords,
    setUser,
    updateUserInterests,
    updateUserSources,
    toggleSignalLike,
    toggleSignalSave,
    dismissSignal,
    markNotificationRead,
    completeOnboarding,
    refreshSignals,
  ]);
});