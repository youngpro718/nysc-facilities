

# Fix: Generated Column Violation Audit

## Finding

The database has exactly **one** generated column across all tables:
- **`personnel_profiles.full_name`** — auto-computed as `first_name || ' ' || last_name`

There is **one violation** in the codebase:

| File | Line | Problem |
|------|------|---------|
| `src/services/court/staffManagement.ts` | 34 | `full_name: fullName` included in `.insert()` payload — causes "cannot insert a non-DEFAULT value into column full_name" error |

All other insert/update calls to `personnel_profiles` (in `judgeManagement.ts` and `PersonnelFormDialog.tsx`) are clean — they don't include `full_name`.

## Fix

**`src/services/court/staffManagement.ts`** — Remove line 34 (`full_name: fullName`) from the insert payload. Also remove the unused `fullName` variable on line 19. The database auto-generates `full_name` from `first_name` and `last_name`.

That's it — single line removal fixes the error. No other generated column violations exist anywhere in the project.

