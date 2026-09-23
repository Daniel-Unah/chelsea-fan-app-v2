import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchCard } from '@/components/sports/match-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStoredMatches } from '@/hooks/use-stored-matches';
import { useTheme } from '@/hooks/use-theme';
import {
  FOCUS_TEAM_SLUG,
  liveMatch,
  nextMatch,
  recentResults,
} from '@/lib/sports/matches';

export default function HomeScreen() {
  const theme = useTheme();
  const { matches, error, loading } = useStoredMatches();
  const now = new Date();
  const live = liveMatch(matches, FOCUS_TEAM_SLUG);
  const next = nextMatch(matches, FOCUS_TEAM_SLUG, now);
  const results = recentResults(matches, FOCUS_TEAM_SLUG);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText accessibilityRole="header" type="title">
            Home
          </ThemedText>
          {loading ? (
            <ThemedText themeColor="textSecondary">Loading matches.</ThemedText>
          ) : null}
          {error ? <ThemedText themeColor="danger">{error}</ThemedText> : null}
          <Section title="Live">
            {live ? (
              <MatchCard match={live} emphasis />
            ) : (
              <ThemedText themeColor="textSecondary">
                No match is live.
              </ThemedText>
            )}
          </Section>
          <Section title="Next match">
            {next ? (
              <MatchCard match={next} emphasis />
            ) : (
              <ThemedText themeColor="textSecondary">
                No upcoming match is stored.
              </ThemedText>
            )}
          </Section>
          <Section title="Recent results">
            {results.length > 0 ? (
              results.map((match) => <MatchCard key={match.id} match={match} />)
            ) : (
              <ThemedText themeColor="textSecondary">
                No results are stored yet.
              </ThemedText>
            )}
          </Section>
          <Section title="Community">
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText themeColor="textSecondary">
                No community posts yet.
              </ThemedText>
            </View>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.heading}>{title}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  heading: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
});
