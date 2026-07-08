-- 095_role_permission_fixes.sql
-- Fixes found during a 2026-07-08 per-role RLS audit (standard, court_aide,
-- court_officer, court_liaison, purchasing, facilities_manager).

-- 1. inventory_items_write excluded purchasing + facilities_manager even
--    though both roles have full Inventory UI access — every write was
--    silently 400ing under RLS. Also drops the dead 'cmc' role reference
--    (not in the app's UserRole type; nothing can ever be assigned it).
drop policy if exists inventory_items_write on public.inventory_items;
create policy inventory_items_write on public.inventory_items
  for all
  using (has_any_role(array['admin', 'court_aide', 'purchasing', 'facilities_manager']))
  with check (has_any_role(array['admin', 'court_aide', 'purchasing', 'facilities_manager']));

-- 2. unified_spaces_admin_all used is_admin() (admin/system_admin only)
--    instead of is_privileged() (admin/system_admin/facilities_manager) —
--    facilities_manager could view but never edit Spaces despite the UI
--    granting full access.
drop policy if exists unified_spaces_admin_all on public.unified_spaces;
create policy unified_spaces_admin_all on public.unified_spaces
  for all
  using (is_privileged())
  with check (is_privileged());

-- 3. maintenance_schedules write policies were is_admin()-gated (one even
--    hardcoded to the literal 'admin' role, excluding system_admin too),
--    so facilities_manager's own "Maintenance" module was view-only at the
--    DB layer. Consolidate to a single is_privileged()-gated policy.
drop policy if exists "Allow admin full access to maintenance schedules" on public.maintenance_schedules;
drop policy if exists admins_manage_maintenance_schedules on public.maintenance_schedules;
drop policy if exists admins_modify on public.maintenance_schedules;
create policy maintenance_schedules_privileged_write on public.maintenance_schedules
  for all
  using (is_privileged())
  with check (is_privileged());

-- 4. assign_key_if_available had an orphaned 2-arg SECURITY DEFINER overload
--    with no role check inside it. The app only ever calls the 3-arg
--    version (useKeyAssignment.ts), which correctly runs under the caller's
--    own RLS. The 2-arg overload let ANY authenticated user (any role)
--    assign any key to any occupant directly via the API, bypassing the
--    key_assignments RLS (which requires admin/system_admin/facilities_manager).
drop function if exists public.assign_key_if_available(uuid, uuid);

-- 5. occupant_room_assignments had a duplicate, functionally-dead policy
--    pair: ora_self_insert/ora_self_update restricted self-assignment to a
--    fixed list of room types, but the newer, broader
--    occupant_room_assignments_self_insert/self_update (added for the
--    self-serve "My Room" feature) already allows any room type for
--    assignment_type='work_location'. Since Postgres ORs permissive
--    policies, the room-type restriction was already fully bypassed — this
--    just removes the dead cruft, no access changes.
drop policy if exists ora_self_insert on public.occupant_room_assignments;
drop policy if exists ora_self_update on public.occupant_room_assignments;
drop policy if exists ora_self_delete on public.occupant_room_assignments;
