# Court Aide Request Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four pieces of the Court Aide request overhaul defined in `docs/superpowers/specs/2026-06-19-unified-request-experience-design.md`: one status vocabulary, one `/my-requests` inbox, one success toast, one Request form, and one `/supplies` tabbed front door. Issues are explicitly untouched.

**Architecture:** Five sequential phases, each independently shippable. Phase order is **5 → 4 → 3 → 2 → 1** so the toast's `View →` link, when it ships, already has a destination at `/my-requests`. The existing `src/lib/statusLabels.ts` is extended (not duplicated) for the vocabulary work. The existing `MyActivity.tsx` is refactored in place into `MyRequests.tsx`.

**Tech Stack:** TypeScript + React 18 + Vite, React Router v6, React Query, Supabase (Postgres + Realtime), Tailwind + shadcn/ui, Sonner toasts, Vitest for unit tests.

---

## Phase 1 — Status vocabulary (Spec Piece 5)

### Task 1.1: Extend `statusLabels.ts` with `getFriendlyTaskStatus`

**Files:**
- Modify: `src/lib/statusLabels.ts`
- Test: `src/lib/__tests__/statusLabels.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/statusLabels.test.ts`:

```typescript
import { getFriendlyTaskStatus } from '../statusLabels';

describe('getFriendlyTaskStatus', () => {
  it('maps pending to Sent / pending', () => {
    expect(getFriendlyTaskStatus('pending').label).toBe('Sent');
    expect(getFriendlyTaskStatus('pending').tone).toBe('pending');
  });

  it('maps claimed and in_progress to Being worked on / progress', () => {
    expect(getFriendlyTaskStatus('claimed').label).toBe('Being worked on');
    expect(getFriendlyTaskStatus('claimed').tone).toBe('progress');
    expect(getFriendlyTaskStatus('in_progress').label).toBe('Being worked on');
  });

  it('maps done and completed to Done / done', () => {
    expect(getFriendlyTaskStatus('done').label).toBe('Done');
    expect(getFriendlyTaskStatus('completed').label).toBe('Done');
    expect(getFriendlyTaskStatus('done').tone).toBe('done');
  });

  it('maps rejected to Not handled / attention', () => {
    expect(getFriendlyTaskStatus('rejected').label).toBe('Not handled');
    expect(getFriendlyTaskStatus('rejected').tone).toBe('attention');
  });

  it('falls back to humanised label and progress tone for unknown', () => {
    const r = getFriendlyTaskStatus('weird_state');
    expect(r.label).toBe('Weird State');
    expect(r.tone).toBe('progress');
  });

  it('returns fallback for null / undefined', () => {
    expect(getFriendlyTaskStatus(null).label).toBe('Updated');
    expect(getFriendlyTaskStatus(undefined).label).toBe('Updated');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/__tests__/statusLabels.test.ts`
Expected: FAIL with `getFriendlyTaskStatus is not a function` (or similar import error).

- [ ] **Step 3: Implement the mapper**

In `src/lib/statusLabels.ts`, after the `KEY_MAP` constant, add:

```typescript
// Court Aide task workflow (Make a Request) --------------------------------
const TASK_MAP: Record<string, FriendlyStatus> = {
  pending: { label: 'Sent', tone: 'pending', description: 'Your request was received and is waiting for a court aide.' },
  claimed: { label: 'Being worked on', tone: 'progress', description: 'A court aide is on it.' },
  in_progress: { label: 'Being worked on', tone: 'progress', description: 'A court aide is on it.' },
  done: { label: 'Done', tone: 'done', description: 'Handled.' },
  completed: { label: 'Done', tone: 'done', description: 'Handled.' },
  rejected: { label: 'Not handled', tone: 'attention', description: 'A court aide could not handle this request. See notes for details.' },
  cancelled: { label: 'Cancelled', tone: 'cancelled', description: 'This request was cancelled.' },
};

export function getFriendlyTaskStatus(status?: string | null): FriendlyStatus {
  if (!status) return FALLBACK;
  return TASK_MAP[status] ?? { ...FALLBACK, label: humanize(status) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/statusLabels.test.ts`
