import type { MatchEventUpsert, MatchUpsert, SyncPlan } from './sync-plan.ts';

export type SyncResult = {
  teams: number;
  competitions: number;
  seasons: number;
  players: number;
  teamPlayers: number;
  matches: number;
  events: number;
};

type ApplyOptions = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetch?: typeof fetch;
};

export async function applySyncPlan(
  plan: SyncPlan,
  options: ApplyOptions,
): Promise<SyncResult> {
  const request = options.fetch ?? fetch;
  const baseUrl = options.supabaseUrl.replace(/\/$/, '');

  async function save(
    table: string,
    rows: unknown[],
    onConflict: string,
  ): Promise<Record<string, unknown>[]> {
    if (rows.length === 0) {
      return [];
    }

    const response = await request(
      `${baseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
      {
        method: 'POST',
        headers: {
          apikey: options.serviceRoleKey,
          Authorization: `Bearer ${options.serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(rows),
      },
    );

    if (!response.ok) {
      throw new Error(`Could not save ${table} (${response.status}).`);
    }

    const body: unknown = await response.json();

    if (!Array.isArray(body)) {
      throw new Error(`Could not save ${table}.`);
    }

    return body.filter(isRecord);
  }

  const competitions = await save(
    'competitions',
    plan.competitions,
    'provider,external_id',
  );
  const teams = await save('teams', plan.teams, 'provider,external_id');
  const competitionIds = idsByExternalId(competitions);
  const teamIds = idsByExternalId(teams);
  const seasons = await save(
    'seasons',
    plan.seasons.flatMap((season) => {
      const competitionId = competitionIds.get(season.competition_external_id);

      if (!competitionId) {
        return [];
      }

      return [
        {
          provider: season.provider,
          external_id: season.external_id,
          competition_id: competitionId,
          name: season.name,
          start_date: season.start_date,
          end_date: season.end_date,
        },
      ];
    }),
    'provider,external_id',
  );
  const players = await save('players', plan.players, 'provider,external_id');
  const seasonIds = idsByExternalId(seasons);
  const playerIds = idsByExternalId(players);
  const teamPlayers = await save(
    'team_players',
    plan.teamPlayers.flatMap((membership) => {
      const teamId = teamIds.get(membership.team_external_id);
      const playerId = playerIds.get(membership.player_external_id);
      const seasonId = seasonIds.get(membership.season_external_id);

      if (!teamId || !playerId || !seasonId) {
        return [];
      }

      return [
        {
          team_id: teamId,
          player_id: playerId,
          season_id: seasonId,
          shirt_number: membership.shirt_number,
          position: membership.position,
          active: membership.active,
        },
      ];
    }),
    'team_id,player_id,season_id',
  );
  const matches = await save(
    'matches',
    plan.matches.flatMap((match) =>
      toMatchRow(match, competitionIds, seasonIds, teamIds),
    ),
    'provider,external_id',
  );
  const matchIds = idsByExternalId(matches);
  const events = await save(
    'match_events',
    plan.events.flatMap((event) =>
      toEventRow(event, matchIds, teamIds, playerIds),
    ),
    'provider,external_id',
  );

  return {
    teams: teams.length,
    competitions: competitions.length,
    seasons: seasons.length,
    players: players.length,
    teamPlayers: teamPlayers.length,
    matches: matches.length,
    events: events.length,
  };
}

function toMatchRow(
  match: MatchUpsert,
  competitionIds: Map<string, string>,
  seasonIds: Map<string, string>,
  teamIds: Map<string, string>,
): Record<string, unknown>[] {
  const homeTeamId = teamIds.get(match.home_team_external_id);
  const awayTeamId = teamIds.get(match.away_team_external_id);

  if (!homeTeamId || !awayTeamId) {
    return [];
  }

  return [
    {
      provider: match.provider,
      external_id: match.external_id,
      competition_id: competitionIds.get(match.competition_external_id) ?? null,
      season_id: match.season_external_id
        ? (seasonIds.get(match.season_external_id) ?? null)
        : null,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff_time: match.kickoff_time,
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score,
      venue: match.venue,
      referee: match.referee,
    },
  ];
}

function toEventRow(
  event: MatchEventUpsert,
  matchIds: Map<string, string>,
  teamIds: Map<string, string>,
  playerIds: Map<string, string>,
): Record<string, unknown>[] {
  const matchId = matchIds.get(event.match_external_id);

  if (!matchId) {
    return [];
  }

  return [
    {
      provider: event.provider,
      external_id: event.external_id,
      match_id: matchId,
      event_type: event.event_type,
      minute: event.minute,
      extra_minute: event.extra_minute,
      team_id: event.team_external_id
        ? (teamIds.get(event.team_external_id) ?? null)
        : null,
      player_id: event.player_external_id
        ? (playerIds.get(event.player_external_id) ?? null)
        : null,
      related_player_id: event.related_player_external_id
        ? (playerIds.get(event.related_player_external_id) ?? null)
        : null,
      description: event.description,
      metadata: event.metadata,
    },
  ];
}

function idsByExternalId(rows: Record<string, unknown>[]): Map<string, string> {
  const ids = new Map<string, string>();

  for (const row of rows) {
    if (typeof row.id === 'string' && typeof row.external_id === 'string') {
      ids.set(row.external_id, row.id);
    }
  }

  return ids;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
