import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.loading': 'Loading...',
    
    // Account Settings
    'account.title': 'Account Settings',
    'account.profile': 'Profile Information',
    'account.notifications': 'Notification Settings',
    'account.privacy': 'Privacy & Security',
    'account.username': 'Username',
    'account.email': 'Email',
    'account.language': 'Language',
    'account.pushNotifications': 'Push Notifications',
    'account.emailNotifications': 'Email Notifications',
    'account.smsNotifications': 'SMS Notifications',
    'account.changePassword': 'Change Password',
    'account.privacySettings': 'Privacy Settings',
    'account.settingsSaved': 'Settings saved successfully!',
    'account.settingsError': 'Failed to save settings',
    
    // Profile
    'profile.me': 'Me',
    'profile.activeStatus': 'Active Status',
    'profile.online': 'Online',
    'profile.offline': 'Offline',
    'profile.interests': 'My Interests',
    'profile.selected': 'selected',
    'profile.preferences': 'Preferences',
    'profile.notifications': 'Notifications',
    'profile.language': 'Language',
    'profile.help': 'Help & Support',
    'profile.account': 'Account',
    'profile.accountSettings': 'Account Settings',
    'profile.exportData': 'Export My Data',
    'profile.deleteAccount': 'Delete Account',
    'profile.logout': 'Logout',
    'profile.viewStats': 'View Profile Stats',
    'profile.hideStats': 'Hide Profile Stats',
    'profile.username': 'Username',
    'profile.anonymousUrl': 'anonymous.me',
    
    // Notifications
    'notifications.pushDesc': 'Receive notifications on your device',
    'notifications.emailDesc': 'Receive notifications via email',
    'notifications.smsDesc': 'Receive notifications via SMS',
    
    // Feed Screen
    'feed.title': 'Feed',
    'feed.breakingNews': 'Breaking News',
    'feed.trending': 'Trending',
    'feed.personalized': 'Personalized',
    'feed.refresh': 'Pull to refresh',
    'feed.loading': 'Loading news...',
    'feed.error': 'Failed to load news',
    'feed.retry': 'Retry',
    'feed.noNews': 'No news available',
    'feed.readMore': 'Read More',
    'feed.readLess': 'Read Less',
    'feed.source': 'Source',
    'feed.published': 'Published',
    'feed.like': 'Like',
    'feed.save': 'Save',
    'feed.share': 'Share',
    
    // Discover Screen
    'discover.title': 'Discover',
    'discover.search': 'Search news...',
    'discover.categories': 'Categories',
    'discover.trendingTopics': 'Trending Topics',
    'discover.recommended': 'Recommended for You',
    'discover.all': 'All',
    'discover.technology': 'Technology',
    'discover.business': 'Business',
    'discover.health': 'Health',
    'discover.sports': 'Sports',
    'discover.entertainment': 'Entertainment',
    'discover.science': 'Science',
    'discover.politics': 'Politics',
    
    // Interest Categories
    'category.tech': 'Technology',
    'category.finance': 'Finance',
    'category.sports': 'Sports',
    'category.health': 'Health',
    'category.science': 'Science',
    'category.entertainment': 'Entertainment',
    'category.music': 'Music',
    'category.gaming': 'Gaming',
    'category.fashion': 'Fashion',
    'category.kpop': 'K-Pop',
    'category.food': 'Food',
    'category.travel': 'Travel',
    'category.localEvents': 'Local Events',
    
    // Navigation
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.community': 'Community',
    'nav.alerts': 'Alerts',
    'nav.profile': 'Profile',
    'nav.chat': 'Chat',
    
    // Common Actions
    'actions.view': 'View',
    'actions.edit': 'Edit',
    'actions.delete': 'Delete',
    'actions.share': 'Share',
    'actions.copy': 'Copy',
    'actions.open': 'Open',
    'actions.close': 'Close',
    'actions.back': 'Back',
    'actions.next': 'Next',
    'actions.previous': 'Previous',
    'actions.finish': 'Finish',
    'actions.skip': 'Skip',
    'actions.continue': 'Continue',
    'actions.done': 'Done',
    
    // Time
    'time.now': 'Now',
    'time.minutesAgo': 'minutes ago',
    'time.hoursAgo': 'hours ago',
    'time.daysAgo': 'days ago',
    'time.weeksAgo': 'weeks ago',
    'time.monthsAgo': 'months ago',
    'time.yearsAgo': 'years ago',
  },
  ko: {
    // Common
    'common.save': '저장',
    'common.cancel': '취소',
    'common.edit': '편집',
    'common.delete': '삭제',
    'common.confirm': '확인',
    'common.success': '성공',
    'common.error': '오류',
    'common.loading': '로딩 중...',
    
    // Account Settings
    'account.title': '계정 설정',
    'account.profile': '프로필 정보',
    'account.notifications': '알림 설정',
    'account.privacy': '개인정보 보호 및 보안',
    'account.username': '사용자명',
    'account.email': '이메일',
    'account.language': '언어',
    'account.pushNotifications': '푸시 알림',
    'account.emailNotifications': '이메일 알림',
    'account.smsNotifications': 'SMS 알림',
    'account.changePassword': '비밀번호 변경',
    'account.privacySettings': '개인정보 설정',
    'account.settingsSaved': '설정이 성공적으로 저장되었습니다!',
    'account.settingsError': '설정 저장에 실패했습니다',
    
    // Profile
    'profile.me': '나',
    'profile.activeStatus': '활성 상태',
    'profile.online': '온라인',
    'profile.offline': '오프라인',
    'profile.interests': '내 관심사',
    'profile.selected': '선택됨',
    'profile.preferences': '환경설정',
    'profile.notifications': '알림',
    'profile.language': '언어',
    'profile.help': '도움말 및 지원',
    'profile.account': '계정',
    'profile.accountSettings': '계정 설정',
    'profile.exportData': '내 데이터 내보내기',
    'profile.deleteAccount': '계정 삭제',
    'profile.logout': '로그아웃',
    'profile.viewStats': '프로필 통계 보기',
    'profile.hideStats': '프로필 통계 숨기기',
    'profile.username': '사용자명',
    'profile.anonymousUrl': 'anonymous.me',
    
    // Notifications
    'notifications.pushDesc': '기기에서 알림을 받습니다',
    'notifications.emailDesc': '이메일로 알림을 받습니다',
    'notifications.smsDesc': 'SMS로 알림을 받습니다',
    
    // Feed Screen
    'feed.title': '피드',
    'feed.breakingNews': '속보',
    'feed.trending': '트렌딩',
    'feed.personalized': '개인화',
    'feed.refresh': '당겨서 새로고침',
    'feed.loading': '뉴스 로딩 중...',
    'feed.error': '뉴스 로드 실패',
    'feed.retry': '다시 시도',
    'feed.noNews': '사용 가능한 뉴스가 없습니다',
    'feed.readMore': '더 읽기',
    'feed.readLess': '간략히',
    'feed.source': '출처',
    'feed.published': '게시됨',
    'feed.like': '좋아요',
    'feed.save': '저장',
    'feed.share': '공유',
    
    // Discover Screen
    'discover.title': '발견',
    'discover.search': '뉴스 검색...',
    'discover.categories': '카테고리',
    'discover.trendingTopics': '트렌딩 주제',
    'discover.recommended': '추천',
    'discover.all': '전체',
    'discover.technology': '기술',
    'discover.business': '비즈니스',
    'discover.health': '건강',
    'discover.sports': '스포츠',
    'discover.entertainment': '엔터테인먼트',
    'discover.science': '과학',
    'discover.politics': '정치',
    
    // Interest Categories
    'category.tech': '기술',
    'category.finance': '금융',
    'category.sports': '스포츠',
    'category.health': '건강',
    'category.science': '과학',
    'category.entertainment': '엔터테인먼트',
    'category.music': '음악',
    'category.gaming': '게임',
    'category.fashion': '패션',
    'category.kpop': '케이팝',
    'category.food': '음식',
    'category.travel': '여행',
    'category.localEvents': '지역 이벤트',
    
    // Navigation
    'nav.home': '홈',
    'nav.search': '검색',
    'nav.community': '커뮤니티',
    'nav.alerts': '알림',
    'nav.profile': '프로필',
    'nav.chat': '채팅',
    
    // Common Actions
    'actions.view': '보기',
    'actions.edit': '편집',
    'actions.delete': '삭제',
    'actions.share': '공유',
    'actions.copy': '복사',
    'actions.open': '열기',
    'actions.close': '닫기',
    'actions.back': '뒤로',
    'actions.next': '다음',
    'actions.previous': '이전',
    'actions.finish': '완료',
    'actions.skip': '건너뛰기',
    'actions.continue': '계속',
    'actions.done': '완료',
    
    // Time
    'time.now': '지금',
    'time.minutesAgo': '분 전',
    'time.hoursAgo': '시간 전',
    'time.daysAgo': '일 전',
    'time.weeksAgo': '주 전',
    'time.monthsAgo': '개월 전',
    'time.yearsAgo': '년 전',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language preference
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('app_language', lang);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
