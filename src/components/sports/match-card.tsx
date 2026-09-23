import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { StoredMatch } from '@/lib/sports/matches';

type MatchCardProps = {
  match: StoredMatch;
  emphasis?: boolean;
};

export function MatchCard({ match, emphasis = false }: MatchCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const kickoff = new Date(match.kickoffTime);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        router.push(`/match/${match.id}` as Href);
      }}
      style={[
        styles.card,
        {
          backgroundColor: emphasis
            ? theme.backgroundSelected
            : theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.meta}>
        <ThemedText themeColor="textSecondary" style={styles.metaText}>
          {match.competition ?? 'Match'}
        </ThemedText>
        <ThemedText
          style={[styles.status, { color: statusColor(match.status, theme) }]}
        >
          {statusLabel(match.status)}
        </ThemedText>
      </View>
      <View style={styles.scoreline}>
        <ThemedText style={styles.team}>{match.homeTeam.name}</ThemedText>
        <ThemedText style={styles.score}>{scoreText(match)}</ThemedText>
        <ThemedText style={[styles.team, styles.away]}>
          {match.awayTeam.name}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.metaText}>
        {kickoff.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
        {match.venue ? ` · ${match.venue}` : ''}
      </ThemedText>
    </Pressable>
  );
}

function scoreText(match: StoredMatch): string {
  if (match.homeScore === null || match.awayScore === null) {
    return 'vs';
  }

  return `${match.homeScore}-${match.awayScore}`;
}

function statusLabel(status: string): string {
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

function statusColor(
  status: string,
  theme: { link: string; textSecondary: string; danger: string },
): string {
  if (status === 'live') {
    return theme.danger;
  }

  if (status === 'scheduled') {
    return theme.link;
  }

  return theme.textSecondary;
}

const styles = StyleSheet.create({
  card: {
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
  scoreline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  team: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  away: {
    textAlign: 'right',
  },
  score: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
    minWidth: 56,
    textAlign: 'center',
  },
});
