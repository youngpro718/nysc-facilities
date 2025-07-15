import * as THREE from 'three';

export interface GridSettings {
  enabled: boolean;
  size: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export class GridSnapping {
  private gridSize: number;
  private enabled: boolean;

  constructor(gridSize: number = 50, enabled: boolean = true) {
    this.gridSize = gridSize;
    this.enabled = enabled;
  }

  snapToGrid(position: THREE.Vector3): THREE.Vector3 {
    if (!this.enabled) return position;

    return new THREE.Vector3(
      Math.round(position.x / this.gridSize) * this.gridSize,
      position.y,
      Math.round(position.z / this.gridSize) * this.gridSize
    );
  }

  snapPosition(position: { x: number; y: number }): { x: number; y: number } {
    if (!this.enabled) return position;

    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  getGridSize(): number {
    return this.gridSize;
  }

  setGridSize(size: number): void {
    this.gridSize = size;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Find optimal position for new objects
  findOptimalPosition(
    existingObjects: any[],
    objectSize: { width: number; height: number },
    preferredPosition?: { x: number; y: number }
  ): { x: number; y: number } {
    const maxAttempts = 100;
    let attempt = 0;

    // Start with preferred position or center
    let candidate = preferredPosition || { x: 0, y: 0 };

    while (attempt < maxAttempts) {
      candidate = this.snapPosition(candidate);
      
      // Check if position is free
      if (this.isPositionFree(candidate, objectSize, existingObjects)) {
        return candidate;
      }

      // Try next position in a spiral pattern
      candidate = this.getNextSpiralPosition(candidate, attempt);
      attempt++;
    }

    // Fallback to a safe position
    return this.snapPosition({ x: attempt * this.gridSize, y: 0 });
  }

  private isPositionFree(
    position: { x: number; y: number },
    size: { width: number; height: number },
    existingObjects: any[]
  ): boolean {
    const buffer = 20; // Minimum space between objects

    return !existingObjects.some(obj => {
      const objPos = obj.position;
      const objSize = obj.data?.size || { width: 150, height: 100 };

      // Check if bounding boxes overlap
      const left1 = position.x - size.width / 2;
      const right1 = position.x + size.width / 2;
      const top1 = position.y - size.height / 2;
      const bottom1 = position.y + size.height / 2;

      const left2 = objPos.x - objSize.width / 2 - buffer;
      const right2 = objPos.x + objSize.width / 2 + buffer;
      const top2 = objPos.y - objSize.height / 2 - buffer;
      const bottom2 = objPos.y + objSize.height / 2 + buffer;

      return !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
    });
  }

  private getNextSpiralPosition(
    center: { x: number; y: number },
    step: number
  ): { x: number; y: number } {
    // Create a spiral pattern for finding next position
    const radius = Math.ceil(Math.sqrt(step + 1));
    const angle = (step * Math.PI * 2) / Math.max(radius, 1);

    return {
      x: center.x + Math.cos(angle) * radius * this.gridSize,
      y: center.y + Math.sin(angle) * radius * this.gridSize
    };
  }

  // Smart positioning for hallways
  suggestHallwayPosition(
    connectedRooms: any[],
    hallwaySize: { width: number; height: number }
  ): { x: number; y: number; rotation: number } {
    if (connectedRooms.length < 2) {
      return { x: 0, y: 0, rotation: 0 };
    }

    const positions = connectedRooms.map(room => room.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    const xDistance = maxX - minX;
    const yDistance = maxY - minY;

    const isHorizontal = xDistance > yDistance;

    if (isHorizontal) {
      // Horizontal hallway
      const position = this.snapPosition({
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      });
      return { ...position, rotation: 0 };
    } else {
      // Vertical hallway
      const position = this.snapPosition({
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      });
      return { ...position, rotation: 90 };
    }
  }
}