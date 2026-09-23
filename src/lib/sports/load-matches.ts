import { getSupabaseClient } from '@/lib/supabase/client';

import { parseStoredMatches, type StoredMatch } from './matches.ts';

const MATCH_COLUMNS =
  'id, kickoff_time, status, home_score, away_score, venue, home_team:teams!matches_home_team_id_fkey(name, slug), away_team:teams!matches_away_team_id_fkey(name, slug), competition:competitions(name)';

export async function loadStoredMatches(): Promise<StoredMatch[]> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await client
    .from('matches')
    .select(MATCH_COLUMNS)
    .order('kickoff_time', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return parseStoredMatches(data);
}
