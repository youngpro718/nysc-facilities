# Fix: "Adjust Stock" submit button does nothing

## Symptom
On `/inventory?tab=stock` (and Alerts), opening the Adjust Stock dialog and clicking the **Adjust Stock** submit button leaves the dialog open with no spinner, no toast, and no visible change. The user has to click Cancel to close it.

## Investigation so far
- `StockAdjustmentDialog.tsx` form wiring looks correct: `<form onSubmit={handleSubmit}>` + `FormButtons` with `type="submit"`.
- `invalidateInventoryStockQueries` util and `inventoryQueryKeys` export both exist.
- RLS on `inventory_items` and `inventory_item_transactions` allows the `admin` role to write.
- Schema fields used in the insert (`item_id`, `transaction_type`, `quantity`, `previous_quantity`, `new_quantity`, `notes`) all exist and are not generated columns.
- No network or console activity was recorded for the failed click in the current preview snapshot, which suggests either (a) the form submit isn't firing, or (b) the mutation throws synchronously and the error toast is being suppressed.

## Diagnostic steps
1. Ask the user to reproduce with DevTools open and report:
   - Whether the submit button shows a spinner.
   - Whether a PATCH `inventory_items` and POST `inventory_item_transactions` request is sent.
   - Any red console errors.
2. If no request fires: add a temporary `console.log` at the top of `handleSubmit` and inside `mutationFn` to confirm where execution stops.

## Likely fixes (apply based on diagnosis)

### A. If submit is firing but mutation errors silently
- Wrap `mutationFn` work in a `try/catch` that logs to console, so React Query's `onError` is guaranteed to fire and show the destructive toast.
- Verify `item.quantity` is a number (not `undefined`/`null`); coerce with `Number(item.quantity) || 0` before arithmetic.

### B. If submit isn't firing at all
- Most likely culprit: nested interactive element swallowing the click, or the Radix `Select` capturing keyboard/Enter focus. Fix by:
  - Ensuring the submit button is not inside a portal that breaks the form association (it isn't currently, but verify after any ModalFrame change).
  - Adding an explicit `onClick={handleSubmit}` fallback on the submit button when used inside a Radix dialog/drawer.

### C. If onSuccess throws after a successful write
- Defensive: guard `invalidateInventoryStockQueries(queryClient)` and the subsequent `invalidateQueries({ predicate })` in a `try/catch` so a stray throw doesn't prevent `handleClose()` from running.
- Move `handleClose()` to run before invalidation so the dialog always closes on success.

## Verification
- Adjusting stock from both the Stock tab and the Alerts tab updates the item quantity in the DB.
- Toast appears (success or destructive).
- Dialog auto-closes on success.
- Overview, Stock, Alerts, Storage, and the role dashboard all reflect the new quantity without a manual page reload.

## Out of scope
- No DB schema or RLS changes.
- No changes to the broader inventory invalidation strategy already shipped earlier in this session.
