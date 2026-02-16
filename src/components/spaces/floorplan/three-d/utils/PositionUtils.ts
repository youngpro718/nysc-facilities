// @ts-nocheck
// Grid snapping and positioning utilities

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export class PositionUtils {
  private gridSize: number;

  constructor(gridSize: number = 50) {
    this.gridSize = gridSize;
  }

  /**
   * Snap position to grid
   */
  snapToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  /**
   * Check if position is occupied by any existing objects
   */
  isPositionFree(
    position: Position, 
    size: Size, 
    existingObjects: unknown[], 
    excludeId?: string
  ): boolean {
    const margin = 10; // Minimum spacing between objects
    
    return !existingObjects.some(obj => {
      if (excludeId && obj.id === excludeId) return false;
      
      const objSize = obj.data?.size || obj.size || { width: 150, height: 100 };
      const objPos = obj.position;
      
      // Check for overlap with margin
      const overlap = !(
        position.x + size.width/2 + margin < objPos.x - objSize.width/2 ||
        position.x - size.width/2 - margin > objPos.x + objSize.width/2 ||
        position.y + size.height/2 + margin < objPos.y - objSize.height/2 ||
        position.y - size.height/2 - margin > objPos.y + objSize.height/2
      );
      
      return overlap;
    });
  }

  /**
   * Find optimal position for new object
   */
  findOptimalPosition(
    existingObjects: unknown[], 
    objectSize: Size,
    preferredPosition?: Position
  ): Position {
    // Try preferred position first
    if (preferredPosition) {
      const snappedPos = this.snapToGrid(preferredPosition);
      if (this.isPositionFree(snappedPos, objectSize, existingObjects)) {
        return snappedPos;
      }
    }

    // Find center of existing objects
    let centerX = 0, centerY = 0;
    if (existingObjects.length > 0) {
      centerX = existingObjects.reduce((sum, obj) => sum + obj.position.x, 0) / existingObjects.length;
      centerY = existingObjects.reduce((sum, obj) => sum + obj.position.y, 0) / existingObjects.length;
    }

    const center = this.snapToGrid({ x: centerX, y: centerY });

    // Search in expanding spiral pattern
    for (let radius = this.gridSize; radius <= 1000; radius += this.gridSize) {
      const positions = this.getPositionsAtRadius(center, radius);
      
      for (const position of positions) {
        if (this.isPositionFree(position, objectSize, existingObjects)) {
          return position;
        }
      }
    }

    // Fallback: place at origin
    return this.snapToGrid({ x: 0, y: 0 });
  }

  /**
   * Get positions at a specific radius from center
   */
  private getPositionsAtRadius(center: Position, radius: number): Position[] {
    const positions: Position[] = [];
    const steps = Math.max(8, Math.floor(radius / this.gridSize) * 4);
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      positions.push(this.snapToGrid({ x, y }));
    }
    
    return positions;
  }

  /**
   * Auto-arrange objects to prevent overlaps
   */
  autoArrangeObjects(objects: unknown[]): unknown[] {
    const arranged = [...objects];
    const positionUtils = new PositionUtils(this.gridSize);
    
    for (let i = 0; i < arranged.length; i++) {
      const obj = arranged[i];
      const size = obj.data?.size || obj.size || { width: 150, height: 100 };
      const otherObjects = arranged.slice(0, i);
      
      if (!positionUtils.isPositionFree(obj.position, size, otherObjects)) {
        obj.position = positionUtils.findOptimalPosition(otherObjects, size);
      }
    }
    
    return arranged;
  }
}