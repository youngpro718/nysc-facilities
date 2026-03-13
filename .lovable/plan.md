

# Reimagine Inventory Overview Page

## Issues Found

**1. Low Stock count is unreliable — two conflicting definitions:**
- **KPI strip badge** (`InventoryDashboard.tsx` line 62): counts items where `quantity <= 3` (`FORCED_MINIMUM`), ignoring each item's actual `minimum_quantity`. This inflates the number — any item with 1-3 units shows as "low stock" even if its minimum is 1.
- **Overview panel** (`InventoryOverviewPanel.tsx` line 80): correctly uses `quantity < minimum_quantity`. 
- **Alerts tab** (`LowStockPanel.tsx` line 120): also correctly uses `minimum_quantity`.
- Result: the badge number doesn't match what the user sees when they click through. Confusing.

**2. "Usage by Room" is redundant** — you confirmed this. It duplicates "Most Used Items" data grouped differently and rarely adds insight.

**3. "Recent Transactions" feels stale** — it queries the last 5 transactions but only within the selected time range, so it can show nothing or old data. It also duplicates the History tab.

**4. Too many stat cards** — 4 KPI strip cards at page level + 4 more stat cards inside Overview = 8 stat rectangles before any useful content.

**5. "Categories" and "System Status: OK" cards are filler** — they show static counts that don't drive decisions.

## Redesign Plan

### Overview panel becomes a single focused view with 3 sections:

```text
┌─────────────────────────────────────────┐
│  Inline Stats Strip (no cards)          │
│  142 items · 12 low stock · 3 out       │
├─────────────────────────────────────────┤
│                                         │
│  ⚠ ACTION NEEDED (only if items exist)  │
│  Out-of-stock + low-stock items in a    │
│  compact list with Restock/Reorder      │
│                                         │
├─────────────────────────────────────────┤
│  📦 Most Used Items (kept, you like it) │
│  Top 8 items with usage counts          │
│                                         │
└─────────────────────────────────────────┘
```

### Specific changes:

**`InventoryOverviewPanel.tsx`** — full rewrite:
- Remove: 4 stat cards, "Usage by Room" card, "Recent Transactions" card, "Low Stock Alerts" duplicate card
- Keep: Most Used Items (the one you like)
- Add: compact inline stats line (total items · low stock · out of stock) as text, not cards
- Add: actionable low-stock section with restock buttons (pull from `LowStockPanel` pattern) — only shows items that are actually below their `minimum_quantity`, limited to top 5 with a "View all → Alerts tab" link

**`InventoryDashboard.tsx`** — simplify page-level KPI:
- Remove: the 4-card KPI strip (lines 206-211) — it duplicates overview content
- Fix: low stock badge count to use `minimum_quantity` comparison instead of `FORCED_MINIMUM` hardcode, so the Alerts tab badge is accurate
- Keep: header, search bar, tab navigation (those are useful)

**`src/constants/inventory.ts`** — `FORCED_MINIMUM` stays as a fallback but won't drive the badge count anymore

### Files to modify

| File | Change |
|------|--------|
| `src/components/inventory/InventoryOverviewPanel.tsx` | Rewrite: inline stats, actionable low-stock section, keep Most Used |
| `src/pages/InventoryDashboard.tsx` | Remove KPI strip cards; fix low stock badge to use `minimum_quantity` |

