import Colors from '@/constants/colors';

export const theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
  },
  shadow: {
    sm: {
      shadowColor: Colors.shadow.sm,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: Colors.shadow.md,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  typography: {
    rounded: {
      fontFamily: undefined,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
    },
  },
};

export type Theme = typeof theme;


