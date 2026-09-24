-- Artifact view counts.
--
-- Why this needs a migration and an API route at all: the artifact pages are
-- statically rendered with ISR (revalidate = 30). A page render happens once per
-- revalidation window, not once per visitor, so incrementing a counter inside
-- the page component would count revalidations, not reads. Instead every visit
-- POSTs to /api/artifacts/[slug]/view, which calls the function below through
-- the service-role client.

alter table public.artifacts
  add column if not exists view_count integer not null default 0;

alter table public.artifacts
  drop constraint if exists artifacts_view_count_nonnegative;
alter table public.artifacts
  add constraint artifacts_view_count_nonnegative check (view_count >= 0);

-- Atomic increment: `update ... returning` takes a row lock, so two visitors
-- arriving at the same moment can never lose a count the way a read-then-write
-- from the route handler would.
create or replace function public.increment_artifact_view(p_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.artifacts
     set view_count = view_count + 1
   where slug = p_slug
  returning view_count;
$$;

-- service_role only. The browser never calls this directly (the anon key cannot
-- execute it); it is reached through the server-side route handler.
revoke all on function public.increment_artifact_view(text) from public;
grant execute on function public.increment_artifact_view(text) to service_role;

-- ---------------------------------------------------------------------------
-- Verification: expect column view_count (integer, not null, default 0) and a
-- single row for increment_artifact_view with prosecdef = true.
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'artifacts'
  and column_name = 'view_count';

select p.proname, p.prosecdef
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'increment_artifact_view';
