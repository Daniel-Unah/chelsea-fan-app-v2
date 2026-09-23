import { FunctionsHttpError } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import {
  isSportsSnapshot,
  type SportsMatch,
  type SportsSnapshot,
} from '../../../supabase/functions/_shared/sports/types';

export default function SportsDataScreen() {
  const { isLoggedIn } = useAuth();
  const theme = useTheme();
  const [snapshot, setSnapshot] = useState<SportsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let active = true;

    async function load() {
      await refresh(setSnapshot, setError, setLoading, () => active);
    }

    void load();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText accessibilityRole="header" type="title">
            Sports data
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Temporary view of Chelsea data from the server. The provider key
            stays on the server.
          </ThemedText>
          {loading ? (
            <ThemedText themeColor="textSecondary">
              Loading sports data
            </ThemedText>
          ) : null}
          {error ? (
            <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          ) : null}
          {snapshot ? <SnapshotDetails snapshot={snapshot} /> : null}
          <Button
            label={loading ? 'Loading' : 'Refresh'}
            disabled={loading}
            onPress={() => {
              void refresh(setSnapshot, setError, setLoading, () => true);
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SnapshotDetails({ snapshot }: { snapshot: SportsSnapshot }) {
  const focus = snapshot.match;

  return (
    <>
      <ThemedText type="title">{snapshot.team.name}</ThemedText>
      <ThemedText themeColor="textSecondary">
        {snapshot.squad.length} squad players · {snapshot.competitions.length}{' '}
        competitions
      </ThemedText>
      <ThemedText>
        {snapshot.competitions
          .map((competition) => competition.name)
          .join(', ')}
      </ThemedText>
      <ThemedText themeColor="textSecondary">Squad</ThemedText>
      <ThemedText>
        {snapshot.squad
          .slice(0, 8)
          .map((player) => player.name)
          .join(', ')}
      </ThemedText>
      <MatchList title="Live" matches={snapshot.liveMatches} />
      <MatchList title="Upcoming" matches={snapshot.upcomingMatches} />
      <MatchList title="Recent" matches={snapshot.recentMatches} />
      {focus ? (
        <>
          <ThemedText themeColor="textSecondary">Match detail</ThemedText>
          <ThemedText>
            {focus.homeTeamName} {scoreText(focus)} {focus.awayTeamName}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {focus.competition.name}
          </ThemedText>
          <ThemedText themeColor="textSecondary">Events</ThemedText>
          {snapshot.events.length === 0 ? (
            <ThemedText>No events returned for the selected match.</ThemedText>
          ) : (
            snapshot.events.map((event) => (
              <ThemedText key={event.externalId}>
                {`${event.minute ?? '–'}' ${event.type}: ${event.playerName ?? 'Unknown'} (${event.detail})`}
              </ThemedText>
            ))
          )}
        </>
      ) : (
        <ThemedText>No match was available to inspect.</ThemedText>
      )}
    </>
  );
}

function MatchList({
  title,
  matches,
}: {
  title: string;
  matches: SportsMatch[];
}) {
  return (
    <>
      <ThemedText themeColor="textSecondary">{title}</ThemedText>
      {matches.length === 0 ? (
        <ThemedText>None</ThemedText>
      ) : (
        matches.map((match) => (
          <ThemedText key={match.externalId}>
            {match.homeTeamName} {scoreText(match)} {match.awayTeamName}
          </ThemedText>
        ))
      )}
    </>
  );
}

function scoreText(match: SportsMatch): string {
  if (match.homeScore === null || match.awayScore === null) {
    return 'vs';
  }

  return `${match.homeScore}-${match.awayScore}`;
}

async function refresh(
  setSnapshot: (snapshot: SportsSnapshot | null) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  isActive: () => boolean,
) {
  const client = getSupabaseClient();

  if (!client) {
    setError('Supabase is not configured.');
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  const { data, error } = await client.functions.invoke('sports-data', {
    method: 'GET',
  });

  if (!isActive()) {
    return;
  }

  if (isRecord(data) && typeof data.error === 'string') {
    setSnapshot(null);
    setError(data.error);
    setLoading(false);
    return;
  }

  if (error || !isSportsSnapshot(data)) {
    setSnapshot(null);
    setError(await readFunctionError(error));
    setLoading(false);
    return;
  }

  setSnapshot(data);
  setLoading(false);
}

async function readFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json();

      if (isRecord(body) && typeof body.error === 'string') {
        return body.error;
      }
    } catch {
      return 'Sports data could not be loaded.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Sports data could not be loaded.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
});
