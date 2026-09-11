begin;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.visions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  statement text not null check (length(statement) between 1 and 10000),
  target_date date not null,
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid,
  title text not null check (length(title) between 1 and 500),
  pillar text not null check (pillar in ('Health', 'Soft Skills', 'Education', 'Career')),
  term text not null check (term in ('long', 'short')),
  domain text check (domain in ('Health', 'Relationships', 'Love', 'Work', 'Money', 'Fun', 'Personal Growth')),
  horizon text check (horizon in ('10-year', '3-year', 'annual', 'quarterly')),
  baseline numeric check (baseline >= 0),
  target numeric check (target > 0),
  unit text check (length(unit) between 1 and 80),
  direction text not null default 'increase' check (direction in ('increase', 'decrease')),
  deadline date,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  reward text not null default '',
  stake text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, parent_id) references public.goals(workspace_id, id) on delete set null (parent_id),
  check (parent_id is distinct from id),
  check (target is null or (unit is not null and deadline is not null))
);

create table public.weekly_scorecards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  reflection text not null default '',
  updated_at timestamptz not null default now(),
  unique (workspace_id, week_start),
  unique (workspace_id, id)
);

create table public.scorecard_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scorecard_id uuid not null,
  goal_id_snapshot uuid not null,
  goal_title text not null,
  pillar text not null check (pillar in ('Health', 'Soft Skills', 'Education', 'Career')),
  score smallint not null check (score between 1 and 10),
  note text not null default '',
  foreign key (workspace_id, scorecard_id) references public.weekly_scorecards(workspace_id, id) on delete cascade,
  unique (scorecard_id, goal_id_snapshot)
);

create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  goal_id uuid,
  domain text not null check (domain in ('Health', 'Relationships', 'Love', 'Work', 'Money', 'Fun', 'Personal Growth')),
  title text not null check (length(title) between 1 and 500),
  weekly_target numeric not null check (weekly_target > 0),
  unit text not null check (length(unit) between 1 and 80),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, goal_id) references public.goals(workspace_id, id) on delete set null (goal_id)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  commitment_id uuid not null,
  log_date date not null,
  quantity numeric not null check (quantity >= 0),
  note text not null default '',
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, commitment_id) references public.commitments(workspace_id, id) on delete cascade,
  unique (commitment_id, log_date)
);

create table public.weekly_audits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  created_at timestamptz not null default now(),
  unique (workspace_id, week_start),
  unique (workspace_id, id)
);

create table public.audit_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  audit_id uuid not null,
  domain text not null check (domain in ('Health', 'Relationships', 'Love', 'Work', 'Money', 'Fun', 'Personal Growth')),
  score smallint check (score between 0 and 10),
  evidence_snapshot jsonb not null check (jsonb_typeof(evidence_snapshot) = 'array'),
  foreign key (workspace_id, audit_id) references public.weekly_audits(workspace_id, id) on delete cascade,
  unique (audit_id, domain)
);

create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  domain text not null check (domain in ('Health', 'Relationships', 'Love', 'Work', 'Money', 'Fun', 'Personal Growth')),
  turns jsonb not null default '[]'::jsonb check (jsonb_typeof(turns) = 'array'),
  hypothesis text,
  corrective_action text,
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not completed or (length(trim(corrective_action)) > 0 and corrective_action is not null and deadline is not null))
);

create index goals_workspace_status on public.goals(workspace_id, status);
create index goals_parent on public.goals(workspace_id, parent_id);
create index commitments_workspace on public.commitments(workspace_id, archived);
create index activity_logs_workspace_date on public.activity_logs(workspace_id, log_date);
create index diagnostics_workspace on public.diagnostics(workspace_id, created_at desc);

-- Visitor scope is resolved only by the server. No direct browser data access.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'workspaces', 'visions', 'goals', 'weekly_scorecards', 'scorecard_entries',
    'commitments', 'activity_logs', 'weekly_audits', 'audit_entries', 'diagnostics'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end;
$$;

commit;
