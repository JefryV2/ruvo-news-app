import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, User, Check, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { communityService } from '@/lib/communityService';

export default function FriendRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { colors } = useTheme();
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadFriendRequests();
  }, [user?.id]);

  const loadFriendRequests = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const requests = await communityService.getFriendRequests(user.id);
      console.log('Loaded friend requests:', requests);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterId: string) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      await communityService.acceptFriendRequest(user.id, requesterId);
      Alert.alert('Success', 'Friend request accepted!');
      // Remove the accepted request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      await communityService.removeFriend(user.id, requestId);
      Alert.alert('Success', 'Friend request rejected');
      // Remove the rejected request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.lighter }]}> 
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Friend Requests</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : friendRequests.length > 0 ? (
          <View style={styles.requestsContainer}>
            <Text style={[styles.requestsTitle, { color: colors.text.primary }]}>
              You have {friendRequests.length} friend request{friendRequests.length !== 1 ? 's' : ''}
            </Text>
            {friendRequests.map((request) => (
              <View 
                key={request.id} 
                style={[styles.requestCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}
              >
                <View style={styles.requestLeft}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.background.tertiary }]}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.username, { color: colors.text.primary }]}>
                      {request.users?.username || 'Unknown User'}
                    </Text>
                    <Text style={[styles.requestDate, { color: colors.text.tertiary }]}>
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: Colors.success, marginRight: 8 }]}
                    onPress={() => handleAcceptRequest(request.id, request.user_id)}
                    disabled={isProcessing}
                  >
                    <Check size={16} color={colors.text.inverse} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: Colors.alert }]}
                    onPress={() => handleRejectRequest(request.id)}
                    disabled={isProcessing}
                  >
                    <X size={16} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <User size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Friend Requests</Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              You don't have any pending friend requests right now.
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
    borderBottomColor: Colors.border.lighter,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  requestsContainer: {
    padding: 16,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    padding: 12,
    marginBottom: 12,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  requestDate: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 140,
  },
});