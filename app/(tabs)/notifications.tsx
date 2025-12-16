import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Clock, Sparkles, TrendingUp, AlertCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { createTestNotifications } from '@/lib/notificationIntegration';
import { useTheme } from '@/contexts/ThemeContext';
import { Notification as NotificationType } from '@/types';

type FilterType = 'all' | 'unread' | 'high';

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

// Move NotificationCard outside of the main component to fix hook issues
const NotificationCard = React.memo(({ 
  notif, 
  index,
  markNotificationRead,
  deleteNotification,
  colors,
  mode
}: { 
  notif: NotificationType; 
  index: number;
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  colors: any;
  mode: string;
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [heightAnim] = useState(new Animated.Value(1));

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return AlertTriangle;
      case 'medium': return AlertCircle;
      case 'low': return Info;
      default: return Bell;
    }
  };

  const getCategoryEmoji = (category: string) => {
    const key = category.toLowerCase();
    if (key.includes('tech') || key.includes('ai') || key.includes('digital')) return '💻';
    if (key.includes('finance') || key.includes('market') || key.includes('economy')) return '💰';
    if (key.includes('health') || key.includes('medical') || key.includes('wellness')) return '🏥';
    if (key.includes('sports') || key.includes('game')) return '⚽';
    if (key.includes('politic') || key.includes('government')) return '🏛️';
    if (key.includes('entertain') || key.includes('movie') || key.includes('music')) return '🎬';
    if (key.includes('science') || key.includes('research')) return '🔬';
    if (key.includes('environment') || key.includes('climate')) return '🌍';
    if (key.includes('food') || key.includes('cooking')) return '🍽️';
    if (key.includes('travel') || key.includes('tourism')) return '✈️';
    if (key.includes('education') || key.includes('learn')) return '📚';
    if (key.includes('taste') || key.includes('flavor')) return '😋';
    if (key.includes('bonus') || key.includes('deal')) return '🎁';
    if (key.includes('delivery')) return '📦';
    if (key.includes('alert') || key.includes('urgent')) return '⚠️';
    return '📰';
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const past = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const urgencyColor = getUrgencyColor(notif.urgency);
  const UrgencyIcon = getUrgencyIcon(notif.urgency);

  // Check if this is a generated notification (has signalId) or a database notification
  const isGeneratedNotification = notif.signalId !== undefined;

  const handleDelete = (e: any) => {
    e.stopPropagation(); // Prevent the card's onPress from firing
    
    // Animate the deletion
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start(() => {
      // Actually delete the notification after animation completes
      deleteNotification(notif.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.notificationCardWrapper,
        {
          opacity: fadeAnim,
          height: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100], // Approximate height, you might need to adjust this
          }),
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.notificationCard, 
          !notif.read && [styles.notificationUnread, { backgroundColor: colors.card.primary, borderColor: colors.border.primary }],
          { backgroundColor: colors.card.primary }
        ]}
        onPress={() => {
          if (!notif.read) {
            markNotificationRead(notif.id);
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.emojiIcon, { backgroundColor: colors.card.secondary }]}>
          <Text style={[styles.emojiText, { color: colors.text.primary }]}>{getCategoryEmoji(notif.category)}</Text>
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text numberOfLines={2} style={[styles.notificationTitle, { color: colors.text.primary, opacity: notif.read ? 0.7 : 1 }]}>{notif.title}</Text>
            <View style={styles.timeContainer}>
              <Clock size={12} color={colors.text.tertiary} strokeWidth={2.5} />
              <Text style={[styles.notificationTime, { color: colors.text.tertiary, opacity: notif.read ? 0.7 : 1 }]}>{formatTimeAgo(notif.timestamp)}</Text>
            </View>
          </View>
          <Text style={[styles.notificationMessage, { color: colors.text.secondary, opacity: notif.read ? 0.7 : 1 }]} numberOfLines={3}>{notif.message} <Text style={{ fontStyle: 'italic', fontSize: 13, opacity: notif.read ? 0.7 : 1 }}>— Based on your interests</Text></Text>
          {!notif.read && (
            <TouchableOpacity 
              style={[styles.markRead, { backgroundColor: colors.primary }]} 
              onPress={(e) => {
                e.stopPropagation(); // Prevent the card's onPress from firing
                markNotificationRead(notif.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.markReadText, { color: colors.text.inverse }]}>Mark as Read</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.notificationActions}>
          {/* Delete button - only show for generated notifications */}
          {isGeneratedNotification && (
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: colors.card.light }]}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
          <UrgencyIcon size={20} color={urgencyColor} style={styles.urgencyIcon} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, deleteNotification } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets();
  const { mode, colors } = useTheme();

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') {
      return !notif.read;
    }
    if (filter === 'high') {
      return notif.urgency === 'high';
    }
    return true;
  });
  
  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    high: notifications.filter((n) => n.urgency === 'high').length,
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  
  useEffect(() => {
    // Clean up any test notifications when component unmounts
    return () => {
      // Any cleanup code if needed
    };
  }, []);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
        <Text style={[styles.headerTagline, { color: colors.text.secondary }]}>Personalized alerts for your interests</Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>
          {unreadCount > 0 ? `${unreadCount} important signals` : 'All caught up!'}
        </Text>
        <Text style={[styles.headerInfo, { color: colors.text.tertiary }]}>
          Showing only the most relevant updates
        </Text>
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <View style={styles.filters}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'all' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border.light }
            ]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' ? { color: colors.text.inverse } : { color: colors.text.primary }]}>
              All ({counts.all})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'unread' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border.light }
            ]} 
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' ? { color: colors.text.inverse } : { color: colors.text.primary }]}>
              Unread ({counts.unread})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'high' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border.light }
            ]} 
            onPress={() => setFilter('high')}
          >
            <Text style={[styles.filterText, filter === 'high' ? { color: colors.text.inverse } : { color: colors.text.primary }]}>
              High Priority ({counts.high})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Notifications List */}
      <View style={styles.listWrapper}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              We'll notify you when there are important updates based on your interests
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.notificationsList}
            contentContainerStyle={styles.notificationsListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.map((notif, index) => (
              <NotificationCard 
                key={notif.id} 
                notif={notif} 
                index={index}
                markNotificationRead={markNotificationRead}
                deleteNotification={deleteNotification}
                colors={colors}
                mode={mode}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.RubikBold,
    marginBottom: 4,
  },
  headerTagline: {
    fontSize: 16,
    fontFamily: Fonts.RubikMedium,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.RubikRegular,
    marginBottom: 8,
  },
  headerInfo: {
    fontSize: 13,
    fontFamily: Fonts.RubikLight,
  },
  filtersWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontFamily: Fonts.RubikMedium,
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsListContent: {
    paddingBottom: 20,
  },
  notificationCardWrapper: {
    overflow: 'hidden',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notificationUnread: {
    borderWidth: 1,
  },
  emojiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: Fonts.RubikSemiBold,
    flex: 1,
    paddingRight: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: Fonts.RubikRegular,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: Fonts.RubikRegular,
    lineHeight: 20,
    marginBottom: 12,
  },
  markRead: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markReadText: {
    fontSize: 12,
    fontFamily: Fonts.RubikMedium,
  },
  notificationActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Add a subtle border to make it more visible
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  urgencyIcon: {
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.RubikSemiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: Fonts.RubikRegular,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});