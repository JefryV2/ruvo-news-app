import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User as UserIcon, ChevronLeft, Moon, Sun, Settings, LogOut, Info, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';

export default function ProfileScreen() {
  const { user } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RUVO</Text>
        <Text style={styles.headerTagline}>Cut the Noise. Catch the Signal.</Text>
      </View>
      
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navIcon}>
          <ChevronLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Me</Text>
        <TouchableOpacity style={styles.navIcon}>
          <Moon size={18} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}> 
            <UserIcon size={28} color={Colors.primary} />
          </View>
          <Text style={styles.username}>{user?.username || 'Swathi Krishnan'}</Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <View style={styles.listCard}>
            <Row icon={<Dot />} title="Active Status" subtitle="On" />
            <Row icon={<Dot />} title="Username" subtitle={user?.username ? `anonymous.me/${user.username}` : 'anonymous.me/username'} trailing={<Info size={16} color={Colors.text.secondary} />} />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.listCard}>
            <Row icon={<Dot />} title="SMS" />
            <Row icon={<Dot />} title="Help" trailing={<MessageCircle size={16} color={Colors.text.secondary} />} />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.listCard}>
            <Row icon={<Dot />} title="Account Settings" trailing={<Settings size={16} color={Colors.text.secondary} />} />
            <Row icon={<Dot />} title="Help" />
            <Row icon={<Dot />} title="Logout" trailing={<LogOut size={16} color={Colors.alert} />} titleStyle={{ color: Colors.alert }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Dot() {
  return (
    <View style={styles.dot} />
  );
}

type RowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  titleStyle?: any;
};

function Row({ icon, title, subtitle, trailing, titleStyle }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBubble}>{icon}</View>
        <View>
          <Text style={[styles.rowTitle, titleStyle]}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    fontFamily: Fonts.bold,
    color: Colors.text.onLight,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: Fonts.regular,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.text.primary,
  },
  sectionBlock: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  listCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});
