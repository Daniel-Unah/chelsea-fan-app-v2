alter table public.profiles
  add column is_moderator boolean not null default false;

create function private.protect_moderator_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_moderator = false;
    return new;
  end if;

  if new.is_moderator is distinct from old.is_moderator then
    raise exception 'Moderator status cannot be changed here';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_moderator_flag
  before insert or update on public.profiles
  for each row
  execute function private.protect_moderator_flag();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  match_event_id uuid references public.match_events (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(content) between 1 and 280)
);

create index comments_match_id_idx on public.comments (match_id);
create index comments_match_event_id_idx on public.comments (match_event_id);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id);
create index comments_user_id_idx on public.comments (user_id);

create function private.enforce_comment_shape()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_match_id uuid;
  parent_event_id uuid;
  parent_parent_id uuid;
  event_match_id uuid;
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or new.match_id is distinct from old.match_id
      or new.match_event_id is distinct from old.match_event_id
      or new.parent_comment_id is distinct from old.parent_comment_id then
      raise exception 'Comment target cannot be changed';
    end if;
  end if;

  if new.parent_comment_id is not null then
    select match_id, match_event_id, parent_comment_id
      into parent_match_id, parent_event_id, parent_parent_id
    from public.comments
    where id = new.parent_comment_id;

    if parent_match_id is null then
      raise exception 'Reply target was not found';
    end if;

    if parent_parent_id is not null then
      raise exception 'Replies can only target a top-level comment';
    end if;

    if parent_match_id <> new.match_id or parent_event_id is distinct from new.match_event_id then
      raise exception 'Reply must stay on the same match and event';
    end if;
  end if;

  if new.match_event_id is not null then
    select match_id into event_match_id
    from public.match_events
    where id = new.match_event_id;

    if event_match_id is null or event_match_id <> new.match_id then
      raise exception 'Event does not belong to this match';
    end if;
  end if;

  return new;
end;
$$;

create trigger comments_enforce_shape
  before insert or update on public.comments
  for each row
  execute function private.enforce_comment_shape();

create trigger comments_set_updated_at
  before update on public.comments
  for each row
  execute function private.set_updated_at();

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  match_event_id uuid references public.match_events (id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  constraint reactions_type_check check (
    reaction_type in ('heart', 'laugh', 'shock')
  ),
  constraint reactions_one_target check (
    (comment_id is not null and match_event_id is null)
    or (comment_id is null and match_event_id is not null)
  )
);

create unique index reactions_user_comment_type_idx
  on public.reactions (user_id, comment_id, reaction_type)
  where comment_id is not null;

create unique index reactions_user_event_type_idx
  on public.reactions (user_id, match_event_id, reaction_type)
  where match_event_id is not null;

create index reactions_comment_id_idx on public.reactions (comment_id);
create index reactions_match_event_id_idx on public.reactions (match_event_id);
create index reactions_user_id_idx on public.reactions (user_id);

create table public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint comment_reports_reason_length check (char_length(reason) between 1 and 200),
  constraint comment_reports_reporter_comment_key unique (reporter_id, comment_id)
);

create index comment_reports_comment_id_idx on public.comment_reports (comment_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index blocks_blocked_id_idx on public.blocks (blocked_id);

revoke all on public.comments, public.reactions, public.comment_reports, public.blocks
  from public, anon, authenticated;

grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert on public.comment_reports to authenticated;
grant select, insert, delete on public.blocks to authenticated;

alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.comment_reports enable row level security;
alter table public.blocks enable row level security;

create policy "Authenticated users can read visible comments"
  on public.comments
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and not exists (
      select 1
      from public.blocks
      where blocks.blocker_id = (select auth.uid())
        and blocks.blocked_id = comments.user_id
    )
  );

create policy "Users can add their own comments"
  on public.comments
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can edit their own comments"
  on public.comments
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users and moderators can delete comments"
  on public.comments
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_moderator
    )
  );

create policy "Authenticated users can read reactions"
  on public.reactions
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy "Users can add their own reactions"
  on public.reactions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own reactions"
  on public.reactions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own reports"
  on public.comment_reports
  for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_moderator
    )
  );

create policy "Users can report comments"
  on public.comment_reports
  for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);

create policy "Users can read their own blocks"
  on public.blocks
  for select
  to authenticated
  using (blocker_id = (select auth.uid()));

create policy "Users can block other users"
  on public.blocks
  for insert
  to authenticated
  with check ((select auth.uid()) = blocker_id);

create policy "Users can remove their own blocks"
  on public.blocks
  for delete
  to authenticated
  using (blocker_id = (select auth.uid()));
