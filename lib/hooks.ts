import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, signalService, userSignalService, notificationService, metadataService, accountSettingsService } from '../lib/services';
import { discoveryService } from '../lib/discoveryService';
import { User } from '../lib/supabase';
import { authService, SignInData, SignUpData } from '../lib/authService';
import { aiNewsService, UserPreferences } from '../lib/aiNewsService';
import { newsApiService } from '../lib/newsApiService';
import { webzioService } from '../lib/webzioService';
import { NotificationGeneratorService } from '../lib/notificationGeneratorService';
import { Signal, UserProfile, Notification as TypesNotification } from '../types';
import { useAuthListener } from '../hooks/useAuthListener';

// Auth hooks
export const useSignIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SignInData) => authService.signIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useSignUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SignUpData) => authService.signUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useSignInWithGoogle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.signInWithGoogle(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useSignUpWithGoogle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.signUpWithGoogle(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      console.log('Sign out successful, clearing query cache');
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Sign out error:', error);
      // Even if there's an error, still try to clear the cache
      queryClient.clear();
      throw error;
    },
  });
};

export const useSession = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: authService.getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User hooks
export const useCurrentUser = () => {
  return useQuery<User | null, Error>({
    queryKey: ['user', 'current'],
    queryFn: userService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // Don't retry on failure - prevents crash on startup
    retryOnMount: false,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      userService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUpdateInterests = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, interests }: { userId: string; interests: string[] }) =>
      userService.updateInterests(userId, interests),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUpdateSources = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, sources }: { userId: string; sources: string[] }) =>
      userService.updateSources(userId, sources),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Real News API hooks
