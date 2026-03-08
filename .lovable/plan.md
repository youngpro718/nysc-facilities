

## Draw Connecting Hallways — Plan

### What this solves

Currently you can only draw standalone hallway lines. You need to draw a second line that touches or starts near an existing hallway, and the system should detect that intersection and ask: **"Is this a continuation (bend), a connected hallway, or connected via a transition door?"**

### How it works (user flow)

1. **Draw first hallway** — works as today (click-start, click-end, name it)
2. **Draw a second line near an existing hallway's endpoint or body** — the system detects proximity (within ~30px snap radius)
3. **Connection dialog appears** after the naming dialog, asking:
   - **Continuation / Bend** — same hallway changes direction (no door, just a turn)
   - **Connected hallway** — separate hallway that branches off
   - **Transition door** — connected via a door (security boundary, fire door, etc.)
4. The connection is saved to `hallway_connections` with a new `connection_type` column

### Database change

Add a `connection_type` column to the existing `hallway_connections` table:

```sql
ALTER TABLE hallway_connections
ADD COLUMN connection_type text NOT NULL DEFAULT 'connected'
CHECK (connection_type IN ('bend', 'connected', 'transition_door'));
```

### Code changes

**1. `LayoutEditorCanvas.tsx`** — Add endpoint detection logic
- After the user finishes drawing a line, check if either endpoint is within 30px of any existing hallway segment's start/end point or body
- If a nearby hallway is found, store a `pendingConnection` with the matched hallway ID and the snap point
- Show a **Connection Type Dialog** before (or after) the naming dialog

**2. New `ConnectionTypeDialog.tsx`**
- Simple dialog with 3 radio options:
  - **Bend in hallway** — "This is the same hallway changing direction"
  - **Connected hallway** — "A separate hallway branching off"  
  - **Transition door** — "Connected through a door or security point"
- Returns the selected type to the canvas

**3. `HallwayNameDialog.tsx`** — Minor update
- For "bend" type: skip this dialog (inherits name from parent hallway) or show it pre-filled
- For "connected" and "transition_door": works as normal

**4. Save logic in `LayoutEditorCanvas.tsx`**
- After creating the new hallway in Supabase, also insert into `hallway_connections`:
  ```
  { main_hallway_id, connected_hallway_id, connection_type, connection_point: {x, y} }
  ```
- For "bend" type, set `main_hallway_id` to the original hallway so they're logically grouped

**5. Visual feedback on canvas**
- Draw a small circle/diamond at connection points
- Color-code: blue for bend, green for connected, orange for transition door
- Show a small door icon at transition door connections

### Files

| File | Action |
|------|--------|
| `hallway_connections` table | Add `connection_type` column (migration) |
| `ConnectionTypeDialog.tsx` | Create — radio dialog for connection type |
| `LayoutEditorCanvas.tsx` | Edit — add snap detection, connection flow |
| `HallwayNameDialog.tsx` | Edit — handle bend pre-fill |

