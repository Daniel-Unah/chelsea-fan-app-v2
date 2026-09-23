create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 24),
  constraint profiles_username_characters check (username ~ '^[A-Za-z0-9_]+$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 40),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 160)
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

revoke all on public.profiles from public, anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function private.set_updated_at();

-- Copies signup fields into profiles. Authorization uses auth.uid(), not this metadata.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text;
  new_display_name text;
begin
  new_username := trim(new.raw_user_meta_data ->> 'username');
  new_display_name := trim(new.raw_user_meta_data ->> 'display_name');

  if new_username is null or new_username = '' then
    raise exception 'Username is required';
  end if;

  if new_display_name is null or new_display_name = '' then
    new_display_name := new_username;
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, new_username, new_display_name);

  return new;
exception
  when unique_violation then
    raise exception 'Username is already taken';
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
