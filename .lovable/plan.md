
# Fix: Apply Simple Report Wizard to All User Entry Points

## Problem Found

The simplified 2-step wizard was only applied to `IssueDialog.tsx`, but regular users access issue reporting from **different components** that still use the old 4-step `ReportIssueWizard`:

| Entry Point | File | Currently Uses | Who Uses It |
|-------------|------|----------------|-------------|
| User Dashboard "Report Issue" button | `QuickIssueReportButton.tsx` | Old 4-step wizard | Regular users |
| "My Issues" page "Report Issue" button | `MyIssues.tsx` | Old 4-step wizard | Regular users |
| Operations page (admin) | `IssueDialog.tsx` | New 2-step wizard | Admins only |

That's why when you tested as a standard user, you still saw the old flow - the simplified wizard was applied to the wrong file.

---

## Solution

Update these 2 files to use the new `SimpleReportWizard`:

### 1. Update `QuickIssueReportButton.tsx`
This is the main entry point for regular users from their dashboard.

**Changes:**
- Replace `ReportIssueWizard` import with `SimpleReportWizard`
- Update the component inside the dialog

### 2. Update `MyIssues.tsx`
This is where users see their reported issues and can create new ones.

**Changes:**
- Replace `ReportIssueWizard` import with `SimpleReportWizard`
- Update the component rendered when `showIssueWizard` is true
- Pass `assignedRooms` prop (fetch using existing `useOccupantAssignments` hook)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/user/QuickIssueReportButton.tsx` | Replace `ReportIssueWizard` with `SimpleReportWizard` |
| `src/pages/MyIssues.tsx` | Replace `ReportIssueWizard` with `SimpleReportWizard`, add assigned rooms data |

---

## Expected Result

After this fix:
- Regular users on their **Dashboard** will see the 2-step flow
- Regular users on the **My Issues** page will see the 2-step flow
- Admins on the **Operations** page will continue to see the Admin Quick Report (with room search, photos, etc.)

The 3-4 tap experience you designed will finally be in effect for all regular users.
