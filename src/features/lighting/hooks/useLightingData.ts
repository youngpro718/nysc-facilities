import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_CONFIG } from '@/config';
import {
  getFixturesForSpace,
  getFixturesForFloor,
  getFixturesByStatus,
  getOpenLightingIssues,
  getWalkthroughHistory,
  getWalkthroughSession,
  startWalkthrough,
  recordFixtureScan,
  completeWalkthrough,
  updateFixtureStatus,
  createFixture,
  type LightStatus,
  type StartWalkthroughPayload,
  type RecordFixtureScanPayload,
  type UpdateFixtureStatusPayload,
  type CreateFixturePayload,
} from '../services/lightingService';

// ============================================================================
// Query Keys
// ============================================================================

export const lightingKeys = {
  all: ['lighting'] as const,
  fixtures: () => [...lightingKeys.all, 'fixtures'] as const,
  fixturesBySpace: (spaceId: string, spaceType: 'room' | 'hallway') =>
    [...lightingKeys.fixtures(), 'space', spaceId, spaceType] as const,
  fixturesByFloor: (floorId: string) =>
    [...lightingKeys.fixtures(), 'floor', floorId] as const,
  fixturesByStatus: (buildingId?: string, status?: LightStatus) =>
    [...lightingKeys.fixtures(), 'status', buildingId, status] as const,
  lightingQueue: (buildingId?: string) =>
    [...lightingKeys.all, 'queue', buildingId] as const,
  walkthroughs: () => [...lightingKeys.all, 'walkthroughs'] as const,
  walkthroughHistory: (hallwayId: string) =>
    [...lightingKeys.walkthroughs(), 'history', hallwayId] as const,
  walkthroughSession: (sessionId: string) =>
    [...lightingKeys.walkthroughs(), 'session', sessionId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get fixtures for a specific space (room or hallway)
 * Used in room/hallway detail panels
 */
export function useSpaceFixtures(spaceId: string, spaceType: 'room' | 'hallway') {
  return useQuery({
    queryKey: lightingKeys.fixturesBySpace(spaceId, spaceType),
    queryFn: () => getFixturesForSpace(spaceId, spaceType),
    staleTime: QUERY_CONFIG.stale.medium, // 5 min - fixture catalog changes slowly
    enabled: !!spaceId,
  });
}

/**
 * Get all fixtures for a floor (for walkthrough setup)
 */
export function useFloorFixtures(floorId: string) {
  return useQuery({
    queryKey: lightingKeys.fixturesByFloor(floorId),
    queryFn: () => getFixturesForFloor(floorId),
    staleTime: QUERY_CONFIG.stale.medium,
    enabled: !!floorId,
  });
}

/**
 * Get fixtures filtered by status
 */
export function useFixturesByStatus(buildingId?: string, status?: LightStatus) {
  return useQuery({
    queryKey: lightingKeys.fixturesByStatus(buildingId, status),
    queryFn: () => getFixturesByStatus(buildingId, status),
    staleTime: QUERY_CONFIG.stale.short, // 1 min - operational view
  });
}

/**
 * Get open lighting issues queue (for Operations Lighting tab)
 */
export function useLightingQueue(buildingId?: string) {
  return useQuery({
    queryKey: lightingKeys.lightingQueue(buildingId),
    queryFn: () => getOpenLightingIssues(buildingId),
    staleTime: QUERY_CONFIG.stale.short, // 1 min - operational queue refreshes often
  });
}

/**
 * Get walkthrough history for a hallway
 */
export function useWalkthroughHistory(hallwayId: string, limit = 10) {
  return useQuery({
    queryKey: lightingKeys.walkthroughHistory(hallwayId),
    queryFn: () => getWalkthroughHistory(hallwayId, limit),
    staleTime: QUERY_CONFIG.stale.medium,
    enabled: !!hallwayId,
  });
}

/**
 * Get active walkthrough session (live during walkthrough)
 */
export function useWalkthroughSession(sessionId: string) {
  return useQuery({
    queryKey: lightingKeys.walkthroughSession(sessionId),
    queryFn: () => getWalkthroughSession(sessionId),
    staleTime: 0, // Always fresh while session is active
    enabled: !!sessionId,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Start a new walkthrough session
 */
export function useStartWalkthrough() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartWalkthroughPayload) => startWalkthrough(payload),
    onSuccess: (data) => {
      // Invalidate walkthrough queries
      queryClient.invalidateQueries({ queryKey: lightingKeys.walkthroughs() });
      if (data.hallway_id) {
        queryClient.invalidateQueries({
          queryKey: lightingKeys.walkthroughHistory(data.hallway_id),
        });
      }
    },
  });
}

/**
 * Record a fixture scan during walkthrough
 */
export function useRecordFixtureScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecordFixtureScanPayload) => recordFixtureScan(payload),
    onSuccess: (_, variables) => {
      // Invalidate the active session to show updated counters
      queryClient.invalidateQueries({
        queryKey: lightingKeys.walkthroughSession(variables.walkthrough_id),
      });
      // Invalidate fixture queries to show updated status
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixtures() });
      // Invalidate lighting queue
      queryClient.invalidateQueries({ queryKey: lightingKeys.lightingQueue() });
    },
  });
}

/**
 * Complete a walkthrough session
 */
export function useCompleteWalkthrough() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walkthroughId: string) => completeWalkthrough(walkthroughId),
    onSuccess: (data) => {
      // Invalidate all walkthrough queries
      queryClient.invalidateQueries({ queryKey: lightingKeys.walkthroughs() });
      if (data.hallway_id) {
        queryClient.invalidateQueries({
          queryKey: lightingKeys.walkthroughHistory(data.hallway_id),
        });
      }
      // Invalidate lighting queue to reflect any new issues
      queryClient.invalidateQueries({ queryKey: lightingKeys.lightingQueue() });
    },
  });
}

/**
 * Update fixture status (admin/facilities_manager)
 */
export function useUpdateFixtureStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fixtureId, payload }: { fixtureId: string; payload: UpdateFixtureStatusPayload }) =>
      updateFixtureStatus(fixtureId, payload),
    onSuccess: () => {
      // Invalidate all fixture queries
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixtures() });
      queryClient.invalidateQueries({ queryKey: lightingKeys.lightingQueue() });
    },
  });
}

/**
 * Create a new fixture
 */
export function useCreateFixture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFixturePayload) => createFixture(payload),
    onSuccess: (data) => {
      // Invalidate fixture queries for the space
      if (data.space_id && data.space_type) {
        queryClient.invalidateQueries({
          queryKey: lightingKeys.fixturesBySpace(data.space_id, data.space_type as 'room' | 'hallway'),
        });
      }
      if (data.floor_id) {
        queryClient.invalidateQueries({
          queryKey: lightingKeys.fixturesByFloor(data.floor_id),
        });
      }
      // Invalidate all fixture queries
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixtures() });
    },
  });
}
