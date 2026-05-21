## Fix: Notes tab does nothing on the room detail back side

**Root cause:** `src/features/spaces/components/spaces/rooms/components/CardBack.tsx` line 156-162 — the Notes `<button>` has no `onClick`. Every sibling tab (Planned, History, Finishes, etc.) calls `setActiveTab(...)`. Notes was missed, so clicking it can never change `activeTab` to `'notes'` and the `{activeTab === 'notes' && ...}` block at line 608 never renders.

**Change (single edit):**
- Add `onClick={() => setActiveTab('notes')}` to that button.

That's the entire fix — the `RoomNotesPanel` and tab content are already wired correctly.
