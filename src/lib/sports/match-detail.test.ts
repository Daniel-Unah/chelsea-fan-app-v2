import { describe, expect, it } from 'vitest';

import {
  cardEvents,
  goalEvents,
  liveMinute,
  minuteLabel,
  parseMatchDetail,
  substitutionEvents,
} from './match-detail.ts';

const match = {
  id: 'match-1',
  kickoff_time: '2026-09-18T19:00:00.000Z',
  status: 'finished',
  home_score: 3,
  away_score: 0,
  venue: 'Gtech Community Stadium',
  referee: 'A Referee',
  home_team: { name: 'Brentford FC', slug: 'brentford-fc' },
  away_team: { name: 'Chelsea FC', slug: 'chelsea-fc' },
  competition: { name: 'English Premier League' },
};

const events = [
  {
    id: 'card',
    event_type: 'yellow_card',
    minute: 40,
    extra_minute: null,
    description: 'Booking',
    team: { name: 'Chelsea FC' },
    player: { name: 'Moises Caicedo' },
    related_player: null,
  },
  {
    id: 'goal',
    event_type: 'goal',
    minute: 67,
    extra_minute: 2,
    description: 'Goal',
    team: { name: 'Brentford FC' },
    player: { name: 'A Striker' },
    related_player: null,
  },
  {
    id: 'sub',
    event_type: 'substitution',
    minute: 70,
    extra_minute: null,
    description: 'Substitution',
    team: { name: 'Chelsea FC' },
    player: { name: 'Cole Palmer' },
    related_player: { name: 'Enzo Fernandez' },
  },
];

describe('match detail', () => {
  it('parses the header and timeline', () => {
    const detail = parseMatchDetail(match, events);

    expect(detail?.homeScore).toBe(3);
    expect(detail?.referee).toBe('A Referee');
    expect(
      goalEvents(detail?.events ?? []).map((event) => event.playerName),
    ).toEqual(['A Striker']);
    expect(minuteLabel(goalEvents(detail?.events ?? [])[0]!)).toBe("67+2'");
    expect(cardEvents(detail?.events ?? [])).toHaveLength(1);
    expect(substitutionEvents(detail?.events ?? [])[0]?.relatedPlayerName).toBe(
      'Enzo Fernandez',
    );
  });

  it('shows a live minute only from stored events', () => {
    const detail = parseMatchDetail({ ...match, status: 'live' }, events);

    expect(liveMinute(detail!)).toBe("70'");
    expect(
      liveMinute(parseMatchDetail({ ...match, status: 'finished' }, events)!),
    ).toBeNull();
    expect(
      liveMinute(parseMatchDetail({ ...match, status: 'live' }, [])!),
    ).toBeNull();
  });
});
