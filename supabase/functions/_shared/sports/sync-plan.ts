import type {
  SportsCompetition,
  SportsFixture,
  SportsMatchEvent,
  SportsPlayer,
  SportsTeam,
} from './types.ts';

export type SyncBundle = {
  team: SportsTeam;
  competitions: SportsCompetition[];
  squad: SportsPlayer[];
  fixtures: SportsFixture[];
};

export type TeamUpsert = {
  provider: string;
  external_id: string;
  name: string;
  short_name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  primary_color: null;
  secondary_color: null;
};

export type CompetitionUpsert = {
  provider: string;
  external_id: string;
  name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
};

export type SeasonUpsert = {
  provider: string;
  external_id: string;
  competition_external_id: string;
  name: string;
  start_date: string;
  end_date: string;
};

export type PlayerUpsert = {
  provider: string;
  external_id: string;
  name: string;
  first_name: string;
  last_name: string;
  position: string | null;
  nationality: string | null;
  photo_url: null;
};

export type TeamPlayerUpsert = {
  team_external_id: string;
  player_external_id: string;
  season_external_id: string;
  shirt_number: number | null;
  position: string | null;
  active: true;
};

export type MatchUpsert = {
  provider: string;
  external_id: string;
  competition_external_id: string;
  season_external_id: string | null;
  home_team_external_id: string;
  away_team_external_id: string;
  kickoff_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  referee: string | null;
};

export type MatchEventUpsert = {
  provider: string;
  external_id: string;
  match_external_id: string;
  event_type: string;
  minute: number | null;
  extra_minute: number | null;
  team_external_id: string | null;
  player_external_id: string | null;
  related_player_external_id: string | null;
  description: string;
  metadata: { detail: string };
};

export type SyncPlan = {
  provider: string;
  teams: TeamUpsert[];
  competitions: CompetitionUpsert[];
  seasons: SeasonUpsert[];
  players: PlayerUpsert[];
  teamPlayers: TeamPlayerUpsert[];
  matches: MatchUpsert[];
  events: MatchEventUpsert[];
};

const PROVIDER = 'football-data.org';

export function buildSyncPlan(bundle: SyncBundle): SyncPlan {
  const slugs = new Set<string>();
  const teams = new Map<string, TeamUpsert>();
  const competitions = new Map<string, CompetitionUpsert>();
  const seasons = new Map<string, SeasonUpsert>();
  const players = new Map<string, PlayerUpsert>();
  const matches = new Map<string, MatchUpsert>();
  const events: MatchEventUpsert[] = [];

  for (const competition of bundle.competitions) {
    competitions.set(competition.externalId, toCompetition(competition, slugs));
  }

  for (const fixture of bundle.fixtures) {
    const match = fixture.match;
    rememberTeam(teams, slugs, {
      externalId: match.homeTeamExternalId,
      name: match.homeTeamName,
      shortName: match.homeTeamName,
      crestUrl: match.homeCrestUrl,
      country: null,
    });
    rememberTeam(teams, slugs, {
      externalId: match.awayTeamExternalId,
      name: match.awayTeamName,
      shortName: match.awayTeamName,
      crestUrl: match.awayCrestUrl,
      country: null,
    });
    competitions.set(
      match.competition.externalId,
      mergeCompetition(
        competitions.get(match.competition.externalId),
        toCompetition(match.competition, slugs),
      ),
    );

    if (match.season) {
      seasons.set(match.season.externalId, {
        provider: PROVIDER,
        external_id: match.season.externalId,
        competition_external_id: match.competition.externalId,
        name: seasonName(match.season.startDate, match.season.endDate),
        start_date: match.season.startDate,
        end_date: match.season.endDate,
      });
    }

    matches.set(match.externalId, {
      provider: PROVIDER,
      external_id: match.externalId,
      competition_external_id: match.competition.externalId,
      season_external_id: match.season?.externalId ?? null,
      home_team_external_id: match.homeTeamExternalId,
      away_team_external_id: match.awayTeamExternalId,
      kickoff_time: match.kickoff,
      status: match.status,
      home_score: match.homeScore,
      away_score: match.awayScore,
      venue: match.venue,
      referee: match.referee,
    });

    for (const event of fixture.events) {
      rememberEventPlayer(players, event);
      events.push(toEvent(match.externalId, event));
    }
  }

  rememberTeam(teams, slugs, bundle.team);

  for (const player of bundle.squad) {
    players.set(player.externalId, toPlayer(player));
  }

  const squadSeason = chooseSquadSeason(bundle.fixtures);
  const teamPlayers: TeamPlayerUpsert[] = squadSeason
    ? bundle.squad.map((player) => ({
        team_external_id: bundle.team.externalId,
        player_external_id: player.externalId,
        season_external_id: squadSeason,
        shirt_number: player.shirtNumber,
        position: player.position,
        active: true,
      }))
    : [];

  return {
    provider: PROVIDER,
    teams: [...teams.values()],
    competitions: [...competitions.values()],
    seasons: [...seasons.values()],
    players: [...players.values()],
    teamPlayers,
    matches: [...matches.values()],
    events,
  };
}

