-- RLS hardening and role normalization (idempotent)
-- Safe to run multiple times; guards against duplicates.

begin;

-- Ensure user_roles table exists
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

-- Unique index to enforce single role row per user
create unique index if not exists user_roles_user_id_uidx on public.user_roles(user_id);

-- Enable RLS where appropriate
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table if exists public.user_sessions enable row level security;

-- Helper: is_admin() function
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  );
$$;

-- Policies: user_roles
-- Users: can read their own role
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'user_roles' and policyname = 'User can view own role'
  ) then
    create policy "User can view own role" on public.user_roles
      for select
      using (user_id = auth.uid());
  end if;
end $$;

-- Admins: can manage all roles
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'user_roles' and policyname = 'Admin manage roles'
  ) then
    create policy "Admin manage roles" on public.user_roles
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Policies: profiles
-- Users: can select and update their own profile
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'User profile read'
  ) then
    create policy "User profile read" on public.profiles
      for select
      using (id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'User profile update'
  ) then
    create policy "User profile update" on public.profiles
      for update
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- Admins: full access to profiles
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Admin profiles all'
  ) then
    create policy "Admin profiles all" on public.profiles
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Policies: user_sessions (optional table)
-- Users manage their own session rows; admins can read all
do $$ begin
  if to_regclass('public.user_sessions') is not null then
    if not exists (
      select 1 from pg_policies where tablename = 'user_sessions' and policyname = 'User sessions self'
    ) then
      create policy "User sessions self" on public.user_sessions
        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
    end if;
    if not exists (
      select 1 from pg_policies where tablename = 'user_sessions' and policyname = 'Admin sessions read'
    ) then
      create policy "Admin sessions read" on public.user_sessions
        for select using (public.is_admin());
    end if;
  end if;
end $$;

commit;
