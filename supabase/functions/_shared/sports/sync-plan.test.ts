import { describe, expect, it } from 'vitest';

import { normalizeMatch, normalizeMatchEvents } from './football-data.ts';
import { buildSyncPlan, storedEventType } from './sync-plan.ts';
import type { SportsFixture, SportsMatchEvent } from './types.ts';

const matchPayload = {
  id: 500,
  utcDate: '2026-09-20T15:00:00Z',
  status: 'FINISHED',
  minute: 90,
  venue: 'Stamford Bridge',
  competition: { id: 2021, name: 'Premier League', code: 'PL' },
  season: { id: 77, startDate: '2026-08-01', endDate: '2027-05-31' },
  homeTeam: {
    id: 61,
    name: 'Chelsea FC',
    crest: 'https://example.com/chelsea.png',
  },
  awayTeam: { id: 57, name: 'Arsenal FC' },
  score: { fullTime: { homeTeam: 2, awayTeam: 1 } },
  goals: [
    {
      minute: 12,
      type: 'REGULAR',
      team: { id: 61 },
      scorer: { id: 44, name: 'Cole Palmer' },
    },
  ],
  bookings: [],
  substitutions: [],
};

function goal(detail: string): SportsMatchEvent {
  return {
    externalId: `event-${detail}`,
    type: 'goal',
    minute: 1,
    extraMinute: null,
    teamExternalId: '61',
    playerExternalId: '44',
    playerName: 'Cole Palmer',
    relatedPlayerExternalId: null,
    detail,
  };
}

describe('storedEventType', () => {
  it('maps provider details onto stored event types', () => {
    expect(storedEventType(goal('REGULAR'))).toBe('goal');
    expect(storedEventType(goal('OWN_GOAL'))).toBe('own_goal');
    expect(storedEventType(goal('PENALTY'))).toBe('penalty_goal');
    expect(
      storedEventType({
        ...goal('YELLOW_CARD'),
        type: 'booking',
        detail: 'YELLOW_CARD',
      }),
    ).toBe('yellow_card');
    expect(
      storedEventType({
        ...goal('RED_CARD'),
        type: 'booking',
        detail: 'RED_CARD',
      }),
    ).toBe('red_card');
  });
});

describe('buildSyncPlan', () => {
  it('upserts Chelsea, the opponent, the squad, and the match', () => {
    const match = normalizeMatch(matchPayload);
    const fixture: SportsFixture = {
      match,
      events: normalizeMatchEvents(matchPayload),
    };
    const plan = buildSyncPlan({
      team: {
        externalId: '61',
        name: 'Chelsea FC',
        shortName: 'Chelsea',
        crestUrl: 'https://example.com/chelsea.png',
        country: 'England',
      },
      competitions: [
        {
          externalId: '2021',
          name: 'Premier League',
          code: 'PL',
          emblemUrl: null,
          country: 'England',
        },
      ],
      squad: [
        {
          externalId: '44',
          name: 'Cole Palmer',
          position: 'Offence',
          nationality: 'England',
          dateOfBirth: '2002-05-06',
          shirtNumber: 20,
        },
      ],
      fixtures: [fixture],
    });

    expect(plan.teams.find((team) => team.external_id === '61')).toMatchObject({
      slug: 'chelsea-fc',
      country: 'England',
      short_name: 'Chelsea',
    });
    expect(plan.teams.find((team) => team.external_id === '57')?.name).toBe(
      'Arsenal FC',
    );
    expect(plan.seasons[0]).toMatchObject({
      external_id: '77',
      name: '2026/2027',
      competition_external_id: '2021',
    });
    expect(plan.teamPlayers).toEqual([
      expect.objectContaining({
        team_external_id: '61',
        player_external_id: '44',
        season_external_id: '77',
        shirt_number: 20,
      }),
    ]);
    expect(plan.matches[0]).toMatchObject({
      external_id: '500',
      home_score: 2,
      away_score: 1,
      status: 'finished',
    });
    expect(plan.events[0]).toMatchObject({
      event_type: 'goal',
      player_external_id: '44',
      match_external_id: '500',
    });
  });
});
