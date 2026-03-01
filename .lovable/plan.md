

## Consolidate: Keep Quick Reassign, Remove Batch Mode

Quick Reassign is strictly better — it does everything Batch Mode does but with fewer clicks. Batch Mode requires opening a dialog per change, selecting operation types, picking from dropdowns, then clicking "Add to Batch." Quick Reassign does the same thing in 2 clicks per reassignment.

### What changes

**Remove from `LiveCourtGrid.tsx`:**
- The "Batch Mode" toggle button from the toolbar
- All `batchMode` / `batchChanges` state and related functions (`executeBatch`, `addBatchChange`, `removeBatchChange`)
- The yellow batch preview bar UI
- The `batchMode` and `onAddBatchChange` props from `LiveRow`
- The "Add to Batch" button inside the Move dialog (the move dialog can still execute single operations immediately)

**Keep intact:**
- Quick Reassign mode (click source → click destination → auto-chain → Apply All)
- The Move/Swap/Reassign dialog for one-off operations (just executes immediately instead of offering "Add to Batch")
- The `BatchChange` interface and `executeChanges` function (Quick Reassign still uses these internally)
- Assign Judge dialog for vacant rooms

### Result
One toolbar button for bulk operations ("Quick Reassign") instead of two competing modes. Single operations still work via the arrow button on each row.

### File to modify
- `src/components/court/LiveCourtGrid.tsx`

