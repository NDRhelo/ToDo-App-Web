-- Prepared for review. Do not apply until explicitly authorized.
-- Creates only boards/subtasks; does not alter public.tasks or authentication.
-- Intentionally no IF NOT EXISTS: an existing relation must be reviewed first.
-- Run the entire migration as one transaction when approved.
--
-- Client contract (Supabase JS v2, authenticated session):
-- boards.insert({ title, accent? }).select(...).single()
-- boards.update({ title?, accent? }).eq('id', id).select(...).single()
-- boards.delete().eq('id', id).select('id')
-- subtasks.insert({ board_id, title, completed? }).select(...).single()
-- subtasks.update({ title?, completed? }).eq('id', id).select(...).single()
-- subtasks.delete().eq('id', id).select('id')
-- SELECT is granted on every column, so select('*'), filters, ordering and
-- nested boards -> subtasks reads are supported, subject to RLS on both tables.
-- Omit id, user_id and created_at from inserts: the database supplies them.
-- Do not send complete row objects as update payloads. Only the listed mutable
-- columns are writable. Ownership/board reassignment and upsert are not needed.

begin;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  title text not null,
  accent text not null default 'violet',
  created_at timestamptz not null default now(),

  constraint boards_title_valid check (
    char_length(btrim(title)) >= 1
    and char_length(title) <= 100
  ),
  constraint boards_accent_valid check (
    accent in ('violet', 'slate', 'sand')
  )
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null
    references public.boards(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),

  constraint subtasks_title_valid check (
    char_length(btrim(title)) >= 1
    and char_length(title) <= 160
  )
);

create index boards_user_created_idx
  on public.boards (user_id, created_at, id);

create index subtasks_board_created_idx
  on public.subtasks (board_id, created_at, id);

alter table public.boards enable row level security;
alter table public.subtasks enable row level security;

-- SELECT/DELETE use USING; INSERT uses WITH CHECK; UPDATE uses both.
-- The SELECT policy also permits returning the owner's inserted/updated rows.
create policy boards_owner_access
  on public.boards
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Ownership is inherited from the parent. Its SELECT policy grants access
-- to the authenticated owner's boards, so this EXISTS is not blocked for
-- their own subtasks. No SECURITY DEFINER function or RLS bypass is required.
-- A foreign board cannot satisfy WITH CHECK even if its UUID is known.
create policy subtasks_owner_access
  on public.subtasks
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.boards b
      where b.id = subtasks.board_id
        and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.boards b
      where b.id = subtasks.board_id
        and b.user_id = (select auth.uid())
    )
  );

-- Remove any default table-level grants before granting minimum privileges.
-- RLS controls which rows; column privileges control which fields are writable.
revoke all on table public.boards
  from public, anon, authenticated;
revoke all on table public.subtasks
  from public, anon, authenticated;

grant select, delete on public.boards to authenticated;
grant insert (title, accent)
  on public.boards to authenticated;
grant update (title, accent)
  on public.boards to authenticated;

grant select, delete on public.subtasks to authenticated;
grant insert (board_id, title, completed)
  on public.subtasks to authenticated;
grant update (title, completed)
  on public.subtasks to authenticated;

-- No demo data, seed inserts, triggers or modifications to existing tasks.
commit;
