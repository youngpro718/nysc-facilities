

# Supply Request System Revamp

## Problems Identified

1. **No obvious "Order Supplies" button** — From the admin page (`/admin/supply-requests`), there's no way to actually place an order. The page is purely an audit/history view. The ordering page (`/request/supplies`) is buried and only accessible via the floating action button or deep navigation.

2. **Admin Supply Request History is bloated** — Each card shows description, justification, items list, contact info, delivery date, approval notes, fulfillment notes, and timestamps all expanded by default. Way too much info at a glance.

3. **User's "My Supply Requests" page is complex** — Status filter has 9 options, the `EnhancedSupplyTracker` cards are large with progress bars, timelines, and nested expand sections. The 594-line component is doing too much.

4. **Receipts are hard to find** — Receipt button only appears buried inside an expanded completed order card. No central receipt history.

5. **Too many supply-related pages** — `/request/supplies` (ordering), `/my-supply-requests` (user tracking), `/admin/supply-requests` (admin history), `/supply-room` (staff dashboard). Users don't know which is which.

---

## Plan

### 1. Add "Order Supplies" Button to Admin Supply Requests Page
**File:** `src/pages/admin/SupplyRequests.tsx`
- Add a prominent "Order Supplies" button in the page header that navigates to `/request/supplies`
- Also add it to the empty state

### 2. Collapse Admin Supply Request Cards by Default
**File:** `src/pages/admin/SupplyRequests.tsx`
- Redesign cards to show a compact summary row: status icon, title, requester name, priority badge, item count, date
- Make the full details (justification, items list, notes, timestamps) expandable on click
- This cuts visual noise by ~70%

### 3. Simplify User's "My Supply Requests" Page  
**File:** `src/pages/MySupplyRequests.tsx`
- Replace the header's "New Request" dialog (which opens a modal with `QuickOrderGrid`) with a simple navigate button to `/request/supplies`
- Reduce status filter options to practical ones: All, Active, Ready, Completed

### 4. Streamline EnhancedSupplyTracker Cards
**File:** `src/components/user/EnhancedSupplyTracker.tsx`
- Make cards more compact by default: show title, status badge, time, and item count in a single row
- Move the full timeline into the expanded section only
- Keep the "Ready for Pickup" banner prominent (it's good)
- Add a receipt button directly on completed cards (not buried in expanded view)

### 5. Add "Order Supplies" Quick Action to Navigation
**File:** `src/components/layout/config/navigation.tsx`
- Under the admin "Assets" section, add a direct "Order Supplies" link to `/request/supplies` so it's always findable in the sidebar

---

## Technical Details

- **Admin cards collapse:** Convert each card from always-expanded to a clickable summary row with `useState` for expansion, similar to the pattern already used in `EnhancedSupplyTracker`
- **Receipt access:** Move the receipt button from inside the expanded completed section to the compact card row, visible without expanding
- **Navigation:** Add new `NavigationItem` entry under the Assets children array
- **Filter simplification:** Map the 9 status values to 4 user-friendly groups (Active = submitted/received/picking, Ready = ready, Completed = completed/fulfilled, All = everything)

