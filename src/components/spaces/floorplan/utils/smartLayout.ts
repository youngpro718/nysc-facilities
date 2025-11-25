/**
 * Smart Layout Algorithm for Floor Plan Objects
 * 
 * This module provides intelligent auto-layout for floor plan objects
 * when they don't have valid positions stored in the database.
 * 
 * Layout Strategy:
 * 1. Hallways are placed first as the "spine" of the floor
 * 2. Rooms are arranged along hallways based on connections
 * 3. Unconnected rooms are placed in a grid pattern
 * 4. Doors are positioned between connected spaces
 */

import { FloorPlanNode, Position, Size } from '../types/floorPlanTypes';

export interface LayoutConfig {
  gridSpacing: number;      // Space between grid cells
  hallwayWidth: number;     // Default hallway width
  hallwayLength: number;    // Default hallway length
  roomWidth: number;        // Default room width
  roomHeight: number;       // Default room height
  doorWidth: number;        // Default door width
  doorHeight: number;       // Default door height
  padding: number;          // Padding around the layout
  columnsPerRow: number;    // Number of columns in grid layout
}

const DEFAULT_CONFIG: LayoutConfig = {
  gridSpacing: 50,
  hallwayWidth: 60,
  hallwayLength: 600,
  roomWidth: 150,
  roomHeight: 120,
  doorWidth: 40,
  doorHeight: 15,
  padding: 100,
  columnsPerRow: 4,
};

/**
 * Check if a position is valid (not at origin and has finite values)
 */
export function isValidPosition(position: Position | null | undefined): boolean {
  if (!position) return false;
  if (typeof position.x !== 'number' || typeof position.y !== 'number') return false;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return false;
  // Consider (0,0) as invalid since it's the default fallback
  if (position.x === 0 && position.y === 0) return false;
  return true;
}

/**
 * Check if objects need auto-layout
 */
export function needsAutoLayout(objects: FloorPlanNode[]): boolean {
  if (!objects || objects.length === 0) return false;
  
  // Count objects with invalid positions
  const invalidCount = objects.filter(obj => !isValidPosition(obj.position)).length;
  
  // If more than 50% have invalid positions, apply auto-layout to all
  return invalidCount > objects.length * 0.5;
}

/**
 * Check if objects are overlapping (collision detection)
 */
export function hasOverlappingObjects(objects: FloorPlanNode[]): boolean {
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i];
      const b = objects[j];
      
      const aSize = a.data?.size || { width: 100, height: 100 };
      const bSize = b.data?.size || { width: 100, height: 100 };
      
      // Check AABB collision
      const aLeft = a.position.x;
      const aRight = a.position.x + aSize.width;
      const aTop = a.position.y;
      const aBottom = a.position.y + aSize.height;
      
      const bLeft = b.position.x;
      const bRight = b.position.x + bSize.width;
      const bTop = b.position.y;
      const bBottom = b.position.y + bSize.height;
      
      if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Apply smart auto-layout to floor plan objects
 */
export function applySmartLayout(
  objects: FloorPlanNode[],
  config: Partial<LayoutConfig> = {}
): FloorPlanNode[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (!objects || objects.length === 0) return [];
  
  // Separate objects by type
  const hallways = objects.filter(obj => obj.type === 'hallway');
  const rooms = objects.filter(obj => obj.type === 'room');
  const doors = objects.filter(obj => obj.type === 'door');
  
  const layoutResult: FloorPlanNode[] = [];
  
  // Step 1: Layout hallways as the spine
  const hallwayPositions = layoutHallways(hallways, cfg);
  layoutResult.push(...hallwayPositions);
  
  // Step 2: Layout rooms along hallways or in grid
  const roomPositions = layoutRooms(rooms, hallwayPositions, cfg);
  layoutResult.push(...roomPositions);
  
  // Step 3: Layout doors between spaces
  const doorPositions = layoutDoors(doors, [...hallwayPositions, ...roomPositions], cfg);
  layoutResult.push(...doorPositions);
  
  return layoutResult;
}

/**
 * Layout hallways in a cross or linear pattern
 */
