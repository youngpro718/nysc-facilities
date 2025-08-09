-- DB Audit Fixes - Security & Performance
-- Date: 2025-08-09

-- 1) Ensure RLS policies exist on public.security_rate_limits
alter table if exists public.security_rate_limits enable row level security;

-- Read policy for authenticated and service roles
create policy if not exists rate_limits_read
on public.security_rate_limits
for select
to authenticated, service_role
using (true);

-- Write policy for service role only
create policy if not exists rate_limits_write
on public.security_rate_limits
for all
to service_role
using (true)
with check (true);

-- 2) Harden function search_path for public.set_updated_at
-- If your function has a different signature, adjust accordingly.
alter function if exists public.set_updated_at()
  set search_path = pg_catalog, public;

-- 3) Add covering indexes for frequently referenced foreign keys
-- Access delegation FKs
create index concurrently if not exists idx_access_delegation_delegate_id
  on public.access_delegation (delegate_id);
create index concurrently if not exists idx_access_delegation_delegator_id
  on public.access_delegation (delegator_id);

-- Court assignments FKs
create index concurrently if not exists idx_court_assignments_term_id
  on public.court_assignments (term_id);
create index concurrently if not exists idx_court_assignments_room_id
  on public.court_assignments (room_id);

-- Emergency lighting routes
create index concurrently if not exists idx_emergency_lighting_routes_floor_id
  on public.emergency_lighting_routes (floor_id);

-- 4) Drop duplicate indexes (retain one of the identical pairs)
-- occupant_room_assignments
-- Keep the newer naming; drop the duplicates if they exist
drop index concurrently if exists public.idx_occupant_room_assignments_occupant_id;
drop index concurrently if exists public.idx_occupant_room_assignments_room_id;

-- profiles (pkey covers id, drop redundant unique index)
drop index concurrently if exists public.profiles_id_key;

-- room_properties (pkey covers space_id or vice versa; keep only one)
drop index concurrently if exists public.room_properties_space_id_key;

-- users_metadata (pkey covers id, drop redundant unique index)
drop index concurrently if exists public.users_metadata_id_key;

-- 5) Optional: consolidate multiple permissive policies (manual review recommended)
-- Example shown for user_sessions; review before applying in production.
-- drop policy if exists "Users can view their own sessions" on public.user_sessions;
-- Ensure remaining policy fully covers intended access.

-- 6) Auth: Leaked password protection must be enabled via Dashboard
-- Supabase Dashboard -> Authentication -> Passwords -> Enable leaked password protection
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
