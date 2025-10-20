declare module 'expo-router' {
  // Minimal type shims to satisfy the TypeScript compiler in editor
  export const Tabs: any;
  export const Stack: any;
  export const router: any;
  export function useRouter(): any;
}

export type Interest = {
  id: string;
  name: string;
  emoji: string;
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
};