function layoutHallways(hallways: FloorPlanNode[], cfg: LayoutConfig): FloorPlanNode[] {
  if (hallways.length === 0) return [];
  
  const result: FloorPlanNode[] = [];
  const centerX = cfg.padding + cfg.hallwayLength / 2;
  const centerY = cfg.padding + cfg.hallwayLength / 2;
  
  hallways.forEach((hallway, index) => {
    const size = hallway.data?.size || { width: cfg.hallwayLength, height: cfg.hallwayWidth };
    let position: Position;
    
    if (index === 0) {
      // First hallway: horizontal, centered
      position = {
        x: centerX - size.width / 2,
        y: centerY - size.height / 2
      };
    } else if (index === 1) {
      // Second hallway: vertical, crossing the first
      position = {
        x: centerX - size.height / 2,  // Swap for vertical
        y: centerY - size.width / 2
      };
      // Swap dimensions for vertical hallway
      hallway.data.size = { width: size.height, height: size.width };
    } else {
      // Additional hallways: offset from center
      const offset = (index - 1) * (cfg.hallwayLength / 2 + cfg.gridSpacing);
      const isVertical = index % 2 === 0;
      
      if (isVertical) {
        position = {
          x: centerX + offset - size.height / 2,
          y: centerY - size.width / 2
        };
        hallway.data.size = { width: size.height, height: size.width };
      } else {
        position = {
          x: centerX - size.width / 2,
          y: centerY + offset - size.height / 2
        };
      }
    }
    
    result.push({
      ...hallway,
      position
    });
  });
  
  return result;
}

/**
 * Layout rooms in a grid pattern, considering hallway positions
 */
