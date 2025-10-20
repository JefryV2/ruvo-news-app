import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

type RuvoIconProps = {
  children: React.ReactNode;
  size?: number;
  background?: 'teal' | 'light' | 'none';
};

export default function RuvoIcon({ children, size = 40, background = 'teal' }: RuvoIconProps) {
  if (background === 'none') {
    return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
  }

  if (background === 'light') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.card.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.gradient.middle, Colors.gradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </LinearGradient>
  );
}


