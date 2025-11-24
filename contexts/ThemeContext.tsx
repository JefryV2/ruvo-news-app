import React, { createContext, useContext, useMemo, useState } from 'react';
import Colors from '@/constants/colors';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';

type ThemeColors = typeof Colors;

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DarkColors: typeof Colors = {
  ...Colors,
  primary: '#20B2AA', // Turquoise accent for dark theme
  background: {
    ...Colors.background,
    primary: '#0F0F0F', // Dark background
    secondary: '#1A1A1A', // Slightly lighter for contrast
    tertiary: '#222222', // Even lighter for cards
    white: '#1E1E1E', // Card background
    light: '#141414', // Subtle background
    dark: '#000000',
    darkSecondary: '#1A1A1A',
  },
  text: {
    ...Colors.text,
    primary: '#FFFFFF', // Pure white for better contrast in dark mode
    secondary: '#B0B0B0', // Medium gray
    tertiary: '#808080', // Light gray
    inverse: '#0F0F0F', // Dark for light backgrounds
    onDark: '#FFFFFF',
    onLight: '#F0F0F0',
    muted: '#666666', // Darker muted text
    light: '#1E1E1E', // Dark background equivalent
  },
  card: {
    ...Colors.card,
    primary: '#1A1A1A',
    secondary: '#1E1E1E',
    elevated: '#222222',
    overlay: 'rgba(0,0,0,0.7)',
    white: '#1E1E1E',
    light: '#1A1A1A',
  },
  border: {
    ...Colors.border,
    light: '#2A2A2A',
    lighter: '#252525',
    primary: '#333333',
    dark: '#404040',
  },
  shadow: {
    sm: 'rgba(0,0,0,0.3)',
    md: 'rgba(0,0,0,0.5)',
    lg: 'rgba(0,0,0,0.7)',
  },
  overlay: {
    ...Colors.overlay,
    light: 'rgba(30,30,30,0.8)',
    dark: 'rgba(0,0,0,0.9)',
    teal: 'rgba(32, 178, 170, 0.2)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = Appearance.getColorScheme();
  const [mode, setMode] = useState<ThemeMode>((system as ThemeMode) || 'light');

  const colors = useMemo(() => (mode === 'dark' ? DarkColors : Colors), [mode]);

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


