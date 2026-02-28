

## Two requests identified

### 1. Bug Fix: Departed judges still showing in assignments

**Root cause**: When judges are removed/departed via the Staff page, their `judge_status` is set to `departed` and `is_active` to `false` in `personnel_profiles`, but the `court_assignments.justice` field (a plain text column) is not always cleared. Currently there are 3 stale entries:
- A. CLOTT (departed) in room 677
- B. LANTRY (inactive) in room 1234  
- M. BEST (inactive) in room 687

**Fix approach** (two-pronged):

1. **Visual indicator in `EnhancedCourtAssignmentTable.tsx`**: Cross-reference the `justice` name against `personnel_profiles` to detect departed/inactive judges. Show a red "Departed" or "Inactive" badge next to the name and apply a distinct visual treatment (strikethrough + muted text) so it's immediately obvious the assignment is stale.

2. **Auto-cleanup option**: Add logic to the assignment query that flags rows where the assigned justice is departed/inactive, and surface a banner like "3 rooms have departed judges assigned -- Click to clear". Clicking would null out the `justice` field for those rooms.

3. **Preventive fix in `staffManagement.ts` / `judgeManagement.ts`**: Ensure `processJudgeDeparture` and `departStaff` always clear the `court_assignments.justice` field when departing a judge, using a case-insensitive match to avoid misses.

### 2. Redesign: Assignments page visual refresh

The user wants to keep the existing mechanics (glow rings, status indicators, inline editing, drag-and-drop) but wants a fresh visual design. Here are three concepts:

---

**Concept A: "Courtroom Card Grid"**

Replace the spreadsheet table with a responsive card grid. Each courtroom becomes a card showing:
- Room number as a prominent header with a colored left border (status-based: green=assigned, purple=incomplete, red=maintenance, blue=inactive)
- The glow rings move to card borders with the same color semantics
- Justice name with presence dot and status badge
- Clerks shown as avatar-like chips
- Sergeant, phone, calendar as compact rows inside the card
- Click any field to edit inline (same popover mechanics)
- Cards are drag-sortable using the existing dnd-kit setup
- Filter bar at top with pill-shaped status filters

**Concept B: "Compact Row Cards with Sidebar Detail"**

Keep a list layout but replace the raw HTML table with styled row cards:
- Each room is a horizontal card with rounded corners, subtle shadow, and the glow effects on the card border
- Left section: room number + part in a colored pill
- Center section: justice name + presence dot + clerks as tags
- Right section: status badge + quick actions
- Clicking a row opens a slide-over sidebar panel with full details and all editable fields
- The list is cleaner and less dense, with the detail work moved to the sidebar
- Mobile-friendly: cards stack vertically naturally

**Concept C: "Split-Panel Board" (Recommended)**

A two-panel layout inspired by modern email/Kanban UIs:
- Left panel: scrollable list of courtroom rows (compact: room#, part, justice name, status dot) with the glow effects as left-border accents
- Right panel: selected courtroom's full detail view with all editable fields, issue history, and presence info
- The glow animations stay on the left-panel rows
- Top toolbar has search, filters (by status, by floor), and the existing Add Judge / Add Staff buttons
- Better mobile experience: on mobile, the right panel becomes a bottom sheet

---

**Recommendation**: Concept C (Split-Panel Board) offers the best balance of information density and modern feel while keeping all existing mechanics intact. However, Concept A (Card Grid) is simpler to implement.

### Implementation plan (if approved)

**Phase 1 - Bug fix** (immediate):
- Add departed/inactive judge detection to `EnhancedCourtAssignmentTable` query
- Show visual indicator (badge + strikethrough) for stale assignments
- Add "Clear departed judges" action banner
- Fix departure functions to always clear assignments

**Phase 2 - Redesign** (after concept choice):
- Rebuild the assignment display component using the chosen concept
- Preserve all existing data hooks, mutations, dnd-kit, and glow animations
- Update `AssignmentManagementPanel` layout and stats cards to match new design language

