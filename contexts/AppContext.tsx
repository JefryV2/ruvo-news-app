import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Signal, Notification } from '@/types';
import { MOCK_SIGNALS, MOCK_NOTIFICATIONS } from '@/constants/mockData';
import { useCurrentUser, useSignalsForUser, useNotificationsForUser, useToggleLike, useToggleSave, useDismissSignal, useMarkNotificationAsRead, useDeleteNotification, useAIPersonalizedNews, useNewsAPIPersonalized, useTopHeadlines, useUpdateInterests, useUpdateSources, useWebzioPersonalized, useUserSignalInteractions } from '@/lib/hooks';
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
  deleteNotification: (notificationId: string) => void;
  completeOnboarding: (user: UserProfile) => void;
  refreshSignals: () => void;
  generateTestNotifications: () => void;
  generateDelayedTestNotifications: (delayMs?: number) => void;
  addTestNotifications: (testNotifications: Notification[]) => void;
  clearGeneratedNotifications: () => void;
};

export const [AppProvider, useApp] = createContextHook<AppState>(() => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSignals, setLocalSignals] = useState<Signal[]>(MOCK_SIGNALS);
  const [generatedNotifications, setGeneratedNotifications] = useState<Notification[]>([]);
  
  // Add effect to log when generatedNotifications changes
  useEffect(() => {
    console.log('generatedNotifications updated:', generatedNotifications);
  }, [generatedNotifications]);
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
    
    const userProfile = {
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
    
    console.log('User profile:', userProfile);
    return userProfile;
  }, [backendUser]);
  
  // Only fetch user interactions if we have a valid user ID
  const { data: userInteractions = {}, isLoading: interactionsLoading, error: interactionsError } = useUserSignalInteractions(user?.id || '');
  
  // Fetch real news using News API
  const userInterests = user?.interests || [];
  
  // Use News API to fetch personalized or top headlines
  const { data: newsApiSignals, isLoading: newsApiLoading, error: newsApiError } = useNewsAPIPersonalized(userInterests);
  const { data: topHeadlinesSignals, isLoading: topHeadlinesLoading, error: topHeadlinesError } = useTopHeadlines('us');
  
  // Select which data to use based on user interests
  const selectedNewsApiSignals = useMemo(() => {
    return userInterests.length > 0 ? newsApiSignals : topHeadlinesSignals;
  }, [userInterests, newsApiSignals, topHeadlinesSignals]);
  
  const selectedNewsApiLoading = useMemo(() => {
    return userInterests.length > 0 ? newsApiLoading : topHeadlinesLoading;
  }, [userInterests, newsApiLoading, topHeadlinesLoading]);
  
  const selectedNewsApiError = useMemo(() => {
    return userInterests.length > 0 ? newsApiError : topHeadlinesError;
  }, [userInterests, newsApiError, topHeadlinesError]);
  
  // Use Webz.io for additional news sources
  const { data: webzioSignals, isLoading: webzioLoading, error: webzioError } = useWebzioPersonalized(userInterests);
  
  // AI-Powered News (optional, if Gemini key is set)
  const userPreferences = {
    interests: userInterests,
    language: user?.language || 'en',
  };
  
  // Call both hooks unconditionally
  const { data: aiSignals, isLoading: aiLoading, error: aiError } = useAIPersonalizedNews(
    userPreferences,
    20
  );
  const { data: fallbackAiSignals, isLoading: fallbackAiLoading, error: fallbackAiError } = useAIPersonalizedNews(
    { ...userPreferences, interests: [] },
    20
  );
  
  // Select which AI data to use based on user interests
  const selectedAiSignals = useMemo(() => {
    return userInterests.length > 0 ? aiSignals : fallbackAiSignals;
  }, [userInterests, aiSignals, fallbackAiSignals]);
  
  const selectedAiLoading = useMemo(() => {
    return userInterests.length > 0 ? aiLoading : fallbackAiLoading;
  }, [userInterests, aiLoading, fallbackAiLoading]);
  
  const selectedAiError = useMemo(() => {
    return userInterests.length > 0 ? aiError : fallbackAiError;
  }, [userInterests, aiError, fallbackAiError]);

  // Fallback chain: AI → News API → Database → Mock Data
  const { data: dbSignals, isLoading: dbLoading, error: dbError } = useSignalsForUser(user?.id || '', 20);
  
  // Combine multiple news sources and merge with user interactions
  const combinedSignals = useMemo(() => {
    console.log(`Combining signals from multiple sources. AI: ${selectedAiSignals?.length || 0}, NewsAPI: ${selectedNewsApiSignals?.length || 0}, Webz.io: ${webzioSignals?.length || 0}, DB: ${dbSignals?.length || 0}`);
    // Handle errors gracefully
    if (selectedAiError || selectedNewsApiError || webzioError || dbError) {
      console.warn('Data fetching errors:', { selectedAiError, selectedNewsApiError, webzioError, dbError });
    }
    
    const allSignals = [
      ...(selectedAiSignals || []),
      ...(selectedNewsApiSignals || []),
      ...(webzioSignals || []),
      ...(dbSignals || []),
    ];
    
    // Remove duplicates based on title similarity
    const unique = allSignals.filter((signal, index, self) =>
      index === self.findIndex((s) => 
        s.title.toLowerCase().trim() === signal.title.toLowerCase().trim()
      )
    );
    
    // Merge with user interactions from database and ensure consistent Signal interface
    const withUserState = unique.map((signal: any) => {
      const interaction = userInteractions[signal.id];
      
      // Normalize signal to ensure it conforms to Signal interface
      const normalizedSignal: Signal = {
        id: signal.id,
        title: signal.title,
        summary: signal.summary,
        content: signal.content,
        sourceId: signal.sourceId || signal.source_id || signal.source_url || '',
        sourceName: signal.sourceName || signal.source_name || signal.source || '',
        verified: signal.verified || false,
        tags: signal.tags || [],
        url: signal.url || signal.link || signal.article_url || '',
        relevanceScore: signal.relevanceScore || signal.relevance_score || 0,
        timestamp: signal.timestamp || signal.created_at || signal.publishedAt || new Date(),
        imageUrl: signal.imageUrl || signal.image_url || signal.image || undefined,
        saved: interaction?.saved || signal.saved || false,
        liked: interaction?.liked || signal.liked || false,
      };
      
      return normalizedSignal;
    });
    
    // Sort by relevance score and timestamp
    const sortedSignals = withUserState.sort((a, b) => {
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
    
    console.log(`Final combined signals count: ${sortedSignals.length}`);
    if (sortedSignals.length > 0) {
      console.log(`First signal ID: ${sortedSignals[0].id}, relevance score: ${(sortedSignals[0] as any).relevanceScore}`);
    }
    
    return sortedSignals;
  }, [selectedAiSignals, selectedNewsApiSignals, webzioSignals, dbSignals, userInteractions, selectedAiError, selectedNewsApiError, webzioError, dbError]);
  
  const signals = combinedSignals.length > 0 ? combinedSignals : localSignals;
  const signalsLoading = selectedAiLoading || selectedNewsApiLoading || webzioLoading || dbLoading || interactionsLoading;
  
  const { data: dbNotifications = [], isLoading: notificationsLoading, error: notificationsError } = useNotificationsForUser(user?.id || '', 50);
  
  console.log(`DB notifications loaded: ${dbNotifications.length}`, dbNotifications);
  
  // Generate notifications based on user interests and signals
  // But limit frequency to prevent notification spam
  useEffect(() => {
    async function generateNotifications() {
      console.log('Starting notification generation process');
      
      if (!user) {
        console.log('No user - skipping notification generation');
        return;
      }
      
      if (!user.interests || user.interests.length === 0) {
        console.log('No user interests - skipping notification generation');
        return;
      }

      if (signals.length === 0) {
        console.log('No signals available - skipping notification generation');
        return;
      }

      console.log(`User ${user.username} has ${user.interests.length} interests and ${signals.length} signals available`);

      // Limit notification generation to once per hour to reduce clutter
      const lastNotificationTime = await AsyncStorage.getItem('last_notification_generation_time');
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in milliseconds
      
      if (lastNotificationTime && parseInt(lastNotificationTime) > oneHourAgo) {
        console.log('Skipping notification generation - too soon since last generation');
        return;
      }

      try {
        // Import the notification integration helper
        const { generateInterestNotifications, filterSignalsByInterests } = await import('@/lib/notificationIntegration');
        
        console.log(`Generating personalized notifications for user: ${user.username}`);
        console.log(`User interests: ${user.interests.join(', ')}`);
        
        // Filter signals to only the most relevant ones based on user interests
        const relevantSignals = filterSignalsByInterests(signals as any, user.interests);
        console.log(`Processing ${relevantSignals.length} relevant signals (from ${signals.length} total)`);
        
        // Only generate notifications if we have highly relevant signals
        if (relevantSignals.length > 0) {
          console.log(`Attempting to generate notifications from ${relevantSignals.length} relevant signals`);
          const newNotifications = await generateInterestNotifications(user, relevantSignals);
          
          if (newNotifications.length > 0) {
            console.log(`✅ Generated ${newNotifications.length} personalized notifications!`);
            console.log('Generated notifications:', newNotifications);
            setGeneratedNotifications(newNotifications);
            
            // Store the last notification generation time
            await AsyncStorage.setItem('last_notification_generation_time', Date.now().toString());
          } else {
            console.log('No personalized notifications generated for current signals');
          }
        } else {
          console.log('No relevant signals found for notification generation');
        }
      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    }

    generateNotifications();
  }, [user, signals]);
  
  // Combine generated notifications with database notifications (excluding mock notifications)
  const notifications = useMemo(() => {
    console.log(`Combining notifications. Generated: ${generatedNotifications.length}, DB: ${dbNotifications.length}`);
    
    // Handle notification errors gracefully
    if (notificationsError) {
      console.warn('Notifications error:', notificationsError);
    }
    
    const allNotifications: Notification[] = [
      ...generatedNotifications,
      ...dbNotifications,
    ];
    
    console.log(`Total notifications before deduplication: ${allNotifications.length}`);
    
    // Remove duplicates by ID
    const uniqueNotifications = allNotifications.filter(
      (notif, index, self) => index === self.findIndex(n => n.id === notif.id)
    );
    
    console.log(`Total notifications after deduplication: ${uniqueNotifications.length}`);
    
    // Sort by timestamp (newest first)
    const sortedNotifications = uniqueNotifications.sort((a, b) => {
      const timestampA = (a as any).timestamp || (a as any).created_at;
      const timestampB = (b as any).timestamp || (b as any).created_at;
      const dateA = timestampA instanceof Date ? timestampA : new Date(timestampA);
      const dateB = timestampB instanceof Date ? timestampB : new Date(timestampB);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Final notification count: ${sortedNotifications.length}`);
    console.log('Final notifications:', sortedNotifications);
    return sortedNotifications;
  }, [generatedNotifications, dbNotifications, notificationsError]);
  
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  const dismissSignalMutation = useDismissSignal();
  const markNotificationReadMutation = useMarkNotificationAsRead();
  const deleteNotificationMutation = useDeleteNotification();
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

  const setUser = useCallback((newUser: UserProfile | null) => {
    // Update the local user state
    console.log('User set:', newUser);
    // This will trigger a re-render with the new user data
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
    // Optimistically update the notification to read in local state
    setGeneratedNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    // Also update in dbNotifications if it's there by invalidating the query
    markNotificationReadMutation.mutate(notificationId);
  }, [markNotificationReadMutation]);

  const deleteNotification = useCallback((notificationId: string) => {
    // Optimistically remove the notification from generated notifications state
    setGeneratedNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    
    // The mutation will handle the database deletion and invalidate the query
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

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

  // Function to manually trigger notification generation for testing
  const generateTestNotifications = useCallback(async () => {
    console.log('Manually triggering notification generation for testing');
    
    if (!user) {
      console.log('No user - skipping notification generation');
      return;
    }
    
    if (!user.interests || user.interests.length === 0) {
      console.log('No user interests - skipping notification generation');
      return;
    }
    
    if (signals.length === 0) {
      console.log('No signals available - skipping notification generation');
      return;
    }
    
    console.log(`User ${user.username} has ${user.interests.length} interests and ${signals.length} signals available`);

    try {
      // Import the notification integration helper
      const { generateInterestNotifications, filterSignalsByInterests } = await import('@/lib/notificationIntegration');
      
      console.log(`Generating personalized notifications for user: ${user.username}`);
      console.log(`User interests: ${user.interests.join(', ')}`);
      
      // Filter signals to only the most relevant ones based on user interests
      const relevantSignals = filterSignalsByInterests(signals as any, user.interests);
      console.log(`Processing ${relevantSignals.length} relevant signals (from ${signals.length} total)`);
      
      // Generate notifications
      const newNotifications = await generateInterestNotifications(user, relevantSignals);
      
      console.log(`generateInterestNotifications returned ${newNotifications.length} notifications`);
      
      if (newNotifications.length > 0) {
        console.log(`✅ Generated ${newNotifications.length} personalized notifications!`);
        console.log('Generated notifications:', newNotifications);
        setGeneratedNotifications(newNotifications);
        console.log('Updated generated notifications state');
      } else {
        console.log('No personalized notifications generated for current signals');
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }, [user, signals, setGeneratedNotifications]);

  // Function to simulate delayed notification generation
  const generateDelayedTestNotifications = useCallback(async (delayMs: number = 2000) => {
    console.log(`Triggering delayed notification generation in ${delayMs}ms`);
    
    setTimeout(async () => {
      console.log('Executing delayed notification generation');
      console.log('Calling generateTestNotifications from delayed function');
      await generateTestNotifications();
      console.log('Finished calling generateTestNotifications from delayed function');
    }, delayMs);
  }, [generateTestNotifications]);

  // Function to clear all generated notifications
  const clearGeneratedNotifications = useCallback(() => {
    console.log('Clearing all generated notifications');
    setGeneratedNotifications(prev => {
      console.log('Cleared notifications state, previous state was:', prev);
      return [];
    });
  }, [setGeneratedNotifications]);

  // Function to add test notifications directly to state
  const addTestNotifications = useCallback((testNotifications: Notification[]) => {
    console.log('Adding test notifications directly to state:', testNotifications);
    setGeneratedNotifications(prev => [...testNotifications, ...prev]);
  }, [setGeneratedNotifications]);

  // Function to clear daily notification limit
  const clearNotificationLimit = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const notificationKeys = keys.filter(key => key.startsWith('daily_notification_count_'));
      await AsyncStorage.multiRemove(notificationKeys);
      console.log('Cleared daily notification limits');
    } catch (error) {
      console.error('Error clearing notification limits:', error);
    }
  }, []);

  return useMemo(() => ({
    user,
    signals,
    notifications,
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
    deleteNotification,
    completeOnboarding,
    refreshSignals,
    generateTestNotifications,
    generateDelayedTestNotifications,
    addTestNotifications,
    clearGeneratedNotifications,
    clearNotificationLimit,
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
    deleteNotification,
    completeOnboarding,
    refreshSignals,
    generateTestNotifications,
    generateDelayedTestNotifications,
    addTestNotifications,
    clearGeneratedNotifications,
  ]);
});