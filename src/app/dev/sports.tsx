import { FunctionsHttpError } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';

type StoredMatch = {
  id: string;
  kickoff_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  home_team: { name: string; slug: string } | null;
  away_team: { name: string; slug: string } | null;
  competition: { name: string } | null;
};

export default function SportsDataScreen() {
  const { isLoggedIn } = useAuth();
  const theme = useTheme();
  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadMatches = useCallback(async () => {
    const client = getSupabaseClient();

    if (!client) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [matchResult, eventResult] = await Promise.all([
      client
        .from('matches')
        .select(
          'id, kickoff_time, status, home_score, away_score, venue, home_team:teams!matches_home_team_id_fkey(name, slug), away_team:teams!matches_away_team_id_fkey(name, slug), competition:competitions(name)',
        )
        .order('kickoff_time', { ascending: true }),
      client.from('match_events').select('id', { count: 'exact', head: true }),
    ]);

    if (matchResult.error) {
      setError(matchResult.error.message);
      setLoading(false);
      return;
    }

    setMatches(
      (matchResult.data ?? []).flatMap(toStoredMatch).filter(isChelseaMatch),
    );
    setEventCount(eventResult.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const client = getSupabaseClient();

    if (!client) {
      return;
    }

    let active = true;

    async function loadStoredMatches() {
      if (!client) {
        return;
      }

      const [matchResult, eventResult] = await Promise.all([
        client
          .from('matches')
          .select(
            'id, kickoff_time, status, home_score, away_score, venue, home_team:teams!matches_home_team_id_fkey(name, slug), away_team:teams!matches_away_team_id_fkey(name, slug), competition:competitions(name)',
          )
          .order('kickoff_time', { ascending: true }),
        client
          .from('match_events')
          .select('id', { count: 'exact', head: true }),
      ]);

      if (!active) {
        return;
      }

      if (matchResult.error) {
        setError(matchResult.error.message);
        setLoading(false);
        return;
      }

      setMatches(
        (matchResult.data ?? []).flatMap(toStoredMatch).filter(isChelseaMatch),
      );
      setEventCount(eventResult.count ?? 0);
      setLoading(false);
    }

    void loadStoredMatches();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  async function sync() {
    const client = getSupabaseClient();

    if (!client) {
      setError('Supabase is not configured.');
      return;
    }

    setSyncing(true);
    setError(null);
    const { error: syncError } = await client.functions.invoke('sports-sync', {
      method: 'POST',
    });
    setSyncing(false);

    if (syncError) {
      setError(await readFunctionError(syncError));
      return;
    }

    await loadMatches();
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText accessibilityRole="header" type="title">
            Stored matches
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Chelsea matches loaded from the database. Sync runs on the server.
          </ThemedText>
          {loading ? (
            <ThemedText themeColor="textSecondary">Loading matches</ThemedText>
          ) : null}
          {error ? (
            <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          ) : null}
          {!loading && matches.length === 0 ? (
            <ThemedText>No matches stored yet.</ThemedText>
          ) : null}
          {matches.map((match) => (
            <ThemedText key={match.id}>
              {match.home_team?.name ?? 'Home'} {scoreText(match)}{' '}
              {match.away_team?.name ?? 'Away'}
              {' · '}
              {match.status}
              {match.competition ? ` · ${match.competition.name}` : ''}
            </ThemedText>
          ))}
          {!loading && matches.length > 0 ? (
            <ThemedText themeColor="textSecondary">
              {eventCount} stored events
            </ThemedText>
          ) : null}
          <Button
            label={syncing ? 'Syncing' : 'Sync'}
            disabled={syncing}
            onPress={() => {
              void sync();
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function toStoredMatch(value: unknown): StoredMatch[] {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.kickoff_time !== 'string'
  ) {
    return [];
  }

  if (typeof value.status !== 'string') {
    return [];
  }

  return [
    {
      id: value.id,
      kickoff_time: value.kickoff_time,
      status: value.status,
      home_score:
        typeof value.home_score === 'number' ? value.home_score : null,
      away_score:
        typeof value.away_score === 'number' ? value.away_score : null,
      venue: typeof value.venue === 'string' ? value.venue : null,
      home_team: teamNamed(value.home_team),
      away_team: teamNamed(value.away_team),
      competition: labelNamed(value.competition),
    },
  ];
}

function teamNamed(value: unknown): { name: string; slug: string } | null {
  if (Array.isArray(value)) {
    return teamNamed(value[0]);
  }

  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.slug !== 'string'
  ) {
    return null;
  }

  return { name: value.name, slug: value.slug };
}

function labelNamed(value: unknown): { name: string } | null {
  if (Array.isArray(value)) {
    return labelNamed(value[0]);
  }

  if (!isRecord(value) || typeof value.name !== 'string') {
    return null;
  }

  return { name: value.name };
}

function isChelseaMatch(match: StoredMatch): boolean {
  return (
    match.home_team?.slug === 'chelsea-fc' ||
    match.away_team?.slug === 'chelsea-fc'
  );
}

function scoreText(match: StoredMatch): string {
  if (match.home_score === null || match.away_score === null) {
    return 'vs';
  }

  return `${match.home_score}-${match.away_score}`;
}

async function readFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json();

      if (isRecord(body) && typeof body.error === 'string') {
        return body.error;
      }
    } catch {
      return 'Sync could not be completed.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Sync could not be completed.';
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
