// @ts-nocheck
import React, { Suspense, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { BlueprintScene } from './blueprint';
import { STATUS_COLORS, TYPE_COLORS } from './blueprint/blueprintMaterials';
import type { SceneHandle } from './NewThreeDScene';

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
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-cyan-300 font-medium text-lg">Loading Blueprint...</p>
      <p className="text-slate-400 text-sm mt-1">Preparing 3D visualization</p>
    </div>
  </div>
);

const Legend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl p-4 text-sm border border-cyan-500/20">
    <h4 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      Room Status
    </h4>
    <div className="space-y-2">
      {[
        { key: 'active', label: 'Active', color: STATUS_COLORS.active },
        { key: 'maintenance', label: 'Maintenance', color: STATUS_COLORS.maintenance },
        { key: 'inactive', label: 'Inactive', color: STATUS_COLORS.inactive },
        { key: 'reserved', label: 'Reserved', color: STATUS_COLORS.reserved },
      ].map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-md shadow-lg" 
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}40`
            }} 
          />
          <span className="text-slate-300 font-medium">{label}</span>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-3 border-t border-slate-700">
      <h4 className="font-semibold text-cyan-300 mb-2">Room Types</h4>
      <div className="space-y-2">
        {[
          { key: 'courtroom', label: 'Courtroom' },
          { key: 'office', label: 'Office' },
          { key: 'conference', label: 'Conference' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-md opacity-60" 
              style={{ backgroundColor: TYPE_COLORS[key as keyof typeof TYPE_COLORS] || TYPE_COLORS.default }} 
            />
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BlueprintFloorPlan = forwardRef<SceneHandle, BlueprintFloorPlanProps>(({
  rooms,
  connections = [],
  selectedRoomId = null,
  hoveredRoomId = null,
  onRoomClick,
  onRoomHover,
  showIcons = true,
  showConnections = true,
  showLegend = false,
  labelScale = 1,
  className = ''
}, ref) => {
  const sceneRef = useRef<SceneHandle>(null);

  // Forward imperative methods
  useImperativeHandle(ref, () => ({
    resetCamera: () => sceneRef.current?.resetCamera(),
    zoomIn: () => sceneRef.current?.zoomIn(),
    zoomOut: () => sceneRef.current?.zoomOut(),
    fitToContent: () => sceneRef.current?.fitToContent(),
  }));

  // Calculate optimal camera position based on content bounds
  const { cameraPosition, gridSize } = useMemo(() => {
    if (!rooms.length) {
      return { cameraPosition: [200, 300, 200] as [number, number, number], gridSize: 800 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    rooms.forEach(room => {
      const w = room.size?.width || 100;
      const h = room.size?.height || 100;
      minX = Math.min(minX, room.position.x - w / 2);
      maxX = Math.max(maxX, room.position.x + w / 2);
      minY = Math.min(minY, room.position.y - h / 2);
      maxY = Math.max(maxY, room.position.y + h / 2);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const maxDimension = Math.max(width, height, 400);
    
    // Camera distance based on content size
    const distance = maxDimension * 1.2;
    
    return { 
      cameraPosition: [distance * 0.6, distance * 0.8, distance * 0.6] as [number, number, number],
      gridSize: Math.max(800, maxDimension * 1.5)
    };
  }, [rooms]);

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{
            position: cameraPosition,
            fov: 45,
            near: 1,
            far: 5000
          }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <BlueprintScene
            ref={sceneRef}
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
    </div>
  );
});

BlueprintFloorPlan.displayName = 'BlueprintFloorPlan';

export default BlueprintFloorPlan;
