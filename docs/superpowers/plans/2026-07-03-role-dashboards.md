# Role Dashboards (User Desktop + Court Officer Command) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the standard-user dashboard as a desktop two-column portal, and create a new Court Officer command dashboard at `/command-center` that becomes that role's landing page.

**Architecture:** Part A restructures `UserDashboard.tsx` presentation only (same hooks/queries) into four new components under `features/dashboard/components/dashboard/`. Part B adds a read-only command page composed of two data hooks + four presentational components under `features/court/`, wired into routing/nav. No migrations, no new tables, no RPCs.

**Tech Stack:** React 18 + TypeScript, react-query v5, Supabase JS, Tailwind + shadcn/ui, vitest (logic tests only — this repo does not unit-test JSX; UI is verified via the Vite preview + `tsc`).

**Specs:** `docs/superpowers/specs/2026-07-03-user-dashboard-desktop-design.md`, `docs/superpowers/specs/2026-07-03-court-officer-command-dashboard-design.md`

**Verification loop used by several tasks** (referred to as "standard verification"):
1. `npx tsc --noEmit -p tsconfig.app.json` → exit 0, no output.
2. Dev server runs on port 8080 (`.claude/launch.json` name `nysc-facilities`). Admin login `jduchate@gmail.com` / `welcome` (from `.env.local`). Role preview: run `localStorage.setItem('preview_role', '<role>')` in the page, then reload (DEV + admin-gated).
3. NEVER run `db/migrations` or seed scripts; the Supabase project holds production data.

---

## Part A — User Dashboard desktop redesign

### Task 1: `DashboardQuickActions` component

**Files:**
- Create: `src/features/dashboard/components/dashboard/DashboardQuickActions.tsx`

The three primary actions as a responsive card row (side-by-side on `sm+`, stacked rows on mobile). This absorbs the `ActionRow` component currently defined inline at the bottom of `src/features/dashboard/pages/UserDashboard.tsx:201-241` (it will be deleted from there in Task 5).

- [ ] **Step 1: Create the component**

