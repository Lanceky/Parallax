-- Parallax persistence schema.
-- Raw imports, screenshots, audio, and photos are intentionally not persisted.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  over_18 boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists eras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text not null,
  kind text not null default 'age' check (kind in ('age', 'event', 'context', 'speculative')),
  start_year integer,
  end_year integer,
  age_start integer,
  age_end integer,
  anchor_event text,
  slice_rule jsonb,
  knowledge_horizon_year integer,
  parent_era_id uuid references eras(id) on delete set null,
  fork_delta jsonb,
  is_speculative boolean not null default false,
  is_now boolean not null default false,
  voice jsonb,
  completeness real not null default 0 check (completeness >= 0 and completeness <= 1),
  color text,
  created_at timestamptz not null default now(),
  check (end_year is null or start_year is null or end_year >= start_year)
);

create index if not exists eras_user_created_idx on eras(user_id, created_at);

create table if not exists era_entities (
  id uuid primary key default gen_random_uuid(),
  era_id uuid not null references eras(id) on delete cascade,
  qloo_entity_id text not null,
  qloo_type text not null,
  name text not null,
  sentiment smallint not null default 1 check (sentiment between -2 and 2),
  weight real not null default 0 check (weight >= 0),
  provenance text not null check (provenance in ('export', 'screenshot', 'tap', 'photo', 'anchor', 'inferred')),
  source_ref uuid,
  scope text not null default 'private' check (scope in ('private', 'trusted', 'public')),
  created_at timestamptz not null default now()
);

create index if not exists era_entities_era_type_idx on era_entities(era_id, qloo_type);
create unique index if not exists era_entities_private_identity_idx
  on era_entities(era_id, qloo_entity_id, provenance);

create table if not exists anchors (
  id uuid primary key default gen_random_uuid(),
  era_id uuid not null references eras(id) on delete cascade,
  prompt text not null,
  answer_parsed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('whatsapp', 'telegram', 'spotify', 'youtube', 'netflix', 'instagram', 'screenshot', 'photo', 'anchor')),
  status text not null check (status in ('received', 'processing', 'complete', 'failed', 'discarded')),
  entity_count integer not null default 0 check (entity_count >= 0),
  year_min integer,
  year_max integer,
  created_at timestamptz not null default now()
);

create table if not exists councils (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question text not null,
  mode text not null,
  options jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  transcript jsonb not null default '[]'::jsonb,
  verdict jsonb,
  qloo_enabled boolean not null default true,
  stakes jsonb,
  created_at timestamptz not null default now()
);

create table if not exists translations (
  qloo_entity_id text not null,
  target_year integer not null,
  direction text not null check (direction in ('to_past', 'to_present')),
  results jsonb not null default '[]'::jsonb,
  confidence real not null default 0 check (confidence >= 0 and confidence <= 1),
  primary key (qloo_entity_id, target_year, direction)
);

create table if not exists decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  council_id uuid not null references councils(id) on delete cascade,
  chosen_option text not null,
  outcome smallint not null check (outcome in (-1, 1, 2)),
  asked_at timestamptz not null default now(),
  answered_at timestamptz
);

create table if not exists self_trust (
  era_id uuid not null references eras(id) on delete cascade,
  domain text not null,
  alpha real not null default 1 check (alpha > 0),
  beta real not null default 1 check (beta > 0),
  primary key (era_id, domain)
);

create table if not exists consent_log (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create table if not exists mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  scope text not null check (scope in ('private', 'trusted', 'public')),
  allowed_tools text[] not null default '{}',
  label text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mcp_tokens_active_idx on mcp_tokens(user_id) where revoked_at is null;
