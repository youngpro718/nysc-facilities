/**
 * Floor Plan Module Exports
 * 
 * This module provides floor plan visualization components.
 * 
 * Recommended usage:
 * - FloorPlanViewer: New, redesigned floor plan component (recommended)
 * - SimpleFloorPlan: Simplified version (alternative)
 * - ModernFloorPlanView: Legacy complex floor plan (deprecated)
 */

// New redesigned component (recommended)
export { FloorPlanViewer } from './FloorPlanViewer';
export { SimpleFloorPlan } from './SimpleFloorPlan';
export { useFloorPlan, useFloors, FLOOR_PLAN_KEYS } from './hooks/useFloorPlan';
export type { FloorPlanSpace, FloorInfo } from './hooks/useFloorPlan';

// Services
export * from './services/floorPlanService';

// Node components (for custom implementations)
export { RoomNode } from './nodes/RoomNode';
export { DoorNode } from './nodes/DoorNode';
export { HallwayNode } from './nodes/HallwayNode';

// Types
export type {
  FloorPlanNode,
  FloorPlanEdge,
  FloorPlanLayer,
  Position,
  Size,
  SpaceType,
  LayerType,
} from './types/floorPlanTypes';

// Legacy exports (for backward compatibility)
export { ModernFloorPlanView } from './ModernFloorPlanView';
export { FloorPlanCanvas } from './FloorPlanCanvas';
