alter table public.comments replica identity full;
alter table public.reactions replica identity full;
alter table public.matches replica identity full;
alter table public.match_events replica identity full;

alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_events;
