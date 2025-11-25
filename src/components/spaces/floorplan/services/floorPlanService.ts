/**
 * Floor Plan Service
 * Centralized data access for floor plan visualization
 * Uses unified_spaces view and handles missing position data gracefully
 */

import { supabase } from '@/lib/supabase';

export interface FloorPlanSpace {
  id: string;
  name: string;
  type: 'room' | 'hallway' | 'door';
  room_number?: string;
  room_type?: string;
  status: string;
  floor_id: string;
  building_id?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  properties: Record<string, unknown>;
}

export interface FloorInfo {
  id: string;
  name: string;
  floor_number: number;
  building_id: string;
  building_name: string;
}

// Default sizes for different space types
const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  room: { width: 150, height: 120 },
  hallway: { width: 300, height: 60 },
  door: { width: 50, height: 20 },
};

// Grid layout configuration for auto-positioning
const GRID_CONFIG = {
  startX: 100,
  startY: 100,
  spacingX: 200,
  spacingY: 180,
  columnsPerRow: 4,
};

/**
 * Parse position from various formats (JSON string, object, or null)
 */
function parsePosition(value: unknown, defaultPos: { x: number; y: number }): { x: number; y: number } {
  if (!value) return defaultPos;
  
  try {
    const pos = typeof value === 'string' ? JSON.parse(value) : value;
    if (
      pos &&
      typeof pos === 'object' &&
      typeof (pos as { x?: number }).x === 'number' &&
      typeof (pos as { y?: number }).y === 'number' &&
      !isNaN((pos as { x: number }).x) &&
      !isNaN((pos as { y: number }).y)
    ) {
      return { x: (pos as { x: number }).x, y: (pos as { y: number }).y };
    }
  } catch {
    // Parsing failed, use default
  }
  return defaultPos;
}

/**
 * Parse size from various formats
 */
function parseSize(value: unknown, defaultSize: { width: number; height: number }): { width: number; height: number } {
  if (!value) return defaultSize;
  
  try {
    const size = typeof value === 'string' ? JSON.parse(value) : value;
    if (
      size &&
      typeof size === 'object' &&
      typeof (size as { width?: number }).width === 'number' &&
      typeof (size as { height?: number }).height === 'number' &&
      !isNaN((size as { width: number }).width) &&
      !isNaN((size as { height: number }).height)
    ) {
      return { 
        width: (size as { width: number }).width, 
        height: (size as { height: number }).height 
      };
    }
  } catch {
    // Parsing failed, use default
  }
  return defaultSize;
}

/**
 * Calculate auto-layout position for spaces without stored positions
 */
function calculateAutoPosition(index: number, type: string): { x: number; y: number } {
  const size = DEFAULT_SIZES[type] || DEFAULT_SIZES.room;
  const col = index % GRID_CONFIG.columnsPerRow;
  const row = Math.floor(index / GRID_CONFIG.columnsPerRow);
  
  return {
    x: GRID_CONFIG.startX + col * (size.width + GRID_CONFIG.spacingX),
    y: GRID_CONFIG.startY + row * (size.height + GRID_CONFIG.spacingY),
  };
}

/**
 * Fetch all floors with building info
 */
export async function fetchFloors(): Promise<FloorInfo[]> {
  const { data, error } = await supabase
    .from('floors')
    .select(`
      id,
      name,
      floor_number,
      building_id,
      buildings!floors_building_id_fkey(name)
    `)
    .order('floor_number', { ascending: false });

  if (error) {
    console.error('[floorPlanService] Error fetching floors:', error);
    throw error;
  }

  return (data || []).map((floor) => ({
    id: floor.id,
    name: floor.name || `Floor ${floor.floor_number}`,
    floor_number: floor.floor_number,
    building_id: floor.building_id,
    building_name: Array.isArray(floor.buildings) 
      ? floor.buildings[0]?.name || 'Unknown Building'
      : (floor.buildings as { name?: string })?.name || 'Unknown Building',
  }));
}

/**
 * Fetch all spaces for a floor with proper position handling
 */
