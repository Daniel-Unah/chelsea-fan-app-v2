import type {
  MatchStatus,
  SportsCompetition,
  SportsDataProvider,
  SportsFixture,
  SportsMatch,
  SportsMatchEvent,
  SportsMatchStatistics,
  SportsPlayer,
  SportsPlayerStatistics,
  SportsSeason,
  SportsTeam,
} from './types.ts';

const DEFAULT_BASE_URL = 'https://api.football-data.org/v4';
const STATISTICS_REASON = 'football-data.org does not provide this statistic.';

export class SportsProviderError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SportsProviderError';
    this.status = status;
  }
}

type FootballDataClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};

export function createFootballDataProvider(
  options: FootballDataClientOptions,
): SportsDataProvider {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const request = options.fetch ?? fetch;
  const cache = new Map<string, unknown>();

  async function getJson(path: string): Promise<unknown> {
    const cached = cache.get(path);

    if (cached) {
      return cached;
    }

    const response = await request(`${baseUrl}${path}`, {
      headers: { 'X-Auth-Token': options.apiKey },
    });

    if (!response.ok) {
      throw new SportsProviderError(
        `football-data.org returned ${response.status}.`,
        response.status,
      );
    }

    const body: unknown = await response.json();
    cache.set(path, body);
    return body;
  }

  return {
    async getTeam(externalId) {
      const body = await getJson(`/teams/${assertId(externalId)}`);
      return normalizeTeam(body);
    },
    async getTeams(competitionCode) {
      const body = await getJson(
        `/competitions/${assertCode(competitionCode)}/teams`,
      );
      return readArray(body, 'teams').map(normalizeTeam);
    },
    async getCompetition(code) {
      const body = await getJson(`/competitions/${assertCode(code)}`);
      return normalizeCompetition(body);
    },
    async getCompetitions() {
      const body = await getJson('/competitions');
      return readArray(body, 'competitions').map(normalizeCompetition);
    },
    async getSeason(competitionCode) {
      const body = await getJson(
        `/competitions/${assertCode(competitionCode)}`,
      );
      return normalizeSeason(body);
    },
    async getPlayer(externalId) {
      const body = await getJson(`/persons/${assertId(externalId)}`);
      return normalizePlayer(body);
    },
    async getTeamSquad(teamExternalId) {
      const body = await getJson(`/teams/${assertId(teamExternalId)}`);
      return readArray(body, 'squad').map(normalizePlayer);
    },
    getUpcomingMatches(teamExternalId) {
      return getMatches(teamExternalId, 'SCHEDULED');
    },
    getRecentMatches(teamExternalId) {
      return getMatches(teamExternalId, 'FINISHED');
    },
    getLiveMatches(teamExternalId) {
      return getMatches(teamExternalId, 'IN_PLAY');
    },
    async getFixtureFeed(teamExternalId) {
      const statuses = ['SCHEDULED', 'FINISHED', 'IN_PLAY'];
      const groups = await Promise.all(
        statuses.map((status) => getFixtureGroup(teamExternalId, status)),
      );
      return groups.flat();
    },
    async getMatch(externalId) {
      const body = await getJson(`/matches/${assertId(externalId)}`);
      return normalizeMatch(unwrapMatch(body));
    },
    async getMatchEvents(externalId) {
      const body = await getJson(`/matches/${assertId(externalId)}`);
      return normalizeMatchEvents(unwrapMatch(body));
    },
    getMatchStatistics(): Promise<SportsMatchStatistics> {
      return Promise.resolve({ available: false, reason: STATISTICS_REASON });
    },
    getPlayerStatistics(): Promise<SportsPlayerStatistics> {
      return Promise.resolve({ available: false, reason: STATISTICS_REASON });
    },
  };

  async function getMatches(
    teamExternalId: string,
    status: string,
  ): Promise<SportsMatch[]> {
    const fixtures = await getFixtureGroup(teamExternalId, status);
    return fixtures.map((fixture) => fixture.match);
  }

  async function getFixtureGroup(
    teamExternalId: string,
    status: string,
  ): Promise<SportsFixture[]> {
    const body = await getJson(
      `/teams/${assertId(teamExternalId)}/matches?status=${status}&limit=5`,
    );
    return readArray(body, 'matches').map((match) => ({
      match: normalizeMatch(match),
      events: normalizeMatchEvents(match),
    }));
  }
}

