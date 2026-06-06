create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  repo_full_name text not null,
  source text not null,
  agent_name text not null,
  model_name text,
  status text not null default 'queued',
  request_id text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists agent_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  severity text not null,
  category text not null,
  title text not null,
  file_path text,
  line_number integer,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists agent_runs_user_repo on agent_runs(user_id, repo_full_name);
create index if not exists agent_findings_run on agent_findings(run_id);