```tsx
/**
 * DashboardQuickActions — the standard user's three primary actions as a
 * responsive card row. Desktop: three upright cards side by side. Mobile:
 * stacked full-width rows (same as the old ActionRow look).
 */
import React from "react";
import { ChevronRight } from "lucide-react";

export interface QuickActionItem {
  icon: React.ElementType;
  label: string;
  sub?: string;
  onClick: () => void;
  /** Highlighted primary action (solid brand background). */
  accent?: boolean;
  /** Route chunk to prefetch on hover/focus. */
  prefetchPath?: string;
}

export function DashboardQuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="quick-actions">
      {actions.map((a) => (
        <QuickActionCard key={a.label} {...a} />
      ))}
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, sub, onClick, accent, prefetchPath }: QuickActionItem) {
  const handlePrefetch = () => {
    if (prefetchPath) {
      // Lazy import so the test setup mock for react-query isn't needed here.
      import("@/lib/prefetchRoutes").then((m) => m.prefetchRoute(prefetchPath));
    }
  };
  return (
    <button
      onClick={onClick}
      onPointerEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={`flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 rounded-md px-5 py-4 sm:py-5 text-left transition-colors touch-manipulation
        ${accent
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border border-border hover:bg-accent text-foreground"
        }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <div className="flex-1 min-w-0 sm:flex-none">
        <span className="text-base font-medium">{label}</span>
        <p className={`text-xs mt-0.5 ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {/* Non-breaking space keeps card heights equal when there is no sub */}
          {sub ?? " "}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-50 sm:hidden" />
    </button>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0. (Component is not mounted yet; that happens in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/dashboard/DashboardQuickActions.tsx
git commit -m "feat(dashboard): quick actions as responsive card row"
```

### Task 2: `DashboardMyRoomCard` component

**Files:**
- Create: `src/features/dashboard/components/dashboard/DashboardMyRoomCard.tsx`

Surfaces the already-built self-serve room assignment on the home page, plus open issues in that room. Reuses `useUserRoomAssignments` and `RoomSelector` unchanged. The room-setting mutation mirrors `MyRoomSection.tsx` exactly (delete own `work_location` rows, insert the new one — RLS restricts to the caller's own `profile_id`).

- [ ] **Step 1: Create the component**

```tsx
/**
 * DashboardMyRoomCard — "My Room" on the home page: the user's self-assigned
 * room, open issues in that room, and the self-serve picker when no room is
 * set. Full room management stays in Profile; this is the discoverable
 * entry point (only 2/10 profiles had set a room while it lived in Profile).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DoorOpen, MapPin, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useUserRoomAssignments } from "@features/spaces/hooks/useUserRoomAssignments";
import { RoomSelector } from "@features/keys/components/keys/lockbox/RoomSelector";
import { getErrorMessage } from "@/lib/errorUtils";

interface RoomIssue {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export function DashboardMyRoomCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rawAssignments = [], isLoading } = useUserRoomAssignments(user?.id);

  // Same de-dup as MyRoomSection: legacy occupant-keyed + profile-keyed rows
  // can reference the same room; show each room once.
  const assignments = rawAssignments.filter(
    (a, i, arr) => arr.findIndex((x) => x.room_id === a.room_id) === i,
  );
  const primary = assignments.find((a) => a.is_primary) ?? assignments[0];

  // Open issues in the assigned room. issues.room_id and
  // occupant_room_assignments.room_id reference the same room ids
  // (verified: 0 mismatches across 142 rooms) — direct eq, no mapping.
  const { data: roomIssues = [] } = useQuery({
    queryKey: ["dashboard-room-issues", primary?.room_id],
    enabled: !!primary?.room_id,
    queryFn: async (): Promise<RoomIssue[]> => {
      const { data, error } = await supabase
        .from("issues")
        .select("id, title, status, priority, created_at")
        .eq("room_id", primary!.room_id)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RoomIssue[];
    },
  });

  const setRoom = useMutation({
    mutationFn: async (roomId: string | null) => {
      if (!user) throw new Error("Not authenticated");
      await supabase
        .from("occupant_room_assignments")
        .delete()
        .eq("profile_id", user.id)
        .eq("assignment_type", "work_location");
      if (roomId) {
        const { error } = await supabase.from("occupant_room_assignments").insert({
          profile_id: user.id,
          room_id: roomId,
          assignment_type: "work_location",
          is_primary: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, roomId) => {
      toast.success(roomId ? "Room updated" : "Room cleared");
      queryClient.invalidateQueries({ queryKey: ["userRoomAssignments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["occupantAssignments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-room-issues"] });
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error) || "Failed to update room"),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            My Room
          </span>
          {primary && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => navigate("/profile")}
            >
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : primary ? (
          <>
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">
                  Room {primary.rooms?.room_number || primary.rooms?.name || "—"}
                </p>
                {primary.rooms?.name && primary.rooms?.room_number && (
                  <p className="text-xs text-muted-foreground truncate">{primary.rooms.name}</p>
                )}
              </div>
            </div>
            {/* Issues render only when present — never "0 issues" filler */}
            {roomIssues.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Open issues in your room
                </p>
                {roomIssues.slice(0, 3).map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => navigate("/my-issues")}
                    className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    <AlertTriangle
                      className={`h-3.5 w-3.5 shrink-0 ${
                        issue.priority === "high" || issue.priority === "critical"
                          ? "text-destructive"
                          : "text-amber-500"
                      }`}
                    />
                    <span className="flex-1 truncate">{issue.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {issue.status.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pick your room — it fills in automatically when you report an issue or
              order supplies.
            </p>
            <RoomSelector
              value={undefined}
              onChange={(roomId) => setRoom.mutate(roomId)}
              disabled={setRoom.isPending}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/dashboard/DashboardMyRoomCard.tsx
git commit -m "feat(dashboard): My Room card with room issues on home page"
```

### Task 3: `DashboardProfileSummaryCard` component

**Files:**
- Create: `src/features/dashboard/components/dashboard/DashboardProfileSummaryCard.tsx`

No new data — wraps the existing `CompactHeader` in a rail card.

- [ ] **Step 1: Create the component**

```tsx
/**
 * DashboardProfileSummaryCard — the user's identity block as a rail card.
 * Same fields CompactHeader already renders; no new data.
 */
import { Card, CardContent } from "@/components/ui/card";
import { CompactHeader } from "@shared/components/user/CompactHeader";

interface Props {
  firstName: string;
  lastName?: string;
  title?: string;
  department?: string;
  roomNumber?: string;
  avatarUrl?: string;
  role?: string;
}

export function DashboardProfileSummaryCard(props: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <CompactHeader {...props} />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/dashboard/components/dashboard/DashboardProfileSummaryCard.tsx
git commit -m "feat(dashboard): profile summary rail card"
```

### Task 4: `DashboardActivityList` component

**Files:**
- Create: `src/features/dashboard/components/dashboard/DashboardActivityList.tsx`

One chronological list merging the three request sources the page already
fetches. Wide rows (type · title · status · location · date) instead of the
truncated mobile tabs. Location shows only where the data has it (issues
carry `unified_spaces`; supplies/tasks don't fetch a room — per spec, data
fetching is unchanged).

- [ ] **Step 1: Create the component**

```tsx
/**
 * DashboardActivityList — merged chronological view of the user's supply
 * orders, issues, and task requests. Desktop-wide rows; the same data the
 * page already fetches (no new queries).
 */
import type { ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Send, AlertTriangle, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SupplyRequestRow {
  id: string;
  title?: string;
  status: string;
  created_at: string;
}
interface IssueRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  unified_spaces?: { name?: string | null; room_number?: string | null } | null;
}
interface TaskRow {
  id: string;
  title: string;
  status: string;
  task_type?: string;
  created_at: string;
}

interface ActivityRow {
  id: string;
  kind: "supply" | "issue" | "task";
  title: string;
  status: string;
  location?: string;
  createdAt: string;
}

const KIND_META: Record<ActivityRow["kind"], { icon: ElementType; label: string }> = {
  supply: { icon: Package, label: "Supply" },
  issue: { icon: AlertTriangle, label: "Issue" },
  task: { icon: Send, label: "Request" },
};

const DONE_STATUSES = ["completed", "fulfilled", "resolved", "cancelled", "rejected"];

export function DashboardActivityList({
  supplyRequests,
  issues,
  taskRequests,
  limit = 8,
}: {
  supplyRequests: SupplyRequestRow[];
  issues: IssueRow[];
  taskRequests: TaskRow[];
  limit?: number;
}) {
  const navigate = useNavigate();

  const rows: ActivityRow[] = [
    ...supplyRequests.map((r) => ({
      id: r.id,
      kind: "supply" as const,
      title: r.title || "Supply order",
      status: r.status,
      createdAt: r.created_at,
    })),
    ...issues.map((i) => ({
      id: i.id,
      kind: "issue" as const,
      title: i.title,
      status: i.status,
      location: i.unified_spaces?.room_number
        ? `Room ${i.unified_spaces.room_number}`
        : i.unified_spaces?.name ?? undefined,
      createdAt: i.created_at,
    })),
    ...taskRequests.map((t) => ({
      id: t.id,
      kind: "task" as const,
      title: t.title,
      status: t.status,
      createdAt: t.created_at,
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nothing yet — your orders, requests, and reported issues will show up here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {rows.map((row) => {
          const meta = KIND_META[row.kind];
          const Icon = meta.icon;
          const done = DONE_STATUSES.includes(row.status);
          return (
            <button
              key={`${row.kind}-${row.id}`}
              onClick={() => navigate(row.kind === "issue" ? "/my-issues" : "/my-requests")}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="hidden md:inline text-xs text-muted-foreground w-16 shrink-0">
                {meta.label}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-medium">{row.title}</span>
              {row.location && (
                <span className="hidden lg:inline text-xs text-muted-foreground shrink-0">
                  {row.location}
                </span>
              )}
              <Badge
                variant={done ? "secondary" : "outline"}
                className="text-[10px] px-1.5 py-0 capitalize shrink-0"
              >
                {row.status.replace(/_/g, " ")}
              </Badge>
              <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums shrink-0 w-24 text-right">
                {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/dashboard/components/dashboard/DashboardActivityList.tsx
git commit -m "feat(dashboard): merged wide activity list"
```

### Task 5: Restructure `UserDashboard` into the two-column portal

**Files:**
- Modify: `src/features/dashboard/pages/UserDashboard.tsx`

Replace the `max-w-lg` single column with the portal grid. **All hooks and
queries stay exactly as they are** (lines 25-121 of the current file) — only
the returned JSX and the now-unused pieces change:

- Delete the inline `ActionRow` component (lines 200-241) and its usage.
- Delete imports that become unused: `CompactHeader` (moves into
  `DashboardProfileSummaryCard`), `CompactActivitySection`, `Button`,
  `ChevronRight` — keep `Package`, `Send`, `KeyRound` (used for quick-action
  icons) and everything else.
- Keep: redirect effect, `PullToRefresh` (mobile), `PickupAlertBanner`,
  `KeyRequestDialog`, loading skeleton, all data hooks.

- [ ] **Step 1: Replace the imports block**

Replace lines 10-22 (from the `NotificationDropdown` import through the
`KeyRequestDialog` import) with:

```tsx
import { NotificationDropdown } from "@shared/components/user/NotificationDropdown";
import { useUserPersonnelInfo } from "@features/court/hooks/useUserPersonnelInfo";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { PickupAlertBanner } from "@shared/components/user/PickupAlertBanner";
import { DashboardQuickActions } from "@features/dashboard/components/dashboard/DashboardQuickActions";
import { DashboardMyRoomCard } from "@features/dashboard/components/dashboard/DashboardMyRoomCard";
import { DashboardProfileSummaryCard } from "@features/dashboard/components/dashboard/DashboardProfileSummaryCard";
import { DashboardActivityList } from "@features/dashboard/components/dashboard/DashboardActivityList";
import { Button } from "@/components/ui/button";
import { Package, Send, ChevronRight, KeyRound } from "lucide-react";
import { getDashboardForRole } from "@/routes/roleBasedRouting";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { KeyRequestDialog } from "@features/keys/components/requests/KeyRequestDialog";
```

- [ ] **Step 2: Replace the returned JSX**

Replace everything from `return (` (line 123) to the end of the component
function (line 198) with:

```tsx
  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="mx-auto max-w-6xl space-y-5 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-0">
        {/* Page header: title + notifications */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="mb-0.5 text-xs font-medium text-primary">Home</p>
            <h1 className="text-xl font-semibold tracking-tight">My Dashboard</h1>
          </div>
          <NotificationDropdown
            notifications={notifications as any}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearNotification={clearNotification}
            onClearAllNotifications={clearAllNotifications}
          />
        </div>

        <PickupAlertBanner count={readyForPickup} onClick={() => navigate("/my-requests")} />

        {/* Two-column portal: main content + rail. Rail stacks after main below lg. */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            <DashboardQuickActions
              actions={[
                {
                  icon: Package,
                  label: "Order Supplies",
                  sub: activeSupplyCount > 0 ? `${activeSupplyCount} in progress` : undefined,
                  onClick: () => navigate("/supplies?tab=order"),
                  prefetchPath: "/supplies",
                  accent: true,
                },
                {
                  icon: Send,
                  label: "Make a Request",
                  sub: openRequestCount > 0 ? `${openRequestCount} active` : "Move, deliver, set up & more",
                  onClick: () => navigate("/supplies?tab=request"),
                  prefetchPath: "/supplies",
                },
                {
                  icon: KeyRound,
                  label: "Request a Key",
                  sub: keysHeld > 0 ? `${keysHeld} key${keysHeld > 1 ? "s" : ""} held` : "New, replacement, spare, or temporary",
                  onClick: () => setKeyRequestOpen(true),
                },
              ]}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">My Requests</h2>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={() => navigate("/my-requests")}
                >
                  View all <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
              <DashboardActivityList
                supplyRequests={supplyRequests as any}
                issues={userIssues as any}
                taskRequests={myTaskRequests as any}
              />
            </div>
          </div>

          <div className="space-y-5">
            <DashboardProfileSummaryCard
              firstName={firstName}
              lastName={lastName}
              title={(profile as any)?.title || personnelInfo?.title}
              department={(profile as any)?.department || (personnelInfo as any)?.department}
              roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
              avatarUrl={profile?.avatar_url}
              role={personnelInfo?.role}
            />
            <DashboardMyRoomCard />
          </div>
        </div>
      </div>

      <KeyRequestDialog open={keyRequestOpen} onOpenChange={setKeyRequestOpen} />
    </PullToRefresh>
  );
}
```

- [ ] **Step 3: Delete the now-dead `ActionRow` function** (everything below
the component's closing brace: the `/* ── Action row component ── */` comment
and the whole `function ActionRow(...) {...}`).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0. If `CompactHeader`/`CompactActivitySection` imports remain
unused, remove them (tsc won't flag unused imports; grep the file to confirm
they're gone).

- [ ] **Step 5: Standard verification (desktop + mobile)**

- In the preview: `localStorage.setItem('preview_role', 'standard')`, go to
  `/dashboard`, viewport 1600×1000. Expect: two columns — actions row +
  activity list left, profile + My Room right; no `max-w-lg` phone column.
- Resize to 375×812. Expect: single column, rail below main, no horizontal
  scroll.
- My Room card: the admin test account has no room set → the RoomSelector
  prompt shows. Pick a room, confirm toast "Room updated" and card shows the
  room; then clear it back (Edit → Profile, or re-pick) to leave data as
  found. If the chosen room has open issues, they appear.
- Console: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/pages/UserDashboard.tsx
git commit -m "feat(dashboard): desktop two-column portal for standard users"
```

---

## Part B — Court Officer Command Dashboard

### Task 6: Command logic helpers (TDD) + fix UTC date in `getCurrentTermId`

**Files:**
- Create: `src/features/court/utils/commandLogic.ts`
- Create: `src/features/court/utils/commandLogic.test.ts`
- Modify: `src/features/court/utils/currentTerm.ts:11`

- [ ] **Step 1: Write the failing tests**

```ts
// src/features/court/utils/commandLogic.test.ts
import { describe, expect, it } from "vitest";
import { isOverdueAssignment, sitsOnDay, weekdayName } from "./commandLogic";

describe("isOverdueAssignment", () => {
  const now = new Date("2026-07-03T12:00:00");
  it("is overdue when unreturned and expected_return_at has passed", () => {
    expect(
      isOverdueAssignment({ returned_at: null, expected_return_at: "2026-07-01T09:00:00Z" }, now),
    ).toBe(true);
  });
  it("is not overdue when expected_return_at is in the future", () => {
    expect(
      isOverdueAssignment({ returned_at: null, expected_return_at: "2026-08-01T09:00:00Z" }, now),
    ).toBe(false);
  });
  it("is not overdue when there is no expected return date", () => {
    expect(isOverdueAssignment({ returned_at: null, expected_return_at: null }, now)).toBe(false);
  });
  it("is not overdue once returned, even past the expected date", () => {
    expect(
      isOverdueAssignment(
        { returned_at: "2026-07-02T10:00:00Z", expected_return_at: "2026-07-01T09:00:00Z" },
        now,
      ),
    ).toBe(false);
  });
});

describe("sitsOnDay", () => {
  it("a part with no schedule sits every court day", () => {
    expect(sitsOnDay(null, "Wednesday")).toBe(true);
    expect(sitsOnDay("", "Monday")).toBe(true);
  });
  it("a scheduled part sits only on its days", () => {
    expect(sitsOnDay("Tuesday,Thursday", "Thursday")).toBe(true);
    expect(sitsOnDay("Tuesday,Thursday", "Wednesday")).toBe(false);
  });
  it("nothing sits on weekends, schedule or not", () => {
    expect(sitsOnDay(null, "Saturday")).toBe(false);
    expect(sitsOnDay("Monday", "Sunday")).toBe(false);
  });
});

describe("weekdayName", () => {
  it("returns the long weekday name", () => {
    expect(weekdayName(new Date("2026-07-03T12:00:00"))).toBe("Friday");
    expect(weekdayName(new Date("2026-07-06T12:00:00"))).toBe("Monday");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/court/utils/commandLogic.test.ts`
Expected: FAIL — cannot resolve `./commandLogic`.

- [ ] **Step 3: Implement**

```ts
// src/features/court/utils/commandLogic.ts
/**
 * Pure helpers for the Court Officer command dashboard.
 */
import { parseSittingDays } from "./termPattern";

export interface OverdueCheckFields {
  returned_at: string | null;
  expected_return_at: string | null;
}

/** A key assignment is overdue when it is unreturned past its expected return. */
export function isOverdueAssignment(a: OverdueCheckFields, now: Date = new Date()): boolean {
  if (a.returned_at || !a.expected_return_at) return false;
  return new Date(a.expected_return_at).getTime() < now.getTime();
}

/** Long weekday name in local time, e.g. "Friday". */
export function weekdayName(d: Date = new Date()): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Whether a part sits on the given weekday. Parts without a calendar_day
 * schedule sit every court day; nothing sits on weekends.
 */
export function sitsOnDay(calendarDay: string | null | undefined, day: string): boolean {
  if (day === "Saturday" || day === "Sunday") return false;
  const days = parseSittingDays(calendarDay);
  return days.length === 0 || days.includes(day);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/court/utils/commandLogic.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Fix the UTC date bug in `getCurrentTermId`**

In `src/features/court/utils/currentTerm.ts`, replace line 11:

```ts
  const today = new Date().toISOString().slice(0, 10);
```

with:

```ts
  // Local calendar date — toISOString() is UTC and flips to tomorrow during
  // NY evenings, which would resolve the wrong term at term boundaries.
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
```

- [ ] **Step 6: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/court/utils/commandLogic.ts src/features/court/utils/commandLogic.test.ts src/features/court/utils/currentTerm.ts
git commit -m "feat(command): sitting-day + overdue-key logic; local-date fix in getCurrentTermId"
```

### Task 7: `useKeyAccountability` hook

**Files:**
- Create: `src/features/court/hooks/useKeyAccountability.ts`

- [ ] **Step 1: Create the hook**

```ts
/**
 * useKeyAccountability — every active (unreturned) key assignment, overdue
 * first. Read-only; feeds the command dashboard's key panel and alert bar.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isOverdueAssignment } from "@features/court/utils/commandLogic";

export interface ActiveKeyAssignment {
  id: string;
  keyName: string;
  recipient: string;
  assignedAt: string;
  expectedReturnAt: string | null;
  isSpare: boolean;
  isElevatorCard: boolean;
  overdue: boolean;
}

export function useKeyAccountability() {
  return useQuery({
    queryKey: ["command-key-accountability"],
    queryFn: async (): Promise<ActiveKeyAssignment[]> => {
      const { data, error } = await supabase
        .from("key_assignments")
        .select(
          "id, assigned_at, returned_at, expected_return_at, is_spare, is_elevator_card, recipient_name, keys:key_id(name)",
        )
        .is("returned_at", null)
        .order("assigned_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []).map((a: any): ActiveKeyAssignment => ({
        id: a.id,
        keyName: a.keys?.name || "Unnamed key",
        recipient: a.recipient_name || "—",
        assignedAt: a.assigned_at,
        expectedReturnAt: a.expected_return_at,
        isSpare: !!a.is_spare,
        isElevatorCard: !!a.is_elevator_card,
        overdue: isOverdueAssignment(a),
      }));

      // Overdue first; then soonest expected return; dateless issuances last.
      return rows.sort((x, y) => {
        if (x.overdue !== y.overdue) return x.overdue ? -1 : 1;
        if (x.expectedReturnAt && y.expectedReturnAt)
          return x.expectedReturnAt < y.expectedReturnAt ? -1 : 1;
        if (x.expectedReturnAt !== y.expectedReturnAt) return x.expectedReturnAt ? -1 : 1;
        return x.assignedAt < y.assignedAt ? 1 : -1;
      });
    },
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/court/hooks/useKeyAccountability.ts
git commit -m "feat(command): key accountability hook"
```

### Task 8: `useCourtroomPicture` hook

**Files:**
- Create: `src/features/court/hooks/useCourtroomPicture.ts`

Composes the courtroom panel's rows: active term's parts sitting today,
courtroom flags (inactive, bunting), and any active shutdowns.

- [ ] **Step 1: Create the hook**

```ts
/**
 * useCourtroomPicture — the command dashboard's "is the building ready to
 * hold court" panel data: today's sitting parts from the active term, with
 * courtroom flags (inactive, bunting) and active shutdowns.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentTermId } from "@features/court/utils/currentTerm";
import { sitsOnDay, weekdayName } from "@features/court/utils/commandLogic";
import { formatSittingDays } from "@features/court/utils/termPattern";

export interface CourtroomRow {
  assignmentId: string;
  part: string;
  justice: string;
  roomId: string; // rooms.id — use for issue lookups
  roomNumber: string;
  sittingDays: string; // "Tue/Thu" or "" (sits every day)
  hasBunting: boolean;
  isActive: boolean;
}

export interface ActiveShutdown {
  id: string;
  roomNumber: string;
  title: string | null;
  reason: string | null;
  status: string;
  endDate: string | null;
}

export interface CourtroomPicture {
  isWeekend: boolean;
  today: string; // long weekday name
  sittingToday: CourtroomRow[];
  notSittingToday: CourtroomRow[];
  shutdowns: ActiveShutdown[];
  hasTermData: boolean;
}

export function useCourtroomPicture() {
  return useQuery({
    queryKey: ["command-courtroom-picture"],
    queryFn: async (): Promise<CourtroomPicture> => {
      const today = weekdayName();
      const isWeekend = today === "Saturday" || today === "Sunday";

      const termId = await getCurrentTermId();

      // Courtroom flags, keyed by rooms.id (court_rooms.room_id).
      const { data: courtRooms, error: crErr } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, is_active, has_bunting, rooms:room_id(room_number)");
      if (crErr) throw crErr;
      const roomFlags = new Map(
        (courtRooms || []).map((cr: any) => [
          cr.room_id as string,
          {
            courtRoomId: cr.id as string,
            roomNumber: (cr.rooms?.room_number || cr.room_number || "—") as string,
            isActive: !!cr.is_active,
            hasBunting: !!cr.has_bunting,
          },
        ]),
      );
      const byCourtRoomId = new Map(
        (courtRooms || []).map((cr: any) => [
          cr.id as string,
          (cr.rooms?.room_number || cr.room_number || "—") as string,
        ]),
      );

      // Active term assignments.
      let sittingToday: CourtroomRow[] = [];
      let notSittingToday: CourtroomRow[] = [];
      if (termId) {
        const { data: assignments, error: aErr } = await supabase
          .from("court_assignments")
          .select("id, part, justice, room_id, calendar_day, sort_order")
          .eq("term_id", termId)
          .order("sort_order");
        if (aErr) throw aErr;

        // Pair each display row with its sitting-day test so the filter
        // doesn't have to re-find the raw record.
        const paired = (assignments || []).map((a: any) => ({
          sitsToday: sitsOnDay(a.calendar_day ?? null, today),
          row: {
            assignmentId: a.id,
            part: a.part || "—",
            justice: a.justice || "Vacant",
            roomId: a.room_id,
            roomNumber: roomFlags.get(a.room_id as string)?.roomNumber ?? "—",
            sittingDays: formatSittingDays(a.calendar_day),
            hasBunting: roomFlags.get(a.room_id as string)?.hasBunting ?? false,
            isActive: roomFlags.get(a.room_id as string)?.isActive ?? true,
          } satisfies CourtroomRow,
        }));
        sittingToday = paired.filter((p) => p.sitsToday).map((p) => p.row);
        notSittingToday = paired.filter((p) => !p.sitsToday).map((p) => p.row);
      }

      // Active shutdowns (courtroom-scoped table; silent when empty).
      const { data: shutdownRows, error: sErr } = await supabase
        .from("room_shutdowns")
        .select("id, court_room_id, title, reason, status, end_date")
        .in("status", ["scheduled", "in_progress", "delayed"]);
      if (sErr) throw sErr;
      const shutdowns = (shutdownRows || []).map((s: any): ActiveShutdown => ({
        id: s.id,
        roomNumber: byCourtRoomId.get(s.court_room_id as string) ?? "—",
        title: s.title,
        reason: s.reason,
        status: s.status,
        endDate: s.end_date,
      }));

      return { isWeekend, today, sittingToday, notSittingToday, shutdowns, hasTermData: !!termId };
    },
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/court/hooks/useCourtroomPicture.ts
git commit -m "feat(command): courtroom picture hook"
```

### Task 9: Presentational components (alert bar, stats, two panels)

**Files:**
- Create: `src/features/court/components/command/CommandAlertsBar.tsx`
- Create: `src/features/court/components/command/CommandStats.tsx`
- Create: `src/features/court/components/command/KeyAccountabilityPanel.tsx`
- Create: `src/features/court/components/command/CourtroomPicturePanel.tsx`

All four are presentational — they receive data from the page (single fetch
per hook, no duplicate queries).

- [ ] **Step 1: `CommandAlertsBar.tsx`**

```tsx
/**
 * CommandAlertsBar — renders only when something needs command attention:
 * overdue keys or courtrooms with urgent open issues. Zero alerts → null.
 */
import { AlertTriangle, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CommandAlertsBar({
  overdueKeys,
  urgentCourtroomIssues,
}: {
  overdueKeys: number;
  urgentCourtroomIssues: number;
}) {
  const navigate = useNavigate();
  if (overdueKeys === 0 && urgentCourtroomIssues === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="text-sm font-medium text-destructive">Needs attention:</span>
      {overdueKeys > 0 && (
        <button
          onClick={() => navigate("/keys")}
          className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors"
        >
          <KeyRound className="h-3 w-3" />
          {overdueKeys} overdue key{overdueKeys !== 1 ? "s" : ""}
        </button>
      )}
      {urgentCourtroomIssues > 0 && (
        <button
          onClick={() => navigate("/operations?tab=issues")}
          className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors"
        >
          <AlertTriangle className="h-3 w-3" />
          {urgentCourtroomIssues} urgent courtroom issue{urgentCourtroomIssues !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `CommandStats.tsx`**

```tsx
/**
 * CommandStats — four command-level numbers as a StatStrip. Each metric is
 * described; the whole strip is informational (click-throughs live on the
 * panels and alert bar).
 */
import { StatStrip } from "@/components/ui/StatStrip";

export function CommandStats({
  keysOut,
  overdueKeys,
  courtroomsSittingToday,
  courtroomsWithIssues,
  isWeekend,
}: {
  keysOut: number;
  overdueKeys: number;
  courtroomsSittingToday: number;
  courtroomsWithIssues: number;
  isWeekend: boolean;
}) {
  return (
    <StatStrip
      items={[
        { label: "keys out", value: keysOut, tone: keysOut > 0 ? "info" : "neutral" },
        {
          label: "overdue returns",
          value: overdueKeys,
          tone: overdueKeys > 0 ? "critical" : "operational",
        },
        {
          label: isWeekend ? "parts sitting (weekend)" : "parts sitting today",
          value: courtroomsSittingToday,
          tone: "neutral",
        },
        {
          label: "courtrooms with issues",
          value: courtroomsWithIssues,
          tone: courtroomsWithIssues > 0 ? "warning" : "operational",
        },
      ]}
    />
  );
}
```

- [ ] **Step 3: `KeyAccountabilityPanel.tsx`**

```tsx
/**
 * KeyAccountabilityPanel — every key currently out, who has it, and when
 * it's expected back. Overdue rows first (destructive highlight).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { ActiveKeyAssignment } from "@features/court/hooks/useKeyAccountability";

export function KeyAccountabilityPanel({
  assignments,
  isLoading,
  error,
}: {
  assignments: ActiveKeyAssignment[];
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" />
          Key Accountability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : error ? (
          <p className="py-4 text-sm text-muted-foreground">
            Couldn't load key assignments — try refreshing.
          </p>
        ) : assignments.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">All keys returned.</p>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                a.overdue ? "border-destructive/40 bg-destructive/5" : "border-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.keyName}
                  {a.isSpare && (
                    <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">spare</Badge>
                  )}
                  {a.isElevatorCard && (
                    <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">elevator</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {a.recipient} · out since {format(new Date(a.assignedAt), "MMM d")}
                </p>
              </div>
              {a.overdue ? (
                <Badge variant="destructive" className="text-[10px] shrink-0">
                  overdue {a.expectedReturnAt ? format(new Date(a.expectedReturnAt), "MMM d") : ""}
                </Badge>
              ) : a.expectedReturnAt ? (
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  due {format(new Date(a.expectedReturnAt), "MMM d")}
                </span>
              ) : null}
            </div>
          ))
        )}
        <Button asChild variant="ghost" size="sm" className="w-full mt-1 text-xs">
          <Link to="/keys">
            Key Management <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: `CourtroomPicturePanel.tsx`**

```tsx
/**
 * CourtroomPicturePanel — today's court operations at a glance: active
 * shutdowns first, then the parts sitting today with issue badges and
 * bunting flags. Weekend → "no parts sit today" note.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, ChevronRight, Flag, AlertTriangle, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import type { CourtroomPicture } from "@features/court/hooks/useCourtroomPicture";

export function CourtroomPicturePanel({
  picture,
  isLoading,
  error,
  getIssueCount,
  hasUrgent,
}: {
  picture: CourtroomPicture | undefined;
  isLoading: boolean;
  error: unknown;
  /** rooms.id → open issue count (from useCourtIssuesIntegration). */
  getIssueCount: (roomId: string) => number;
  hasUrgent: (roomId: string) => boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4 text-primary" />
          Courtroom Picture
          {picture && !picture.isWeekend && (
            <span className="text-xs font-normal text-muted-foreground">· {picture.today}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : error ? (
          <p className="py-4 text-sm text-muted-foreground">
            Couldn't load courtroom data — try refreshing.
          </p>
        ) : !picture?.hasTermData ? (
          <p className="py-4 text-sm text-muted-foreground">
            No term sheet data.{" "}
            <Link to="/term-sheet" className="underline">Open the Term Sheet</Link>
          </p>
        ) : (
          <>
            {picture.shutdowns.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2"
              >
                <Construction className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Room {s.roomNumber} — {s.title || s.reason || "shutdown"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.status.replace("_", " ")}
                    {s.endDate ? ` · until ${s.endDate}` : ""}
                  </p>
                </div>
              </div>
            ))}
            {picture.isWeekend ? (
              <p className="py-4 text-sm text-muted-foreground">
                No parts sit today — next court day is Monday.
              </p>
            ) : picture.sittingToday.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No parts are scheduled to sit today.
              </p>
            ) : (
              picture.sittingToday.map((r) => {
                const issues = getIssueCount(r.roomId);
                return (
                  <div
                    key={r.assignmentId}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                      !r.isActive
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border"
                    }`}
                  >
                    <span className="w-16 shrink-0 text-sm font-bold text-primary whitespace-pre-line">
                      {r.part}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.justice}</p>
                      <p className="text-xs text-muted-foreground">
                        Rm {r.roomNumber}
                        {r.sittingDays && ` · ${r.sittingDays}`}
                      </p>
                    </div>
                    {r.hasBunting && (
                      <Flag className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Bunting up" />
                    )}
                    {!r.isActive && (
                      <Badge variant="destructive" className="text-[10px] shrink-0">inactive</Badge>
                    )}
                    {issues > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 gap-0.5 ${
                          hasUrgent(r.roomId) ? "border-destructive text-destructive" : "border-orange-400 text-orange-500"
                        }`}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {issues}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
        <Button asChild variant="ghost" size="sm" className="w-full mt-1 text-xs">
          <Link to="/courtrooms">
            Courtroom Directory <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/court/components/command/
git commit -m "feat(command): alert bar, stats, key + courtroom panels"
```

### Task 10: Page shell `CourtOfficerCommandCenter`

**Files:**
- Create: `src/features/court/pages/CourtOfficerCommandCenter.tsx`

- [ ] **Step 1: Create the page**

```tsx
/**
 * Court Officer Command Center
 *
 * Command-level landing page for captains: key accountability on the left,
 * courtroom operational picture on the right. Read-only; the working tools
 * (Keys, Courtrooms, Reports, Term Sheet) are one click away.
 */
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNotifications } from "@shared/hooks/useNotifications";
import { NotificationDropdown } from "@shared/components/user/NotificationDropdown";
import { useCourtIssuesIntegration } from "@features/court/hooks/useCourtIssuesIntegration";
import { useKeyAccountability } from "@features/court/hooks/useKeyAccountability";
import { useCourtroomPicture } from "@features/court/hooks/useCourtroomPicture";
import { CommandAlertsBar } from "@features/court/components/command/CommandAlertsBar";
import { CommandStats } from "@features/court/components/command/CommandStats";
import { KeyAccountabilityPanel } from "@features/court/components/command/KeyAccountabilityPanel";
import { CourtroomPicturePanel } from "@features/court/components/command/CourtroomPicturePanel";

export default function CourtOfficerCommandCenter() {
  const { user } = useAuth();
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications(user?.id);

  const keys = useKeyAccountability();
  const courtrooms = useCourtroomPicture();
  const { getIssuesForRoom, hasUrgentIssues } = useCourtIssuesIntegration();

  const assignments = keys.data ?? [];
  const overdueKeys = assignments.filter((a) => a.overdue).length;
  const picture = courtrooms.data;

  // Stat: rooms sitting today that have open issues. Alert: urgent issues in
  // ANY courtroom on the term (a fire in a room that sits tomorrow still
  // needs command attention today).
  const allRooms = [...(picture?.sittingToday ?? []), ...(picture?.notSittingToday ?? [])];
  const roomsWithIssues = (picture?.sittingToday ?? []).filter(
    (r) => getIssuesForRoom(r.roomId).length > 0,
  );
  const urgentCourtroomIssues = allRooms.filter((r) => hasUrgentIssues(r.roomId)).length;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 pb-6 px-3 sm:px-0">
      {/* Header — Work Center pattern (operational surface, no first-name greeting) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-primary">Court officer command</p>
          <h1 className="text-[length:var(--text-page-title)] font-semibold tracking-[-0.025em]">
            Command center
          </h1>
          <p className="mt-1 text-sm text-text-secondary tabular">
            {today} · Keys and courtroom readiness at a glance
          </p>
        </div>
        <NotificationDropdown
          notifications={notifications as any}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearNotification={clearNotification}
          onClearAllNotifications={clearAllNotifications}
        />
      </div>

      <CommandAlertsBar overdueKeys={overdueKeys} urgentCourtroomIssues={urgentCourtroomIssues} />

      <CommandStats
        keysOut={assignments.length}
        overdueKeys={overdueKeys}
        courtroomsSittingToday={picture?.sittingToday.length ?? 0}
        courtroomsWithIssues={roomsWithIssues.length}
        isWeekend={picture?.isWeekend ?? false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        <KeyAccountabilityPanel
          assignments={assignments}
          isLoading={keys.isLoading}
          error={keys.error}
        />
        <CourtroomPicturePanel
          picture={picture}
          isLoading={courtrooms.isLoading}
          error={courtrooms.error}
          getIssueCount={(roomId) => getIssuesForRoom(roomId).length}
          hasUrgent={hasUrgentIssues}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

```bash
git add src/features/court/pages/CourtOfficerCommandCenter.tsx
git commit -m "feat(command): court officer command center page"
```

### Task 11: Routing + navigation wiring

**Files:**
- Modify: `src/App.tsx` (lazy import near line 45; redirect at line 120; new route near the `/work-center` route at line 293)
- Modify: `src/routes/roleBasedRouting.ts:32-35`
- Modify: `src/components/layout/utils/navigationPaths.ts` (BASE_PATH_MAP + role branch at line 46 + description map)
- Modify: `src/components/layout/config/navigation.tsx:140-149` (court_officer nav list; check the second court_officer block at line 256 and the `noDashboardRoles` list at line 304)

- [ ] **Step 1: App.tsx — lazy import** (next to `CourtAideWorkCenter`, line 45):

```tsx
const CourtOfficerCommandCenter = lazy(() => import("@features/court/pages/CourtOfficerCommandCenter"));
```

- [ ] **Step 2: App.tsx — update the legacy redirect** (line 120):

```tsx
          <Route path="/court-officer-dashboard" element={<Navigate to="/command-center" replace />} />
```

- [ ] **Step 3: App.tsx — add the route** (immediately after the `/work-center` route block, line 293-297):

```tsx
          <Route path="/command-center" element={
            <ProtectedRoute>
              <CourtOfficerCommandCenter />
            </ProtectedRoute>
          } />
```

- [ ] **Step 4: roleBasedRouting.ts** — replace lines 32-35:

```ts
  court_officer: {
    path: '/command-center',
    name: 'Command Center',
  },
```

- [ ] **Step 5: navigationPaths.ts** — three edits:

In `BASE_PATH_MAP`, after the `'Work Center': '/work-center',` line add:

```ts
  'Command Center': '/command-center',
```

At line 46, change:

```ts
    if (userRole === 'court_officer') return '/keys';
```

to:

```ts
    if (userRole === 'court_officer') return '/command-center';
```

In `getNavigationDescription`'s `descriptionMap`, after `'Work Center'`
(add the key if `Work Center` is absent — insert alphabetically is fine):

```ts
    'Command Center': 'Keys & courtroom readiness',
```

- [ ] **Step 6: navigation.tsx** — in the court_officer block (lines 140-149),
add Command Center first:

```tsx
  if (userRole === 'court_officer') {
    return [
      { title: 'Command Center', icon: LayoutDashboard },
      { title: 'Keys', icon: KeyRound },
      { title: 'Reports', icon: AlertTriangle },
      { title: 'Courtrooms', icon: Gavel },
      { title: 'Term Sheet', icon: FileText },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }
```

Check `LayoutDashboard` is already imported in this file (it is — used by the
court_aide block); if not, add it to the lucide-react import. Then inspect the
second `court_officer` branch near line 256 (mobile/bottom nav variant) and add
`{ title: 'Command Center', icon: LayoutDashboard }` as its first entry the
same way. Finally, at line 304 remove `'court_officer'` from
`noDashboardRoles` (the role now has a dashboard).

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/routes/roleBasedRouting.ts src/components/layout/utils/navigationPaths.ts src/components/layout/config/navigation.tsx
git commit -m "feat(command): route /command-center as court officer landing page"
```

### Task 12: Live verification + graph rebuild

**Files:** none (verification only)

- [ ] **Step 1: Verify as court officer.** In the preview:
`localStorage.setItem('preview_role', 'court_officer')`, navigate to `/`,
viewport 1600×1000. Expected:
- Redirected/landing resolves to `/command-center`.
- Sidebar shows Command Center (active) above Keys/Reports/Courtrooms/Term Sheet.
- Stat strip shows live numbers (3 keys out at time of planning).
- Key panel lists the active assignments; courtroom panel lists today's
  sitting parts for the active term (cross-check a couple of rows against
  `/term-sheet` sitting-day labels), bunting flag on flagged rooms.
- No console errors.

- [ ] **Step 2: Overdue path.** Via Supabase SQL (test data, revert after):
set `expected_return_at = now() - interval '2 days'` on ONE active
`key_assignments` row, note its id and previous value first
(`SELECT id, expected_return_at FROM key_assignments WHERE returned_at IS NULL LIMIT 1;`).
Reload `/command-center`: the alert bar appears with "1 overdue key", the row
sorts first with the destructive highlight, and "overdue returns" stat shows
1/critical dot. Then restore the previous value.

- [ ] **Step 3: Weekend + empty states** (spot check): temporarily eval in
the page console `new Date().getDay()` — if it's a weekday (expected), skip
live weekend testing; the logic is covered by the `sitsOnDay` vitest cases.

- [ ] **Step 4: Mobile.** Resize to 375×812 — panels stack, no horizontal
scroll, bottom nav still works.

- [ ] **Step 5: Full test suite + graph.**

Run: `npx vitest run src/features/court/utils/commandLogic.test.ts` → PASS.
Run: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.
Run: `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` → graph.json updated.

- [ ] **Step 6: Commit any stragglers**

```bash
git status --short   # expect clean or only graphify-out changes
git add -A && git commit -m "chore: rebuild code graph after dashboard work" || true
```
