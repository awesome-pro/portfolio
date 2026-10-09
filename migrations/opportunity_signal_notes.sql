-- signal_notes: dated notes on the opportunity signal board.
--
-- Paste this whole file into the Supabase SQL editor in one go.
--
-- A note is three things: some text, the date it is *for*, and zero or more
-- saved companies it refers to. "Message Baseten on Monday" is a row with
-- note_date = Monday and signal_ids = [<baseten id>]. The date is the whole
-- point — it is the day you want to be reminded, not the day you wrote it.
--
-- Idempotent: safe to run twice, and safe on a database that already has it.
--
-- This file is the source of truth for the table. It is deliberately separate
-- from migrations/opportunity_signals.sql so that adding notes to an existing
-- database never touches the signal rows themselves.

begin;

create table if not exists public.signal_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  -- `date`, not `timestamptz`: "Monday" must not slide a day forward or back
  -- when the same row is read from a different timezone.
  note_date date not null default current_date,
  -- The companies this note refers to, as opportunity_signals ids. Empty is
  -- normal — a note can be about nothing in particular.
  signal_ids uuid[] not null default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  -- A note with no text is never useful, and the dialog's save button is
  -- disabled for it anyway; this is the backstop.
  constraint signal_notes_body_not_blank check (btrim(body) <> '')
);

-- The notes tab reads every note and groups them in the browser, so this
-- index is for the one ordering the page relies on: a date, time within it.
create index if not exists signal_notes_note_date_idx
  on public.signal_notes (note_date desc, created_at asc);

grant select, insert, update, delete on public.signal_notes to service_role;

-- Admin-only, same as opportunity_signals: read through the service-role
-- client under /admin/*. RLS with no policy means the anon role sees nothing.
alter table public.signal_notes enable row level security;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification: expect table_name = signal_notes, rls_enabled = true and no
-- policy name (NULL). On a fresh install note_count is 0.
-- ---------------------------------------------------------------------------
select c.relname        as table_name,
       c.relrowsecurity as rls_enabled,
       p.policyname
from pg_class c
left join pg_policies p
       on p.schemaname = 'public'
      and p.tablename = c.relname
where c.oid = 'public.signal_notes'::regclass;

select count(*) as note_count from public.signal_notes;
