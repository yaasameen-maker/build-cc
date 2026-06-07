create table if not exists generated_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  repo_full_name text,
  language_id text not null,
  prompt text not null,
  stack_context jsonb not null,
  mode text not null,
  filename_suggestion text,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists generated_scripts_user on generated_scripts(user_id);
