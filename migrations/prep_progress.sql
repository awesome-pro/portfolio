-- Interview prep progress.
--
-- One row per item the user has ever touched, keyed by the same content hash
-- the page uses (see lib/prep-checklist.ts). `done` is a boolean rather than
-- "delete the row when unticked" on purpose: an untick has to be a *timestamped
-- write*, otherwise another device that still holds the tick locally would
-- resurrect it on the next merge. With updated_at, the newest write wins per
-- item and nothing is ever lost or un-unticked by accident.
--
-- A row is at most ~50 bytes and the checklist has 487 items, so the table
-- tops out in the tens of kilobytes.

create table if not exists public.prep_progress (
  item_key   text primary key,
  done       boolean not null default true,
  updated_at timestamptz not null default now()
);

-- The API always reads the whole table (it is tiny), but this keeps the
-- ordering cheap if that ever stops being true.
create index if not exists prep_progress_updated_at_idx
  on public.prep_progress (updated_at desc);

-- Reached only with the service-role key from the admin API route, which
-- checks the session first. No anon access.
alter table public.prep_progress enable row level security;
