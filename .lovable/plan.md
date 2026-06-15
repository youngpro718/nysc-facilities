## Problem

Today the key search only looks inside the currently selected lockbox. If a court officer is on Lockbox A and searches for a key that lives in Lockbox B, they get nothing — they have to know which lockbox to pick first.

## Goal

One search that looks across **every** lockbox, with each result clearly labeled so the officer immediately sees which lockbox (and slot) the key is in. Keep the current per-lockbox view intact for browsing — only the search behavior changes.

## Changes

### 1. Fetch slots from all lockboxes (for search)
In `LockboxView.tsx`, add a second query that loads every slot across every lockbox, joined with its lockbox name and room. This runs alongside the existing per-lockbox fetch so the browse view is unchanged.

```text
slots (selected lockbox) → grid/browse view (today)
allSlots (every lockbox) → search results (new)
```

### 2. Make the search global with clear lockbox labels
In `LockboxSearch.tsx`:
- When the search box is empty → show the current selected-lockbox slots (no change to today's behavior).
- When the user types anything → search across **all** slots from all lockboxes.
- Each result card gets a prominent badge showing the **lockbox name** (e.g. "📦 Captain's Office") next to the slot number, so it's obvious where the key lives.
- Results are grouped by lockbox with a small header ("Captain's Office — 3 keys", "Court Officer Desk — 1 key") so officers can scan quickly.
- A single line above results: "Showing matches from all lockboxes" — so they know the search just widened automatically; nothing to configure.

### 3. Tap a result → jump to that lockbox
When a search result is tapped:
- If the slot belongs to a different lockbox than the one currently selected, automatically switch `selectedLockboxId` to that lockbox so the rest of the UI (header, print, edit) lines up.
- Then open the existing slot detail dialog as today.

This keeps the mental model simple: "I searched, I tapped, now I'm in the right lockbox looking at the right key."

### Out of scope
- No DB changes, no RLS changes.
- No changes to the lockbox selector, slot dialog, or print view beyond the auto-switch above.
- Room-link filters (Unlinked / No Room) stay scoped to the currently selected lockbox — those are a management tool, not a search tool.

## Files touched
- `src/features/keys/components/keys/lockbox/LockboxView.tsx` — add `allSlots` query, pass to search, handle cross-lockbox tap.
- `src/features/keys/components/keys/lockbox/LockboxSearch.tsx` — switch to global search when query is non-empty, group by lockbox, show lockbox-name badge on each result.
- `src/features/keys/components/keys/lockbox/LockboxSlotCard.tsx` — accept an optional `lockboxName` prop to render the badge (small, non-intrusive).
