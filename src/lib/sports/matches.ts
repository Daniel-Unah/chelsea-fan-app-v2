export const FOCUS_TEAM_SLUG = 'chelsea-fc';

export type StoredMatch = {
  id: string;
  kickoffTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  homeTeam: { name: string; slug: string };
  awayTeam: { name: string; slug: string };
  competition: string | null;
};

export type MatchGroup = 'live' | 'upcoming' | 'results';

export function parseStoredMatches(rows: unknown): StoredMatch[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap(parseStoredMatch);
}

export function involvesTeam(match: StoredMatch, slug: string): boolean {
  return match.homeTeam.slug === slug || match.awayTeam.slug === slug;
}

export function liveMatch(
  matches: StoredMatch[],
  slug: string,
): StoredMatch | null {
  return (
    matches.find(
      (match) => match.status === 'live' && involvesTeam(match, slug),
    ) ?? null
  );
}

export function nextMatch(
  matches: StoredMatch[],
  slug: string,
  now: Date,
): StoredMatch | null {
  return (
    matches
      .filter(
        (match) =>
          match.status === 'scheduled' &&
          involvesTeam(match, slug) &&
          Date.parse(match.kickoffTime) >= now.getTime(),
      )
      .sort(
        (left, right) =>
          Date.parse(left.kickoffTime) - Date.parse(right.kickoffTime),
      )[0] ?? null
  );
}

export function recentResults(
  matches: StoredMatch[],
  slug: string,
  limit = 3,
): StoredMatch[] {
  return matches
    .filter((match) => match.status === 'finished' && involvesTeam(match, slug))
    .sort(
      (left, right) =>
        Date.parse(right.kickoffTime) - Date.parse(left.kickoffTime),
    )
    .slice(0, limit);
}

export function competitionNames(matches: StoredMatch[]): string[] {
  return [
    ...new Set(
      matches.flatMap((match) =>
        match.competition ? [match.competition] : [],
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export function filterMatches(
  matches: StoredMatch[],
  group: MatchGroup,
  competition: string | null,
): StoredMatch[] {
  return matches
    .filter((match) => matchGroup(match.status) === group)
    .filter(
      (match) => competition === null || match.competition === competition,
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.kickoffTime);
      const rightTime = Date.parse(right.kickoffTime);
      return group === 'results' ? rightTime - leftTime : leftTime - rightTime;
    });
}

function matchGroup(status: string): MatchGroup | null {
  if (status === 'live') {
    return 'live';
  }

  if (status === 'scheduled' || status === 'postponed') {
    return 'upcoming';
  }

  if (status === 'finished') {
    return 'results';
  }

  return null;
}

function parseStoredMatch(value: unknown): StoredMatch[] {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.kickoff_time !== 'string' ||
    typeof value.status !== 'string'
  ) {
    return [];
  }

  const homeTeam = teamNamed(value.home_team);
  const awayTeam = teamNamed(value.away_team);

  if (!homeTeam || !awayTeam) {
    return [];
  }

  return [
    {
      id: value.id,
      kickoffTime: value.kickoff_time,
      status: value.status,
      homeScore: score(value.home_score),
      awayScore: score(value.away_score),
      venue: typeof value.venue === 'string' ? value.venue : null,
      homeTeam,
      awayTeam,
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

function labelNamed(value: unknown): string | null {
  if (Array.isArray(value)) {
    return labelNamed(value[0]);
  }

  if (!isRecord(value) || typeof value.name !== 'string') {
    return null;
  }

  return value.name;
}

function score(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
