

## Fix: Cascade-delete child records before deleting a room

The delete fails because `deleteSpace.ts` tries to delete the room directly, but 34 other tables have foreign keys pointing to `rooms`. For room 687 specifically, 3 tables have data blocking the delete: `room_lighting_status`, `room_history`, and `lockbox_slots`.

### Approach

**Create a database function** `delete_room_cascade(p_room_id UUID)` that deletes from all referencing tables in the correct order, then deletes the room itself — all within a single transaction. This is safer and faster than making 30+ individual API calls from the client.

**Update `deleteSpace.ts`** to call `supabase.rpc('delete_room_cascade', { p_room_id: id })` instead of a direct `.delete()` on the rooms table.

### Database function will delete from these tables (in order):
1. `room_lighting_status`, `lighting_fixtures`, `room_health_metrics`, `room_maintenance_schedule`
2. `room_history`, `room_notes`, `room_finishes_log`, `room_occupancy`
3. `room_inventory`, `room_key_access`, `lockbox_slots`
4. `court_assignments`, `court_rooms`, `term_assignments`
5. `occupant_room_assignments` (all FK columns), `occupants`
6. `room_relationships` (both columns), `hallway_adjacent_rooms`
7. `inventory_audits`, `room_relocations` (both columns)
8. `relocations` (both columns), `renovations`
9. `key_requests`, `staff_tasks` (both columns), `floorplan_objects` (via constraint)
10. `rooms` (children with `parent_room_id` first, then the room itself)

### Files to change:
- **New migration**: Create `delete_room_cascade` PL/pgSQL function
- **`src/components/spaces/services/deleteSpace.ts`**: Replace direct delete with RPC call for rooms

