import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Clock, Sparkles, TrendingUp, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { Notification as NotificationType } from '@/types';

type FilterType = 'all' | 'unread' | 'high';

export default function NotificationsScreen() {
  const { notifications, markNotificationRead } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets();

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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return Colors.alert;
      case 'medium':
        return '#FFA500';
      case 'low':
        return Colors.success;
      default:
        return Colors.text.secondary;
    }
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

  const NotificationCard = ({ notif, index }: { notif: NotificationType; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          delay: index * 80,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: index * 80,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    }, [fadeAnim, slideAnim, scaleAnim, index]);

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
          style={[styles.notificationCard, !notif.read && styles.notificationUnread]}
          onPress={() => markNotificationRead(notif.id)}
          activeOpacity={0.7}
        >
          <View style={styles.emojiIcon}><Text style={styles.emojiText}>{getCategoryEmoji(notif.category)}</Text></View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text numberOfLines={1} style={styles.notificationTitle}>{notif.title}</Text>
              <View style={styles.timeContainer}>
                <Clock size={11} color={Colors.text.tertiary} strokeWidth={2} />
                <Text style={styles.notificationTime}>{formatTimeAgo(notif.timestamp)}</Text>
              </View>
            </View>
            <Text style={styles.notificationMessage}>{notif.message}</Text>
            {!notif.read && (
              <TouchableOpacity style={styles.markRead} onPress={() => markNotificationRead(notif.id)}>
                <Text style={styles.markReadText}>Mark read</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.itemDivider} />
      </Animated.View>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>RUVO</Text>
        <Text style={styles.headerTagline}>Cut the Noise. Catch the Signal.</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 ? `${unreadCount} new signals` : 'All caught up!'}
        </Text>
      </View>

      <View style={styles.filtersWrapper}>
        <View style={styles.dotsRow}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
            accessibilityLabel="All"
            style={styles.dotButton}
          >
            <View style={[styles.dot, { backgroundColor: '#34C759' }, filter === 'all' && styles.dotActive]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            activeOpacity={0.8}
            accessibilityLabel="Unread"
            style={styles.dotButton}
          >
            <View style={[styles.dot, { backgroundColor: '#FFD60A' }, filter === 'unread' && styles.dotActive]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('high')}
            activeOpacity={0.8}
            accessibilityLabel="Urgent"
            style={styles.dotButton}
          >
            <View style={[styles.dot, { backgroundColor: '#FF453A' }, filter === 'high' && styles.dotActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.notificationsContainer}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif, index) => (
              <NotificationCard key={notif.id} notif={notif} index={index} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Bell size={48} color={Colors.text.tertiary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMessage}>You&apos;re all caught up! Check back later for updates.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  largeHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: Fonts.regular,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.text.tertiary,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    color: Colors.text.primary,
  },
  largeSubtitle: {
    marginTop: 4,
    color: Colors.text.secondary,
  },
  filtersWrapper: {
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dotButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dotActive: {
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    overflow: 'hidden',
  },
  filterChipGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterChipActive: {
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.inverse,
  },
  countDot: {
    marginLeft: 8,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  countDotActive: {
    backgroundColor: Colors.primary,
  },
  countDotText: {
    color: Colors.text.onLight,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  notificationsContainer: {
    padding: 18,
  },
  notificationCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  notificationUnread: {
    backgroundColor: Colors.background.white,
    borderColor: Colors.border.light,
  },
  urgencyIndicator: {
    display: 'none',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  emojiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: Colors.background.secondary,
  },
  emojiText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  notificationCategory: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.text.tertiary,
    fontWeight: '500' as const,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.text.secondary,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border.lighter,
    marginLeft: 60,
    marginVertical: 6,
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  markRead: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Colors.card.secondary,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  markReadText: {
    color: Colors.text.onLight,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
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
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
