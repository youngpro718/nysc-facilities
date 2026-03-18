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

  snapToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  isPositionFree(
    position: Position, 
    size: Size, 
    existingObjects: any[], 
    excludeId?: string
  ): boolean {
    const margin = 10; // Minimum spacing between objects
    
    return !existingObjects.some(existingObject => {
      if (excludeId && existingObject.id === excludeId) return false;

      const existingObjectSize = existingObject.data?.size || existingObject.size || { width: 150, height: 100 };
      const existingObjectPosition = existingObject.position;

      // Check for overlap with margin
      const overlap = !(
        position.x + size.width/2 + margin < existingObjectPosition.x - existingObjectSize.width/2 ||
        position.x - size.width/2 - margin > existingObjectPosition.x + existingObjectSize.width/2 ||
        position.y + size.height/2 + margin < existingObjectPosition.y - existingObjectSize.height/2 ||
        position.y - size.height/2 - margin > existingObjectPosition.y + existingObjectSize.height/2
      );
      
      return overlap;
    });
  }

  findOptimalPosition(
    existingObjects: any[], 
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

  autoArrangeObjects(objects: any[]): any[] {
    const arranged = [...objects];
    const positionUtils = new PositionUtils(this.gridSize);
    for (let i = 0; i < arranged.length; i++) {
      const floorPlanObject = arranged[i];
      const size = floorPlanObject.data?.size || floorPlanObject.size || { width: 150, height: 100 };
      const otherObjects = arranged.slice(0, i);

      if (!positionUtils.isPositionFree(floorPlanObject.position, size, otherObjects)) {
        floorPlanObject.position = positionUtils.findOptimalPosition(otherObjects, size);
      }
    }
    
    return arranged;
  }
}