export async function fetchFloorSpaces(floorId: string): Promise<FloorPlanSpace[]> {
  console.log('[floorPlanService] Fetching spaces for floor:', floorId);
  
  // Fetch rooms - don't filter by status to get all rooms
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name, room_number, room_type, status, floor_id, position, size, rotation')
    .eq('floor_id', floorId);

  if (roomsError) {
    console.error('[floorPlanService] Error fetching rooms:', roomsError);
  } else {
    console.log('[floorPlanService] Fetched rooms:', rooms?.length || 0);
  }

  // Try to fetch hallways (may not exist in all deployments)
  let hallways: unknown[] = [];
  try {
    const { data, error } = await supabase
      .from('hallways')
      .select('id, name, status, floor_id, position, size, rotation')
      .eq('floor_id', floorId);
    
    if (!error && data) {
      hallways = data;
      console.log('[floorPlanService] Fetched hallways:', data.length);
    }
  } catch (e) {
    console.log('[floorPlanService] Hallways table not available');
  }

  // Try to fetch doors (may not exist in all deployments)
  let doors: unknown[] = [];
  try {
    const { data, error } = await supabase
      .from('doors')
      .select('id, name, status, floor_id, position, size')
      .eq('floor_id', floorId);
    
    if (!error && data) {
      doors = data;
      console.log('[floorPlanService] Fetched doors:', data.length);
    }
  } catch (e) {
    console.log('[floorPlanService] Doors table not available');
  }

  // Transform and combine all spaces
  const spaces: FloorPlanSpace[] = [];
  let autoLayoutIndex = 0;

  // Process rooms
  (rooms || []).forEach((room) => {
    const defaultSize = DEFAULT_SIZES.room;
    const position = parsePosition(room.position, calculateAutoPosition(autoLayoutIndex, 'room'));
    const size = parseSize(room.size, defaultSize);
    
    // If position was auto-calculated, increment the index
    if (!room.position) {
      autoLayoutIndex++;
    }

    spaces.push({
      id: room.id,
      name: room.name || room.room_number || 'Unnamed Room',
      type: 'room',
      room_number: room.room_number,
      room_type: room.room_type,
      status: room.status || 'active',
      floor_id: room.floor_id,
      position,
      size,
      rotation: typeof room.rotation === 'number' ? room.rotation : 0,
      properties: {
        room_number: room.room_number,
        room_type: room.room_type,
      },
    });
  });

  // Process hallways
  (hallways as Array<{
    id: string;
    name?: string;
    status?: string;
    floor_id: string;
    position?: unknown;
    size?: unknown;
    rotation?: number;
  }>).forEach((hallway) => {
    const defaultSize = DEFAULT_SIZES.hallway;
    const position = parsePosition(hallway.position, calculateAutoPosition(autoLayoutIndex, 'hallway'));
    const size = parseSize(hallway.size, defaultSize);
    
    if (!hallway.position) {
      autoLayoutIndex++;
    }

    spaces.push({
      id: hallway.id,
      name: hallway.name || 'Hallway',
      type: 'hallway',
      status: hallway.status || 'active',
      floor_id: hallway.floor_id,
      position,
      size,
      rotation: typeof hallway.rotation === 'number' ? hallway.rotation : 0,
      properties: {
        orientation: size.width > size.height ? 'horizontal' : 'vertical',
      },
    });
  });

  // Process doors
  (doors as Array<{
    id: string;
    name?: string;
    status?: string;
    floor_id: string;
    position?: unknown;
    size?: unknown;
  }>).forEach((door) => {
    const defaultSize = DEFAULT_SIZES.door;
    const position = parsePosition(door.position, calculateAutoPosition(autoLayoutIndex, 'door'));
    const size = parseSize(door.size, defaultSize);
    
    if (!door.position) {
      autoLayoutIndex++;
    }

    spaces.push({
      id: door.id,
      name: door.name || 'Door',
      type: 'door',
      status: door.status || 'active',
      floor_id: door.floor_id,
      position,
      size,
      rotation: 0,
      properties: {},
    });
  });

  return spaces;
}

/**
 * Update space position in database
 */
export async function updateSpacePosition(
  spaceId: string,
  spaceType: 'room' | 'hallway' | 'door',
  position: { x: number; y: number }
): Promise<void> {
  const table = spaceType === 'room' ? 'rooms' : spaceType === 'hallway' ? 'hallways' : 'doors';
  
  const { error } = await supabase
    .from(table)
    .update({ position })
    .eq('id', spaceId);

  if (error) {
    console.error(`[floorPlanService] Error updating ${spaceType} position:`, error);
    throw error;
  }
}

/**
 * Update space size in database
 */
export async function updateSpaceSize(
  spaceId: string,
  spaceType: 'room' | 'hallway' | 'door',
  size: { width: number; height: number }
): Promise<void> {
  const table = spaceType === 'room' ? 'rooms' : spaceType === 'hallway' ? 'hallways' : 'doors';
  
  const { error } = await supabase
    .from(table)
    .update({ size })
    .eq('id', spaceId);

  if (error) {
    console.error(`[floorPlanService] Error updating ${spaceType} size:`, error);
    throw error;
  }
}

/**
 * Batch update space positions (for auto-layout save)
 */
export async function batchUpdatePositions(
  updates: Array<{ id: string; type: 'room' | 'hallway' | 'door'; position: { x: number; y: number } }>
): Promise<void> {
  // Group by type for efficient batch updates
  const byType = updates.reduce((acc, update) => {
    if (!acc[update.type]) acc[update.type] = [];
    acc[update.type].push(update);
    return acc;
  }, {} as Record<string, typeof updates>);

  const promises = Object.entries(byType).map(async ([type, items]) => {
    const table = type === 'room' ? 'rooms' : type === 'hallway' ? 'hallways' : 'doors';
    
    // Update each item (Supabase doesn't support bulk upsert with different values easily)
    for (const item of items) {
      const { error } = await supabase
        .from(table)
        .update({ position: item.position })
        .eq('id', item.id);
      
      if (error) {
        console.error(`[floorPlanService] Error in batch update for ${item.id}:`, error);
      }
    }
  });

  await Promise.all(promises);
}
