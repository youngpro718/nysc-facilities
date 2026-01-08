import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { BlueprintScene } from './blueprint';
import { STATUS_COLORS, TYPE_COLORS } from './blueprint/blueprintMaterials';

interface RoomData {
  id: string;
  position: { x: number; y: number; z?: number };
  size?: { width: number; height: number; depth?: number };
  name?: string;
  type?: string;
  status?: string;
  room_number?: string;
}

interface ConnectionData {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'standard' | 'emergency' | 'highTraffic';
}

interface BlueprintFloorPlanProps {
  rooms: RoomData[];
  connections?: ConnectionData[];
  selectedRoomId?: string | null;
  hoveredRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  onRoomHover?: (roomId: string | null) => void;
  showIcons?: boolean;
  showConnections?: boolean;
  showLegend?: boolean;
  labelScale?: number;
  className?: string;
}

const LoadingFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-sky-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sky-700 font-medium">Loading Blueprint...</p>
    </div>
  </div>
);

const Legend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
    <h4 className="font-semibold text-slate-700 mb-2">Status</h4>
    <div className="space-y-1">
      {Object.entries(STATUS_COLORS).slice(0, 4).map(([key, color]) => (
        <div key={key} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }} 
          />
          <span className="capitalize text-slate-600">{key}</span>
        </div>
      ))}
    </div>
  </div>
);

const BlueprintFloorPlan: React.FC<BlueprintFloorPlanProps> = ({
  rooms,
  connections = [],
  selectedRoomId = null,
  hoveredRoomId = null,
  onRoomClick,
  onRoomHover,
  showIcons = true,
  showConnections = true,
  showLegend = true,
  labelScale = 1,
  className = ''
}) => {
  // Calculate grid size based on room positions
  const gridSize = useMemo(() => {
    if (!rooms.length) return 1000;
    
    let maxDist = 0;
    rooms.forEach(room => {
      const dist = Math.max(Math.abs(room.position.x), Math.abs(room.position.y));
      maxDist = Math.max(maxDist, dist);
    });
    
    return Math.max(1000, maxDist * 3);
  }, [rooms]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{
            position: [300, 400, 300],
            fov: 50,
            near: 1,
            far: 5000
          }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <BlueprintScene
            rooms={rooms}
            connections={connections}
            selectedRoomId={selectedRoomId}
            hoveredRoomId={hoveredRoomId}
            onRoomClick={onRoomClick}
            onRoomHover={onRoomHover}
            showIcons={showIcons}
            showConnections={showConnections}
            labelScale={labelScale}
            gridSize={gridSize}
          />
        </Canvas>
      </Suspense>

      {/* Legend overlay */}
      {showLegend && <Legend />}

      {/* Style indicator */}
      <div className="absolute top-4 right-4 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
        Blueprint View
      </div>
    </div>
  );
};

export default BlueprintFloorPlan;