function layoutRooms(
  rooms: FloorPlanNode[],
  hallways: FloorPlanNode[],
  cfg: LayoutConfig
): FloorPlanNode[] {
  if (rooms.length === 0) return [];
  
  const result: FloorPlanNode[] = [];
  
  // Calculate layout bounds based on hallways
  let startX = cfg.padding;
  let startY = cfg.padding;
  
  if (hallways.length > 0) {
    // Find the bounding box of hallways
    const hallwayBounds = hallways.reduce((bounds, h) => {
      const size = h.data?.size || { width: cfg.hallwayLength, height: cfg.hallwayWidth };
      return {
        minX: Math.min(bounds.minX, h.position.x),
        maxX: Math.max(bounds.maxX, h.position.x + size.width),
        minY: Math.min(bounds.minY, h.position.y),
        maxY: Math.max(bounds.maxY, h.position.y + size.height)
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    
    // Position rooms around hallways
    startY = hallwayBounds.minY - cfg.roomHeight - cfg.gridSpacing;
    startX = hallwayBounds.minX;
  }
  
  // Create a grid layout for rooms
  const cellWidth = cfg.roomWidth + cfg.gridSpacing;
  const cellHeight = cfg.roomHeight + cfg.gridSpacing;
  
  // Split rooms into two groups: above and below the hallway
  const halfCount = Math.ceil(rooms.length / 2);
  
  rooms.forEach((room, index) => {
    const size = room.data?.size || { width: cfg.roomWidth, height: cfg.roomHeight };
    
    let position: Position;
    
    if (hallways.length > 0) {
      // Position relative to hallways
      const isTopRow = index < halfCount;
      const rowIndex = isTopRow ? index : index - halfCount;
      const col = rowIndex % cfg.columnsPerRow;
      
      if (isTopRow) {
        // Rooms above the hallway
        position = {
          x: startX + col * cellWidth,
          y: startY - Math.floor(rowIndex / cfg.columnsPerRow) * cellHeight
        };
      } else {
        // Rooms below the hallway
        const hallwayBottom = hallways.reduce((max, h) => {
          const hSize = h.data?.size || { width: 0, height: cfg.hallwayWidth };
          return Math.max(max, h.position.y + hSize.height);
        }, 0);
        
        position = {
          x: startX + col * cellWidth,
          y: hallwayBottom + cfg.gridSpacing + Math.floor(rowIndex / cfg.columnsPerRow) * cellHeight
        };
      }
    } else {
      // Simple grid layout without hallways
      const col = index % cfg.columnsPerRow;
      const row = Math.floor(index / cfg.columnsPerRow);
      
      position = {
        x: cfg.padding + col * cellWidth,
        y: cfg.padding + row * cellHeight
      };
    }
    
    result.push({
      ...room,
      position,
      data: {
        ...room.data,
        size
      }
    });
  });
  
  return result;
}

/**
 * Layout doors between connected spaces
 */
function layoutDoors(
  doors: FloorPlanNode[],
  spaces: FloorPlanNode[],
  cfg: LayoutConfig
): FloorPlanNode[] {
  if (doors.length === 0) return [];
  
  const result: FloorPlanNode[] = [];
  
  // For now, place doors in a row below all other spaces
  const maxY = spaces.reduce((max, space) => {
    const size = space.data?.size || { width: 100, height: 100 };
    return Math.max(max, space.position.y + size.height);
  }, 0);
  
  doors.forEach((door, index) => {
    const size = door.data?.size || { width: cfg.doorWidth, height: cfg.doorHeight };
    
    result.push({
      ...door,
      position: {
        x: cfg.padding + index * (cfg.doorWidth + cfg.gridSpacing),
        y: maxY + cfg.gridSpacing * 2
      },
      data: {
        ...door.data,
        size
      }
    });
  });
  
  return result;
}

/**
 * Normalize layout to center around origin (for 3D view)
 */
export function normalizeLayoutToOrigin(objects: FloorPlanNode[]): FloorPlanNode[] {
  if (!objects || objects.length === 0) return [];
  
  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  objects.forEach(obj => {
    const size = obj.data?.size || { width: 100, height: 100 };
    minX = Math.min(minX, obj.position.x);
    maxX = Math.max(maxX, obj.position.x + size.width);
    minY = Math.min(minY, obj.position.y);
    maxY = Math.max(maxY, obj.position.y + size.height);
  });
  
  // Calculate center offset
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Shift all objects to center around origin
  return objects.map(obj => ({
    ...obj,
    position: {
      x: obj.position.x - centerX,
      y: obj.position.y - centerY
    }
  }));
}

/**
 * Apply collision resolution to prevent overlapping
 */
export function resolveCollisions(objects: FloorPlanNode[], maxIterations: number = 50): FloorPlanNode[] {
  const result = objects.map(obj => ({ ...obj, position: { ...obj.position } }));
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasCollision = false;
    
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        
        const aSize = a.data?.size || { width: 100, height: 100 };
        const bSize = b.data?.size || { width: 100, height: 100 };
        
        // Calculate overlap
        const overlapX = Math.min(a.position.x + aSize.width, b.position.x + bSize.width) - 
                        Math.max(a.position.x, b.position.x);
        const overlapY = Math.min(a.position.y + aSize.height, b.position.y + bSize.height) - 
                        Math.max(a.position.y, b.position.y);
        
        if (overlapX > 0 && overlapY > 0) {
          hasCollision = true;
          
          // Push objects apart
          const pushX = overlapX / 2 + 10;
          const pushY = overlapY / 2 + 10;
          
          // Determine push direction based on center positions
          const aCenterX = a.position.x + aSize.width / 2;
          const bCenterX = b.position.x + bSize.width / 2;
          const aCenterY = a.position.y + aSize.height / 2;
          const bCenterY = b.position.y + bSize.height / 2;
          
          if (Math.abs(aCenterX - bCenterX) > Math.abs(aCenterY - bCenterY)) {
            // Push horizontally
            if (aCenterX < bCenterX) {
              a.position.x -= pushX;
              b.position.x += pushX;
            } else {
              a.position.x += pushX;
              b.position.x -= pushX;
            }
          } else {
            // Push vertically
            if (aCenterY < bCenterY) {
              a.position.y -= pushY;
              b.position.y += pushY;
            } else {
              a.position.y += pushY;
              b.position.y -= pushY;
            }
          }
        }
      }
    }
    
    if (!hasCollision) break;
  }
  
  return result;
}
