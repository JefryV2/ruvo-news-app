import React, { useRef, useEffect } from 'react';
import { Text, TouchableOpacity, Animated, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { theme } from '@/themes';

type Variant = 'primary' | 'secondary' | 'ghost';

type RuvoButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export default function RuvoButton({ title, onPress, variant = 'primary', disabled, style, textStyle, leftIcon, rightIcon }: RuvoButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, [scale]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }).start();
  };

  if (variant === 'ghost') {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: theme.radius.lg,
            backgroundColor: Colors.card.secondary,
            borderWidth: 1,
            borderColor: Colors.border.lighter,
            opacity: disabled ? 0.6 : 1,
            ...(style || {}),
          }}
          activeOpacity={0.85}
        >
          {leftIcon}
          <Text style={{ color: Colors.text.light, fontWeight: '700', fontFamily: Fonts.bold, letterSpacing: -0.2, ...(textStyle || {}) }}>{title}</Text>
          {rightIcon}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: theme.radius.xl,
            backgroundColor: Colors.background.white,
            borderWidth: 1,
            borderColor: Colors.border.light,
            opacity: disabled ? 0.6 : 1,
            ...(style || {}),
            ...theme.shadow.sm,
          }}
          activeOpacity={0.85}
        >
          {leftIcon}
          <Text style={{ color: Colors.text.primary, fontWeight: '700', fontFamily: Fonts.bold, letterSpacing: -0.2, ...(textStyle || {}) }}>{title}</Text>
          {rightIcon}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} disabled={disabled} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.9}>
        <LinearGradient
          colors={[Colors.gradient.middle, Colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: theme.radius.xl,
            opacity: disabled ? 0.6 : 1,
            ...(style || {}),
            ...theme.shadow.md,
          }}
        >
          {leftIcon}
          <Text style={{ color: Colors.text.inverse, fontWeight: '700', fontFamily: Fonts.bold, letterSpacing: -0.2, ...(textStyle || {}) }}>{title}</Text>
          {rightIcon}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}


