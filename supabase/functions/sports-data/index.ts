import {
  createFootballDataProvider,
  SportsProviderError,
} from '../_shared/sports/football-data.ts';
import { loadTeamSnapshot } from '../_shared/sports/snapshot.ts';
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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const apiKey = Deno.env.get('SPORTS_API_KEY');

  if (!apiKey) {
    return json({ error: 'Sports provider is not configured.' }, 500);
  }

  try {
    const provider = createFootballDataProvider({ apiKey });
    const snapshot = await loadTeamSnapshot(
      provider,
      FIRST_DATASET_TEAM_EXTERNAL_ID,
    );
    return json(snapshot, 200);
  } catch (error) {
    if (error instanceof SportsProviderError) {
      return json(
        { error: error.message },
        error.status >= 500 ? 502 : error.status,
      );
    }

    return json({ error: 'Sports data could not be loaded.' }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
