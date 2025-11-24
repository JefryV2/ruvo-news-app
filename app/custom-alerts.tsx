import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, BellOff, Trash2, Plus, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { CustomAlert } from '@/types';
import { useCustomAlerts } from '@/hooks/useCustomAlerts';
import { useTheme } from '@/contexts/ThemeContext';

export default function CustomAlertsScreen() {
  const { getUserAlerts, deleteAlert, toggleAlert, getAlertStats } = useCustomAlerts();
  const { mode, colors } = useTheme();
  const [alerts, setAlerts] = useState<CustomAlert[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, triggered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [userAlerts, alertStats] = await Promise.all([
        getUserAlerts(),
        getAlertStats(),
      ]);
      setAlerts(userAlerts);
      setStats(alertStats);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (alertId: string) => {
    await toggleAlert(alertId);
    await loadAlerts();
  };

  const handleDelete = (alert: CustomAlert) => {
    Alert.alert(
      'Delete Alert',
      `Are you sure you want to delete "${alert.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAlert(alert.id);
            await loadAlerts();
          },
        },
      ]
    );
  };

  const getAlertTypeEmoji = (type: CustomAlert['type']): string => {
    const emojiMap = {
      album_release: '🎵',
      product_announcement: '📱',
      earnings_report: '📊',
      price_change: '💰',
      event: '🎪',
      news_mention: '📰',
      general: '🔔',
    };
    return emojiMap[type];
  };

  const renderAlertCard = (alert: CustomAlert) => (
    <View key={alert.id} style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <Text style={styles.alertEmoji}>{getAlertTypeEmoji(alert.type)}</Text>
          <View style={styles.alertTitleContainer}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertDescription}>{alert.description}</Text>
          </View>
        </View>
        <Switch
          value={alert.isActive}
          onValueChange={() => handleToggle(alert.id)}
          trackColor={{ false: Colors.border.light, true: Colors.accent }}
          thumbColor={Colors.background.white}
        />
      </View>

      <View style={styles.alertMeta}>
        <View style={styles.metaItem}>
          <TrendingUp size={14} color={Colors.text.tertiary} />
          <Text style={styles.metaText}>
            Triggered {alert.triggeredCount} {alert.triggeredCount === 1 ? 'time' : 'times'}
          </Text>
        </View>
        {alert.lastTriggered && (
          <Text style={styles.metaText}>
            Last: {new Date(alert.lastTriggered).toLocaleDateString()}
          </Text>
        )}
      </View>

      {alert.keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          {alert.keywords.slice(0, 3).map((keyword, index) => (
            <View key={index} style={styles.keywordChip}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
          {alert.keywords.length > 3 && (
            <Text style={styles.moreKeywords}>+{alert.keywords.length - 3} more</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(alert)}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color={Colors.text.tertiary} />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} translucent={true} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Alerts</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.accent }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{stats.triggered}</Text>
          <Text style={styles.statLabel}>Triggered</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading alerts...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={Colors.border.light} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Custom Alerts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Use "Ask Ruvo" to create alerts for specific topics, artists, or products
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/ask-ruvo')}
              activeOpacity={0.8}
            >
              <Plus size={20} color={Colors.text.inverse} />
              <Text style={styles.createButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {alerts.map(alert => renderAlertCard(alert))}
            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {alerts.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.push('/ask-ruvo')}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
  },
  placeholder: {
    width: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  alertCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginRight: 12,
  },
  alertEmoji: {
    fontSize: 28,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: Fonts.bold,
  },
  alertDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  keywordChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  keywordText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  moreKeywords: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
