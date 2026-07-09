-- 098_fix_issue_comments_and_linked_tasks.sql
-- Fixes three confirmed production bugs in the /operations issue details
-- dialog (verified live 2026-07-08):
--
-- 1. Posting a comment 400s with 42703 "column issues.last_activity_at does
--    not exist". The AFTER INSERT trigger update_issue_activity on
--    issue_comments runs update_issue_last_activity(), which does
--    `UPDATE issues SET last_activity_at = NOW() WHERE id = NEW.issue_id`.
--    That column was never added to issues. (Confirmed via
--    pg_get_functiondef: the function references only last_activity_at,
--    nothing else missing.)
--
-- 2. Reading comments 400s with PGRST200: the UI embed
--    `profiles:author_id(first_name,last_name,avatar_url)` requires a FK
--    from issue_comments.author_id to profiles, which does not exist
--    (issue_comments has only its primary key — confirmed via pg_constraint).
--    The Comments tab silently renders empty even when rows exist.
--
-- 3. "Linked Tasks" and "Create Task from issue" 400 because the UI
--    reads/writes staff_tasks.issue_id, which does not exist on staff_tasks.

-- 1. Add the missing last_activity_at column the trigger function writes to.
alter table public.issues
  add column if not exists last_activity_at timestamptz not null default now();

-- 2. Add the missing FK so PostgREST can resolve the profiles:author_id(...)
--    embed. No orphaned author_id values found (0 rows where author_id is
--    set but has no matching profiles row), so no cleanup UPDATE is needed
--    before adding the constraint.
alter table public.issue_comments
  add constraint issue_comments_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

-- 3. Add the missing issue_id link on staff_tasks used by the "Linked
--    Tasks" list and "Create Task" action on the issue details dialog.
alter table public.staff_tasks
  add column if not exists issue_id uuid references public.issues(id) on delete set null;

create index if not exists idx_staff_tasks_issue_id on public.staff_tasks(issue_id);

-- Note: RLS on issue_comments already covers the required access —
-- issue_comments_insert (authenticated, with_check author_id = auth.uid())
-- and issue_comments_read (authenticated, qual true) — confirmed via
-- pg_policies. No policy changes needed.
