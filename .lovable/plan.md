## Kiosk Mode for Keys

Goal: a dead-simple, high-contrast, large-touch screen designed for a shared desk monitor. Court officers tap one button to find a room's key or see what's out, and check keys in/out without typing more than a name.

### 1. Entry point
- Add a new route `/keys/kiosk` (separate page, no app chrome — full-screen).
- On the existing Keys page header (desktop + mobile), add a prominent **"Kiosk Mode"** toggle button (icon: Monitor) that opens `/keys/kiosk` in the same tab. Visible to court_officer, court_aide, admin, system_admin.
- Kiosk page has an **Exit** button (top-right) returning to `/keys`.

### 2. Layout
Full-viewport (`h-dvh`), dark-on-light, oversized typography. Two giant tabs at the top:

```text
┌──────────────────────────────────────────────┐
│  [ 🔑 Find a Key ]    [ 📋 Keys Out ]   Exit │
├──────────────────────────────────────────────┤
│                                              │
│           (tab content area)                 │
│                                              │
└──────────────────────────────────────────────┘
```

Tabs are >=72px tall, text >=24px, touch targets >=56px.

### 3. Tab A — Find a Key
- One huge search input at top: "Search room number, name, or key…" with on-screen number pad shortcut (e.g. `1300`).
- Results render as large cards (one per match) showing:
  - Room number + name (huge)
  - Key name + lockbox/slot location ("Box A, Slot 12")
  - Status pill: **Available** (green) or **Checked out to {name} · {time ago}** (amber)
  - Primary action button: **Check Out** (if available) or **Check In** (if out)
- Tap a card → bottom sheet with name capture (autocomplete from occupants) → confirm. Writes to `lockbox_activity_logs` + updates slot state via existing flow.

### 4. Tab B — Keys Out
- Grid/list of every currently checked-out key, sorted by most recent.
- Each row: room + key, who has it (big), how long ago, and a single **Check In** button.
- Live-refresh every 15s via react-query.

### 5. Reuse existing data + mutations
- Read from the same queries used in `MobileKeyManagement` (`lockboxes`, `lockbox_slots`, `lockbox_activity_logs`).
- Reuse existing check-in/check-out handlers (extract them from current dialog if needed) so RLS + audit logs stay consistent. No new DB tables or policies.

### 6. Styling
- Semantic tokens only; large radii (`rounded-2xl`), thick borders, status colors from existing system.
- Optional "Always-on" flag stored in localStorage so the toggle button can hide chrome and prevent accidental exit (single Exit button, no nav).

### 7. Files (new / changed)
- New: `src/features/keys/pages/KeysKiosk.tsx`
- New: `src/features/keys/components/keys/kiosk/KioskHeader.tsx`
- New: `src/features/keys/components/keys/kiosk/FindKeyTab.tsx`
- New: `src/features/keys/components/keys/kiosk/KeysOutTab.tsx`
- New: `src/features/keys/components/keys/kiosk/CheckInOutSheet.tsx`
- Changed: `src/config/routes.ts` (register `/keys/kiosk`, no sidebar nav)
- Changed: `src/features/keys/pages/Keys.tsx` + `MobileKeyHeader.tsx` (add Kiosk button)

### Out of scope
- No new database tables or RLS changes.
- No changes to existing desktop/mobile Keys UI beyond the toggle button.
- No PIN/lock for exiting kiosk (can add later if you want true lockdown).