export type Interest = {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
};

export type Source = {
  id: string;
  name: string;
  verified: boolean;
  url: string;
};

export type Signal = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  sourceId: string;
  sourceName: string;
  verified: boolean;
  tags: string[];
  url: string;
  relevanceScore: number;
  timestamp: Date;
  imageUrl?: string;
  saved: boolean;
  liked: boolean;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
  signalId?: string;
};

export type TrendingTopic = {
  id: string;
  name: string;
  count: number;
  category: string;
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  interests: string[];
  sources: string[];
  profileImage?: string;
  isPremium: boolean;
  language: 'en' | 'ko';
  location?: {
    latitude: number;
    longitude: number;
    country: string;
    countryCode: string;
    region: string;
    city: string;
    timezone: string;
  };
};

export type CustomAlertType = 'album_release' | 'product_announcement' | 'earnings_report' | 'price_change' | 'event' | 'news_mention' | 'general';

export type CustomAlert = {
  id: string;
  userId: string;
  type: CustomAlertType;
  title: string;
  description: string;
  keywords: string[];
  entities: {
    artists?: string[];
    companies?: string[];
    products?: string[];
    people?: string[];
    topics?: string[];
  };
  conditions?: {
    priceThreshold?: number;
    dateRange?: { start: Date; end: Date };
    sources?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  triggeredCount: number;
  lastTriggered?: Date;
};

export type AlertMatch = {
  alertId: string;
  signalId: string;
  matchScore: number;
  matchedKeywords: string[];
  timestamp: Date;
};