/**
 * useFloorPlan Hook
 * Simplified, reliable hook for floor plan data management
 * Replaces the complex useFloorPlanData with a cleaner implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import { toast } from 'sonner';
import {
  fetchFloors,
  fetchFloorSpaces,
  updateSpacePosition,
  updateSpaceSize,
  batchUpdatePositions,
  FloorPlanSpace,
  FloorInfo,
} from '../services/floorPlanService';

// Query keys for cache management
export const FLOOR_PLAN_KEYS = {
  floors: ['floorplan', 'floors'] as const,
  spaces: (floorId: string) => ['floorplan', 'spaces', floorId] as const,
};

// Node colors by type
const NODE_COLORS = {
  room: {
    background: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
    selected: 'hsl(var(--primary))',
  },
  hallway: {
    background: 'hsl(var(--muted))',
    border: 'hsl(var(--muted-foreground))',
    selected: 'hsl(var(--primary))',
  },
  door: {
    background: 'hsl(var(--secondary))',
    border: 'hsl(var(--secondary-foreground))',
    selected: 'hsl(var(--primary))',
  },
};

/**
 * Transform FloorPlanSpace to ReactFlow Node
 */
function spaceToNode(space: FloorPlanSpace): Node {
  const colors = NODE_COLORS[space.type] || NODE_COLORS.room;
  
  return {
    id: space.id,
    type: space.type,
    position: space.position,
    draggable: true,
    selectable: true,
    data: {
      label: space.name,
      type: space.type,
      size: space.size,
      rotation: space.rotation,
      style: {
        backgroundColor: colors.background,
        borderColor: colors.border,
      },
      properties: {
        ...space.properties,
        room_number: space.room_number,
        room_type: space.room_type,
        status: space.status,
      },
    },
  };
}

/**
 * Hook to fetch available floors
 */
export function useFloors() {
  return useQuery({
    queryKey: FLOOR_PLAN_KEYS.floors,
    queryFn: fetchFloors,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Main floor plan hook
 */
export function useFloorPlan(floorId: string | null) {
  const queryClient = useQueryClient();

  // Fetch spaces for the selected floor
  const {
    data: spaces,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: floorId ? FLOOR_PLAN_KEYS.spaces(floorId) : ['floorplan', 'spaces', 'none'],
    queryFn: () => (floorId ? fetchFloorSpaces(floorId) : Promise.resolve([])),
    enabled: !!floorId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Transform spaces to ReactFlow nodes
  const nodes = useMemo<Node[]>(() => {
    if (!spaces) return [];
    return spaces.map(spaceToNode);
  }, [spaces]);

  // For now, edges are empty (connections can be added later)
  const edges = useMemo<Edge[]>(() => [], []);

  // Mutation for updating position
  const positionMutation = useMutation({
    mutationFn: async ({
      spaceId,
      spaceType,
      position,
    }: {
      spaceId: string;
      spaceType: 'room' | 'hallway' | 'door';
      position: { x: number; y: number };
    }) => {
      await updateSpacePosition(spaceId, spaceType, position);
    },
    onError: (error) => {
      console.error('[useFloorPlan] Position update failed:', error);
      toast.error('Failed to save position');
    },
  });

  // Mutation for updating size
  const sizeMutation = useMutation({
    mutationFn: async ({
      spaceId,
      spaceType,
      size,
    }: {
      spaceId: string;
      spaceType: 'room' | 'hallway' | 'door';
      size: { width: number; height: number };
    }) => {
      await updateSpaceSize(spaceId, spaceType, size);
    },
    onError: (error) => {
      console.error('[useFloorPlan] Size update failed:', error);
      toast.error('Failed to save size');
    },
  });

  // Mutation for batch position updates
  const batchPositionMutation = useMutation({
    mutationFn: batchUpdatePositions,
    onSuccess: () => {
      if (floorId) {
        queryClient.invalidateQueries({ queryKey: FLOOR_PLAN_KEYS.spaces(floorId) });
      }
      toast.success('Layout saved');
    },
    onError: (error) => {
      console.error('[useFloorPlan] Batch update failed:', error);
      toast.error('Failed to save layout');
    },
  });

  // Handler for node position change (debounced save)
  const handlePositionChange = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const space = spaces?.find((s) => s.id === nodeId);
      if (space) {
        positionMutation.mutate({
          spaceId: nodeId,
          spaceType: space.type,
          position,
        });
      }
    },
    [spaces, positionMutation]
  );

  // Handler for node size change
  const handleSizeChange = useCallback(
    (nodeId: string, size: { width: number; height: number }) => {
      const space = spaces?.find((s) => s.id === nodeId);
      if (space) {
        sizeMutation.mutate({
          spaceId: nodeId,
          spaceType: space.type,
          size,
        });
      }
    },
    [spaces, sizeMutation]
  );

  // Save all current positions (for "Save Layout" button)
  const saveAllPositions = useCallback(
    (currentNodes: Node[]) => {
      if (!spaces) return;

      const updates = currentNodes
        .map((node) => {
          const space = spaces.find((s) => s.id === node.id);
          if (!space) return null;
          return {
            id: node.id,
            type: space.type,
            position: node.position,
          };
        })
        .filter((u): u is NonNullable<typeof u> => u !== null);

      if (updates.length > 0) {
        batchPositionMutation.mutate(updates);
      }
    },
    [spaces, batchPositionMutation]
  );

  return {
    // Data
    nodes,
    edges,
    spaces: spaces || [],
    
    // Loading states
    isLoading,
    isSaving: positionMutation.isPending || sizeMutation.isPending || batchPositionMutation.isPending,
    error,
    
    // Actions
    refetch,
    handlePositionChange,
    handleSizeChange,
    saveAllPositions,
  };
}

export type { FloorPlanSpace, FloorInfo };
