import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Clock, Share2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { communityService } from '@/lib/communityService';

export default function LikedArticlesScreen() {
  const insets = useSafeAreaInsets();
  const { signals, user } = useApp();
  const { colors } = useTheme();
  const [friends, setFriends] = useState<any[]>([]);

  // Filter liked signals
  const likedSignals = signals.filter(signal => signal.liked);

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'Just now';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  const handleShareArticle = async (signalId: string) => {
    console.log('Share button pressed in liked articles. Signal ID:', signalId);
    console.log('Current user:', user);
    
    if (!user?.id) {
      console.log('User not logged in in liked articles');
      Alert.alert('Error', 'You must be logged in to share articles');
      return;
    }

    try {
      console.log('Fetching friends for user in liked articles:', user.id);
      // Get friends
      const friendsData = await communityService.getFriends(user.id);
      setFriends(friendsData);
      console.log('Friends data received in liked articles:', friendsData);

      // Show share options even if no friends (for community sharing)
      const friendOptions = friendsData.map(friend => 
        friend.user_id === user.id ? friend.friend_id : friend.user_id
      );
      
      console.log('Friend options in liked articles:', friendOptions);
      console.log('Platform.OS in liked articles:', Platform.OS);
      
      if (Platform.OS === 'ios') {
        console.log('Showing ActionSheet for iOS in liked articles');
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Share with all friends', 'Share to Community Feed', ...friendOptions.map((id, index) => `Friend ${index + 1}`)],
            cancelButtonIndex: 0,
            title: 'Share with friends',
            message: 'Select a friend to share this article with'
          },
          async (buttonIndex) => {
            console.log('ActionSheet button pressed in liked articles:', buttonIndex);
            if (buttonIndex === 0) return; // Cancel
            
            try {
              if (buttonIndex === 1) {
                // Share with all friends
                console.log('Sharing with all friends in liked articles');
                // Get the full signal object
                const signal = likedSignals.find(s => s.id === signalId);
                if (signal) {
                  await communityService.shareArticleWithAllFriends(user.id, signal, 'Check out this article!');
                  Alert.alert('Success', 'Article shared with all friends and to community feed');
                } else {
                  Alert.alert('Error', 'Failed to share article. Please try again.');
                }
              } else if (buttonIndex === 2) {
                // Share to Community Feed only
                console.log('Sharing to community feed only in liked articles');
                // Get the full signal object
                const signal = likedSignals.find(s => s.id === signalId);
                if (signal) {
                  await communityService.shareArticleToCommunity(user.id, signal, 'Check out this article!');
                  Alert.alert('Success', 'Article shared to community feed');
                } else {
                  Alert.alert('Error', 'Failed to share article. Please try again.');
                }
              } else {
                // Share with specific friend
                const friendId = friendOptions[buttonIndex - 3];
                console.log('Sharing with specific friend in liked articles:', friendId);
                // Get the full signal object
                const signal = likedSignals.find(s => s.id === signalId);
                if (signal) {
                  await communityService.shareArticleWithFriend(user.id, signal, friendId, 'Check out this article!');
                  Alert.alert('Success', 'Article shared with friend');
                } else {
                  Alert.alert('Error', 'Failed to share article. Please try again.');
                }
              }

            } catch (error) {
              console.error('Error sharing article in liked articles:', error);
              Alert.alert('Error', 'Failed to share article. Please try again.');
            }
          }
        );
      } else {
        console.log('Showing Alert for Android/Web in liked articles');
        // For Android and web, show a simple alert with options
        const options = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share with all friends', onPress: async () => {
            try {
              console.log('Sharing with all friends in liked articles');
              // Get the full signal object
              const signal = likedSignals.find(s => s.id === signalId);
              if (signal) {
                await communityService.shareArticleWithAllFriends(user.id, signal, 'Check out this article!');
                Alert.alert('Success', 'Article shared with all friends and to community feed');
              } else {
                Alert.alert('Error', 'Failed to share article. Please try again.');
              }
            } catch (error) {
              console.error('Error sharing article in liked articles:', error);
              Alert.alert('Error', 'Failed to share article. Please try again.');
            }
          }},
          { text: 'Share to Community Feed', onPress: async () => {
            try {
              console.log('Sharing to community feed only in liked articles');
              // Get the full signal object
              const signal = likedSignals.find(s => s.id === signalId);
              if (signal) {
                await communityService.shareArticleToCommunity(user.id, signal, 'Check out this article!');
                Alert.alert('Success', 'Article shared to community feed');
              } else {
                Alert.alert('Error', 'Failed to share article. Please try again.');
              }
            } catch (error) {
              console.error('Error sharing article in liked articles:', error);
              Alert.alert('Error', 'Failed to share article. Please try again.');
            }
          }},
          ...friendOptions.map((friendId, index) => ({
            text: `Friend ${index + 1}`,
            onPress: async () => {
              try {
                console.log('Sharing with specific friend in liked articles:', friendId);
                // Get the full signal object
                const signal = likedSignals.find(s => s.id === signalId);
                if (signal) {
                  await communityService.shareArticleWithFriend(user.id, signal, friendId, 'Check out this article!');
                  Alert.alert('Success', 'Article shared with friend');
                } else {
                  Alert.alert('Error', 'Failed to share article. Please try again.');
                }
              } catch (error) {
                console.error('Error sharing article in liked articles:', error);
                Alert.alert('Error', 'Failed to share article. Please try again.');
              }
            }
          }))
        ];
        
        Alert.alert(
          'Share with friends',
          'Select a friend to share this article with',
          options as any
        );
      }
    } catch (error) {
      console.error('Error loading friends in liked articles:', error);
      Alert.alert('Error', 'Failed to load friends list. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>      
      <StatusBar barStyle="dark-content" translucent={true} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.lighter }]}> 
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Liked Articles</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {likedSignals.length > 0 ? (
          <View style={styles.articlesContainer}>
            {likedSignals.map((signal) => (
              <TouchableOpacity
                key={signal.id}
                style={[styles.articleCard, { backgroundColor: colors.card.secondary, borderColor: colors.border.lighter }]}
                onPress={() => router.push(`/article-detail?id=${signal.id}`)}
                activeOpacity={0.8}
              >
                {signal.imageUrl && (
                  <Image 
                    source={{ uri: signal.imageUrl }} 
                    style={styles.articleImage} 
                    resizeMode="cover"
                  />
                )}
                <View style={styles.articleContent}>
                  <View style={styles.tagsContainer}>
                    {signal.tags.slice(0, 2).map((tag, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: colors.card.light }]}> 
                        <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={[styles.articleTitle, { color: colors.text.primary }]} numberOfLines={2}>{signal.title}</Text>
                  <Text style={[styles.articleSummary, { color: colors.text.secondary }]} numberOfLines={2}>{signal.summary}</Text>
                  
                  <View style={styles.articleMeta}>
                    <Text style={[styles.source, { color: colors.text.tertiary }]}>{signal.sourceName}</Text>
                    <View style={styles.timeContainer}>
                      <Clock size={11} color={colors.text.tertiary} />
                      <Text style={[styles.time, { color: colors.text.tertiary }]}>{formatTimeAgo(signal.timestamp)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.card.light }]}
                    onPress={() => handleShareArticle(signal.id)}
                  >
                    <Share2 size={16} color={colors.text.primary} />
                  </TouchableOpacity>
                  <View style={[styles.likedBadge, { backgroundColor: colors.card.light }]}> 
                    <Heart size={14} color={colors.alert} fill={colors.alert} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card.secondary }]}> 
              <Heart size={48} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Liked Articles</Text>
            <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}> 
              Start liking articles that you enjoy
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
  articlesContainer: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.card.secondary,
  },
  articleContent: {
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: 'rgba(240,244,255,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Fonts.bold,
  },
  articleSummary: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  source: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  likedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 140,
  },
});