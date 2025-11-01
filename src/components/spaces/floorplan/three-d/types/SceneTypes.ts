// Proper TypeScript interfaces for type safety

export interface Position3D {
  x: number;
  y: number;
  z?: number;
}

export interface Size3D {
  width: number;
  height: number;
  depth?: number;
}

export type ObjectKind = 'room' | 'hallway' | 'door';

export interface SpaceData {
  id: string;
  name: string;
  type: ObjectKind;
  status?: string;
  properties?: Record<string, any>;
}

export interface FloorPlanObject {
  id: string;
  type: ObjectKind;
  position: Position3D;
  size: Size3D;
  rotation?: number;
  data: SpaceData;
  label?: string;
  properties?: Record<string, any>;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  type?: 'direct' | 'hallway' | 'emergency';
  data?: {
    type?: string;
    direction?: string;
    [key: string]: any;
  };
  is_emergency_exit?: boolean;
}

export interface SceneConfiguration {
  gridSize: number;
  lightIntensity: number;
  cameraDistance: number;
  enableDamping: boolean;
  dampingFactor: number;
  rotateSpeed: number;
  maxPolarAngle: number;
  minDistance: number;
  maxDistance: number;
}

export interface HallwayLayoutConfig {
  width: number;
  segmentLength: number;
  cornerRadius: number;
  wallThickness: number;
  floorOffset: number;
}

export interface SceneState {
  hasInitialized: boolean;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  connectingFromId: string | null;
  isLoading: boolean;
  renderMode: 'default' | 'rooms' | 'hallways' | 'doors';
}

export interface SceneCallbacks {
  onObjectSelect: (object: FloorPlanObject) => void;
  onObjectHover?: (object: FloorPlanObject | null) => void;
  onStartConnection?: (fromId: string) => void;
  onFinishConnection?: (fromId: string, toId: string) => void;
  onError?: (error: Error) => void;
}

export interface SceneProps {
  objects: FloorPlanObject[];
  connections: Connection[];
  selectedObjectId?: string | null;
  previewData?: FloorPlanObject | null;
  showLabels?: boolean;
  showConnections?: boolean;
  lightIntensity?: number;
  viewMode?: 'default' | 'rooms' | 'hallways' | 'doors';
  configuration?: Partial<SceneConfiguration>;
  hallwayConfig?: Partial<HallwayLayoutConfig>;
  callbacks: SceneCallbacks;
}

export interface SceneRef {
  fitToFloor: () => void;
  focusObject: (objectId: string) => void;
  resetCamera: () => void;
  getSceneState: () => SceneState;
}
