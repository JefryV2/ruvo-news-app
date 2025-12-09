import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Clock, Sparkles, TrendingUp, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
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
  colors,
  mode
}: { 
  notif: NotificationType; 
  index: number;
  markNotificationRead: (id: string) => void;
  colors: any;
  mode: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 50,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 50,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim, index]);

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

  const UrgencyIcon = getUrgencyIcon(notif.urgency);
  const urgencyColor = getUrgencyColor(notif.urgency);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.notificationCard, !notif.read && [styles.notificationUnread, { backgroundColor: colors.card.elevated, borderColor: colors.border.light }]]}
        onPress={() => markNotificationRead(notif.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.emojiIcon, { backgroundColor: colors.card.secondary }]}>
          <Text style={[styles.emojiText, { color: colors.text.primary }]}>{getCategoryEmoji(notif.category)}</Text>
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text numberOfLines={2} style={[styles.notificationTitle, { color: colors.text.primary }]}>{notif.title}</Text>
            <View style={styles.timeContainer}>
              <Clock size={12} color={colors.text.tertiary} strokeWidth={2.5} />
              <Text style={[styles.notificationTime, { color: colors.text.tertiary }]}>{formatTimeAgo(notif.timestamp)}</Text>
            </View>
          </View>
          <Text style={[styles.notificationMessage, { color: colors.text.secondary }]} numberOfLines={3}>{notif.message}</Text>
          {!notif.read && (
            <TouchableOpacity 
              style={[styles.markRead, { backgroundColor: colors.primary }]} 
              onPress={() => markNotificationRead(notif.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.markReadText, { color: colors.text.inverse }]}>Mark as Read</Text>
            </TouchableOpacity>
          )}
        </View>
        <UrgencyIcon size={20} color={urgencyColor} style={styles.urgencyIcon} />
      </TouchableOpacity>
      
      <View style={[styles.itemDivider, { backgroundColor: colors.border.lighter }]} />
    </Animated.View>
  );
});

export default function NotificationsScreen() {
  const { notifications, markNotificationRead } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets();
  const { mode, colors } = useTheme();

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'high') return notif.urgency === 'high';
    return true;
  });
  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    high: notifications.filter((n) => n.urgency === 'high').length,
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return AlertCircle;
      case 'medium':
        return TrendingUp;
      case 'low':
        return Sparkles;
      default:
        return Bell;
    }
  };

  const getCategoryEmoji = (category: string) => {
    const key = category.toLowerCase();
    if (key.includes('meal') || key.includes('food')) return '🍽️';
    if (key.includes('order')) return '✅';
    if (key.includes('taste') || key.includes('flavor')) return '😋';
    if (key.includes('bonus') || key.includes('deal')) return '🎁';
    if (key.includes('delivery')) return '📦';
    if (key.includes('alert') || key.includes('urgent')) return '⚠️';
    return '📰';
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>RUVO</Text>
        <Text style={[styles.headerTagline, { color: colors.text.secondary }]}>Cut the Noise. Catch the Signal.</Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>
          {unreadCount > 0 ? `${unreadCount} new signals` : 'All caught up!'}
        </Text>
      </View>

      <View style={styles.filtersWrapper}>
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
            accessibilityLabel="All"
            style={[styles.filterButton, filter === 'all' && { backgroundColor: colors.primary + '20' }]}
          >
            <Text style={[styles.filterText, { color: filter === 'all' ? colors.primary : colors.text.secondary }]}>All</Text>
            <View style={[styles.filterBadge, { backgroundColor: colors.border.light }]}>
              <Text style={[styles.filterBadgeText, { color: colors.text.tertiary }]}>{counts.all}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            activeOpacity={0.8}
            accessibilityLabel="Unread"
            style={[styles.filterButton, filter === 'unread' && { backgroundColor: colors.primary + '20' }]}
          >
            <Text style={[styles.filterText, { color: filter === 'unread' ? colors.primary : colors.text.secondary }]}>Unread</Text>
            <View style={[styles.filterBadge, { backgroundColor: colors.border.light }]}>
              <Text style={[styles.filterBadgeText, { color: colors.text.tertiary }]}>{counts.unread}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setFilter('high')}
            activeOpacity={0.8}
            accessibilityLabel="Urgent"
            style={[styles.filterButton, filter === 'high' && { backgroundColor: colors.primary + '20' }]}
          >
            <Text style={[styles.filterText, { color: filter === 'high' ? colors.primary : colors.text.secondary }]}>Urgent</Text>
            <View style={[styles.filterBadge, { backgroundColor: colors.border.light }]}>
              <Text style={[styles.filterBadgeText, { color: colors.text.tertiary }]}>{counts.high}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.notificationsContainer}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif, index) => (
              <NotificationCard key={notif.id} notif={notif} index={index} markNotificationRead={markNotificationRead} colors={colors} mode={mode} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Bell size={48} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No notifications</Text>
              <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>You&apos;re all caught up! Check back later for updates.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={{ height: (Platform.OS === 'web' ? 0 : 80 + insets.bottom), backgroundColor: colors.background.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    color: 'inherit',
    letterSpacing: -1,
    marginBottom: 6,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Fonts.regular,
    color: 'inherit',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'inherit',
    fontWeight: '600',
    opacity: 0.9,
  },
  filtersWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'inherit',
    marginRight: 6,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'inherit',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'inherit',
  },
  notificationList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'inherit',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 80,
  },
  notificationUnread: {
    borderWidth: 1,
    borderColor: 'inherit',
  },
  emojiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    alignSelf: 'flex-start',
  },
  emojiText: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'inherit',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: 'inherit',
  },
  notificationMessage: {
    fontSize: 15,
    color: 'inherit',
    lineHeight: 22,
    marginBottom: 16,
  },
  markRead: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'inherit',
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'inherit',
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'inherit',
    opacity: 0.1,
    marginHorizontal: 20,
  },
  urgencyIcon: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 24,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'inherit',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'inherit',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  emptyMessage: {
    fontSize: 16,
    color: 'inherit',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  notificationsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});
