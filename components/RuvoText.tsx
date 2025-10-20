import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Fonts } from '@/constants/fonts';

type RuvoTextProps = RNTextProps & {
  variant?: 'regular' | 'semiBold' | 'bold';
};

export default function RuvoText({ 
  variant = 'regular', 
  style, 
  children, 
  ...props 
}: RuvoTextProps) {
  const fontFamily = variant === 'bold' ? Fonts.bold : 
                    variant === 'semiBold' ? Fonts.semiBold : 
                    Fonts.regular;

  return (
    <RNText 
      style={[{ fontFamily }, style]} 
      {...props}
    >
      {children}
    </RNText>
  );
}
