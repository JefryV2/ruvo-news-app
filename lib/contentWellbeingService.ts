import AsyncStorage from '@react-native-async-storage/async-storage';
import { Signal } from '@/types';

const STORAGE_KEY = 'wellbeing_article_stats';
const MAX_DAYS_STORED = 14;

const DISTRESS_TAGS = [
  'conflict',
  'war',
  'violence',
  'crime',
  'tragedy',
  'disaster',
  'pandemic',
  'politics',
  'layoffs',
  'recession',
  'terrorism',
];

const DISTRESS_KEYWORDS = [
  'attack',
  'shooting',
  'earthquake',
  'hurricane',
  'fired',
  'riot',
  'protest',
  'ban',
  'death',
  'crash',
  'corruption',
];

type StoredEntry = {
  signalId: string;
  title: string;
  category: string;
  tags: string[];
  durationMs: number;
  timestamp: number;
  isDistressing: boolean;
};

type DailyStats = {
  date: string;
  totalDurationMs: number;
  distressDurationMs: number;
  categories: Record<string, number>;
  entries: StoredEntry[];
};

type StoredData = Record<string, DailyStats>;

const safeParse = (value: string | null): StoredData => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as StoredData;
    }
    return {};
  } catch {
    return {};
  }
};

const saveData = async (data: StoredData) => {
  const keys = Object.keys(data).sort((a, b) => (a > b ? -1 : 1));
  const trimmed: StoredData = {};
  keys.slice(0, MAX_DAYS_STORED).forEach((key) => {
    trimmed[key] = data[key];
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
};

const getTodayKey = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

const normaliseText = (text?: string) => text?.toLowerCase() ?? '';

const evaluateDistress = (signal: Signal) => {
  const reasons: string[] = [];
  const tags = (signal.tags || []).map((tag) => tag.toLowerCase());

  tags.forEach((tag) => {
    if (DISTRESS_TAGS.includes(tag)) {
      reasons.push(`Tag: ${tag}`);
    }
  });

  const title = normaliseText(signal.title);
  DISTRESS_KEYWORDS.forEach((keyword) => {
    if (title.includes(keyword)) {
      reasons.push(`Keyword: ${keyword}`);
    }
  });

  return {
    isDistressing: reasons.length > 0,
    reasons,
  };
};

export const contentWellbeingService = {
  evaluateSignal(signal: Signal) {
    return evaluateDistress(signal);
  },

  async logArticleView(signal: Signal, durationMs: number) {
    if (!signal || durationMs <= 0) return;

    const data = safeParse(await AsyncStorage.getItem(STORAGE_KEY));
    const todayKey = getTodayKey();

    if (!data[todayKey]) {
      data[todayKey] = {
        date: todayKey,
        totalDurationMs: 0,
        distressDurationMs: 0,
        categories: {},
        entries: [],
      };
    }

    const category = signal.category || signal.tags?.[0] || 'uncategorized';
    const tags = signal.tags || [];
    const distressInfo = evaluateDistress(signal);

    data[todayKey].totalDurationMs += durationMs;
    data[todayKey].categories[category] =
      (data[todayKey].categories[category] || 0) + durationMs;

    if (distressInfo.isDistressing) {
      data[todayKey].distressDurationMs += durationMs;
    }

    data[todayKey].entries.push({
      signalId: signal.id,
      title: signal.title,
      category,
      tags,
      durationMs,
      timestamp: Date.now(),
      isDistressing: distressInfo.isDistressing,
    });

    await saveData(data);
  },

  async getRecentStats(days = 7) {
    const data = safeParse(await AsyncStorage.getItem(STORAGE_KEY));
    const keys = Object.keys(data).sort();
    return keys
      .slice(-days)
      .map((key) => data[key])
      .filter(Boolean);
  },

  async clearAll() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};

export type ContentWellbeingStats = Awaited<
  ReturnType<typeof contentWellbeingService.getRecentStats>
>;

