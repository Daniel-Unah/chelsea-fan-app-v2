export type MatchStatus =
  'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'unknown';

export type MatchEventType = 'goal' | 'booking' | 'substitution';

export type SportsTeam = {
  externalId: string;
  name: string;
  shortName: string;
  crestUrl: string | null;
  country: string | null;
};

export type SportsCompetition = {
  externalId: string;
  name: string;
  code: string | null;
  emblemUrl: string | null;
  country: string | null;
};

export type SportsSeason = {
  externalId: string;
  startDate: string;
  endDate: string;
  currentMatchday: number | null;
};

export type SportsPlayer = {
  externalId: string;
  name: string;
  position: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  shirtNumber: number | null;
};

export type SportsMatch = {
  externalId: string;
  competition: SportsCompetition;
  season: SportsSeason | null;
  kickoff: string;
  status: MatchStatus;
  minute: number | null;
  venue: string | null;
  referee: string | null;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCrestUrl: string | null;
  awayCrestUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type SportsFixture = {
  match: SportsMatch;
  events: SportsMatchEvent[];
};

export type SportsMatchEvent = {
  externalId: string;
  type: MatchEventType;
  minute: number | null;
  extraMinute: number | null;
  teamExternalId: string | null;
  playerExternalId: string | null;
  playerName: string | null;
  relatedPlayerExternalId: string | null;
  detail: string;
};

export type SportsStatisticLine = {
  name: string;
  home: string;
  away: string;
};

export type SportsMatchStatistics =
  | { available: true; items: SportsStatisticLine[] }
  | { available: false; reason: string };

export type SportsPlayerStatistics =
  | { available: true; items: { name: string; value: string }[] }
  | { available: false; reason: string };

export type SportsSnapshot = {
  provider: 'football-data.org';
  retrievedAt: string;
  team: SportsTeam;
  competitions: SportsCompetition[];
  squad: SportsPlayer[];
  upcomingMatches: SportsMatch[];
  recentMatches: SportsMatch[];
  liveMatches: SportsMatch[];
  match: SportsMatch | null;
  events: SportsMatchEvent[];
};

export interface SportsDataProvider {
  getTeam(externalId: string): Promise<SportsTeam>;
  getTeams(competitionCode: string): Promise<SportsTeam[]>;
  getCompetition(code: string): Promise<SportsCompetition>;
  getCompetitions(): Promise<SportsCompetition[]>;
  getSeason(competitionCode: string): Promise<SportsSeason>;
  getPlayer(externalId: string): Promise<SportsPlayer>;
  getTeamSquad(teamExternalId: string): Promise<SportsPlayer[]>;
  getUpcomingMatches(teamExternalId: string): Promise<SportsMatch[]>;
  getRecentMatches(teamExternalId: string): Promise<SportsMatch[]>;
  getLiveMatches(teamExternalId: string): Promise<SportsMatch[]>;
  getFixtureFeed(teamExternalId: string): Promise<SportsFixture[]>;
  getMatch(externalId: string): Promise<SportsMatch>;
  getMatchEvents(externalId: string): Promise<SportsMatchEvent[]>;
  getMatchStatistics(externalId: string): Promise<SportsMatchStatistics>;
  getPlayerStatistics(externalId: string): Promise<SportsPlayerStatistics>;
}

export const FIRST_DATASET_TEAM_EXTERNAL_ID = '61';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isSportsSnapshot(value: unknown): value is SportsSnapshot {
  if (!isRecord(value) || value.provider !== 'football-data.org') {
    return false;
  }

  return (
    isRecord(value.team) &&
    typeof value.team.name === 'string' &&
    typeof value.team.externalId === 'string' &&
    Array.isArray(value.competitions) &&
    Array.isArray(value.squad) &&
    Array.isArray(value.upcomingMatches) &&
    Array.isArray(value.recentMatches) &&
    Array.isArray(value.liveMatches) &&
    Array.isArray(value.events)
  );
}
