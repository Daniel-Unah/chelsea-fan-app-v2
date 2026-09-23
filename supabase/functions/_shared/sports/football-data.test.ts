import { describe, expect, it, vi } from 'vitest';

import {
  createFootballDataProvider,
  normalizeMatch,
  normalizeMatchEvents,
  normalizeTeam,
  SportsProviderError,
} from './football-data.ts';
import { loadTeamSnapshot } from './snapshot.ts';
import type { SportsDataProvider, SportsTeam } from './types.ts';

const teamPayload = {
  id: 61,
  name: 'Chelsea FC',
  shortName: 'Chelsea',
  crest: 'https://example.com/chelsea.png',
  squad: [
    {
      id: 44,
      name: 'Cole Palmer',
      position: 'Offence',
      nationality: 'England',
      dateOfBirth: '2002-05-06',
    },
  ],
  runningCompetitions: [
    { id: 2021, name: 'Premier League', code: 'PL', emblem: null },
  ],
};

const matchPayload = {
  id: 500,
  utcDate: '2026-09-20T15:00:00Z',
  status: 'FINISHED',
  minute: 90,
  venue: 'Stamford Bridge',
  competition: { id: 2021, name: 'Premier League', code: 'PL' },
  homeTeam: { id: 61, name: 'Chelsea FC' },
  awayTeam: { id: 57, name: 'Arsenal FC' },
  score: { fullTime: { homeTeam: 2, awayTeam: 1 } },
  goals: [
    {
      minute: 12,
      type: 'REGULAR',
      team: { id: 61, name: 'Chelsea FC' },
      scorer: { id: 44, name: 'Cole Palmer' },
    },
  ],
  bookings: [
    {
      minute: 40,
      card: 'YELLOW_CARD',
      team: { id: 57 },
      player: { id: 9, name: 'Example Player' },
    },
  ],
  substitutions: [
    {
      minute: 70,
      team: { id: 61 },
      playerIn: { id: 3, name: 'Sub On' },
      playerOut: { id: 4, name: 'Sub Off' },
    },
  ],
};

describe('normalize football-data.org payloads', () => {
  it('maps a team without keeping the provider field names', () => {
    expect(normalizeTeam(teamPayload)).toEqual({
      externalId: '61',
      name: 'Chelsea FC',
      shortName: 'Chelsea',
      crestUrl: 'https://example.com/chelsea.png',
      country: null,
    });
  });

  it('maps a match score and status', () => {
    expect(normalizeMatch(matchPayload)).toMatchObject({
      externalId: '500',
      status: 'finished',
      homeTeamName: 'Chelsea FC',
      awayTeamName: 'Arsenal FC',
      homeScore: 2,
      awayScore: 1,
      kickoff: '2026-09-20T15:00:00Z',
    });
  });

  it('builds stable event ids for goals, bookings, and substitutions', () => {
    const events = normalizeMatchEvents(matchPayload);

    expect(events.map((event) => event.type)).toEqual([
      'goal',
      'booking',
      'substitution',
    ]);
    expect(events[0]).toMatchObject({
      externalId: 'fd:goal:500:12:61:44',
      playerName: 'Cole Palmer',
      minute: 12,
    });
    expect(events[2]?.detail).toBe('On for Sub Off');
  });

  it('rejects a payload that is not an object', () => {
    expect(() => normalizeTeam([])).toThrow(SportsProviderError);
  });
});

describe('football-data.org client', () => {
  it('sends the token in a header and returns normalized data', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('https://api.football-data.org/v4/teams/61');
      expect(new Headers(init?.headers).get('X-Auth-Token')).toBe(
        'secret-token',
      );
      expect(String(url)).not.toContain('secret-token');
      return new Response(JSON.stringify(teamPayload), { status: 200 });
    });

    const provider = createFootballDataProvider({
      apiKey: 'secret-token',
      fetch: fetchMock as typeof fetch,
    });

    await expect(provider.getTeam('61')).resolves.toMatchObject({
      name: 'Chelsea FC',
    });
    await provider.getTeamSquad('61');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not include the token when the provider fails', async () => {
    const fetchMock = vi.fn(
      async () => new Response('nope secret-token', { status: 403 }),
    );
    const provider = createFootballDataProvider({
      apiKey: 'secret-token',
      fetch: fetchMock as typeof fetch,
    });

    await expect(provider.getTeam('61')).rejects.toThrow('returned 403');
    await expect(provider.getTeam('61')).rejects.not.toThrow('secret-token');
  });
});

describe('loadTeamSnapshot', () => {
  it('asks the provider for Chelsea data and keeps one match for inspection', async () => {
    const team: SportsTeam = {
      externalId: '61',
      name: 'Chelsea FC',
      shortName: 'Chelsea',
      crestUrl: null,
      country: 'England',
    };
    const match = normalizeMatch(matchPayload);
    const provider: SportsDataProvider = {
      getTeam: vi.fn(async () => team),
      getTeams: vi.fn(async () => [team]),
      getCompetition: vi.fn(async () => match.competition),
      getCompetitions: vi.fn(async () => [match.competition]),
      getSeason: vi.fn(async () => ({
        externalId: '1',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
        currentMatchday: 6,
      })),
      getPlayer: vi.fn(async () => ({
        externalId: '44',
        name: 'Cole Palmer',
        position: 'Offence',
        nationality: 'England',
        dateOfBirth: '2002-05-06',
        shirtNumber: null,
      })),
      getTeamSquad: vi.fn(async () => []),
      getUpcomingMatches: vi.fn(async () => []),
      getRecentMatches: vi.fn(async () => [match]),
      getLiveMatches: vi.fn(async () => []),
      getFixtureFeed: vi.fn(async () => [
        { match, events: normalizeMatchEvents(matchPayload) },
      ]),
      getMatch: vi.fn(async () => match),
      getMatchEvents: vi.fn(async () => normalizeMatchEvents(matchPayload)),
      getMatchStatistics: vi.fn(async () => ({
        available: false as const,
        reason: 'none',
      })),
      getPlayerStatistics: vi.fn(async () => ({
        available: false as const,
        reason: 'none',
      })),
    };

    const snapshot = await loadTeamSnapshot(provider, '61');

    expect(snapshot.team.name).toBe('Chelsea FC');
    expect(snapshot.match?.externalId).toBe('500');
    expect(snapshot.events).toHaveLength(3);
    expect(provider.getMatch).toHaveBeenCalledWith('500');
  });
});
