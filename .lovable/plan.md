

# Fix: Issue Resolution Failing + Audit of Recent Changes

## Root Cause of "Failed to resolve"

The mutation in `IssueDetails.tsx` writes to **two columns that don't exist** in the database:

| Code writes to | Actual DB column |
|---|---|
| `resolution_date` | `resolved_at` (exists) |
| `resolution_type` | **Does not exist** |

Supabase silently rejects the entire update because `resolution_type` is not a real column.

## Fix (2 parts)

### 1. Add `resolution_type` column to the `issues` table
Run a migration:
```sql
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS resolution_type text;
```

### 2. Fix column name in `IssueDetails.tsx`
Change line 81 from `resolution_date` to `resolved_at`:
```typescript
// Line 81 — change:
resolution_date: new Date().toISOString(),
// to:
resolved_at: new Date().toISOString(),
```

### 3. Fix the resolved banner display (line 144)
The banner already correctly reads `resolved_at` — no change needed there. But `resolution_type` was also being read via `(issue as any).resolution_type` which will now work once the column exists.

## Audit of Other Recent Changes

| Feature | Status | Issue |
|---|---|---|
| **Issue categories** (Structural, Furniture) | OK | Constants added correctly |
| **Auto-title generation** | OK | Works in SimpleReportWizard |
| **Lockbox color-coding** | OK | CSS classes applied correctly |
| **Lockbox dialog labels** | OK | Human-readable labels in place |
| **Room planned work tab** | Needs verification | Query references `to_room_id` on `staff_tasks` — needs DB column check |
| **CreateTaskDialog schema** | OK | `issue_id` added to zod schema |
| **UserIssue `updated_at`** | OK | Field added to interface |
| **Supply receipt generation** | OK | On-demand receipt logic in place |

### 4. Verify `to_room_id` exists on `staff_tasks`
Will check during implementation. If missing, the Room "Planned" tab will silently return empty — not a crash but incorrect.

## Files to Change
- **Migration**: Add `resolution_type` column to `issues`
- **`src/features/issues/components/issues/details/IssueDetails.tsx`**: Fix `resolution_date` → `resolved_at`

