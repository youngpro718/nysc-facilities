

# Fix: Redundant Buttons & Missing Supply Request Button

## Problems Found

1. **Duplicate "Add Item" on Inventory page**: The page header (line 158) has an "Add Item" button that just switches to the Stock tab. Then the Stock tab's `InventoryItemsPanel` has its *own* "Add Item" button (line 300) that actually opens the create dialog. So when you're on the Stock tab, you see two "Add Item" buttons.

2. **"Order Supplies" button location**: The button was added to the **Admin Supply Requests** page (`/admin/supply-requests`) header — but not to the **Inventory Dashboard** (`/inventory`) header where you're currently looking. So from the inventory page, there's no visible way to order supplies.

## Fix Plan

### 1. Remove duplicate "Add Item" from Inventory Dashboard header
**File:** `src/pages/InventoryDashboard.tsx`
- Remove the "Add Item" button from the page header (lines 158-161). The Stock tab already has its own "Add Item" button with the actual dialog trigger — that's the only one needed.

### 2. Add "Order Supplies" button to Inventory Dashboard header
**File:** `src/pages/InventoryDashboard.tsx`
- Replace the removed "Add Item" with an "Order Supplies" button that navigates to `/request/supplies`, placed next to the existing "Requests" button. This makes it discoverable from the inventory page.

Two small edits, one file.

