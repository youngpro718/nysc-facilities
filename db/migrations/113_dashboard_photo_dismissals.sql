-- 113: Per-admin dismissal of building-card issue photos.
--
-- Product decision 2026-07-20: the admin dashboard's "latest issue photo"
-- hero picks the single newest open issue-with-photo per building and shows
-- it forever (until resolved/replaced/deleted) — no way to say "I've seen
-- this enough". Adding a per-user dismissal so each admin can move a photo
-- out of the hero slot (it drops to a small thumbnail, still viewable) and
-- promote the next one up. Deliberately NOT reusing issues.seen — that
-- column means "the reporter has seen updates to their own issue" and is
-- read by the user's own issue list; conflating it with "an admin dismissed
-- this from the command dashboard" would leak one feature into the other.

create table if not exists public.dashboard_photo_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, issue_id)
);

alter table public.dashboard_photo_dismissals enable row level security;

create policy "dismissals_select_own"
  on public.dashboard_photo_dismissals for select
  using (user_id = auth.uid());

create policy "dismissals_insert_own"
  on public.dashboard_photo_dismissals for insert
  with check (user_id = auth.uid());

create policy "dismissals_delete_own"
  on public.dashboard_photo_dismissals for delete
  using (user_id = auth.uid());

create index if not exists idx_dashboard_photo_dismissals_user
  on public.dashboard_photo_dismissals(user_id);
