import React, { useMemo } from 'react';
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
}

interface FloorPlanConnection {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'standard' | 'emergency' | 'highTraffic';
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
  commandToken?: any;
  moveEnabled?: boolean;
}

const NewThreeDScene: React.FC<NewThreeDSceneProps> = ({
  objects = [],
  connections = [],
  selectedObjectId = null,
  hoveredObjectId = null,
  onObjectClick,
  onObjectHover,
  className = '',
  showConnections = true,
  labelScale = 1
}) => {
  const validObjects = useMemo(() => {
    if (!Array.isArray(objects)) return [];
    return objects.filter(obj => 
      obj?.id && obj?.position && 
      Number.isFinite(obj.position.x) && 
      Number.isFinite(obj.position.y)
    );
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
        rooms={validObjects}
        connections={validConnections}
        selectedRoomId={selectedObjectId}
        hoveredRoomId={hoveredObjectId}
        onRoomClick={onObjectClick}
        onRoomHover={onObjectHover}
        showConnections={showConnections}
        labelScale={labelScale}
        showLegend={true}
        showIcons={true}
      />
    </div>
  );
};

export default NewThreeDScene;
