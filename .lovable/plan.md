

# Two-Part Fix: Login Persistence + Maintenance System Audit

## Part 1: Login Persistence & Saved Credentials

### Root Cause: Session Dies on Browser Close
The Supabase client in `src/lib/supabase.ts` (line 14) uses **`sessionStorage`** — this is wiped every time the browser/tab closes. That's why you have to re-enter credentials every time.

### Fix
1. **Switch `sessionStorage` → `localStorage`** in `src/lib/supabase.ts` — sessions will persist for days/weeks until the token expires (Supabase default: 1 week refresh window).
2. **Add a "Remember Me" account picker on the login page** — store the last-used email(s) in localStorage so returning users just tap their name and type their password (like Windows login screen). Show avatar initials + email, pre-fill the email field on tap.
3. **Enable browser credential saving** — after successful login, use the [Credential Management API](https://developer.mozilla.org/en-US/docs/Web/API/CredentialManagementAPI) (`navigator.credentials.store()`) to prompt the browser/OS to save the credential. On mobile, this triggers the native "Save Password" prompt, which subsequently allows biometric unlock (Face ID / fingerprint) to autofill. No server-side WebAuthn setup needed — this leverages the browser's built-in password manager.

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/supabase.ts` | Change `storage: sessionStorage` → `storage: localStorage` |
| `src/components/auth/SecureLoginForm.tsx` | Add credential store after login; add account picker UI showing saved emails |
| `src/hooks/security/useSecureAuth.ts` | After successful sign-in, call `navigator.credentials.store()` |

---

## Part 2: Maintenance System — Disconnection Audit

### Issues Found

**Bug 1: Scheduled maintenance doesn't link to rooms**
`ScheduleMaintenanceDialog.tsx` inserts into `maintenance_schedules` with `space_name: "1536"` (text) but **never sets `space_id`** (the UUID foreign key to rooms). So when `MaintenanceScheduleList` queries with `.select("*, rooms:space_id(name, room_number)")`, the join returns `null` — the room name never displays on the schedule card.

**Bug 2: ReportIssueDialog writes wrong column name**
Line 94 inserts `type: data.issue_type` but the `issues` table column is `issue_type`, not `type`. The `as unknown` cast hides the TypeScript error. Reported issues likely have a null `issue_type`, meaning they never show up in `MaintenanceIssuesList` (which filters by `MAINTENANCE_ISSUE_TYPES`).

**Bug 3: No cross-reference between schedules and issues**
`maintenance_schedules` and `issues` are two completely separate tables with no foreign key or linkage. If you schedule maintenance for Room 1536 and also report an issue for Room 1536, there's no way to see them together. The "Issues & Repairs" tab and "Schedule" tab are querying different tables with no shared context.

**Bug 4: MaintenanceStats counts may be wrong**
Stats query (line 20) filters issues by `MAINTENANCE_ISSUE_TYPES` = `['BUILDING_SYSTEMS', 'ELECTRICAL_NEEDS', 'GENERAL_REQUESTS']`, but if Bug 2 means no issues have their `issue_type` set, the "Open Issues" count will always be 0.

### Fix Plan

| File | Change |
|------|--------|
| `src/components/maintenance/ScheduleMaintenanceDialog.tsx` | When user selects a room, also set `space_id` to the room's UUID (not just room_number as text). Query rooms properly and pass both values. |
| `src/components/maintenance/ReportIssueDialog.tsx` | Fix column name: `type` → `issue_type` in the insert payload. Remove `as unknown` cast. |
| `src/components/maintenance/MaintenanceScheduleList.tsx` | Add fallback display: show `space_name` text when `rooms` join is null (for existing data that lacks `space_id`). |
| `src/components/maintenance/MaintenanceIssuesList.tsx` | Verify the query key invalidation matches what `ReportIssueDialog` emits (`maintenance-issues` vs `maintenanceIssues`). Fix mismatch. |

### Query Key Mismatch Detail
- `ReportIssueDialog` invalidates `queryKey: ["maintenanceIssues"]` (camelCase)
- `MaintenanceIssuesList` uses `queryKey: ["maintenance-issues"]` (kebab-case)
- These don't match — newly reported issues won't appear until manual page refresh.

