-- Edits to the interview prep checklist.
--
-- The markdown file stays the base: 487 items parsed at build time. This table
-- holds only what the user changes from the page, so the two never fight:
--
--   * a row with a base item's key and new text  -> that item is reworded
--   * a row with a base item's key and deleted   -> that item is hidden
--   * a row with a key starting `custom-`        -> a new item, inserted at the
--                                                   end of its section
--
-- `deleted` is a flag rather than a row deletion so a hidden base item can be
-- restored, and so the "hidden" toggle has something to show. Only genuinely
-- custom items are ever hard-deleted, and that is their own row.
--
-- Rewording an item in the markdown gives it a new key (keys are hashes of the
-- text, see lib/prep-checklist.ts), so a stale override stops matching and the
-- item falls back to the file. That fails safe: the edit is ignored rather than
-- applied to the wrong line.

create table if not exists public.prep_items (
  item_key   text primary key,
  section_id text not null,
  text       text,
  deleted    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prep_items_section_idx
  on public.prep_items (section_id, created_at);

alter table public.prep_items enable row level security;
