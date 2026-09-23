import { applySyncPlan } from '../_shared/sports/apply-sync.ts';
import {
  createFootballDataProvider,
  SportsProviderError,
} from '../_shared/sports/football-data.ts';
import { loadOpenFootballPlan } from '../_shared/sports/openfootball.ts';
import { loadSyncBundle } from '../_shared/sports/snapshot.ts';
import { buildSyncPlan } from '../_shared/sports/sync-plan.ts';
import { FIRST_DATASET_TEAM_EXTERNAL_ID } from '../_shared/sports/types.ts';

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const apiKey = Deno.env.get('SPORTS_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Database credentials are not configured.' }, 500);
  }

  try {
    const plan = apiKey
      ? buildSyncPlan(
          await loadSyncBundle(
            createFootballDataProvider({ apiKey }),
            FIRST_DATASET_TEAM_EXTERNAL_ID,
          ),
        )
      : await loadOpenFootballPlan();
    const result = await applySyncPlan(plan, {
      supabaseUrl,
      serviceRoleKey,
    });
    return json({ source: plan.provider, ...result }, 200);
  } catch (error) {
    if (error instanceof SportsProviderError) {
      return json(
        { error: error.message },
        error.status >= 500 ? 502 : error.status,
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Sports data could not be saved.';
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
