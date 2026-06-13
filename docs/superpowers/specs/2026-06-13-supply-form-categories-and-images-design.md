# Supply Order Form — Real Categories & Item Images — Design

Date: 2026-06-13
Status: approved (categories + images decisions confirmed by user)

## Problem
The supply order form (mobile `QuickSupplyRequest`, desktop `QuickOrderGrid`) both
hardcode `ALLOWED_CATEGORIES = ['Office Supplies','Furniture','Cleaning Supplies',
'Technology','Safety Equipment','Maintenance Supplies']` and **filter items to only
those**. Live inventory is Office Supplies (60), Electronics (5), Furniture (5), and
**83 uncategorized** (153 total). Consequences:
- Electronics items are hidden (list says "Technology", not "Electronics").
- The 83 uncategorized items are invisible/unorderable.
- 4 categories that have zero stock are shown.
Images: `inventory_items.photo_url` exists; mobile renders it, desktop does not.
Only **1 of 153** items has a photo.

## Decisions (user)
- **Categories:** auto-categorize the 83 (by item name), user reviewed/approved the
  mapping. Add two new categories: **Cleaning Supplies**, **Miscellaneous**. Picker
  derives categories from actual inventory (only categories with items), no hardcoded
  allow-list.
- **Images:** show the real photo where present, a clean category-based placeholder
  otherwise; desktop matches mobile; add a per-item photo upload so the library grows.

## Part B1 — Data: categorize the 83 + add 2 categories (migration)
- Insert categories `Cleaning Supplies`, `Miscellaneous`.
- Assign (approved mapping):
  - Cleaning Supplies: Clorox Wipes, Hand Sanitizer, Dust-Off/Duster.
  - Furniture: Coat Tree/Rack, Metal Easels, Clothes Hangers, Floor mat.
  - Electronics: Extension Wire (for outlet), Clocks.
  - Miscellaneous: Jury Wheel, Court Rope, Cups, Water Pitchers, Razors.
  - Office Supplies: every other currently-uncategorized item (the remaining ~63).
- Implemented as: set the named exceptions, then `UPDATE ... SET category_id =
  OfficeSupplies WHERE category_id IS NULL` for the rest.

## Part B2 — Dynamic category list (mobile + desktop)
- Remove the hardcoded `ALLOWED_CATEGORIES` filter in `QuickSupplyRequest.tsx` and
  `QuickOrderGrid.tsx`. Derive the category list from the items actually returned
  (distinct category names with ≥1 item), sorted (Office Supplies first or
  alphabetical). Items with no category fall under "Miscellaneous" after B1, so an
  "Other/Uncategorized" bucket should rarely appear — but keep a graceful "Other"
  group if any null slips through.
- `CATEGORY_CONFIG` (icons/gradients) keyed by category name: add Electronics,
  Cleaning Supplies, Miscellaneous; keep a default icon for unknown categories so a
  new category never breaks the UI.

## Part B3 — Images + placeholder (desktop parity)
- Desktop item rows/cards (`QuickOrderGrid` / `CompactItemList` / `ItemDetailPanel`)
  render `photo_url` like mobile.
- Shared `<ItemImage>` component: shows `photo_url` if present; otherwise a
  category-themed placeholder (icon on a tinted background). Used by both platforms
  so they stay consistent.

## Part B4 — Per-item photo upload
- In inventory management (where admins/purchasing edit items), add a photo upload
  that stores to a Supabase Storage bucket and writes `inventory_items.photo_url`.
  Reuse the existing storage upload pattern (same as issue photos / courtroom photos).
- Gated to roles that can write inventory (admin/cmc/court_aide per `inventory_items`
  RLS) — note purchasing can order but inventory writes follow existing policy.

## Out of scope
- Bulk photo sourcing (only 1 photo exists; library grows via B4 over time).
- Inventory schema changes beyond category assignment.

## Risks
- Deriving categories dynamically must not show empty categories or duplicate the
  "Other" bucket.
- Placeholder must be lightweight (no layout shift, no broken-image flash) — render
  the placeholder unless a real URL loads.
- Photo upload must validate size/type and follow existing storage RLS.
