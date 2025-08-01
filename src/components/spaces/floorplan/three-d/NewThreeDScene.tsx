import React, { useMemo } from 'react';
import { Scene3DErrorBoundary } from './core/Scene3DErrorBoundary';
import FloorPlanRenderer from './core/FloorPlanRenderer';

interface NewThreeDSceneProps {
  objects: any[];
  connections: any[];
  selectedObjectId?: string | null;
  hoveredObjectId?: string | null;
  onObjectClick?: (objectId: string) => void;
  onObjectHover?: (objectId: string | null) => void;
  className?: string;
  showConnections?: boolean;
  enableShadows?: boolean;
  backgroundColor?: number;
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
  enableShadows = true,
  backgroundColor = 0xf5f5f5
}) => {
  // Memoize scene options to prevent unnecessary re-renders
  const scene3DOptions = useMemo(() => ({
    enableShadows,
    backgroundColor,
    gridSize: 1000,
    cameraDistance: 500
  }), [enableShadows, backgroundColor]);

  // Filter and validate objects
  const validObjects = useMemo(() => {
    return objects.filter(obj => {
      if (!obj || typeof obj !== 'object') return false;
      if (!obj.id) return false;
      if (!obj.position || typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') return false;
      return true;
    });
  }, [objects]);

  // Filter and validate connections
  const validConnections = useMemo(() => {
    if (!showConnections) return [];
    
    return connections.filter(conn => {
      if (!conn || typeof conn !== 'object') return false;
      if (!conn.id) return false;
      if (!conn.from || typeof conn.from.x !== 'number' || typeof conn.from.y !== 'number') return false;
      if (!conn.to || typeof conn.to.x !== 'number' || typeof conn.to.y !== 'number') return false;
      return true;
    });
  }, [connections, showConnections]);

  // Create fallback component for error states
  const fallbackComponent = useMemo(() => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Floor Plan Unavailable</h3>
        <p className="text-gray-600 mb-4">
          Unable to display the 3D floor plan. Showing basic information instead.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Objects: {validObjects.length}</p>
          <p className="text-sm text-gray-500">Connections: {validConnections.length}</p>
        </div>
      </div>
    </div>
  ), [validObjects.length, validConnections.length]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Scene3DErrorBoundary 
        fallbackComponent={fallbackComponent}
        onError={(error, errorInfo) => {
          console.error('NewThreeDScene: Error in 3D scene:', error);
          console.error('NewThreeDScene: Component stack:', errorInfo.componentStack);
        }}
      >
        <FloorPlanRenderer
          rooms={validObjects}
          connections={validConnections}
          selectedRoomId={selectedObjectId}
          hoveredRoomId={hoveredObjectId}
          onRoomClick={onObjectClick}
          onRoomHover={onObjectHover}
          scene3DOptions={scene3DOptions}
          className="w-full h-full"
        />
      </Scene3DErrorBoundary>
    </div>
  );
};

export default NewThreeDScene;