Expected: PASS (10+ assertions across the new and existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/statusLabels.ts src/lib/__tests__/statusLabels.test.ts
git commit -m "Add getFriendlyTaskStatus for court-aide tasks"
```

### Task 1.2: Use `getFriendlyTaskStatus` in `Notifications.tsx`

**Files:**
- Modify: `src/features/dashboard/pages/Notifications.tsx`

- [ ] **Step 1: Locate every place a raw task status is rendered**

Run: `grep -n "staff_tasks\|task.status\|task_request" src/features/dashboard/pages/Notifications.tsx`
Note each line that reads a status string from a task and renders it.

- [ ] **Step 2: Import the helper**

At the top of `src/features/dashboard/pages/Notifications.tsx` (with the other utility imports):

```typescript
import { getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
```

- [ ] **Step 3: Replace raw status renders**

For each notification that carries a task status, replace the raw string with the friendly label. Example pattern (apply at each site you found in Step 1):

```typescript
// before
<span>{task.status}</span>

// after
<span className={toneClasses(getFriendlyTaskStatus(task.status).tone)}>
  {getFriendlyTaskStatus(task.status).label}
</span>
```

If a notification message is built from a template that includes the status, replace the interpolation similarly:

```typescript
// before
const message = `New Task Request: ${requesterEmail} — status ${task.status}`;
// after
const friendly = getFriendlyTaskStatus(task.status).label;
const message = `New request from ${requesterName} — ${friendly}`;
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/pages/Notifications.tsx
git commit -m "Notifications: friendly task statuses via getFriendlyTaskStatus"
```

---

## Phase 2 — `/my-requests` inbox (Spec Piece 4)

### Task 2.1: Create `useMyRequests` merged hook

**Files:**
- Create: `src/features/dashboard/hooks/useMyRequests.ts`
- Test: `src/features/dashboard/hooks/__tests__/useMyRequests.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/dashboard/hooks/__tests__/useMyRequests.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mergeRows, type MyRequestRow } from '../useMyRequests';

describe('mergeRows', () => {
  it('returns supply orders + tasks sorted newest first', () => {
    const supplies = [
      { id: 's1', requester_id: 'u', delivery_location: '1602', status: 'submitted', created_at: '2026-06-18T10:00:00Z', description: 'Pens please' },
    ];
    const tasks = [
      { id: 't1', created_by: 'u', room_id: 'r1', description: 'Move desk', status: 'pending', created_at: '2026-06-19T09:00:00Z', task_type: 'request', timing_preference: 'anytime', requested_for_at: null },
    ];
    const rows = mergeRows(supplies as any, tasks as any);
    expect(rows.map(r => r.id)).toEqual(['t1', 's1']);
    expect(rows[0].type).toBe('request');
    expect(rows[1].type).toBe('supply');
  });

  it('renders the supply title from description when present', () => {
    const supplies = [{ id: 's1', requester_id: 'u', delivery_location: '1602', status: 'submitted', created_at: '2026-06-18T10:00:00Z', notes: 'Pens, paper' }];
    const rows = mergeRows(supplies as any, []);
    expect(rows[0].title).toBe('Pens, paper');
  });

  it('renders the request title as the first 60 chars of description', () => {
    const longDesc = 'Lateral file cabinet on the east wall is busted — replace with another lateral by the end of the week';
    const tasks = [{ id: 't1', created_by: 'u', room_id: 'r1', description: longDesc, status: 'pending', created_at: '2026-06-19T09:00:00Z', task_type: 'request', timing_preference: 'anytime', requested_for_at: null }];
    const rows = mergeRows([], tasks as any);
    expect(rows[0].title.length).toBeLessThanOrEqual(63); // 60 + '...'
    expect(rows[0].title.endsWith('…')).toBe(true);
  });

  it('handles empty inputs', () => {
    expect(mergeRows([], [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/dashboard/hooks/__tests__/useMyRequests.test.ts`
Expected: FAIL with import error.

- [ ] **Step 3: Implement the hook**

Create `src/features/dashboard/hooks/useMyRequests.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';

export interface MyRequestRow {
  id: string;
  type: 'supply' | 'request';
  title: string;
  location_label: string | null;
  status_internal: string;
  created_at: string;
  raw: SupplyRow | TaskRow;
}

export interface SupplyRow {
  id: string;
  requester_id: string;
  delivery_location: string | null;
  status: string;
  created_at: string;
  description?: string | null;
}

export interface TaskRow {
  id: string;
  created_by: string;
  room_id: string | null;
  description: string;
  status: string;
  created_at: string;
  task_type: string | null;
  timing_preference?: string | null;
  requested_for_at?: string | null;
}

const truncate = (s: string, n = 60) => (s.length <= n ? s : s.slice(0, n).trimEnd() + '…');

export function mergeRows(supplies: SupplyRow[], tasks: TaskRow[]): MyRequestRow[] {
  const supplyRows: MyRequestRow[] = supplies.map(s => ({
    id: s.id,
    type: 'supply',
    title: s.description?.trim() || 'Supply order',
    location_label: s.delivery_location,
    status_internal: s.status,
    created_at: s.created_at,
    raw: s,
  }));
  const taskRows: MyRequestRow[] = tasks.map(t => ({
    id: t.id,
    type: 'request',
    title: truncate(t.description || 'Request'),
    location_label: t.room_id,
    status_internal: t.status,
    created_at: t.created_at,
    raw: t,
  }));
  return [...supplyRows, ...taskRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function useMyRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-requests', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<MyRequestRow[]> => {
      const [supplyRes, taskRes] = await Promise.all([
        supabase
          .from('supply_requests')
          .select('id, requester_id, delivery_location, status, created_at, description')
          .eq('requester_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('staff_tasks')
          .select('id, created_by, room_id, description, status, created_at, task_type, timing_preference, requested_for_at')
          .eq('created_by', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (supplyRes.error) throw supplyRes.error;
      if (taskRes.error) throw taskRes.error;
      return mergeRows(supplyRes.data ?? [], taskRes.data ?? []);
    },
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/dashboard/hooks/__tests__/useMyRequests.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/hooks/useMyRequests.ts src/features/dashboard/hooks/__tests__/useMyRequests.test.ts
git commit -m "Add useMyRequests merged supply + task hook"
```

### Task 2.2: Create `MyRequestRow` component

**Files:**
- Create: `src/features/dashboard/components/MyRequestRow.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNowStrict } from 'date-fns';
import { Package, HandHelping } from 'lucide-react';
import { getFriendlySupplyStatus, getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
import type { MyRequestRow } from '@features/dashboard/hooks/useMyRequests';

interface Props {
  row: MyRequestRow;
  onClick: () => void;
  highlighted?: boolean;
}

export function MyRequestRow({ row, onClick, highlighted }: Props) {
  const friendly =
    row.type === 'supply' ? getFriendlySupplyStatus(row.status_internal) : getFriendlyTaskStatus(row.status_internal);

  const TypeIcon = row.type === 'supply' ? Package : HandHelping;
  const typeLabel = row.type === 'supply' ? 'Supply' : 'Request';
  const shortId = `#${row.id.slice(0, 8).toUpperCase()}`;
  const relative = formatDistanceToNowStrict(new Date(row.created_at), { addSuffix: true });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/40 transition-colors ${
        highlighted ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <TypeIcon className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {typeLabel}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{row.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {row.location_label || 'No location'} · {shortId}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <Badge variant="outline" className={`text-xs ${toneClasses(friendly.tone)}`}>
          {friendly.label}
        </Badge>
        <span className="text-[11px] text-muted-foreground mt-0.5">{relative}</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/MyRequestRow.tsx
git commit -m "Add MyRequestRow uniform list row"
```

### Task 2.3: Create `RequestDetailBody` component

**Files:**
- Create: `src/features/dashboard/components/RequestDetailBody.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { Calendar, MapPin, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { TaskRow } from '@features/dashboard/hooks/useMyRequests';

interface Props {
  task: TaskRow;
}

const TIMING_LABEL: Record<string, string> = {
  anytime: 'Anytime',
  when_court_is_down: 'When court is down',
  specific_time: 'By a specific time',
};

export function RequestDetailBody({ task }: Props) {
  const timing = task.timing_preference || 'anytime';
  const timingLabel = TIMING_LABEL[timing] || 'Anytime';
  const specificAt = task.requested_for_at ? format(new Date(task.requested_for_at), 'EEE MMM d, h:mm a') : null;

  return (
    <div className="space-y-4 p-4">
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <MapPin className="h-3.5 w-3.5" /> Where
        </div>
        <div className="text-sm">{task.room_id || 'No room recorded'}</div>
      </section>
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <MessageSquare className="h-3.5 w-3.5" /> What
        </div>
        <div className="text-sm whitespace-pre-wrap">{task.description || ''}</div>
      </section>
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <Calendar className="h-3.5 w-3.5" /> When
        </div>
        <div className="text-sm">
          {timingLabel}
          {specificAt && <span className="text-muted-foreground"> — {specificAt}</span>}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/RequestDetailBody.tsx
git commit -m "Add RequestDetailBody for /my-requests detail drawer"
```

### Task 2.4: Create `MyRequestDetailDrawer` component

**Files:**
- Create: `src/features/dashboard/components/MyRequestDetailDrawer.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getFriendlySupplyStatus, getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
import { RequestDetailBody } from './RequestDetailBody';
import type { MyRequestRow, TaskRow, SupplyRow } from '@features/dashboard/hooks/useMyRequests';

interface Props {
  row: MyRequestRow | null;
  onOpenChange: (open: boolean) => void;
}

export function MyRequestDetailDrawer({ row, onOpenChange }: Props) {
  if (!row) return null;
  const friendly =
    row.type === 'supply' ? getFriendlySupplyStatus(row.status_internal) : getFriendlyTaskStatus(row.status_internal);

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-base flex items-center justify-between gap-2">
            <span className="truncate">{row.title}</span>
            <Badge variant="outline" className={`text-xs ${toneClasses(friendly.tone)}`}>
              {friendly.label}
            </Badge>
          </SheetTitle>
          <div className="text-xs text-muted-foreground">
            #{row.id.slice(0, 8).toUpperCase()} · Submitted {format(new Date(row.created_at), 'EEE MMM d, h:mm a')}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {row.type === 'request' ? (
            <RequestDetailBody task={row.raw as TaskRow} />
          ) : (
            <SupplyDetailStub supply={row.raw as SupplyRow} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SupplyDetailStub({ supply }: { supply: SupplyRow }) {
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Supply order detail for {supply.id.slice(0, 8).toUpperCase()}.
      <br />
      <span className="text-xs">Full supply detail panel can be plugged in here in a follow-up.</span>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/MyRequestDetailDrawer.tsx
git commit -m "Add MyRequestDetailDrawer with type-specific body"
```

### Task 2.5: Create `MyRequests` page

**Files:**
- Create: `src/features/dashboard/pages/MyRequests.tsx`

- [ ] **Step 1: Write the page**

```typescript
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMyRequests, type MyRequestRow } from '@features/dashboard/hooks/useMyRequests';
import { MyRequestRow as RowComponent } from '@features/dashboard/components/MyRequestRow';
import { MyRequestDetailDrawer } from '@features/dashboard/components/MyRequestDetailDrawer';

type Filter = 'all' | 'open' | 'done';
type TypeFilter = 'all' | 'supply' | 'request';

const OPEN_SUPPLY = new Set(['submitted', 'pending_approval', 'approved', 'received', 'picking', 'packing', 'ready']);
const OPEN_TASK = new Set(['pending', 'claimed', 'in_progress']);

function isOpen(row: MyRequestRow): boolean {
  return row.type === 'supply' ? OPEN_SUPPLY.has(row.status_internal) : OPEN_TASK.has(row.status_internal);
}

export default function MyRequests() {
  const { data: rows = [], isLoading, error } = useMyRequests();
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');
  const [filter, setFilter] = useState<Filter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (focusId) {
      setSelectedId(focusId);
      const el = document.getElementById(`row-${focusId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(() => {
        const next = new URLSearchParams(params);
        next.delete('focus');
        setParams(next, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [focusId, params, setParams]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter === 'open' && !isOpen(r)) return false;
      if (filter === 'done' && isOpen(r)) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [rows, filter, typeFilter]);

  const selected = rows.find(r => r.id === selectedId) ?? null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <p className="text-sm text-muted-foreground">Everything you've asked the court aides for.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'done'] as Filter[]).map(f => (
          <Button
            key={f}
            type="button"
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        {(['all', 'supply', 'request'] as TypeFilter[]).map(t => (
          <Button
            key={t}
            type="button"
            variant={typeFilter === t ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(t)}
            className="capitalize"
          >
            {t === 'all' ? 'All types' : t}
          </Button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden bg-background">
        {isLoading && <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>}
        {error && <div className="p-6 text-center text-destructive text-sm">Could not load requests.</div>}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No requests yet.</div>
        )}
        {filtered.map(row => (
          <div id={`row-${row.id}`} key={row.id}>
            <RowComponent row={row} highlighted={row.id === focusId} onClick={() => setSelectedId(row.id)} />
          </div>
        ))}
      </div>

      <MyRequestDetailDrawer row={selected} onOpenChange={open => !open && setSelectedId(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/pages/MyRequests.tsx
git commit -m "Add MyRequests page (merged supply + task inbox)"
```

### Task 2.6: Wire `/my-requests` route, rename sidebar, redirect legacy URLs

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Layout.tsx` (or whichever file holds the sidebar nav definition)
- Delete: `src/features/dashboard/pages/MyActivity.tsx`

- [ ] **Step 1: Identify the sidebar nav definition**

Run: `grep -rn "My Activity\|/my-activity" src/components src/features/dashboard 2>/dev/null | head -10`
Locate the literal `My Activity` string and the `/my-activity` href.

- [ ] **Step 2: Register the new route + redirects in `src/App.tsx`**

Find the existing `MyActivity` lazy-import line and replace with:

```typescript
const MyRequests = lazy(() => import("@features/dashboard/pages/MyRequests"));
```

Then find the `<Route path="/my-activity"` block and replace it with:

```tsx
<Route path="/my-requests" element={
  <ProtectedRoute>
    <MyRequests />
  </ProtectedRoute>
} />
<Route path="/my-activity" element={<Navigate to="/my-requests" replace />} />
<Route path="/my-supply-requests" element={<Navigate to="/my-requests" replace />} />
```

Keep the existing `/my-issues` route as it is. Do not redirect it.

- [ ] **Step 3: Rename the sidebar entry**

In the file you found in Step 1, change the literal `'My Activity'` to `'My Requests'` and the `href`/`to` from `/my-activity` to `/my-requests`. Leave the icon and ordering as they are.

- [ ] **Step 4: Delete the legacy page**

Run: `git rm src/features/dashboard/pages/MyActivity.tsx`
If any consumer imports it, the build will complain — fix any remaining imports by removing them (the legacy page should have no other importers after Step 2).

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/layout/Layout.tsx
git rm src/features/dashboard/pages/MyActivity.tsx
git commit -m "Wire /my-requests route, rename sidebar, redirect legacy URLs"
```

### Task 2.7: Subscribe to realtime updates for `useMyRequests`

**Files:**
- Modify: `src/features/dashboard/hooks/useMyRequests.ts`

- [ ] **Step 1: Locate the realtime provider hook**

Run: `grep -rn "RealtimeProvider\|useRealtimeChannel\|supabase.channel" src/providers src/shared/hooks 2>/dev/null | head -5`
Identify the existing channel-subscription pattern used elsewhere (e.g. `useSupplyRequests`).

- [ ] **Step 2: Add a realtime invalidation effect**

Append to `src/features/dashboard/hooks/useMyRequests.ts`:

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useMyRequestsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`my-requests-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_requests', filter: `requester_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_tasks', filter: `created_by=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
```

- [ ] **Step 3: Use the realtime hook in `MyRequests.tsx`**

In `src/features/dashboard/pages/MyRequests.tsx`, import and call it at the top of the component:

```typescript
import { useMyRequests, useMyRequestsRealtime, type MyRequestRow } from '@features/dashboard/hooks/useMyRequests';
// ...
export default function MyRequests() {
  useMyRequestsRealtime();
  const { data: rows = [], isLoading, error } = useMyRequests();
  // ...
}
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/hooks/useMyRequests.ts src/features/dashboard/pages/MyRequests.tsx
git commit -m "MyRequests: realtime invalidation on supply + task changes"
```

---

## Phase 3 — One success toast (Spec Piece 3)

### Task 3.1: Create `requestToast` helper

**Files:**
- Create: `src/shared/utils/requestToast.ts`
- Test: `src/shared/utils/__tests__/requestToast.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
import { requestSubmittedToast, requestFailedToast, formatShortId } from '../requestToast';

describe('formatShortId', () => {
  it('uppercases the first 8 chars with a leading #', () => {
    expect(formatShortId('abc123de-foo-bar')).toBe('#ABC123DE');
  });
});

describe('requestSubmittedToast', () => {
  it('fires sonner success with the short id and a View action', () => {
    requestSubmittedToast({ id: 'abc123de-foo', type: 'supply', needsApproval: false });
    expect(toast.success).toHaveBeenCalled();
    const call = (toast.success as any).mock.calls.at(-1);
    expect(call[0]).toContain('#ABC123DE');
    expect(call[0]).toMatch(/Request|Order/);
  });

  it('uses approval wording when needsApproval is true', () => {
    requestSubmittedToast({ id: 'abc123de-foo', type: 'supply', needsApproval: true });
    const call = (toast.success as any).mock.calls.at(-1);
    expect(call[0]).toMatch(/approval/i);
  });
});

describe('requestFailedToast', () => {
  it('fires sonner error with the message', () => {
    requestFailedToast('boom');
    expect(toast.error).toHaveBeenCalledWith('boom');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/shared/utils/__tests__/requestToast.test.ts`
Expected: FAIL with import error.

- [ ] **Step 3: Implement the helper**

```typescript
import { toast } from 'sonner';

export type RequestType = 'supply' | 'request';

export interface SubmittedToastOpts {
  id: string;
  type: RequestType;
  needsApproval?: boolean;
}

export function formatShortId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function requestSubmittedToast({ id, type, needsApproval }: SubmittedToastOpts) {
  const shortId = formatShortId(id);
  const noun = type === 'supply' ? 'Order' : 'Request';
  const verb = needsApproval ? 'sent for approval' : 'submitted';
  toast.success(`${noun} ${shortId} ${verb}`, {
    action: {
      label: 'View',
      onClick: () => {
        window.location.assign(`/my-requests?focus=${id}`);
      },
    },
    duration: 6000,
  });
}

export function requestFailedToast(message: string) {
  toast.error(message);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/shared/utils/__tests__/requestToast.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/requestToast.ts src/shared/utils/__tests__/requestToast.test.ts
git commit -m "Add requestToast helper (submitted / failed)"
```

### Task 3.2: Wire toast into `OrderCart`, remove the in-place success screen

**Files:**
- Modify: `src/features/supply/components/supply/OrderCart.tsx`
- Modify: `src/features/supply/hooks/useOrderCart.ts`
- Modify: `src/features/supply/components/supply/QuickOrderGrid.tsx`
- Modify: `src/features/supply/components/supply/QuickSupplyRequest.tsx`

- [ ] **Step 1: Identify the success-state branch in `useOrderCart.ts`**

Run: `grep -n "submittedOrder\|resetSubmittedOrder" src/features/supply/hooks/useOrderCart.ts`
Note the lines where `submittedOrder` state is declared, set on success, and reset.

- [ ] **Step 2: Replace the success state with the toast**

In `src/features/supply/hooks/useOrderCart.ts`:
- Delete the `submittedOrder` state and its setter.
- Delete the `resetSubmittedOrder` function.
- Import `requestSubmittedToast` from `@shared/utils/requestToast`.
- In `submitOrder`'s success branch, call:

```typescript
requestSubmittedToast({
  id: result.id,
  type: 'supply',
  needsApproval: result.status === 'pending_approval',
});
```

- Remove `submittedOrder` and `resetSubmittedOrder` from the returned object.

- [ ] **Step 3: Update consumers**

In `src/features/supply/components/supply/QuickOrderGrid.tsx` and `QuickSupplyRequest.tsx`:
- Remove the destructured `submittedOrder` and `resetSubmittedOrder` from `useOrderCart()`.
- Remove any JSX that renders a success screen based on `submittedOrder` (search the file for `submittedOrder` references and delete that JSX block entirely).

- [ ] **Step 4: Update `OrderCart.tsx`**

In `src/features/supply/components/supply/OrderCart.tsx`:
- The modal already closes on successful submit (`setIsOpen(false)` in `handleSubmit`). No JSX change needed.
- Confirm: no reference to `submittedOrder` remains. Run `grep -n submittedOrder src/features/supply/components/supply/OrderCart.tsx` — expect zero hits.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/supply/components/supply/OrderCart.tsx src/features/supply/hooks/useOrderCart.ts src/features/supply/components/supply/QuickOrderGrid.tsx src/features/supply/components/supply/QuickSupplyRequest.tsx
git commit -m "Supply cart: emit submitted toast, drop in-place success view"
```

---

## Phase 4 — One Request form (Spec Piece 2)

### Task 4.1: DB migration — add `timing_preference` and `requested_for_at` to `staff_tasks`

**Files:**
- Create: `db/migrations/074_staff_tasks_timing.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Make a Request form: capture the timing constraint the user typed in.
-- 'anytime' is the default and matches today's behaviour. 'when_court_is_down'
-- is a soft signal with no specific date. 'specific_time' is paired with a
-- non-null requested_for_at timestamp.

ALTER TABLE public.staff_tasks
  ADD COLUMN IF NOT EXISTS timing_preference text DEFAULT 'anytime',
  ADD COLUMN IF NOT EXISTS requested_for_at timestamptz;

ALTER TABLE public.staff_tasks
  DROP CONSTRAINT IF EXISTS staff_tasks_timing_preference_check;

ALTER TABLE public.staff_tasks
  ADD CONSTRAINT staff_tasks_timing_preference_check
    CHECK (timing_preference IN ('anytime', 'when_court_is_down', 'specific_time'));

ALTER TABLE public.staff_tasks
  DROP CONSTRAINT IF EXISTS staff_tasks_specific_time_has_date;

ALTER TABLE public.staff_tasks
  ADD CONSTRAINT staff_tasks_specific_time_has_date
    CHECK (timing_preference <> 'specific_time' OR requested_for_at IS NOT NULL);
```

- [ ] **Step 2: Apply the migration to the live Supabase project**

Use the `mcp__supabase__apply_migration` tool with `project_id: fmymhtuiqzhupjyopfvi`, `name: 074_staff_tasks_timing`, and the SQL from Step 1.

- [ ] **Step 3: Verify the columns landed**

Use `mcp__supabase__execute_sql` to run:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'staff_tasks' AND column_name IN ('timing_preference', 'requested_for_at');
```

Expected: two rows.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/074_staff_tasks_timing.sql
git commit -m "Migration 074: staff_tasks timing_preference + requested_for_at"
```

### Task 4.2: Create `RequestForm` component

**Files:**
- Create: `src/features/supply/components/request/RequestForm.tsx`

- [ ] **Step 1: Identify the existing room picker**

Run: `grep -rn "DeliveryRoomPicker\|RoomPicker" src/features/supply --include="*.tsx" 2>/dev/null | head -5`
Note the canonical room picker component used by the supply cart.

- [ ] **Step 2: Write the component**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, MessageSquare } from 'lucide-react';
import { DeliveryRoomPicker } from '@features/supply/components/supply/DeliveryRoomPicker';
import { requestSubmittedToast, requestFailedToast } from '@shared/utils/requestToast';

type Timing = 'anytime' | 'when_court_is_down' | 'specific_time';

export function RequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [where, setWhere] = useState('');
  const [what, setWhat] = useState('');
  const [timing, setTiming] = useState<Timing>('anytime');
  const [specificAt, setSpecificAt] = useState('');

  const whereMissing = !where.trim();
  const whatMissing = what.trim().length < 10;
  const specificMissing = timing === 'specific_time' && !specificAt;
  const canSubmit = !whereMissing && !whatMissing && !specificMissing;

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          created_by: user.id,
          room_id: where.trim() || null,
          description: what.trim(),
          status: 'pending',
          task_type: 'request',
          timing_preference: timing,
          requested_for_at: timing === 'specific_time' ? new Date(specificAt).toISOString() : null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      requestSubmittedToast({ id: data.id, type: 'request' });
      setWhere('');
      setWhat('');
      setTiming('anytime');
      setSpecificAt('');
      queryClient.invalidateQueries({ queryKey: ['my-requests', user?.id] });
      navigate('/my-requests?focus=' + data.id);
    },
    onError: (e: any) => requestFailedToast(e?.message || 'Could not submit your request. Try again.'),
  });

  return (
    <form
      className="space-y-5 max-w-xl mx-auto"
      onSubmit={e => {
        e.preventDefault();
        if (canSubmit && !submit.isPending) submit.mutate();
      }}
    >
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="h-4 w-4" /> Where <span className="text-destructive">*</span>
        </Label>
        <DeliveryRoomPicker
          value={where}
          onChange={setWhere}
          userId={user?.id}
          invalid={whereMissing && (submit.isError || submit.isPending)}
          placeholder="Search for a room…"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="h-4 w-4" /> What <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={what}
          onChange={e => setWhat(e.target.value)}
          placeholder="e.g., Lateral file cabinet on the east wall is busted — replace with another lateral."
          rows={5}
        />
        {what.length > 0 && whatMissing && (
          <p className="text-xs text-muted-foreground">A few more words help the court aide know what you need.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Calendar className="h-4 w-4" /> When can it happen? <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div className="flex flex-col gap-2">
          {([
            ['anytime', 'Anytime'],
            ['when_court_is_down', 'When court is down'],
            ['specific_time', 'By a specific time'],
          ] as [Timing, string][]).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="timing"
                value={value}
                checked={timing === value}
                onChange={() => setTiming(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {timing === 'specific_time' && (
          <Input
            type="datetime-local"
            value={specificAt}
            onChange={e => setSpecificAt(e.target.value)}
            className="max-w-xs"
          />
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={!canSubmit || submit.isPending}
          className="w-full sm:w-auto"
        >
          {submit.isPending ? 'Submitting…' : 'Submit request'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/supply/components/request/RequestForm.tsx
git commit -m "Add RequestForm (one-screen Where / What / When)"
```

### Task 4.3: Delete the four legacy sub-forms and the picker page

**Files:**
- Delete: `src/features/supply/pages/request/HelpRequestPage.tsx`
- Delete any related setup / move / help wizard components.

- [ ] **Step 1: Inventory the legacy files**

Run: `ls src/features/supply/pages/request/ src/features/supply/components/request/ 2>/dev/null`
Note every file other than the `RequestForm.tsx` you just created.

- [ ] **Step 2: Find any importers**

For each legacy file, run: `grep -rn "from.*<basename without .tsx>" src --include="*.tsx" --include="*.ts" 2>/dev/null`
Importers will be cleaned up in the front-door task (4.4 below uses `RequestForm` instead).

- [ ] **Step 3: Delete the files**

```bash
git rm src/features/supply/pages/request/HelpRequestPage.tsx
# repeat for SetupRequestForm.tsx, the picker component, and any helper file
# whose only consumer was HelpRequestPage.
```

- [ ] **Step 4: Defer build verification**

The build will fail until Phase 5 wires `RequestForm` into a real route, so do not run the build yet — just stage the deletes. They are committed together with Phase 5.

- [ ] **Step 5: Stage but do not commit**

```bash
git status  # confirm all deletions are staged
```

Leave staged; the next task is Phase 5 which lands the wiring and commits all of it together.

---

## Phase 5 — `/supplies` tabbed front door (Spec Piece 1)

### Task 5.1: Create `CourtAideRequests` page with two tabs

**Files:**
- Create: `src/features/supply/pages/CourtAideRequests.tsx`

- [ ] **Step 1: Identify the existing catalog component**

Run: `grep -rn "QuickOrderGrid\|QuickSupplyRequest" src/features/supply/pages 2>/dev/null | head -5`
The route `/request/supplies` today lazy-loads one of these. Use the same one in the new page.

- [ ] **Step 2: Write the page**

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { QuickOrderGrid } from '@features/supply/components/supply/QuickOrderGrid';
import { RequestForm } from '@features/supply/components/request/RequestForm';

export default function CourtAideRequests() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'request' ? 'request' : 'order';

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <header className="mb-4 space-y-1">
        <h1 className="text-2xl font-semibold">Supplies & Requests</h1>
        <p className="text-sm text-muted-foreground">
          Order supplies from the stockroom, or make a request to the court aides.
        </p>
      </header>
      <Tabs
        value={tab}
        onValueChange={v => setParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', v);
          return next;
        }, { replace: true })}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="order">Order Supplies</TabsTrigger>
          <TabsTrigger value="request">Make a Request</TabsTrigger>
        </TabsList>
        <TabsContent value="order">
          <QuickOrderGrid />
        </TabsContent>
        <TabsContent value="request">
          <RequestForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: exit 0.

### Task 5.2: Register `/supplies` route + redirect legacy URLs

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the lazy import**

Near the existing supply lazy imports in `src/App.tsx`, add:

```typescript
const CourtAideRequests = lazy(() => import("@features/supply/pages/CourtAideRequests"));
```

- [ ] **Step 2: Add the route + redirects**

Replace the existing `/request/supplies` and `/request/help` route declarations with:

```tsx
<Route path="/supplies" element={
  <ProtectedRoute>
    <ModuleProtectedRoute moduleKey="supply_requests" moduleName="Supplies & Requests">
      <CourtAideRequests />
    </ModuleProtectedRoute>
  </ProtectedRoute>
} />
<Route path="/request/supplies" element={<Navigate to="/supplies?tab=order" replace />} />
<Route path="/request/help" element={<Navigate to="/supplies?tab=request" replace />} />
```

If the original `/request/supplies` block had a different `moduleKey`, use the existing one. Leave any other `/request/*` route untouched.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: built. The Phase 4.3 file deletions are now valid (their imports are gone).

- [ ] **Step 4: Commit Phase 4.3 + Phase 5.1 + Phase 5.2 together**

```bash
git add src/App.tsx src/features/supply/pages/CourtAideRequests.tsx
# the Phase 4.3 deletions are still staged from earlier
git commit -m "Add /supplies tabbed front door; collapse 4 sub-forms into RequestForm"
```

### Task 5.3: Rename the sidebar nav item

**Files:**
- Modify: the sidebar nav definition (located in Task 2.6 Step 1)

- [ ] **Step 1: Update the supply nav entry**

Locate the existing `'Supplies'` or `'Order Supplies'` nav entry and change its label to **`Supplies & Requests`** and its `href` to `/supplies`.

If the sidebar has a separate `Make a Request` entry that pointed to `/request/help`, delete that entry — the new entry covers both.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Layout.tsx  # or wherever the sidebar lives
git commit -m "Sidebar: rename Supplies entry to Supplies & Requests"
```

### Task 5.4: Collapse the header CTAs

**Files:**
- Modify: the header / Layout file where `Order Supplies` and `Make a Request` buttons live.

- [ ] **Step 1: Find the existing CTAs**

Run: `grep -rn "Order Supplies\|Make a Request" src/components 2>/dev/null | head -10`

- [ ] **Step 2: Pick one of two patterns**

Either:
- **Keep the two buttons** but route them to `/supplies?tab=order` and `/supplies?tab=request`. Simplest. Recommended for now.

Or, if you prefer the dropdown:
- Replace both buttons with a single `<DropdownMenu>` trigger labelled `+ Court Aide` and two menu items routing to the same two URLs.

Pick the two-buttons option unless the dropdown is explicitly requested.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Layout.tsx  # or wherever the header lives
git commit -m "Header CTAs: route to /supplies?tab=order and ?tab=request"
```

---

## Phase 6 — End-to-end manual verification

### Task 6.1: Manual walkthrough

- [ ] **Step 1: Start the dev server (if not running)**

Run: `npm run dev` and open the preview at `http://localhost:8080`.

- [ ] **Step 2: Verify the sidebar / front door**

- Sidebar shows `Supplies & Requests` (not `Supplies` + `Make a Request` as two items).
- Clicking it lands on `/supplies` with the `Order Supplies` tab active.
- Tab switch to `Make a Request` shows the new three-field form.

- [ ] **Step 3: Submit a supply order**

- Add an item, open the cart, pick a delivery room, submit.
- Verify: cart modal closes; a toast appears `Order #XXXXXXXX submitted`; the page stays on the catalog with an empty cart.
- Click `View` in the toast; lands on `/my-requests` with the new row highlighted for ~3 seconds.

- [ ] **Step 4: Submit a Make a Request**

- Tab to `Make a Request`. Pick a room. Type a description with ≥10 chars. Try each of the three `When` options (including `By a specific time` with a datetime).
- Verify: submit disabled until valid; on submit toast appears; navigates to `/my-requests` with the new row highlighted.

- [ ] **Step 5: Browse `/my-requests`**

- Both the new supply order and the new request appear, newest first, with the right type chip and status pill.
- Filter chips `Open` / `Done` work.
- Tap a row — detail drawer opens with `Where / What / When` for requests and the supply stub for supply orders.

- [ ] **Step 6: Verify Issues are untouched**

- Sidebar still has the Issues / Operations entry.
- `/operations?tab=issues` still works.
- `/my-issues` still works.
- `/my-requests` does **not** include any issue.

- [ ] **Step 7: Verify legacy URL redirects**

- Visiting `/my-activity`, `/my-supply-requests`, `/request/supplies`, `/request/help` each lands on the correct new URL.

### Task 6.2: Final commit and push

- [ ] **Step 1: Confirm clean working tree**

Run: `git status` — expected: nothing to commit.

- [ ] **Step 2: Push**

Run: `git push`
Expected: all phase commits land on the remote.

---

## Notes for the implementer

- **Realtime channel naming** — Supabase channels must be unique per subscription. The Phase 2.7 hook scopes the channel to the user id, which is the expected pattern (look at how `useSupplyRequests` does it in this repo).
- **Module guard reuse** — The `/supplies` route uses the same `ModuleProtectedRoute` wrapper the original `/request/supplies` used; do not change which `moduleKey` is required.
- **Existing `statusLabels.ts`** — Do not change the existing supply / issue / key mappings while adding the task mapping. The labels they produce ship in many places already; the new task mapping should follow the same `FriendlyStatus` shape.
- **No DB rename** — `staff_tasks` keeps its name. The `task_type` column keeps its values for historical rows. New rows write `'request'`.
- **Sidebar location varies** — the codebase has both `Layout.tsx` and a sidebar definition file. Whichever holds the literal `'My Activity'` string is the one to edit. Use `grep` to find it before editing.
- **Issues stay** — no part of this plan touches `Operations.tsx`, `ReportIssueDialog.tsx`, the `Issues` / `Maintenance` / `Lighting` sidebar entries, or `/my-issues`. If a task seems to require changing one, stop and re-read the spec.
