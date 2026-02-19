

# Lockbox Key Addition, Help Button Fix, Print Feature & Aesthetics Audit

## Problem Summary

1. **No way to add keys/slots to an existing lockbox** - You can only create slots when first creating a lockbox. There's no "Add Slot" button on the Lockbox view.
2. **Help button broken on mobile** - The Help button (`bottom-20 right-4`) overlaps with the Floating Action Button (`bottom-24 right-4`), making it untappable. Both sit in the same corner.
3. **No print/export for lockbox key reference** - No way to print a summary of all keys in a lockbox.
4. **General aesthetics polish** needed for the keys section.

---

## Part 1: Add Keys/Slots to Existing Lockbox

Currently, slots are only created in bulk when a lockbox is first created (`CreateLockboxDialog`). We need an "Add Slot" button on the Lockbox view.

### Changes:
- **New component: `AddSlotDialog.tsx`** in `src/components/keys/lockbox/`
  - Form fields: Label (required), Room (via `RoomSelector`), Quantity, Notes
  - On submit: inserts a new row into `lockbox_slots` with `slot_number` set to `max(existing) + 1`
  - Logs activity to `lockbox_activity_logs`

- **Update `LockboxView.tsx`**
  - Add a "+" / "Add Key Slot" button next to the lockbox selector (or in the lockbox info bar)
  - Wire it to open the `AddSlotDialog` with the currently selected lockbox ID
  - On success, refresh slots

---

## Part 2: Fix Help Button on Mobile

The Help button and FAB overlap on mobile (both at `right-4`, nearly the same `bottom` offset). The Help button dropdown also may not open properly on small screens.

### Changes:
- **Update `HelpButton.tsx`**:
  - Hide on mobile since the FAB already occupies that space, and instead integrate help into the mobile navigation or make it accessible from a different location
  - Alternative approach: Move the help button to `bottom-36` on mobile so it stacks above the FAB without overlapping
  - Add `md:bottom-6` (desktop stays the same) and use `bottom-36` for mobile to clear the FAB at `bottom-24`

- **Improve touch targets**: Ensure the dropdown menu items have 44px minimum tap targets (already has `py-3` which should be sufficient)

---

## Part 3: Printable Lockbox Key Reference

Add a "Print" button to the lockbox view that generates a clean, printable summary of all keys in the selected lockbox.

### Changes:
- **New component: `PrintLockboxReference.tsx`** in `src/components/keys/lockbox/`
  - A button that opens a print-optimized view showing:
    - Lockbox name and location
    - Date printed
    - Table of all slots: Slot #, Label, Room, Status, Quantity
  - Uses `window.print()` with a hidden print-only div, or opens content in a new window with print styles
  - Clean, professional layout suitable for posting inside/near a physical lockbox

- **Update `LockboxView.tsx`**:
  - Add a "Print" / printer icon button in the lockbox info bar area
  - Pass current slots and lockbox info to the print component

---

## Part 4: Keys Section Aesthetics Audit

### Lockbox View improvements:
- **LockboxSelector**: Add lockbox count badge, improve the info bar with a subtle card background
- **LockboxSlotCard**: Improve visual hierarchy - make status badges more prominent, add subtle left-border color coding (green = in box, orange = out, red = missing)
- **LockboxSlotDialog**: Better spacing, clearer action buttons with icons

### Keys page tab bar:
- The 6-tab layout on mobile (`min-w-max`) requires horizontal scrolling - add scroll indicators/arrows
- Ensure active tab is clearly highlighted

### Key Statistics Cards:
- Already well-structured with responsive grid; minor polish for consistency

---

## Technical Details

### New Files:
1. `src/components/keys/lockbox/AddSlotDialog.tsx` - Dialog to add a new slot to existing lockbox
2. `src/components/keys/lockbox/PrintLockboxReference.tsx` - Print-friendly lockbox key reference

### Modified Files:
1. `src/components/keys/lockbox/LockboxView.tsx` - Add "Add Slot" and "Print" buttons
2. `src/components/help/HelpButton.tsx` - Fix mobile positioning to avoid FAB overlap
3. `src/components/keys/lockbox/LockboxSlotCard.tsx` - Aesthetic improvements (left border color coding)
4. `src/components/keys/lockbox/LockboxSelector.tsx` - Polish info bar

### No database changes required - the `lockbox_slots` table already supports inserting new rows with all needed columns.

### Implementation Order:
1. Fix Help Button positioning (quick win)
2. Add "Add Slot" dialog and button
3. Add Print lockbox reference feature
4. Aesthetics polish pass

