import type { StoredMatch } from './matches.ts';

export type StoredEvent = {
  id: string;
  type: string;
  minute: number | null;
  extraMinute: number | null;
  description: string;
  teamName: string | null;
  playerName: string | null;
  relatedPlayerName: string | null;
};

export type MatchDetail = StoredMatch & {
  referee: string | null;
  events: StoredEvent[];
};

const GOAL_TYPES = ['goal', 'own_goal', 'penalty_goal', 'missed_penalty'];
const CARD_TYPES = ['yellow_card', 'red_card'];
const SUBSTITUTION_TYPES = ['substitution'];

export function parseMatchDetail(
  match: unknown,
  events: unknown,
): MatchDetail | null {
  if (!isRecord(match) || typeof match.id !== 'string') {
    return null;
  }

  const parsed = parseStoredMatchRow(match);

  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    referee: typeof match.referee === 'string' ? match.referee : null,
    events: parseEvents(events),
  };
}

export function orderedEvents(events: StoredEvent[]): StoredEvent[] {
  return [...events].sort((left, right) => {
    const minute = (left.minute ?? -1) - (right.minute ?? -1);

    if (minute !== 0) {
      return minute;
    }

    return (left.extraMinute ?? 0) - (right.extraMinute ?? 0);
  });
}

export function goalEvents(events: StoredEvent[]): StoredEvent[] {
  return orderedEvents(
    events.filter((event) => GOAL_TYPES.includes(event.type)),
  );
}

export function cardEvents(events: StoredEvent[]): StoredEvent[] {
  return orderedEvents(
    events.filter((event) => CARD_TYPES.includes(event.type)),
  );
}

export function substitutionEvents(events: StoredEvent[]): StoredEvent[] {
  return orderedEvents(
    events.filter((event) => SUBSTITUTION_TYPES.includes(event.type)),
  );
}

export function liveMinute(detail: MatchDetail): string | null {
  if (detail.status !== 'live') {
    return null;
  }

  const latest = orderedEvents(detail.events).reduce<StoredEvent | undefined>(
    (current, event) => (event.minute !== null ? event : current),
    undefined,
  );

  return latest ? minuteLabel(latest) : null;
}

export function minuteLabel(event: StoredEvent): string {
  if (event.minute === null) {
    return '';
  }

  if (event.extraMinute) {
    return `${event.minute}+${event.extraMinute}'`;
  }

  return `${event.minute}'`;
}

export function eventLabel(type: string): string {
  switch (type) {
    case 'goal':
      return 'Goal';
    case 'own_goal':
      return 'Own goal';
    case 'penalty_goal':
      return 'Penalty';
    case 'missed_penalty':
      return 'Missed penalty';
    case 'yellow_card':
      return 'Yellow card';
    case 'red_card':
      return 'Red card';
    case 'substitution':
      return 'Substitution';
    case 'var':
      return 'VAR';
    case 'kickoff':
      return 'Kickoff';
    case 'halftime':
      return 'Half time';
    case 'fulltime':
      return 'Full time';
    default:
      return 'Event';
  }
}

function parseStoredMatchRow(
  match: Record<string, unknown>,
): StoredMatch | null {
  if (
    typeof match.id !== 'string' ||
    typeof match.kickoff_time !== 'string' ||
    typeof match.status !== 'string'
  ) {
    return null;
  }

  const homeTeam = teamNamed(match.home_team);
  const awayTeam = teamNamed(match.away_team);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  return {
    id: match.id,
    kickoffTime: match.kickoff_time,
    status: match.status,
    homeScore: typeof match.home_score === 'number' ? match.home_score : null,
    awayScore: typeof match.away_score === 'number' ? match.away_score : null,
    venue: typeof match.venue === 'string' ? match.venue : null,
    homeTeam,
    awayTeam,
    competition: labelNamed(match.competition),
  };
}

function parseEvents(value: unknown): StoredEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.event_type !== 'string' ||
      typeof item.description !== 'string'
    ) {
      return [];
    }

    return [
      {
        id: item.id,
        type: item.event_type,
        minute: typeof item.minute === 'number' ? item.minute : null,
        extraMinute:
          typeof item.extra_minute === 'number' ? item.extra_minute : null,
        description: item.description,
        teamName: labelNamed(item.team),
        playerName: labelNamed(item.player),
        relatedPlayerName: labelNamed(item.related_player),
      },
    ];
  });
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
