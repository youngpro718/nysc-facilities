
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { processFloorPlanObjects } from "../utils/floorPlanTransformers";
import { fetchFloorPlanLayers, fetchFloorPlanObjects, HallwayRoomConnection } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, RawFloorPlanObject, Position, Size } from "../types/floorPlanTypes";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

/** Position config for hallway-centric layout */
const POSITION_OFFSETS: Record<string, number> = {
  start: 0.2,
  middle: 0.5,
  end: 0.8,
};

const SIDE_OFFSET = 200; // pixels offset from hallway center for left/right rooms
const SEQUENCE_SPACING = 180; // pixels between rooms in the same segment

/**
 * Given hallway-room connections and a map of all objects,
 * compute positions for rooms along the hallway spine.
 * Returns a map of objectId -> computed Position.
 */
function computeHallwayCentricLayout(
  connections: HallwayRoomConnection[],
  objectMap: Map<string, RawFloorPlanObject>
): Map<string, Position> {
  const positionOverrides = new Map<string, Position>();

  // Group connections by hallway
  const byHallway = new Map<string, HallwayRoomConnection[]>();
  for (const conn of connections) {
    const list = byHallway.get(conn.hallway_id) || [];
    list.push(conn);
    byHallway.set(conn.hallway_id, list);
  }

  for (const [hallwayId, conns] of byHallway) {
    const hallway = objectMap.get(hallwayId);
    if (!hallway) continue;

    // Determine hallway center and dimensions
    const hPos = parsePosition(hallway.position) || { x: 400, y: 300 };
    const hSize = parseSize(hallway.size) || { width: 300, height: 50 };

    // Determine orientation: wider = horizontal spine, taller = vertical spine
    const isHorizontal = hSize.width >= hSize.height;
    const spineLength = isHorizontal ? hSize.width : hSize.height;

    // Place hallway itself at a good center position if unpositioned
    if (hPos.x === 0 && hPos.y === 0) {
      const centeredPos = { x: 500, y: 400 };
      positionOverrides.set(hallwayId, centeredPos);
      hPos.x = centeredPos.x;
      hPos.y = centeredPos.y;
    }

    // Group connections by position segment for sequence spacing
    const segmentCounts: Record<string, { left: number; right: number }> = {
      start: { left: 0, right: 0 },
      middle: { left: 0, right: 0 },
      end: { left: 0, right: 0 },
    };

    // Sort by sequence_order within each segment
    const sorted = [...conns].sort((a, b) => a.sequence_order - b.sequence_order);

    for (const conn of sorted) {
      const posKey = conn.position || 'middle';
      const sideKey = conn.side || 'left';
      const segment = segmentCounts[posKey] || segmentCounts.middle;
      const seqIndex = segment[sideKey];
      segment[sideKey]++;

      const ratio = POSITION_OFFSETS[posKey] || 0.5;
      const sideSign = sideKey === 'left' ? -1 : 1;

      let roomX: number, roomY: number;

      if (isHorizontal) {
        // Rooms branch above/below a horizontal hallway
        roomX = hPos.x + (ratio - 0.5) * spineLength + seqIndex * SEQUENCE_SPACING;
        roomY = hPos.y + sideSign * SIDE_OFFSET;
      } else {
        // Rooms branch left/right of a vertical hallway
        roomX = hPos.x + sideSign * SIDE_OFFSET;
        roomY = hPos.y + (ratio - 0.5) * spineLength + seqIndex * SEQUENCE_SPACING;
      }

      positionOverrides.set(conn.room_id, { x: roomX, y: roomY });
    }
  }

  return positionOverrides;
}

/**
 * Generate edge objects from hallway-room connections for visual rendering.
 */
function generateConnectionEdges(connections: HallwayRoomConnection[]) {
  return connections.map(conn => ({
    id: `hallway-conn-${conn.id}`,
    source: conn.hallway_id,
    target: conn.room_id,
    data: {
      type: 'hallway_adjacent',
      direction: conn.side,
      position: conn.position,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDasharray: '',
      },
    },
    type: 'straight',
    animated: true,
  }));
}

