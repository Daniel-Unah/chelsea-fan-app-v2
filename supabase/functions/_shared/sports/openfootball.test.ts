import { describe, expect, it } from 'vitest';

import { londonKickoff, parsePremierLeague } from './openfootball.ts';

const SEASON = `= English Premier League 2026/27

▪ Matchday 1
  Fri Aug 21 2026
    20:00  Arsenal FC              v Coventry City FC         3-0 (2-0)
  Mon Aug 24
    20:00  Fulham FC               v Chelsea FC               2-3 (1-2)

▪ Matchday 6
  Sat Oct 10
           Chelsea FC              v AFC Bournemouth

▪ Matchday 20
  Sat Jan 2 2027
    15:00  Chelsea FC              v Liverpool FC
    17:30  Hull City AFC           v Aston Villa FC           0-0
`;

describe('openfootball premier league file', () => {
  const plan = parsePremierLeague(SEASON);
  const chelsea = plan.matches.filter(
    (match) =>
      match.home_team_external_id === 'chelsea-fc' ||
      match.away_team_external_id === 'chelsea-fc',
  );

  it('stores Chelsea results and a later fixture', () => {
    expect(chelsea).toHaveLength(3);
    expect(chelsea[0]).toMatchObject({
      status: 'finished',
      home_score: 2,
      away_score: 3,
      home_team_external_id: 'fulham-fc',
      away_team_external_id: 'chelsea-fc',
      kickoff_time: '2026-08-24T19:00:00.000Z',
    });
    expect(chelsea[1]).toMatchObject({
      status: 'scheduled',
      home_score: null,
      away_score: null,
      home_team_external_id: 'chelsea-fc',
      away_team_external_id: 'afc-bournemouth',
    });
  });

  it('names the season and competition once', () => {
    expect(plan.competitions[0]).toMatchObject({
      name: 'English Premier League',
      slug: 'premier-league',
    });
    expect(plan.seasons[0]).toMatchObject({
      name: '2026/2027',
      external_id: '2026-27',
    });
    expect(plan.teams.find((team) => team.slug === 'chelsea-fc')).toMatchObject(
      {
        short_name: 'Chelsea',
        country: 'England',
      },
    );
    expect(plan.players).toEqual([]);
    expect(plan.events).toEqual([]);
    expect(plan.teams.map((team) => team.name)).not.toContain(
      'Aston Villa FC           0-0',
    );
    expect(
      plan.matches.find(
        (match) => match.home_team_external_id === 'hull-city-afc',
      ),
    ).toMatchObject({
      away_team_external_id: 'aston-villa-fc',
      home_score: 0,
      away_score: 0,
      status: 'finished',
    });
  });

  it('keeps a winter kickoff in London time', () => {
    expect(londonKickoff(2027, 0, 2, '15:00')).toBe('2027-01-02T15:00:00.000Z');
    expect(chelsea[2]?.kickoff_time).toBe('2027-01-02T15:00:00.000Z');
  });
});
