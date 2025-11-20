import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'wellbeing_preferences';

export type WellbeingPreferences = {
  trackingEnabled: boolean;
  showSensitiveBanner: boolean;
};

const DEFAULT_PREFS: WellbeingPreferences = {
  trackingEnabled: true,
  showSensitiveBanner: true,
};

async function getStoredPreferences(): Promise<WellbeingPreferences> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) return DEFAULT_PREFS;
    const parsed = JSON.parse(value);
    return {
      ...DEFAULT_PREFS,
      ...(parsed || {}),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

async function setStoredPreferences(prefs: WellbeingPreferences) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export const wellbeingPreferencesService = {
  async getPreferences() {
    return getStoredPreferences();
  },
  async updatePreferences(partial: Partial<WellbeingPreferences>) {
    const current = await getStoredPreferences();
    const updated = { ...current, ...partial };
    await setStoredPreferences(updated);
    return updated;
  },
  async resetPreferences() {
    await setStoredPreferences(DEFAULT_PREFS);
    return DEFAULT_PREFS;
  },
  DEFAULT_PREFS,
};

export function useWellbeingPreferences() {
  const [preferences, setPreferences] = useState<WellbeingPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStoredPreferences().then((prefs) => {
      if (mounted) {
        setPreferences(prefs);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updatePreference = useCallback(async (partial: Partial<WellbeingPreferences>) => {
    setLoading(true);
    const updated = await wellbeingPreferencesService.updatePreferences(partial);
    setPreferences(updated);
    setLoading(false);
    return updated;
  }, []);

  return {
    preferences,
    setPreference: updatePreference,
    loading,
  };
}

