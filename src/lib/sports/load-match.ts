import { getSupabaseClient } from '@/lib/supabase/client';

import { parseMatchDetail, type MatchDetail } from './match-detail.ts';

const MATCH_COLUMNS =
  'id, kickoff_time, status, home_score, away_score, venue, referee, home_team:teams!matches_home_team_id_fkey(name, slug), away_team:teams!matches_away_team_id_fkey(name, slug), competition:competitions(name)';

const EVENT_COLUMNS =
  'id, event_type, minute, extra_minute, description, team:teams(name), player:players!match_events_player_id_fkey(name), related_player:players!match_events_related_player_id_fkey(name)';

export async function loadMatchDetail(
  matchId: string,
): Promise<MatchDetail | null> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const [matchResult, eventResult] = await Promise.all([
    client
      .from('matches')
      .select(MATCH_COLUMNS)
      .eq('id', matchId)
      .maybeSingle(),
    client
      .from('match_events')
      .select(EVENT_COLUMNS)
      .eq('match_id', matchId)
      .order('minute', { ascending: true }),
  ]);

  if (matchResult.error) {
    throw new Error(matchResult.error.message);
  }

  if (eventResult.error) {
    throw new Error(eventResult.error.message);
  }

  return parseMatchDetail(matchResult.data, eventResult.data);
}
