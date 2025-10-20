import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, Search as SearchIcon, SlidersHorizontal } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { TRENDING_TOPICS } from '@/constants/mockData';
import { TrendingTopic } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import RuvoButton from '@/components/RuvoButton';
import RuvoIcon from '@/components/RuvoIcon';
import { Animated } from 'react-native';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const insets = useSafeAreaInsets();

  const filteredTopics = TRENDING_TOPICS.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderTrendingTopic = (topic: TrendingTopic) => (
    <TouchableOpacity key={topic.id} style={styles.topicCard} activeOpacity={0.9}>
      <View style={styles.topicHeader}>
        <RuvoIcon>
          <TrendingUp size={20} color={Colors.text.inverse} />
        </RuvoIcon>
        <View style={styles.topicInfo}>
          <Text style={styles.topicCategory}>{topic.category}</Text>
          <Text style={styles.topicName}>{topic.name}</Text>
          <Text style={styles.topicCount}>{formatCount(topic.count)} mentions</Text>
        </View>
        <RuvoButton title="Follow" variant="secondary" style={{ paddingVertical: 8, paddingHorizontal: 12 }} textStyle={{ fontSize: 12 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RUVO</Text>
        <Text style={styles.headerTagline}>Cut the Noise. Catch the Signal.</Text>
        <Text style={styles.headerSubtitle}>Discover trending topics and new sources</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchIcon size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <SlidersHorizontal size={18} color={Colors.text.tertiary} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.chipsRow}>
          {['All','Politic','Sport','Education','Games'].map((l, i) => (
            <View key={i} style={[styles.chip, i===0 && styles.chipActive]}>
              <Text style={[styles.chipText, i===0 && styles.chipTextActive]}>{l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.list}>
          {filteredTopics.slice(0,5).map((t) => (
            <View key={t.id} style={styles.listItem}>
              <View style={styles.thumb} />
              <View style={styles.listContent}>
                <Text style={styles.listSection}>{t.category}</Text>
                <Text numberOfLines={2} style={styles.listTitle}>{t.name}</Text>
                <View style={styles.listMetaRow}>
                  <View style={styles.metaAvatar} />
                  <Text style={styles.listMetaText}>McKindney · Feb 27,2023</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lighter,
  },
  largeHeader: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    color: Colors.text.primary,
  },
  largeSubtitle: {
    marginTop: 4,
    color: Colors.text.secondary,
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.text.tertiary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: Colors.card.secondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: Colors.background.white,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.text.onLight,
    fontWeight: '700' as const,
  },
  chipTextActive: {
    color: Colors.text.inverse,
  },
  list: {
    paddingHorizontal: 16,
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
    padding: 10,
  },
  thumb: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  listContent: {
    flex: 1,
  },
  listSection: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  listTitle: {
    marginTop: 4,
    color: Colors.text.primary,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  listMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.border.primary,
  },
  listMetaText: {
    color: Colors.text.tertiary,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginHorizontal: 20,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  topicsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  topicCard: {
    backgroundColor: Colors.card.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfo: {
    flex: 1,
  },
  topicCategory: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  topicCount: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  recommendationsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  recommendationCard: {
    flex: 1,
    backgroundColor: Colors.card.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border.lighter,
  },
  recommendationEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  recommendationDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