export const useNewsAPIPersonalized = (interests: string[]) => {
  return useQuery({
    queryKey: ['news-api', 'personalized', interests],
    queryFn: () => newsApiService.fetchPersonalizedNews(interests),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useTopHeadlines = (country: string = 'us', category?: string) => {
  return useQuery({
    queryKey: ['news-api', 'headlines', country, category],
    queryFn: () => newsApiService.fetchTopHeadlines(country, category),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// AI-Powered News hooks
export const useAIPersonalizedNews = (preferences: UserPreferences, limit = 20) => {
  return useQuery({
    queryKey: ['ai-news', 'personalized', preferences.interests, limit],
    queryFn: () => aiNewsService.fetchPersonalizedNews(preferences, limit),
    enabled: preferences.interests.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - AI calls are expensive
    retry: 1,
  });
};

export const useAIRecommendations = (
  preferences: UserPreferences,
  userHistory: { liked: string[], saved: string[], dismissed: string[] }
) => {
  return useQuery({
    queryKey: ['ai-news', 'recommendations', preferences.interests, userHistory],
    queryFn: () => aiNewsService.getAIRecommendations(preferences, userHistory),
    enabled: preferences.interests.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
};

export const useDailyDigest = (signals: any[]) => {
  return useQuery({
    queryKey: ['ai-digest', signals.map(s => s.id).join(',')],
    queryFn: () => aiNewsService.generateDailyDigest(signals),
    enabled: signals.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useAITrendingTopics = (recentSignals: any[]) => {
  return useQuery({
    queryKey: ['ai-trending', recentSignals.map(s => s.id).join(',')],
    queryFn: () => aiNewsService.analyzeTrendingTopics(recentSignals),
    enabled: recentSignals.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Signal hooks (Legacy - keeping for fallback)
export const useSignalsForUser = (userId: string, limit = 20) => {
  return useQuery({
    queryKey: ['signals', 'user', userId, limit],
    queryFn: () => signalService.getSignalsForUser(userId, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTrendingSignals = (limit = 10) => {
  return useQuery({
    queryKey: ['signals', 'trending', limit],
    queryFn: () => signalService.getTrendingSignals(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchSignals = (query: string, limit = 20) => {
  return useQuery({
    queryKey: ['signals', 'search', query, limit],
    queryFn: () => signalService.searchSignals(query, limit),
    enabled: query.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSignalById = (id: string) => {
  return useQuery({
    queryKey: ['signals', id],
    queryFn: () => signalService.getSignalById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// User Signal interaction hooks
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, signalId }: { userId: string; signalId: string }) => {
      console.log('🎯 useToggleLike mutation called:', { userId, signalId });
      return userSignalService.toggleLike(userId, signalId);
    },
    onSuccess: (data, { userId, signalId }) => {
      console.log('✅ useToggleLike SUCCESS!', { userId, signalId, data });
      console.log('🔄 Invalidating caches...');
      // Invalidate user interactions cache so UI updates
      queryClient.invalidateQueries({ queryKey: ['user-signals', 'interactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-signals', 'liked', userId] });
      queryClient.invalidateQueries({ queryKey: ['signals', 'user', userId] });
      // Invalidate profile stats to update counts
      queryClient.invalidateQueries({ queryKey: ['profile-stats', userId] });
      console.log('✅ Caches invalidated!');
    },
    onError: (error) => {
      console.error('❌ useToggleLike ERROR:', error);
    },
  });
};

export const useToggleSave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, signalId }: { userId: string; signalId: string }) => {
      console.log('🎯 useToggleSave mutation called:', { userId, signalId });
      return userSignalService.toggleSave(userId, signalId);
    },
    onSuccess: (data, { userId, signalId }) => {
      console.log('✅ useToggleSave SUCCESS!', { userId, signalId, data });
      console.log('🔄 Invalidating caches...');
      // Invalidate user interactions cache so UI updates
      queryClient.invalidateQueries({ queryKey: ['user-signals', 'interactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-signals', 'saved', userId] });
      queryClient.invalidateQueries({ queryKey: ['signals', 'user', userId] });
      // Invalidate profile stats to update counts
      queryClient.invalidateQueries({ queryKey: ['profile-stats', userId] });
      console.log('✅ Caches invalidated!');
    },
    onError: (error) => {
      console.error('❌ useToggleSave ERROR:', error);
    },
  });
};

export const useDismissSignal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, signalId }: { userId: string; signalId: string }) =>
      userSignalService.dismissSignal(userId, signalId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['signals', 'user', userId] });
    },
  });
};

// Fetch user signal interactions
export const useUserSignalInteractions = (userId: string) => {
  return useQuery<Record<string, any>, Error>({
    queryKey: ['user-signals', 'interactions', userId],
    queryFn: () => userSignalService.getUserSignalInteractions(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 0, // Prevent crash on startup if database is unavailable
  });
};

export const useLikedSignals = (userId: string) => {
  return useQuery({
    queryKey: ['user-signals', 'liked', userId],
    queryFn: () => userSignalService.getLikedSignals(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useSavedSignals = (userId: string) => {
  return useQuery({
    queryKey: ['user-signals', 'saved', userId],
    queryFn: () => userSignalService.getSavedSignals(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Notification hooks
export const useNotificationsForUser = (userId: string, limit = 50) => {
  return useQuery<TypesNotification[], Error>({
    queryKey: ['notifications', 'user', userId, limit],
    queryFn: () => notificationService.getNotificationsForUser(userId, limit),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUnreadNotificationCount = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: () => notificationService.getUnreadCount(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) =>
      notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Metadata hooks
export const useInterests = () => {
  return useQuery({
    queryKey: ['interests'],
    queryFn: metadataService.getInterests,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useSources = () => {
  return useQuery({
    queryKey: ['sources'],
    queryFn: metadataService.getSources,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Discovery hooks
export const useTrendingTopics = (userInterests: string[] = []) => {
  return useQuery({
    queryKey: ['discovery', 'trending', userInterests],
    queryFn: () => discoveryService.getTrendingTopics(userInterests),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchArticles = (query: string, category?: string, language: string = 'en') => {
  return useQuery({
    queryKey: ['discovery', 'search', query, category, language],
    queryFn: () => discoveryService.searchArticles(query, category, language),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePersonalizedRecommendations = (userInterests: string[]) => {
  return useQuery({
    queryKey: ['discovery', 'personalized', userInterests],
    queryFn: () => discoveryService.getPersonalizedRecommendations(userInterests),
    enabled: userInterests.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTrendingByCategory = (category: string, language: string = 'en') => {
  return useQuery({
    queryKey: ['discovery', 'category', category, language],
    queryFn: () => discoveryService.getTrendingByCategory(category, language),
    enabled: category !== 'All',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Webz.io News hooks
export const useWebzioPersonalized = (interests: string[]) => {
  return useQuery({
    queryKey: ['webzio', 'personalized', interests],
    queryFn: () => webzioService.fetchPersonalizedNews(interests),
    enabled: interests.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useWebzioByCategory = (category: string) => {
  return useQuery({
    queryKey: ['webzio', 'category', category],
    queryFn: () => webzioService.fetchByCategory(category),
    enabled: !!category && category !== 'All',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useWebzioSearch = (query: string) => {
  return useQuery({
    queryKey: ['webzio', 'search', query],
    queryFn: () => webzioService.searchNews(query),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Profile and Account Management hooks
export const useProfileStats = (userId: string) => {
  return useQuery<any, Error>({
    queryKey: ['profile-stats', userId],
    queryFn: () => accountSettingsService.getProfileStats(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAccountSettings = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery<any, Error>({
    queryKey: ['account-settings', user?.id],
    queryFn: () => accountSettingsService.getAccountSettings(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateAccountSettings = () => {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: (settings: any) => 
      accountSettingsService.updateAccountSettings(user?.id || '', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => accountSettingsService.deleteAccount(userId),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useExportUserData = () => {
  return useMutation({
    mutationFn: (userId: string) => accountSettingsService.exportUserData(userId),
  });
};

// Notification Generation hooks
export const useGenerateNotifications = () => {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async ({ signals, preferences }: { signals: Signal[], preferences?: any }) => {
      if (!user) throw new Error('User not found');
      const userProfile: UserProfile = {
        ...user,
        isPremium: user.is_premium || false,
        language: (user.language as 'en' | 'ko') || 'en',
      };
      return NotificationGeneratorService.processNewSignals(userProfile, signals, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useGenerateDailyDigest = () => {
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: (signals: Signal[]) => {
      if (!user) throw new Error('User not found');
      const userProfile: UserProfile = {
        ...user,
        isPremium: user.is_premium || false,
        language: (user.language as 'en' | 'ko') || 'en',
      };
      const digest = NotificationGeneratorService.generateDailyDigest(userProfile, signals);
      if (!digest) throw new Error('No signals for digest');
      return Promise.resolve(digest);
    },
  });
};

// Auth listener hook
export { useAuthListener };
