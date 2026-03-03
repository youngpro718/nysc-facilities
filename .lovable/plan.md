

## Fix: Wrong column name in `delete_room_cascade`

**Root cause**: The database function references `occupants.current_room_id` which doesn't exist — the actual column is `occupants.room_id`. This causes the entire function to fail.

### Change
**Database migration**: Replace the `delete_room_cascade` function, changing line:
```sql
-- Before
DELETE FROM public.occupants WHERE current_room_id = p_room_id;
-- After
DELETE FROM public.occupants WHERE room_id = p_room_id;
```

The rest of the function is correct. This single column name fix should resolve the deletion failure.

### File
- **New migration**: `CREATE OR REPLACE FUNCTION delete_room_cascade` with the corrected column name.
- No client-side code changes needed — `deleteSpace.ts` is already correct.
