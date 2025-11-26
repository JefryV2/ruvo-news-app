import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ChevronLeft, User, Plus, Search, Check, Info } from 'lucide-react-native';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { userService } from '@/lib/services';
import { communityService } from '@/lib/communityService';

export default function AddFriendScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setIsLoading(true);
    try {
      const results = await userService.searchUsers(searchQuery);
      
      // Filter out the current user
      const filteredResults = results.filter(u => u.id !== user?.id);
      
      // Check for existing friend requests for each user
      const resultsWithStatus = await Promise.all(filteredResults.map(async (u) => {
        try {
          const status = await communityService.checkFriendshipStatus(user!.id, u.id);
          return {
            ...u,
            friendRequestStatus: status?.status || null
          };
        } catch (error) {
          return {
            ...u,
            friendRequestStatus: null
          };
        }
      }));
      setSearchResults(resultsWithStatus);
    } catch (error) {
      showFeedback('error', 'Something went wrong while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (!user?.id) {
      showFeedback('error', 'You must be logged in to send friend requests.');
      return;
    }

    setIsSendingRequest(true);
    try {
      const result = await communityService.sendFriendRequest(user.id, friendId);
      if (result) {
        showFeedback('success', 'Friend request sent!');
      }
      // Update the user in search results to show pending state
      setSearchResults(prev => prev.map(u => 
        u.id === friendId ? { ...u, friendRequestStatus: 'pending' } : u
      ));
    } catch (error: any) {
      let errorMessage = 'Failed to send friend request';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      showFeedback('error', errorMessage);
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.lighter }]}> 
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Add Friend</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { 
              color: colors.text.primary,
              backgroundColor: 'transparent',
            }]}
            placeholder="Search by username or email"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text style={[styles.searchButtonText, { color: colors.text.inverse }]}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {feedback ? (
        <View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor:
                feedback.type === 'success'
                  ? colors.success
                  : feedback.type === 'error'
                    ? colors.alert
                    : colors.card.secondary,
              borderColor: feedback.type === 'info' ? colors.border.lighter : 'transparent',
            },
          ]}
        >
          {feedback.type === 'success' ? (
            <Check size={16} color={colors.text.inverse} />
          ) : feedback.type === 'error' ? (
            <Info size={16} color={colors.text.inverse} />
          ) : (
            <Info size={16} color={colors.text.primary} />
          )}
          <Text
            style={[
              styles.feedbackText,
              {
                color: feedback.type === 'info' ? colors.text.primary : colors.text.inverse,
              },
            ]}
          >
            {feedback.message}
          </Text>
        </View>
      ) : null}

      {/* Results */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {searchResults.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { color: colors.text.primary }]}>
              Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
            </Text>
            {searchResults.map((resultUser) => (
              <View 
                key={resultUser.id} 
                style={[styles.userCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}
              >
                <View style={styles.userLeft}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.background.tertiary }]}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.username, { color: colors.text.primary }]}>{resultUser.username}</Text>
                    <Text style={[styles.userEmail, { color: colors.text.tertiary }]} numberOfLines={1}>
                      {resultUser.email}
                    </Text>
                    {resultUser.friendRequestStatus === 'pending' && (
                      <View style={[styles.statusPill, { backgroundColor: colors.background.secondary }]}>
                        <Text style={[styles.statusText, { color: colors.text.secondary }]}>Request pending</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.addButton, { 
                    backgroundColor: resultUser.friendRequestStatus === 'pending' 
                      ? colors.background.tertiary 
                      : colors.primary 
                  }]}
                  onPress={() => handleSendFriendRequest(resultUser.id)}
                  disabled={isSendingRequest || resultUser.friendRequestStatus === 'pending'}
                >
                  {isSendingRequest ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : resultUser.friendRequestStatus === 'pending' ? (
                    <Text style={[styles.searchButtonText, { color: colors.text.primary }]}>Pending</Text>
                  ) : (
                    <Plus size={16} color={colors.text.inverse} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : hasSearched ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No users found</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Search size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Find Friends</Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              Search for friends by username or email to connect with them
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 12,
    marginBottom: 12,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 140,
  },
  feedbackBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});