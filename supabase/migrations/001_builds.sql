create table if not exists builds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  name         text not null,
  repo         text,
  lang         text,
  description  text,
  checks       jsonb default '{}',
  auto_checks  jsonb default '{}',
  custom_items jsonb default '{}',
  docs         jsonb default '[]',
  section_open jsonb default '{}',
  gh_data      jsonb default '{}',
  signals      jsonb default '{}',
  dep          jsonb default '{}',
  last_scan    timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table builds enable row level security;

create policy "users own their builds"
  on builds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger builds_updated_at
  before update on builds
  for each row execute function update_updated_at();