export function storedEventType(event: SportsMatchEvent): string {
  if (event.type === 'goal') {
    const detail = event.detail.toUpperCase();

    if (detail.includes('OWN')) {
      return 'own_goal';
    }

    if (detail.includes('MISS')) {
      return 'missed_penalty';
    }

    if (detail.includes('PENALTY')) {
      return 'penalty_goal';
    }

    return 'goal';
  }

  if (event.type === 'booking') {
    return event.detail.toUpperCase().includes('RED')
      ? 'red_card'
      : 'yellow_card';
  }

  return 'substitution';
}

function chooseSquadSeason(fixtures: SportsFixture[]): string | null {
  const premierLeague = fixtures.find(
    (fixture) =>
      fixture.match.competition.code === 'PL' && fixture.match.season,
  );

  if (premierLeague?.match.season) {
    return premierLeague.match.season.externalId;
  }

  return (
    fixtures.find((fixture) => fixture.match.season)?.match.season
      ?.externalId ?? null
  );
}

function rememberTeam(
  teams: Map<string, TeamUpsert>,
  slugs: Set<string>,
  team: SportsTeam,
): void {
  const existing = teams.get(team.externalId);

  teams.set(team.externalId, {
    provider: PROVIDER,
    external_id: team.externalId,
    name: team.name,
    short_name: team.shortName,
    slug: existing?.slug ?? uniqueSlug(slugs, team.name, team.externalId),
    logo_url: team.crestUrl,
    country: team.country ?? existing?.country ?? null,
    primary_color: null,
    secondary_color: null,
  });
}

function rememberEventPlayer(
  players: Map<string, PlayerUpsert>,
  event: SportsMatchEvent,
): void {
  if (
    event.playerExternalId &&
    event.playerName &&
    !players.has(event.playerExternalId)
  ) {
    players.set(
      event.playerExternalId,
      toPlayer({
        externalId: event.playerExternalId,
        name: event.playerName,
        position: null,
        nationality: null,
        dateOfBirth: null,
        shirtNumber: null,
      }),
    );
  }
}

function toCompetition(
  competition: SportsCompetition,
  slugs: Set<string>,
): CompetitionUpsert {
  return {
    provider: PROVIDER,
    external_id: competition.externalId,
    name: competition.name,
    slug: uniqueSlug(
      slugs,
      competition.code ?? competition.name,
      competition.externalId,
    ),
    country: competition.country,
    logo_url: competition.emblemUrl,
  };
}

function mergeCompetition(
  current: CompetitionUpsert | undefined,
  next: CompetitionUpsert,
): CompetitionUpsert {
  if (!current) {
    return next;
  }

  return {
    ...current,
    country: current.country ?? next.country,
    logo_url: current.logo_url ?? next.logo_url,
  };
}

function toPlayer(player: SportsPlayer): PlayerUpsert {
  const parts = player.name.trim().split(/\s+/);

  return {
    provider: PROVIDER,
    external_id: player.externalId,
    name: player.name,
    first_name: parts[0] ?? player.name,
    last_name: parts.slice(1).join(' ') || parts[0] || player.name,
    position: player.position,
    nationality: player.nationality,
    photo_url: null,
  };
}

function toEvent(
  matchExternalId: string,
  event: SportsMatchEvent,
): MatchEventUpsert {
  const description = [event.playerName, event.detail]
    .filter(Boolean)
    .join(' · ');

  return {
    provider: PROVIDER,
    external_id: event.externalId,
    match_external_id: matchExternalId,
    event_type: storedEventType(event),
    minute: event.minute,
    extra_minute: event.extraMinute,
    team_external_id: event.teamExternalId,
    player_external_id: event.playerExternalId,
    related_player_external_id: event.relatedPlayerExternalId,
    description,
    metadata: { detail: event.detail },
  };
}

function seasonName(startDate: string, endDate: string): string {
  return `${startDate.slice(0, 4)}/${endDate.slice(0, 4)}`;
}

function uniqueSlug(
  slugs: Set<string>,
  name: string,
  externalId: string,
): string {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || externalId;
  const slug = slugs.has(base) ? `${base}-${externalId}` : base;
  slugs.add(slug);
  return slug;
}
