-- opportunity_signals: simplified schema.
--
-- Replaces the old wide shape (signal_type, reason, job_links, relevant_links,
-- people_to_reach, match_score, interview_probability) with a single `links`
-- array. Like migrations/artifacts.sql, this file is the source of truth for
-- the live table.
--
-- WARNING: this drops and recreates the table, so existing rows are discarded.

drop table if exists public.opportunity_signals cascade;

create table public.opportunity_signals (
  id uuid primary key default gen_random_uuid(),
  company_name text not null unique,
  website text null,
  links jsonb not null default '[]'::jsonb,
  notes text null,
  discovered_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status text null default 'new',
  constraint opportunity_signals_links_array check (jsonb_typeof(links) = 'array')
);

create index if not exists opportunity_signals_discovered_at_idx
  on public.opportunity_signals (discovered_at desc);

grant select, insert, update, delete on public.opportunity_signals to service_role;

-- Admin-only: read exclusively through the service-role client under /admin/*.
-- RLS enabled with no policy is intentional — the anon role sees nothing.
alter table public.opportunity_signals enable row level security;

-- ---------------------------------------------------------------------------
-- Verification: expect rls_enabled = true and zero rows in pg_policies.
-- ---------------------------------------------------------------------------
select c.relname        as table_name,
       c.relrowsecurity as rls_enabled,
       p.policyname
from pg_class c
left join pg_policies p
       on p.schemaname = 'public'
      and p.tablename = c.relname
where c.oid = 'public.opportunity_signals'::regclass;
