

# Issue Details Panel Cleanup & Court Operations Issue Clickability

## Problem 1: Issue Details Panel Layout
The issue details sheet that opens when you click "View Details" has layout issues:
- The header has a large `text-xl` title, edit button, and delete button all cramped together
- The badges (status, priority, type) are displayed redundantly — once in the header and again in the content area
- The "Resolve" and "Create Task" buttons sit in an awkward row above the tabs
- The two-column grid layout crams description + linked tasks into one column while location info sits in another

### Fixes
1. **`IssueDetailsHeader.tsx`**: Reduce title to `text-lg`, move the status badge inline with the title, and group edit/delete into a compact icon row on the right.
2. **`IssueDetailsContent.tsx`**: Remove the duplicate `IssueBadges` section at the top (already shown in header). Move location metadata into a compact single-row strip instead of a full column. Keep description and linked tasks in a clean single-column flow.
3. **`IssueDetails.tsx`**: Move the Resolve and Create Task buttons into the header row (next to edit/delete) so they don't eat a whole row of space.

## Problem 2: Court Operations — Issues Not Clickable
In the Court Operations page, when a room has issues:
- The `AssignmentDetailPanel` shows a "Has Issues" or "Urgent Issues" badge but there's no way to see what the issues are or click through
- The `TermSheetBoard` shows an issue count icon but it's not interactive

### Fixes (Role-Aware)

4. **`AssignmentDetailPanel.tsx`**: Add an "Issues" section below the maintenance section that lists actual issues for that room (using `getIssuesForRoom`). Each issue shows title, priority, and status. For **admins**, clicking an issue navigates to `/operations?tab=issues` (the Building Issues page). For **CMCs/non-admins**, clicking opens the `IssueDetails` sheet inline (same as the existing sheet component) so they see the details without leaving Court Operations.

5. **`TermSheetBoard.tsx`**: Make the issue count badge clickable. For admins, navigate to the issues page. For non-admins, open the issue detail sheet.

6. **Create a shared `IssuePreviewSheet` wrapper** that can be used from Court Operations to show `IssueDetails` in a sheet without navigating away.

## Files to Change

| File | Change |
|------|--------|
| `IssueDetailsHeader.tsx` | Compact layout, smaller title, inline actions |
| `IssueDetailsContent.tsx` | Remove duplicate badges, single-column flow, compact metadata strip |
| `IssueDetails.tsx` | Move Resolve/Create Task into header area |
| `AssignmentDetailPanel.tsx` | Add clickable issues list section with role-aware behavior |
| `TermSheetBoard.tsx` | Make issue count clickable |
| New: `IssuePreviewSheet.tsx` | Shared sheet wrapper for inline issue viewing from other modules |

