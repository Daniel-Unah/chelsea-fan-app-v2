create table public.teams (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  name text not null,
  short_name text not null,
  slug text not null,
  logo_url text,
  country text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_provider_external_id_key unique (provider, external_id),
  constraint teams_slug_key unique (slug)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  name text not null,
  slug text not null,
  country text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_provider_external_id_key unique (provider, external_id),
  constraint competitions_slug_key unique (slug)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  competition_id uuid not null references public.competitions (id),
  name text not null,
  start_date date not null,
  end_date date not null,
  constraint seasons_provider_external_id_key unique (provider, external_id)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  name text not null,
  first_name text not null,
  last_name text not null,
  position text,
  nationality text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_provider_external_id_key unique (provider, external_id)
);

create table public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id),
  player_id uuid not null references public.players (id),
  season_id uuid not null references public.seasons (id),
  shirt_number integer,
  position text,
  active boolean not null default true,
  constraint team_players_membership_key unique (team_id, player_id, season_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  competition_id uuid references public.competitions (id),
  season_id uuid references public.seasons (id),
  home_team_id uuid not null references public.teams (id),
  away_team_id uuid not null references public.teams (id),
  kickoff_time timestamptz not null,
  status text not null,
  home_score integer,
  away_score integer,
  venue text,
  referee text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_provider_external_id_key unique (provider, external_id),
  constraint matches_status_check check (
    status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled', 'unknown')
  )
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  match_id uuid not null references public.matches (id),
  event_type text not null,
  minute integer,
  extra_minute integer,
  team_id uuid references public.teams (id),
  player_id uuid references public.players (id),
  related_player_id uuid references public.players (id),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint match_events_provider_external_id_key unique (provider, external_id),
  constraint match_events_type_check check (
    event_type in (
      'goal',
      'own_goal',
      'penalty_goal',
      'missed_penalty',
      'yellow_card',
      'red_card',
      'substitution',
      'var',
      'kickoff',
      'halftime',
      'fulltime'
    )
  )
);

create index seasons_competition_id_idx on public.seasons (competition_id);
create index team_players_team_id_idx on public.team_players (team_id);
create index team_players_player_id_idx on public.team_players (player_id);
create index team_players_season_id_idx on public.team_players (season_id);
create index matches_competition_id_idx on public.matches (competition_id);
create index matches_season_id_idx on public.matches (season_id);
create index matches_home_team_id_idx on public.matches (home_team_id);
create index matches_away_team_id_idx on public.matches (away_team_id);
create index matches_kickoff_time_idx on public.matches (kickoff_time);
create index match_events_match_id_idx on public.match_events (match_id);
create index match_events_team_id_idx on public.match_events (team_id);
create index match_events_player_id_idx on public.match_events (player_id);

revoke all on public.teams, public.competitions, public.seasons, public.players,
  public.team_players, public.matches, public.match_events
  from public, anon, authenticated;

grant select on public.teams, public.competitions, public.seasons, public.players,
  public.team_players, public.matches, public.match_events
  to authenticated;

alter table public.teams enable row level security;
alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.players enable row level security;
alter table public.team_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;

create policy "Authenticated users can read teams"
  on public.teams for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can read competitions"
  on public.competitions for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can read seasons"
  on public.seasons for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can read players"
  on public.players for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can read team players"
  on public.team_players for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can read matches"
  on public.matches for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can read match events"
  on public.match_events for select to authenticated
  using ((select auth.uid()) is not null);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function private.set_updated_at();

create trigger competitions_set_updated_at
  before update on public.competitions
  for each row execute function private.set_updated_at();

create trigger players_set_updated_at
  before update on public.players
  for each row execute function private.set_updated_at();

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function private.set_updated_at();
