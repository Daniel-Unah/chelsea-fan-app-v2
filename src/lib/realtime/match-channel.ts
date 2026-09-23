import { getSupabaseClient } from '@/lib/supabase/client';

export function subscribeToMatchChanges(
  matchId: string,
  onChange: () => void,
): () => void {
  const client = getSupabaseClient();

  if (!client) {
    return () => undefined;
  }

  const channel = client
    .channel(`match-live-${matchId}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        onChange();
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
      },
      () => {
        onChange();
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      () => {
        onChange();
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_events',
        filter: `match_id=eq.${matchId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
