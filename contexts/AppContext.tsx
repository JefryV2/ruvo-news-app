import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Signal, Notification } from '@/types';
import { MOCK_SIGNALS, MOCK_NOTIFICATIONS } from '@/constants/mockData';
import { useCurrentUser, useSignalsForUser, useNotificationsForUser, useToggleLike, useToggleSave, useDismissSignal, useMarkNotificationAsRead } from '@/lib/hooks';

type AppState = {
  user: UserProfile | null;
  signals: Signal[];
  notifications: Notification[];
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
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
  
  // Backend integration hooks
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: signals = MOCK_SIGNALS, isLoading: signalsLoading } = useSignalsForUser(user?.id || '', 20);
  const { data: notifications = MOCK_NOTIFICATIONS, isLoading: notificationsLoading } = useNotificationsForUser(user?.id || '', 50);
  
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  const dismissSignalMutation = useDismissSignal();
  const markNotificationReadMutation = useMarkNotificationAsRead();

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        setHasCompletedOnboarding(true);
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
    // This will be handled by the backend mutation hooks
    console.log('Updating interests:', interests);
  }, []);

  const updateUserSources = useCallback(async (sources: string[]) => {
    // This will be handled by the backend mutation hooks
    console.log('Updating sources:', sources);
  }, []);

  const toggleSignalLike = useCallback((signalId: string) => {
    if (user?.id) {
      toggleLikeMutation.mutate({ userId: user.id, signalId });
    }
  }, [user?.id, toggleLikeMutation]);

  const toggleSignalSave = useCallback((signalId: string) => {
    if (user?.id) {
      toggleSaveMutation.mutate({ userId: user.id, signalId });
    }
  }, [user?.id, toggleSaveMutation]);

  const dismissSignal = useCallback((signalId: string) => {
    if (user?.id) {
      dismissSignalMutation.mutate({ userId: user.id, signalId });
    }
  }, [user?.id, dismissSignalMutation]);

  const markNotificationRead = useCallback((notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  }, [markNotificationReadMutation]);

  const completeOnboarding = useCallback(async (newUser: UserProfile) => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      await setUser(newUser);
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, [setUser]);

  const refreshSignals = useCallback(() => {
    // This will be handled by React Query's refetch
    console.log('Refreshing signals...');
  }, []);

  const combinedIsLoading = isLoading || userLoading || signalsLoading || notificationsLoading;

  return useMemo(() => ({
    user,
    signals,
    notifications,
    hasCompletedOnboarding,
    isLoading: combinedIsLoading,
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
