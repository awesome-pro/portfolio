create table public.contribution_targets (
  id uuid not null default gen_random_uuid (),
  repo_url text not null,
  description text null,
  topics text[] null default '{}'::text[],
  company_url text null,
  why_recommended text null,
  suggested_contribution text null,
  status text null default 'suggested'::text,
  user_notes text null,
  discovered_at timestamp with time zone null default now(),
  constraint contribution_targets_pkey primary key (id),
  constraint contribution_targets_repo_url_key unique (repo_url)
) TABLESPACE pg_default;

create index IF not exists contribution_targets_discovered_at_idx on public.contribution_targets using btree (discovered_at desc) TABLESPACE pg_default;

create index IF not exists contribution_targets_status_idx on public.contribution_targets using btree (status) TABLESPACE pg_default;