import { useEffect, useCallback } from 'react';
import { Signal, Notification } from '@/types';
import { CustomAlertsService } from '@/lib/customAlertsService';
import { useApp } from '@/contexts/AppContext';

/**
 * Hook to automatically check signals against custom alerts
 */
export function useCustomAlerts() {
  const { user } = useApp();

  /**
   * Check a signal against all active alerts
   */
  const checkSignal = useCallback(async (signal: Signal): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const matchedAlerts = await CustomAlertsService.checkSignalAgainstAlerts(user.id, signal);
      
      // Create notifications for matched alerts
      const notifications = matchedAlerts.map(alert =>
        CustomAlertsService.createNotificationFromMatch(alert, signal)
      );

      return notifications;
    } catch (error) {
      console.error('Error checking signal against alerts:', error);
      return [];
    }
  }, [user]);

  /**
   * Check multiple signals
   */
  const checkSignals = useCallback(async (signals: Signal[]): Promise<Notification[]> => {
    if (!user) return [];

    const allNotifications: Notification[] = [];

    for (const signal of signals) {
      const notifications = await checkSignal(signal);
      allNotifications.push(...notifications);
    }

    return allNotifications;
  }, [user, checkSignal]);

  /**
   * Get user's alert statistics
   */
  const getAlertStats = useCallback(async () => {
    if (!user) return { total: 0, active: 0, triggered: 0 };
    return CustomAlertsService.getAlertStats(user.id);
  }, [user]);

  /**
   * Get all user alerts
   */
  const getUserAlerts = useCallback(async () => {
    if (!user) return [];
    return CustomAlertsService.getUserAlerts(user.id);
  }, [user]);

  /**
   * Delete an alert
   */
  const deleteAlert = useCallback(async (alertId: string) => {
    await CustomAlertsService.deleteAlert(alertId);
  }, []);

  /**
   * Toggle an alert
   */
  const toggleAlert = useCallback(async (alertId: string) => {
    await CustomAlertsService.toggleAlert(alertId);
  }, []);

  return {
    checkSignal,
    checkSignals,
    getAlertStats,
    getUserAlerts,
    deleteAlert,
    toggleAlert,
  };
}
