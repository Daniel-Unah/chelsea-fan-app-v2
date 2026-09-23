import { describe, expect, it } from 'vitest';

import {
  filterMatches,
  liveMatch,
  nextMatch,
  parseStoredMatches,
  recentResults,
  type StoredMatch,
} from './matches.ts';

const chelsea: StoredMatch = {
  id: 'next',
  kickoffTime: '2026-10-10T14:00:00.000Z',
  status: 'scheduled',
  homeScore: null,
  awayScore: null,
  venue: null,
  homeTeam: { name: 'Chelsea FC', slug: 'chelsea-fc' },
  awayTeam: { name: 'AFC Bournemouth', slug: 'afc-bournemouth' },
  competition: 'English Premier League',
};

const finished: StoredMatch = {
  ...chelsea,
  id: 'result',
  kickoffTime: '2026-09-18T19:00:00.000Z',
  status: 'finished',
  homeScore: 3,
  awayScore: 0,
  homeTeam: { name: 'Brentford FC', slug: 'brentford-fc' },
  awayTeam: { name: 'Chelsea FC', slug: 'chelsea-fc' },
};

const other: StoredMatch = {
  ...chelsea,
  id: 'other',
  kickoffTime: '2026-10-10T11:30:00.000Z',
  homeTeam: { name: 'Arsenal FC', slug: 'arsenal-fc' },
  awayTeam: { name: 'Leeds United FC', slug: 'leeds-united-fc' },
};

describe('stored match selection', () => {
  const matches = [other, chelsea, finished];
  const now = new Date('2026-09-23T12:00:00.000Z');

  it('parses a database row', () => {
    expect(
      parseStoredMatches([
        {
          id: '1',
          kickoff_time: '2026-08-24T19:00:00.000Z',
          status: 'finished',
          home_score: 2,
          away_score: 3,
          venue: null,
          home_team: { name: 'Fulham FC', slug: 'fulham-fc' },
          away_team: { name: 'Chelsea FC', slug: 'chelsea-fc' },
          competition: { name: 'English Premier League' },
        },
      ]),
    ).toMatchObject([
      { homeScore: 2, awayScore: 3, competition: 'English Premier League' },
    ]);
  });

  it('picks Chelsea’s next fixture rather than an earlier match', () => {
    expect(nextMatch(matches, 'chelsea-fc', now)?.id).toBe('next');
  });

  it('returns the latest Chelsea result', () => {
    expect(
      recentResults(matches, 'chelsea-fc').map((match) => match.id),
    ).toEqual(['result']);
  });

  it('shows a live card only while Chelsea are playing', () => {
    expect(liveMatch(matches, 'chelsea-fc')).toBeNull();
    expect(liveMatch([{ ...chelsea, status: 'live' }], 'chelsea-fc')?.id).toBe(
      'next',
    );
  });

  it('filters upcoming matches by competition', () => {
    expect(
      filterMatches(matches, 'upcoming', 'English Premier League'),
    ).toHaveLength(2);
    expect(
      filterMatches(matches, 'results', null).map((match) => match.id),
    ).toEqual(['result']);
  });
});
