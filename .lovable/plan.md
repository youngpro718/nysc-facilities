

# Fix: Issue Details Header Overlap

## Problem
The title and action buttons share a single row. When the title is long (e.g., "Plumbing Issues in Room 302"), it overlaps the Resolve/Create Task/Edit/Delete buttons because there's not enough horizontal space.

## Solution: Two-Row Header Layout

Split the header into two distinct rows:

**Row 1 — Title + Status Badge**
Full-width row for the issue title and status badge. Title gets `truncate` or wraps naturally across the full width. The dialog's built-in close button (top-right) handles closing.

**Row 2 — Action Buttons**
A separate row below the title with all action buttons (Resolve, Create Task, Edit, Delete) aligned to the right. This gives them guaranteed space and eliminates any overlap with the title.

```text
┌─────────────────────────────────────────────────┐
│  Plumbing Issues in Room 302    [Open] badge    │  ← Row 1: full width
│                        Resolve · Create Task · ✏ · 🗑  │  ← Row 2: actions
├─────────────────────────────────────────────────┤
│  Tabs: Details | Timeline | Photos | Comments   │
```

## File Changes

| File | Change |
|------|--------|
| `IssueDetailsHeader.tsx` | Restructure from single flex-row to stacked layout: title row on top, actions row below aligned right. Remove `pr-12` (no longer needed since buttons aren't competing with title). Add small gap between rows. |

No other files need changes — the header component is self-contained and the `actions` prop slot stays the same.

