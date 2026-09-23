import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterChips } from '@/components/sports/filter-chips';
import { MatchCard } from '@/components/sports/match-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useStoredMatches } from '@/hooks/use-stored-matches';
import {
  competitionNames,
  filterMatches,
  type MatchGroup,
  type StoredMatch,
} from '@/lib/sports/matches';

const GROUPS: { id: MatchGroup; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
];

export default function MatchesScreen() {
  const { matches, error, loading } = useStoredMatches();
  const [group, setGroup] = useState<MatchGroup>('upcoming');
  const [competition, setCompetition] = useState('all');
  const competitions = competitionNames(matches);
  const visible = filterMatches(
    matches,
    group,
    competition === 'all' ? null : competition,
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={visible}
          keyExtractor={(match) => match.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText accessibilityRole="header" type="title">
                Matches
              </ThemedText>
              <FilterChips
                options={GROUPS}
                selectedId={group}
                onSelect={(id) => {
                  if (id === 'live' || id === 'upcoming' || id === 'results') {
                    setGroup(id);
                  }
                }}
              />
              <FilterChips
                options={[
                  { id: 'all', label: 'All competitions' },
                  ...competitions.map((name) => ({ id: name, label: name })),
                ]}
                selectedId={competition}
                onSelect={setCompetition}
              />
              {loading ? (
                <ThemedText themeColor="textSecondary">
                  Loading matches.
                </ThemedText>
              ) : null}
              {error ? (
                <ThemedText themeColor="danger">{error}</ThemedText>
              ) : null}
              {!loading && !error && visible.length === 0 ? (
                <ThemedText themeColor="textSecondary">
                  {emptyMessage(group)}
                </ThemedText>
              ) : null}
            </View>
          }
          renderItem={({ item }) => <MatchRow match={item} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function MatchRow({ match }: { match: StoredMatch }) {
  return <MatchCard match={match} />;
}

function Separator() {
  return <View style={styles.separator} />;
}

function emptyMessage(group: MatchGroup): string {
  if (group === 'live') {
    return 'No match is live.';
  }

  if (group === 'results') {
    return 'No results are stored yet.';
  }

  return 'No upcoming matches are stored.';
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
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
});