export function normalizeTeam(value: unknown): SportsTeam {
  const record = asRecord(value, 'team');
  return {
    externalId: readId(record),
    name: readRequiredString(record, 'name'),
    shortName:
      readString(record, 'shortName') ?? readRequiredString(record, 'name'),
    crestUrl: readString(record, 'crest'),
    country: readNestedName(record, 'area'),
  };
}

export function normalizeCompetition(value: unknown): SportsCompetition {
  const record = asRecord(value, 'competition');
  return {
    externalId: readId(record),
    name: readRequiredString(record, 'name'),
    code: readString(record, 'code'),
    emblemUrl: readString(record, 'emblem'),
    country: readNestedName(record, 'area'),
  };
}

export function normalizeSeason(value: unknown): SportsSeason {
  const record = asRecord(value, 'competition');
  const season = asRecord(record.currentSeason, 'season');
  return {
    externalId: readId(season),
    startDate: readRequiredString(season, 'startDate'),
    endDate: readRequiredString(season, 'endDate'),
    currentMatchday: readNumber(season, 'currentMatchday'),
  };
}

export function normalizePlayer(value: unknown): SportsPlayer {
  const record = asRecord(value, 'player');
  return {
    externalId: readId(record),
    name: readRequiredString(record, 'name'),
    position: readString(record, 'position'),
    nationality: readString(record, 'nationality'),
    dateOfBirth: readString(record, 'dateOfBirth'),
    shirtNumber: readNumber(record, 'shirtNumber'),
  };
}

export function normalizeMatch(value: unknown): SportsMatch {
  const record = asRecord(value, 'match');
  const score = asRecord(record.score ?? {}, 'score');
  const fullTime = asRecord(score.fullTime ?? {}, 'fullTime');
  const homeTeam = asRecord(record.homeTeam, 'homeTeam');
  const awayTeam = asRecord(record.awayTeam, 'awayTeam');

  return {
    externalId: readId(record),
    competition: normalizeCompetition(record.competition),
    season: normalizeMatchSeason(record.season),
    kickoff: readRequiredString(record, 'utcDate'),
    status: normalizeStatus(readString(record, 'status')),
    minute: readNumber(record, 'minute'),
    venue: readString(record, 'venue'),
    referee: readReferee(record.referees),
    homeTeamExternalId: readId(homeTeam),
    awayTeamExternalId: readId(awayTeam),
    homeTeamName: readRequiredString(homeTeam, 'name'),
    awayTeamName: readRequiredString(awayTeam, 'name'),
    homeCrestUrl: readString(homeTeam, 'crest'),
    awayCrestUrl: readString(awayTeam, 'crest'),
    homeScore: readNumber(fullTime, 'home') ?? readNumber(fullTime, 'homeTeam'),
    awayScore: readNumber(fullTime, 'away') ?? readNumber(fullTime, 'awayTeam'),
  };
}

function normalizeMatchSeason(value: unknown): SportsSeason | null {
  if (
    !isRecord(value) ||
    (typeof value.id !== 'number' && typeof value.id !== 'string')
  ) {
    return null;
  }

  const startDate = readString(value, 'startDate');
  const endDate = readString(value, 'endDate');

  if (!startDate || !endDate) {
    return null;
  }

  return {
    externalId: readId(value),
    startDate,
    endDate,
    currentMatchday: readNumber(value, 'currentMatchday'),
  };
}

function readReferee(value: unknown): string | null {
  if (!Array.isArray(value) || !isRecord(value[0])) {
    return null;
  }

  return readString(value[0], 'name');
}

export function normalizeMatchEvents(value: unknown): SportsMatchEvent[] {
  const record = asRecord(value, 'match');
  const matchId = readId(record);
  const goals = readArray(record, 'goals').map((goal, index) =>
    normalizeGoal(goal, matchId, index),
  );
  const bookings = readArray(record, 'bookings').map((booking, index) =>
    normalizeBooking(booking, matchId, index),
  );
  const substitutions = readArray(record, 'substitutions').map(
    (substitution, index) =>
      normalizeSubstitution(substitution, matchId, index),
  );

  return [...goals, ...bookings, ...substitutions];
}

