import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  cardEvents,
  eventLabel,
  goalEvents,
  liveMinute,
  minuteLabel,
  substitutionEvents,
  type MatchDetail,
  type StoredEvent,
} from '@/lib/sports/match-detail';
import { loadMatchDetail } from '@/lib/sports/load-match';
import { useAuth } from '@/providers/auth-provider';

export default function MatchCenterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const matchId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!isLoggedIn || !matchId) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const stored = await loadMatchDetail(matchId);

        if (!active) {
          return;
        }

        setDetail(stored);
        setError(stored ? null : 'That match is not stored.');
      } catch (caught) {
        if (!active) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : 'Could not load this match.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [isLoggedIn, matchId]);

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  const minute = detail ? liveMinute(detail) : null;
  const kickoff = detail ? new Date(detail.kickoffTime) : null;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              router.back();
            }}
          >
            <ThemedText themeColor="link">Back</ThemedText>
          </Pressable>
          {loading ? (
            <ThemedText themeColor="textSecondary">Loading match.</ThemedText>
          ) : null}
          {error ? <ThemedText themeColor="danger">{error}</ThemedText> : null}
          {detail && kickoff ? (
            <>
              <View
                style={[
                  styles.header,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.meta}>
                  <ThemedText
                    themeColor="textSecondary"
                    style={styles.metaText}
                  >
                    {detail.competition ?? 'Match'}
                  </ThemedText>
                  <ThemedText style={[styles.status, { color: theme.link }]}>
                    {statusText(detail.status)}
                    {minute ? ` · ${minute}` : ''}
                  </ThemedText>
                </View>
                <ScoreRow
                  name={detail.homeTeam.name}
                  score={detail.homeScore}
                />
                <ScoreRow
                  name={detail.awayTeam.name}
                  score={detail.awayScore}
                />
                <ThemedText themeColor="textSecondary" style={styles.metaText}>
                  {kickoff.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {detail.venue ? ` · ${detail.venue}` : ''}
                  {detail.referee ? ` · ${detail.referee}` : ''}
                </ThemedText>
              </View>
              <EventSection title="Timeline" events={detail.events} />
              <EventSection title="Goals" events={goalEvents(detail.events)} />
              <EventSection title="Cards" events={cardEvents(detail.events)} />
              <EventSection
                title="Substitutions"
                events={substitutionEvents(detail.events)}
              />
              <Unavailable
                title="Lineups"
                message="Lineups are not available for this match."
              />
              <Unavailable
                title="Statistics"
                message="Match statistics are not available."
              />
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ScoreRow({ name, score }: { name: string; score: number | null }) {
  return (
    <View style={styles.scoreRow}>
      <ThemedText style={styles.team}>{name}</ThemedText>
      <ThemedText style={styles.score}>{score ?? '–'}</ThemedText>
    </View>
  );
}

function EventSection({
  title,
  events,
}: {
  title: string;
  events: StoredEvent[];
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText style={styles.heading}>{title}</ThemedText>
      {events.length === 0 ? (
        <ThemedText themeColor="textSecondary">None stored.</ThemedText>
      ) : (
        events.map((event) => (
          <View
            key={`${title}-${event.id}`}
            style={[
              styles.event,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={styles.minute}>{minuteLabel(event)}</ThemedText>
            <View style={styles.eventBody}>
              <ThemedText style={styles.eventTitle}>
                {eventLabel(event.type)}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.metaText}>
                {[event.playerName, event.relatedPlayerName, event.teamName]
                  .filter((part) => part)
                  .join(' · ') || event.description}
              </ThemedText>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function Unavailable({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.heading}>{title}</ThemedText>
      <ThemedText themeColor="textSecondary">{message}</ThemedText>
    </View>
  );
}

function statusText(status: string): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'scheduled':
      return 'Upcoming';
    case 'finished':
      return 'Full time';
    case 'postponed':
      return 'Postponed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
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
  header: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  team: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  score: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  section: {
    gap: Spacing.two,
  },
  heading: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  event: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  minute: {
    fontFamily: FontFamily.bold,
    width: 52,
  },
  eventBody: {
    flex: 1,
    gap: Spacing.half,
  },
  eventTitle: {
    fontFamily: FontFamily.semibold,
  },
});