function parsePosition(pos: unknown): Position | null {
  if (!pos) return null;
  if (typeof pos === 'string') {
    try {
      const p = JSON.parse(pos);
      if (p && typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch { return null; }
  }
  if (typeof pos === 'object' && pos !== null && 'x' in pos && 'y' in pos) {
    const p = pos as any;
    if (typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y };
  }
  return null;
}

function parseSize(size: unknown): Size | null {
  if (!size) return null;
  if (typeof size === 'string') {
    try {
      const s = JSON.parse(size);
      if (s && typeof s.width === 'number' && typeof s.height === 'number') return s;
    } catch { return null; }
  }
  if (typeof size === 'object' && size !== null && 'width' in size && 'height' in size) {
    const s = size as any;
    if (typeof s.width === 'number' && typeof s.height === 'number') return { width: s.width, height: s.height };
  }
  return null;
}

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const data = await fetchFloorPlanLayers(floorId);
      return Array.isArray(data) ? data.map(layer => transformLayer(layer as FloorPlanLayerDB)) : [];
    },
    enabled: !!floorId
  });

  // Query for floor plan objects and connections
  const { data: spaceData, isLoading: isLoadingObjects, error } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], connections: [] };
      logger.debug('Fetching floor plan objects for floor:', floorId);
      return fetchFloorPlanObjects(floorId);
    },
    enabled: !!floorId
  });

  // Query for lighting fixtures data
  const { data: lightingData, isLoading: isLoadingLighting } = useQuery({
    queryKey: ['floorplan-lighting', floorId],
    queryFn: async () => {
      if (!floorId) return {};
      
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, space_id, status, position, name, type, floor_id')
        .eq('floor_id', floorId)
        .order('space_id');
        
      if (error) throw error;
      
      const fixturesBySpace: Record<string, unknown[]> = {};
      
      if (data && Array.isArray(data)) {
        data.forEach(fixture => {
          if (!fixture || !fixture.space_id) return;
          if (!fixturesBySpace[fixture.space_id]) {
            fixturesBySpace[fixture.space_id] = [];
          }
          fixturesBySpace[fixture.space_id].push(fixture);
        });
      }
      
      return fixturesBySpace;
    },
    enabled: !!floorId
  });

  // Ensure spaceData is properly structured
  const safeSpaceData = spaceData || { objects: [], connections: [] };
  const hallwayConnections = (safeSpaceData.connections || []) as HallwayRoomConnection[];

  // Build object map for hallway-centric layout
  const rawObjects = Array.isArray(safeSpaceData.objects) ? safeSpaceData.objects : [];
  const objectMap = new Map<string, RawFloorPlanObject>();
  rawObjects.forEach((obj: any) => {
    if (obj.id) objectMap.set(obj.id, obj);
  });

  // Compute hallway-centric positions
  const hallwayPositionOverrides = computeHallwayCentricLayout(hallwayConnections, objectMap);

  // Set of room IDs that have hallway connections
  const connectedRoomIds = new Set(hallwayConnections.map(c => c.room_id));
  const connectedHallwayIds = new Set(hallwayConnections.map(c => c.hallway_id));

  // Assign positions to objects
  let unpositionedIndex = 0;
  const objectsWithPositions = rawObjects.map((rawObj: any, index: number) => {
    const defaultSize: Size = { width: 150, height: 100 };

    // Check if hallway-centric layout gave us a position
    const hallwayOverride = hallwayPositionOverrides.get(rawObj.id);

    // Parse stored position
    let parsedPosition: Position | null = parsePosition(rawObj.position);
    
    // Treat {0,0} as unpositioned
    if (parsedPosition && parsedPosition.x === 0 && parsedPosition.y === 0) {
      parsedPosition = null;
    }

    // Priority: hallway override > stored position > grid fallback
    let finalPosition: Position;
    if (hallwayOverride) {
      finalPosition = hallwayOverride;
    } else if (parsedPosition) {
      finalPosition = parsedPosition;
    } else {
      // Grid fallback for unconnected/unpositioned objects
      finalPosition = {
        x: (unpositionedIndex % 4) * 250 + 100,
        y: Math.floor(unpositionedIndex / 4) * 250 + 100
      };
      unpositionedIndex++;
    }

    // Parse size
    let parsedSize = parseSize(rawObj.size) || defaultSize;
    
    // Determine the object type
    const objectType = rawObj.object_type || rawObj.type || 'room';
    
    // Add lighting data if available
    let enhancedProperties = rawObj.properties || {};
    
    if (lightingData && rawObj.id && lightingData[rawObj.id]) {
      const fixtures = lightingData[rawObj.id];
      const functionalLights = fixtures.filter((f: any) => f.status === 'functional').length;
      const totalLights = fixtures.length;
      
      enhancedProperties = {
        ...enhancedProperties,
        lighting_fixtures: fixtures,
        functional_lights: functionalLights,
        total_lights: totalLights,
        lighting_status: 
          totalLights === 0 ? 'unknown' :
          functionalLights === totalLights ? 'all_functional' :
          functionalLights === 0 ? 'all_non_functional' : 
          'partial_issues'
      };
    }

    // Mark hallway-connected rooms in properties
    if (connectedRoomIds.has(rawObj.id) || connectedHallwayIds.has(rawObj.id)) {
      enhancedProperties = {
        ...enhancedProperties,
        has_hallway_connection: true,
      };
    }
    
    return {
      ...rawObj,
      id: rawObj.id || `obj-${index}`,
      position: finalPosition,
      size: parsedSize,
      properties: enhancedProperties,
      object_type: objectType,
      rotation: rawObj.rotation || 0
    } as RawFloorPlanObject;
  });
  
  // Generate edges from hallway connections
  const hallwayEdges = generateConnectionEdges(hallwayConnections);

  // Transform all objects into floor plan nodes
  const objects = processFloorPlanObjects(objectsWithPositions, hallwayEdges);
    
  const FP_DEBUG = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FLOORPLAN_DEBUG === 'true';
  if (FP_DEBUG) {
    logger.debug('Hallway connections:', hallwayConnections);
    logger.debug('Position overrides:', [...hallwayPositionOverrides.entries()]);
    logger.debug('Transformed objects:', objects);
    logger.debug('Hallway edges:', hallwayEdges);
  }

  // Don't block loading on lighting data since it's optional
  const finalIsLoading = isLoadingLayers || isLoadingObjects;
  
  return {
    layers: layers || [],
    objects,
    edges: hallwayEdges,
    isLoading: finalIsLoading,
    error
  };
}
