
import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import BlueprintFloorPlan from './BlueprintFloorPlan';

interface FloorPlanObject {
  id: string;
  position: {
    x: number;
    y: number;
    z?: number;
  };
  size?: { width: number; height: number; depth?: number };
  name?: string;
  type?: string;
  status?: string;
  room_number?: string;
  data?: {
    label?: string;
    type?: string;
    size?: { width: number; height: number };
    properties?: {
      status?: string;
      room_number?: string;
      name?: string;
      [key: string]: unknown;
    };
  };
}

interface FloorPlanConnection {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'standard' | 'emergency' | 'highTraffic';
}

export interface SceneHandle {
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToContent: () => void;
}

interface NewThreeDSceneProps {
  objects: FloorPlanObject[];
  connections: FloorPlanConnection[];
  selectedObjectId?: string | null;
  hoveredObjectId?: string | null;
  onObjectClick?: (objectId: string) => void;
  onObjectHover?: (objectId: string | null) => void;
  className?: string;
  showConnections?: boolean;
  labelScale?: number;
  // Legacy props (ignored in blueprint mode)
  enableShadows?: boolean;
  backgroundColor?: number;
  commandToken?: unknown;
  moveEnabled?: boolean;
}

const NewThreeDScene = forwardRef<SceneHandle, NewThreeDSceneProps>(({
  objects = [],
  connections = [],
  selectedObjectId = null,
  hoveredObjectId = null,
  onObjectClick,
  onObjectHover,
  className = '',
  showConnections = true,
  labelScale = 1
}, ref) => {
  const blueprintRef = useRef<SceneHandle>(null);

  // Forward imperative methods to parent
  useImperativeHandle(ref, () => ({
    resetCamera: () => blueprintRef.current?.resetCamera(),
    zoomIn: () => blueprintRef.current?.zoomIn(),
    zoomOut: () => blueprintRef.current?.zoomOut(),
    fitToContent: () => blueprintRef.current?.fitToContent(),
  }));

  // Transform and validate objects, extracting proper names from data
  const validObjects = useMemo(() => {
    if (!Array.isArray(objects)) return [];
    
    return objects
      .filter(obj => 
        obj?.id && obj?.position && 
        Number.isFinite(obj.position.x) && 
        Number.isFinite(obj.position.y)
      )
      .map(obj => {
        // Extract name from multiple possible sources
        const extractedName = 
          obj.name || 
          obj.data?.label || 
          obj.data?.properties?.name ||
          obj.room_number ||
          obj.data?.properties?.room_number ||
          '';

        // Extract type
        const extractedType = 
          obj.type || 
          obj.data?.type || 
          'room';

        // Extract status
        const extractedStatus = 
          obj.status || 
          obj.data?.properties?.status || 
          'active';

        // Extract room number
        const extractedRoomNumber = 
          obj.room_number || 
          obj.data?.properties?.room_number || 
          '';

        // Extract size with sensible defaults
        const extractedSize = {
          width: obj.size?.width || obj.data?.size?.width || 120,
          height: obj.size?.height || obj.data?.size?.height || 80,
          depth: obj.size?.depth || 40,
        };

        // Extract rotation from multiple sources
        const extractedRotation = 
          (obj as any).rotation !== undefined ? (obj as any).rotation :
          (obj as any).data?.rotation !== undefined ? (obj as any).data.rotation : 0;

        return {
          ...obj,
          name: extractedName,
          type: extractedType,
          status: extractedStatus,
          room_number: extractedRoomNumber,
          size: extractedSize,
          rotation: extractedRotation,
        };
      });
  }, [objects]);

  const validConnections = useMemo(() => {
    if (!showConnections || !Array.isArray(connections)) return [];
    return connections.filter(conn =>
      conn?.id && conn?.from && conn?.to &&
      Number.isFinite(conn.from.x) && Number.isFinite(conn.from.y) &&
      Number.isFinite(conn.to.x) && Number.isFinite(conn.to.y)
    );
  }, [connections, showConnections]);

  return (
    <div className={`w-full h-full ${className}`}>
      <BlueprintFloorPlan
        ref={blueprintRef}
        rooms={validObjects}
        connections={validConnections}
        selectedRoomId={selectedObjectId}
        hoveredRoomId={hoveredObjectId}
        onRoomClick={onObjectClick}
        onRoomHover={onObjectHover}
        showConnections={showConnections}
        labelScale={labelScale}
        showLegend={false}
        showIcons={true}
      />
    </div>
  );
});

NewThreeDScene.displayName = 'NewThreeDScene';

export default NewThreeDScene;