function normalizeGoal(
  value: unknown,
  matchId: string,
  index: number,
): SportsMatchEvent {
  const record = asRecord(value, 'goal');
  const team = asRecord(record.team ?? {}, 'team');
  const scorer = asRecord(record.scorer ?? {}, 'scorer');
  const minute = readNumber(record, 'minute');
  const scorerId = readStringId(scorer);
  const teamId = readStringId(team);

  const assist = asRecord(record.assist ?? {}, 'assist');

  return {
    externalId: `fd:goal:${matchId}:${minute ?? 'na'}:${teamId ?? 'na'}:${scorerId ?? index}`,
    type: 'goal',
    minute,
    extraMinute: readNumber(record, 'extraTime'),
    teamExternalId: teamId,
    playerExternalId: scorerId,
    playerName: readString(scorer, 'name'),
    relatedPlayerExternalId: readStringId(assist),
    detail: readString(record, 'type') ?? 'GOAL',
  };
}

function normalizeBooking(
  value: unknown,
  matchId: string,
  index: number,
): SportsMatchEvent {
  const record = asRecord(value, 'booking');
  const team = asRecord(record.team ?? {}, 'team');
  const player = asRecord(record.player ?? {}, 'player');
  const minute = readNumber(record, 'minute');
  const playerId = readStringId(player);

  return {
    externalId: `fd:booking:${matchId}:${minute ?? 'na'}:${playerId ?? index}`,
    type: 'booking',
    minute,
    extraMinute: readNumber(record, 'extraTime'),
    teamExternalId: readStringId(team),
    playerExternalId: playerId,
    playerName: readString(player, 'name'),
    relatedPlayerExternalId: null,
    detail: readString(record, 'card') ?? 'CARD',
  };
}

function normalizeSubstitution(
  value: unknown,
  matchId: string,
  index: number,
): SportsMatchEvent {
  const record = asRecord(value, 'substitution');
  const team = asRecord(record.team ?? {}, 'team');
  const playerIn = asRecord(record.playerIn ?? {}, 'playerIn');
  const playerOut = asRecord(record.playerOut ?? {}, 'playerOut');
  const minute = readNumber(record, 'minute');
  const playerInName = readString(playerIn, 'name');
  const playerOutName = readString(playerOut, 'name');

  return {
    externalId: `fd:sub:${matchId}:${minute ?? 'na'}:${readStringId(playerIn) ?? index}`,
    type: 'substitution',
    minute,
    extraMinute: readNumber(record, 'extraTime'),
    teamExternalId: readStringId(team),
    playerExternalId: readStringId(playerIn),
    playerName: playerInName,
    relatedPlayerExternalId: readStringId(playerOut),
    detail: playerOutName ? `On for ${playerOutName}` : 'Substitution',
  };
}

function normalizeStatus(status: string | null): MatchStatus {
  switch (status) {
    case 'SCHEDULED':
    case 'TIMED':
      return 'scheduled';
    case 'LIVE':
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    case 'POSTPONED':
    case 'SUSPENDED':
      return 'postponed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'unknown';
  }
}

function unwrapMatch(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.match)) {
    return value;
  }

  return value.match;
}

function assertId(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new SportsProviderError(
      'Team, match, and player ids must be numeric.',
      400,
    );
  }

  return value;
}

function assertCode(value: string): string {
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    throw new SportsProviderError(
      'Competition codes must be letters or numbers.',
      400,
    );
  }

  return value;
}

function readArray(value: unknown, key: string): unknown[] {
  if (!isRecord(value) || !Array.isArray(value[key])) {
    return [];
  }

  return value[key];
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new SportsProviderError(
      `football-data.org returned an invalid ${label}.`,
      502,
    );
  }

  return value;
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = readString(record, key);

  if (!value) {
    throw new SportsProviderError(`football-data.org omitted ${key}.`, 502);
  }

  return value;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

function readId(record: Record<string, unknown>): string {
  const value = record.id;

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  throw new SportsProviderError('football-data.org omitted an id.', 502);
}

function readNestedName(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const nested = record[key];

  if (!isRecord(nested)) {
    return null;
  }

  return readString(nested, 'name');
}

function readStringId(record: Record<string, unknown>): string | null {
  const value = record.id;

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
