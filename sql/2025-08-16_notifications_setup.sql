-- Admin and User Notifications setup
-- Safely create tables, RLS, helper function, and triggers to auto-emit admin notifications

-- Extensions
create extension if not exists pgcrypto;

-- Admin notifications table
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  title text not null,
  message text not null,
  urgency text not null default 'medium' check (urgency in ('low','medium','high')),
  related_table text,
  related_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  read_by uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.admin_notifications enable row level security;

-- Simple admin check via user_roles
-- Only admins can read admin_notifications
create policy if not exists admin_notifications_select_for_admins
on public.admin_notifications for select
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- Inserts go through SECURITY DEFINER function only
create policy if not exists admin_notifications_block_direct_insert
on public.admin_notifications for insert
with check (false);

-- Update allowed to mark read_by by admins (optional)
create policy if not exists admin_notifications_update_read_by_for_admins
on public.admin_notifications for update
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- Helper function to emit admin notifications
create or replace function public.emit_admin_notification(
  p_type text,
  p_title text,
  p_message text,
  p_urgency text default 'medium',
  p_related_table text default null,
  p_related_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if p_urgency not in ('low','medium','high') then
    p_urgency := 'medium';
  end if;

  insert into public.admin_notifications (
    notification_type, title, message, urgency, related_table, related_id, metadata
  ) values (
    p_type, p_title, p_message, p_urgency, p_related_table, p_related_id, coalesce(p_metadata, '{}'::jsonb)
  );
exception when others then
  -- never block the caller
  null;
end;
$$;

grant execute on function public.emit_admin_notification(text, text, text, text, text, uuid, jsonb) to authenticated, service_role;

-- Optional: user notifications table (if not present) used by edge functions
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  urgency text not null default 'medium' check (urgency in ('low','medium','high')),
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  related_id text,
  created_at timestamptz not null default now()
);

alter table public.user_notifications enable row level security;

-- Users can read their own notifications
create policy if not exists user_notifications_select_own
on public.user_notifications for select
using (user_id = auth.uid());

-- Only the user can update their own notifications (e.g., mark read)
create policy if not exists user_notifications_update_own
on public.user_notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Inserts allowed via service role or backend only; block direct client inserts
create policy if not exists user_notifications_block_insert
on public.user_notifications for insert
with check (false);

-- Triggers to automatically notify admins of new requests/issues
-- Key Requests
create or replace function public.trg_admin_notify_new_key_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.emit_admin_notification(
    'new_key_request',
    'New Key Request',
    coalesce('New ' || coalesce(new.request_type, 'key') || ' request submitted', 'New key request submitted'),
    case when coalesce(new.priority,'') in ('urgent','high','critical') then 'high' else 'medium' end,
    'key_requests',
    new.id,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_new_key_request on public.key_requests;
create trigger trg_admin_notify_new_key_request
after insert on public.key_requests
for each row execute function public.trg_admin_notify_new_key_request();

-- Supply Requests
create or replace function public.trg_admin_notify_new_supply_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.emit_admin_notification(
    'new_supply_request',
    'New Supply Request',
    coalesce('New supply request: ' || coalesce(new.title, 'Untitled'), 'New supply request submitted'),
    case when coalesce(new.priority,'') in ('urgent','high','critical') then 'high' else 'medium' end,
    'supply_requests',
    new.id,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_new_supply_request on public.supply_requests;
create trigger trg_admin_notify_new_supply_request
after insert on public.supply_requests
for each row execute function public.trg_admin_notify_new_supply_request();

-- Issues
create or replace function public.trg_admin_notify_new_issue()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.emit_admin_notification(
    'new_issue',
    'New Issue Reported',
    coalesce('Issue: ' || coalesce(new.title, 'Untitled'), 'New issue reported'),
    case when coalesce(new.priority,'') in ('critical') then 'high' else 'medium' end,
    'issues',
    new.id,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_new_issue on public.issues;
create trigger trg_admin_notify_new_issue
after insert on public.issues
for each row execute function public.trg_admin_notify_new_issue();
