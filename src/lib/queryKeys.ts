/**
 * Centralized TanStack Query key registry.
 *
 * Rules:
 * - All keys are readonly tuples so TypeScript catches typos.
 * - Parameterized keys are functions; static keys are arrays.
 * - Never use raw string literals for query keys — always import from here.
 *
 * Existing domain-specific registries (do not duplicate here):
 *   - inventoryQueryKeys   → src/features/inventory/...
 *   - ANALYTICS_QUERY_KEYS → src/features/...
 *   - OPTIMIZED_QUERY_KEYS → src/features/spaces/...
 */

export const QUERY_KEYS = {
  // ── Reference data (slowly changing, long staleTime) ──────────────────────
  buildings:           () => ['buildings']           as const,
  floors:              (buildingId?: string) =>
                         buildingId ? ['floors', buildingId] as const
                                    : ['floors']     as const,
  inventoryCategories: () => ['inventory-categories'] as const,
  courtRoomsList:      () => ['court-rooms-list']    as const,
  storageRooms:        () => ['storage-rooms']       as const,
  departments:         () => ['departments']         as const,

  // ── Issues ─────────────────────────────────────────────────────────────────
  allIssues:           () => ['allIssues']           as const,
  adminIssues:         () => ['adminIssues']         as const,
  userIssueDetail:     (issueId: string) => ['user-issue-detail', issueId] as const,

  // ── Keys & passes ──────────────────────────────────────────────────────────
  userKeyAssignments:  (userId: string) => ['user-key-assignments', userId] as const,

  // ── Court operations ───────────────────────────────────────────────────────
  courtSessions:       (date: string, period: string, buildingCode: string) =>
                         ['court-sessions', date, period, buildingCode] as const,
  courtPersonnel:      () => ['court-personnel']     as const,
  staffAbsences:       () => ['staff-absences']      as const,

  // ── Spaces ─────────────────────────────────────────────────────────────────
  rooms:               (floorId?: string) =>
                         floorId ? ['rooms', floorId] as const
                                 : ['rooms']          as const,
} as const;
