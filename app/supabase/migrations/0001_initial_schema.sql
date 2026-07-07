create extension if not exists pgcrypto;

create table if not exists metrics (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  unit text not null default '',
  orientation_higher_is_frothier boolean not null default true,
  description_short text not null default '',
  description_long text not null default '',
  why_it_matters text not null default '',
  interpretation_bands jsonb not null default '[]'::jsonb,
  source_name text not null default '',
  source_url text not null default '',
  source_tier integer not null default 1,
  update_frequency text not null default '',
  methodology_notes text not null default '',
  caveats text not null default '',
  included_in_composite boolean not null default true,
  active boolean not null default true,
  manual_entry boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists metric_values (
  metric_id text not null references metrics(id) on delete cascade,
  date date not null,
  value numeric not null,
  is_estimate boolean not null default false,
  source_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (metric_id, date)
);

create table if not exists composite_scores (
  date date primary key,
  score numeric not null check (score >= 0 and score <= 100),
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('composite', 'metric', 'distance_to_peak')),
  metric_id text references metrics(id) on delete cascade,
  operator text not null check (operator in ('>=', '<=', 'crosses')),
  threshold numeric not null,
  active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id uuid references user_alerts(id) on delete cascade,
  title text not null,
  body text not null,
  triggered_on date not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_id text not null references metrics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, metric_id)
);

create table if not exists metric_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  proposed_name text not null,
  description text not null,
  proposed_source_url text not null,
  rationale text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  votes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists metric_submission_votes (
  submission_id uuid not null references metric_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (submission_id, user_id)
);

create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  status text not null check (status in ('success', 'partial', 'failed')),
  source_details jsonb not null default '{}'::jsonb
);

create index if not exists metric_values_metric_date_idx on metric_values(metric_id, date desc);
create index if not exists notifications_user_created_idx on user_notifications(user_id, created_at desc);
create index if not exists submissions_status_created_idx on metric_submissions(status, created_at desc);

alter table metrics enable row level security;
alter table metric_values enable row level security;
alter table composite_scores enable row level security;
alter table user_alerts enable row level security;
alter table user_notifications enable row level security;
alter table user_watchlist enable row level security;
alter table metric_submissions enable row level security;
alter table metric_submission_votes enable row level security;
alter table ingestion_runs enable row level security;

create policy "metrics are public readable" on metrics for select using (active = true);
create policy "metric values are public readable" on metric_values for select using (true);
create policy "composite scores are public readable" on composite_scores for select using (true);
create policy "ingestion runs are admin-service only" on ingestion_runs for select using (false);

create policy "users read own alerts" on user_alerts for select using (auth.uid() = user_id);
create policy "users insert own alerts" on user_alerts for insert with check (auth.uid() = user_id);
create policy "users update own alerts" on user_alerts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own alerts" on user_alerts for delete using (auth.uid() = user_id);

create policy "users read own notifications" on user_notifications for select using (auth.uid() = user_id);
create policy "users update own notifications" on user_notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own watchlist" on user_watchlist for select using (auth.uid() = user_id);
create policy "users insert own watchlist" on user_watchlist for insert with check (auth.uid() = user_id);
create policy "users delete own watchlist" on user_watchlist for delete using (auth.uid() = user_id);

create policy "submissions are public readable" on metric_submissions for select using (true);
create policy "anyone can submit metric ideas" on metric_submissions for insert with check (true);

create policy "users read own votes" on metric_submission_votes for select using (auth.uid() = user_id);
create policy "users insert own votes" on metric_submission_votes for insert with check (auth.uid() = user_id);
create policy "users delete own votes" on metric_submission_votes for delete using (auth.uid() = user_id);
