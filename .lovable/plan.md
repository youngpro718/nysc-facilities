

# Unified Audit Trail for All Personnel & Room Movements

## Current State

**What's already audited (via database triggers):**
- `occupant_room_assignments` → trigger writes to `room_assignment_audit_log` + sends `user_notifications`
- `key_assignments` → trigger writes to `key_audit_logs`

**What's NOT audited (the gap):**
- `court_assignments` — judge moves, clerk assignments, sergeant assignments, part changes, bulk shuffles, Quick Reassign, swaps — **zero audit logging**. This is the biggest blind spot. Every `.update()`, `.upsert()`, `.insert()`, and `.delete()` on `court_assignments` across 5+ components fires with no record of who did what.
- Room status changes in `operationsService.updateRoomStatus()` write to a nonexistent `audit_logs` table (it was never created).

## Plan

### 1. Create `court_assignment_audit_log` table

New table to capture every court assignment mutation:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| assignment_id | uuid | FK to court_assignments (nullable for deletes) |
| room_id | uuid | The room involved |
| action_type | text | `assigned`, `reassigned`, `swapped`, `cleared`, `covered`, `updated`, `deleted` |
| reason | text | Why the move happened (covering, permanent reassign, swap, bulk shuffle) |
| old_values | jsonb | Previous state (justice, clerks, sergeant, part) |
| new_values | jsonb | New state |
| changed_fields | text[] | Which columns changed |
| performed_by | uuid | `auth.uid()` |
| performed_at | timestamptz | Default now() |
| notes | text | Optional notes from the reason-for-move prompt |

### 2. Database trigger on `court_assignments`

Create a `log_court_assignment_changes` trigger function (INSERT/UPDATE/DELETE) that automatically writes to `court_assignment_audit_log`. This captures everything regardless of which UI component initiates the change — LiveCourtGrid, EnhancedCourtAssignmentTable, CourtAssignmentTable, AddStaffDialog, CreateAssignmentDialog, bulk shuffle, etc.

### 3. Create unified `audit_logs` table

The `operationsService.updateRoomStatus()` already tries to write to `audit_logs` but that table doesn't exist. Create it as a general-purpose audit table for room status changes and other operational mutations.

### 4. Court Assignment Audit Viewer

Add a lightweight "Assignment History" panel accessible from the Court Operations page — a simple table showing recent movements: who was moved, from where, to where, by whom, when, and why.

### Files to Create/Modify

| File | Change |
|------|--------|
| **Migration SQL** | Create `court_assignment_audit_log` table, trigger function, and `audit_logs` table |
| `src/components/court/CourtAssignmentAuditPanel.tsx` | **New** — UI panel showing court assignment history |
| `src/components/court/AssignmentManagementPanel.tsx` | Add "History" tab/button to open audit panel |

### What This Covers

Once the trigger is in place, every court assignment change is automatically captured — no need to modify the 7+ components that write to `court_assignments`. The trigger handles it all at the database level, same pattern as the existing `occupant_room_assignments` audit trigger.

