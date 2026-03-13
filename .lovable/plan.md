

# Smart Personnel Assignment — Availability-Aware Courtroom Staffing

## The Problem

Right now, when you assign a judge, clerk, or sergeant to a courtroom, the system shows **everyone** in the dropdown — no distinction between who's free and who's already assigned somewhere else. You only find out about conflicts after the fact (via error toasts or the Conflict Detection panel). This forces you to mentally track who's where, which is error-prone during busy reassignment days.

## What Changes

### 1. Availability-Aware Personnel Dropdowns

Every personnel selector (judges, clerks, sergeants) will show **availability status inline**:

```text
┌─ Select Judge ──────────────────────────────┐
│ 🔍 Search judges...                         │
│                                              │
│ ── Available ──────────────────────────────  │
│ ✅ J. SMITH          Justice                 │
│ ✅ R. JOHNSON        JHO                     │
│                                              │
│ ── Currently Assigned ─────────────────────  │
│ 📌 M. WILLIAMS       Part 12 · Room 1300    │
│ 📌 K. DAVIS          Part 8 · Room 763      │
│                                              │
│ ── Out Today ──────────────────────────────  │
│ 🔴 T. BROWN          Sick Leave             │
│ 🔴 L. GARCIA         Vacation (until 3/17)  │
└──────────────────────────────────────────────┘
```

- **Available**: Not assigned to any room AND not marked absent
- **Currently Assigned**: Has an active courtroom assignment (shows which room/part)
- **Out Today**: Marked absent via staff absences

You can still pick someone from "Currently Assigned" — but the system will warn you and ask **why**.

### 2. Reason-for-Move Prompt

When you select someone who's already assigned, a contextual prompt appears:

```text
┌─ M. WILLIAMS is currently in Part 12, Room 1300 ─┐
│                                                    │
│  Why is this judge moving?                         │
│                                                    │
│  ○ Covering temporarily (keeps original room)      │
│  ○ Reassigning permanently (clears original room)  │
│  ○ Swapping with current occupant                  │
│                                                    │
│  Notes (optional): ___________________________     │
│                                                    │
│  [Cancel]                    [Confirm Assignment]  │
└────────────────────────────────────────────────────┘
```

This replaces the current approach where the "Assignment Type" radio buttons are always visible. Instead, they only appear when relevant (when you pick someone already assigned).

### 3. Same Logic for Clerks and Sergeants

The same availability grouping applies to clerk and sergeant selectors. Since clerks can be assigned to multiple rooms, the indicator shows all their current assignments rather than just one.

## Technical Approach

### New Hook: `usePersonnelAvailability`

A single hook that cross-references three data sources:
- `court_assignments` — who's assigned where (justice, clerks, sergeant columns)
- `staff_absences` / staff-out-today — who's absent
- `personnel_profiles` — the master list

Returns personnel grouped into `available`, `assigned` (with their current room/part), and `absent` (with reason).

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/usePersonnelAvailability.ts` | **New** — hook that fetches assignments + absences and returns grouped/annotated personnel lists |
| `src/components/court/PersonnelSelector.tsx` | Group items by availability status (Available / Assigned / Out). Show room/part info for assigned personnel. |
| `src/components/court/LiveCourtGrid.tsx` | Update `AssignJudgeDialog` — show assignment type options only when selecting an already-assigned judge; pre-select "Covering" when picking someone assigned elsewhere |
| `src/components/court/JudgeStatusManager.tsx` | Update `MoveJudgeDialog` — use the new availability data to show which destination rooms are vacant vs occupied |
| `src/components/court/AddStaffDialog.tsx` | Use availability-aware selector for clerks and sergeants |

### Data Flow

```text
usePersonnelAvailability()
  ├── useCourtPersonnel()        → all personnel profiles
  ├── court_assignments query    → who's assigned where
  └── useStaffOutToday()         → who's absent
  
  Returns: {
    judges: { available: [...], assigned: [...], absent: [...] }
    clerks: { available: [...], assigned: [...], absent: [...] }
    sergeants: { available: [...], assigned: [...], absent: [...] }
  }
```

Each "assigned" entry includes `currentRoom`, `currentPart` so the UI can display it. Each "absent" entry includes `reason` and `returnDate`.

