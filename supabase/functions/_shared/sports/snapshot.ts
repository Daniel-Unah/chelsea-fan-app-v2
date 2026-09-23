import type { SportsDataProvider, SportsSnapshot } from './types.ts';

export async function loadTeamSnapshot(
  provider: SportsDataProvider,
  teamExternalId: string,
): Promise<SportsSnapshot> {
  const [
    team,
    competitions,
    squad,
    upcomingMatches,
    recentMatches,
    liveMatches,
  ] = await Promise.all([
    provider.getTeam(teamExternalId),
    provider.getCompetitions(),
    provider.getTeamSquad(teamExternalId),
    provider.getUpcomingMatches(teamExternalId),
    provider.getRecentMatches(teamExternalId),
    provider.getLiveMatches(teamExternalId),
  ]);

  const focus =
    liveMatches[0] ?? upcomingMatches[0] ?? recentMatches[0] ?? null;
  const match = focus ? await provider.getMatch(focus.externalId) : null;
  const events = focus ? await provider.getMatchEvents(focus.externalId) : [];

  return {
    provider: 'football-data.org',
    retrievedAt: new Date().toISOString(),
    team,
    competitions,
    squad,
    upcomingMatches,
    recentMatches,
    liveMatches,
    match,
    events,
  };
}
