-- opportunity_signal_focus: one boolean, one star.
--
-- ONE-PASTE MIGRATION. Replaces the tier / rank / tags priority model (which
-- was over-built for the job) with a single `focus` flag, carrying over every
-- company that was already tier = 'focus'. Idempotent: safe to run twice.
--
-- Ordering after this: starred first, then newest-first. That is the whole
-- model — see lib/signal-focus.ts.

begin;

-- ---------------------------------------------------------------------------
-- 1. The column
-- ---------------------------------------------------------------------------
alter table public.opportunity_signals
  add column if not exists focus boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. Carry over the old tiers, if they are still around
-- ---------------------------------------------------------------------------
-- Guarded so this file also works on a database built from
-- migrations/opportunity_signals.sql, where tier never existed.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'opportunity_signals'
      and column_name = 'tier'
  ) then
    execute $backfill$
      update public.opportunity_signals
      set focus = true
      where tier = 'focus'
        and focus = false
    $backfill$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Drop the old model (its constraints and indexes go with the columns)
-- ---------------------------------------------------------------------------
alter table public.opportunity_signals
  drop column if exists tier,
  drop column if exists rank,
  drop column if exists tags;

-- ---------------------------------------------------------------------------
-- 4. Index for the list's sort
-- ---------------------------------------------------------------------------
create index if not exists opportunity_signals_focus_idx
  on public.opportunity_signals (focus desc, discovered_at desc);

commit;

-- PostgREST caches the table shape; make it pick up the change now.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification: focus_count should equal the number of companies you had
-- starred under the old model (21 if you never changed it).
-- ---------------------------------------------------------------------------
select count(*)                        as signals,
       count(*) filter (where focus)   as focus_count,
       count(*) filter (where status = 'applied') as applied
from public.opportunity_signals;

select company_name, status, discovered_at::date as discovered
from public.opportunity_signals
where focus
order by discovered_at desc;
