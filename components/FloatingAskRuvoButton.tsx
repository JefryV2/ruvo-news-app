import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

type FloatingAskRuvoButtonProps = {
  onPress: () => void;
};

export default function FloatingAskRuvoButton({ onPress }: FloatingAskRuvoButtonProps) {
  // For now, we're not using this component due to the error
  // The button is implemented directly in the tab layout
  return null;
}
