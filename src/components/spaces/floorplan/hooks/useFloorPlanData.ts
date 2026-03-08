
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { processFloorPlanObjects } from "../utils/floorPlanTransformers";
import { fetchFloorPlanLayers, fetchFloorPlanObjects, HallwayRoomConnection } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, RawFloorPlanObject, Position, Size } from "../types/floorPlanTypes";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

/** Layout config */
const ROOM_GAP = 10; // gap between adjacent rooms (wall thickness)
const SIDE_OFFSET = 180; // distance from hallway center to room center
const HALLWAY_PADDING = 40; // extra padding on each end of hallway
const POSITION_SEGMENT_PRIORITY: Record<string, number> = {
  start: 0,
  middle: 1,
  end: 2,
};

interface LayoutOverrides {
  positions: Map<string, Position>;
  sizes: Map<string, Size>;
}

/**
 * Sequential tiling with auto-extending hallway.
 * Rooms tile side-by-side along the hallway spine.
 * The hallway auto-extends to fit all connected rooms.
 */
function computeHallwayCentricLayout(
  connections: HallwayRoomConnection[],
  objectMap: Map<string, RawFloorPlanObject>
): LayoutOverrides {
  const positions = new Map<string, Position>();
  const sizes = new Map<string, Size>();

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

    const hPos = parsePosition(hallway.position) || { x: 400, y: 300 };
    const hSize = parseSize(hallway.size) || { width: 300, height: 50 };
    const isHorizontal = hSize.width >= hSize.height;

    // Center hallway if unpositioned
    if (hPos.x === 0 && hPos.y === 0) {
      hPos.x = 500;
      hPos.y = 400;
    }

    // Split connections by side, sort by segment priority then sequence_order then insertion order
    const leftRooms: { conn: HallwayRoomConnection; size: Size }[] = [];
    const rightRooms: { conn: HallwayRoomConnection; size: Size }[] = [];

    for (const conn of conns) {
      const roomObj = objectMap.get(conn.room_id);
      const roomSize = (roomObj && parseSize(roomObj.size)) || { width: 150, height: 100 };
      const entry = { conn, size: roomSize };
      if (conn.side === 'right') {
        rightRooms.push(entry);
      } else {
        leftRooms.push(entry); // default to left
      }
    }

    const sortRooms = (arr: typeof leftRooms) =>
      arr.sort((a, b) => {
        const pa = POSITION_SEGMENT_PRIORITY[a.conn.position] ?? 1;
        const pb = POSITION_SEGMENT_PRIORITY[b.conn.position] ?? 1;
        if (pa !== pb) return pa - pb;
        return a.conn.sequence_order - b.conn.sequence_order;
      });

    sortRooms(leftRooms);
    sortRooms(rightRooms);

    // Tile rooms sequentially along the spine axis
    const tileRooms = (
      rooms: typeof leftRooms,
      sideSign: number // -1 for left/above, +1 for right/below
    ) => {
      let cursor = 0; // running offset along the spine

      for (const { conn, size } of rooms) {
        const roomSpan = isHorizontal ? size.width : size.height;
        const roomOffset = cursor + roomSpan / 2;

        let roomX: number, roomY: number;
        if (isHorizontal) {
          // Spine runs along X; rooms branch along Y
          roomX = cursor;
          roomY = hPos.y + sideSign * (SIDE_OFFSET + (isHorizontal ? size.height / 2 : size.width / 2));
        } else {
          // Spine runs along Y; rooms branch along X
          roomX = hPos.x + sideSign * (SIDE_OFFSET + size.width / 2);
          roomY = cursor;
        }

        positions.set(conn.room_id, { x: roomX, y: roomY });
        cursor += roomSpan + ROOM_GAP;
      }

      return cursor - ROOM_GAP; // total span used (minus trailing gap)
    };

    const leftSpan = tileRooms(leftRooms, -1);
    const rightSpan = tileRooms(rightRooms, 1);
    const maxSpan = Math.max(leftSpan, rightSpan, 0);

    // Auto-extend hallway to cover all rooms
    const totalLength = maxSpan + HALLWAY_PADDING * 2;
    const hallwayStart = -HALLWAY_PADDING;

    // Shift all room positions to be centered on the hallway
    const shiftRoomsRelative = (rooms: typeof leftRooms, sideSign: number) => {
      let cursor = 0;
      for (const { conn, size } of rooms) {
        const roomSpan = isHorizontal ? size.width : size.height;
        const existing = positions.get(conn.room_id);
        if (existing) {
          if (isHorizontal) {
            existing.x = hPos.x - totalLength / 2 + HALLWAY_PADDING + cursor + roomSpan / 2;
          } else {
            existing.y = hPos.y - totalLength / 2 + HALLWAY_PADDING + cursor + roomSpan / 2;
          }
          positions.set(conn.room_id, existing);
        }
        cursor += roomSpan + ROOM_GAP;
      }
    };

    shiftRoomsRelative(leftRooms, -1);
    shiftRoomsRelative(rightRooms, 1);

    // Override hallway size
    if (isHorizontal) {
      sizes.set(hallwayId, { width: Math.max(hSize.width, totalLength), height: hSize.height });
    } else {
      sizes.set(hallwayId, { width: hSize.width, height: Math.max(hSize.height, totalLength) });
    }

    positions.set(hallwayId, hPos);
  }

  return { positions, sizes };
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
  const hallwayOverrides = computeHallwayCentricLayout(hallwayConnections, objectMap);

  // Set of room IDs that have hallway connections
  const connectedRoomIds = new Set(hallwayConnections.map(c => c.room_id));
  const connectedHallwayIds = new Set(hallwayConnections.map(c => c.hallway_id));

  // Assign positions to objects
  let unpositionedIndex = 0;
  const objectsWithPositions = rawObjects.map((rawObj: any, index: number) => {
    const defaultSize: Size = { width: 150, height: 100 };

    // Check if hallway-centric layout gave us a position
    const hallwayOverride = hallwayOverrides.positions.get(rawObj.id);

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

    // Parse size — apply hallway size override if available
    const sizeOverride = hallwayOverrides.sizes.get(rawObj.id);
    let parsedSize = sizeOverride || parseSize(rawObj.size) || defaultSize;
    
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
    logger.debug('Position overrides:', [...hallwayOverrides.positions.entries()]);
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
