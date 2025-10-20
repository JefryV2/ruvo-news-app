import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, signalService, userSignalService, notificationService, metadataService } from '../lib/services';
import { User } from '../lib/supabase';

// User hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: userService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Signal hooks
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
    mutationFn: ({ userId, signalId }: { userId: string; signalId: string }) =>
      userSignalService.toggleLike(userId, signalId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['signals', 'user', userId] });
    },
  });
};

export const useToggleSave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, signalId }: { userId: string; signalId: string }) =>
      userSignalService.toggleSave(userId, signalId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['signals', 'user', userId] });
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

// Notification hooks
export const useNotificationsForUser = (userId: string, limit = 50) => {
  return useQuery({
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
