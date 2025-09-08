import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Scene3DManager, RoomData, ConnectionData, Scene3DOptions } from './Scene3DManager';
import { createMultiHallwayLayout } from '../utils/hallwayLayout';

interface FloorPlanRendererProps {
  rooms: any[];
  connections: any[];
  selectedRoomId?: string | null;
  hoveredRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  onRoomHover?: (roomId: string | null) => void;
  className?: string;
  fallbackTo2D?: boolean;
  scene3DOptions?: Scene3DOptions;
}

interface FloorPlanState {
  is3DMode: boolean;
  hasError: boolean;
  errorMessage: string;
  isLoading: boolean;
}

export const FloorPlanRenderer: React.FC<FloorPlanRendererProps> = ({
  rooms = [],
  connections = [],
  selectedRoomId = null,
  hoveredRoomId = null,
  onRoomClick,
  onRoomHover,
  className = '',
  fallbackTo2D = false,
  scene3DOptions = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<Scene3DManager | null>(null);
  
  const [state, setState] = useState<FloorPlanState>({
    is3DMode: !fallbackTo2D,
    hasError: false,
    errorMessage: '',
    isLoading: true
  });

  // Stable ID helpers (deterministic across renders)
  const hashString = useCallback((input: string): string => {
    // djb2 hash
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash) + input.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit int
    }
    return (hash >>> 0).toString(36); // unsigned, base36
  }, []);

  const stableRoomId = useCallback((room: any): string => {
    if (room?.id && typeof room.id === 'string') return room.id;
    const key = JSON.stringify({
      n: room?.name ?? room?.data?.label ?? room?.room_number ?? 'room',
      px: room?.position?.x ?? 0,
      py: room?.position?.y ?? 0,
      sw: room?.data?.size?.width ?? room?.size?.width ?? 100,
      sh: room?.data?.size?.height ?? room?.size?.height ?? 100,
      t: room?.type ?? 'room',
      r: room?.rotation ?? 0,
    });
    return `room-${hashString(key)}`;
  }, [hashString]);

  const stableConnectionId = useCallback((conn: any): string => {
    if (conn?.id && typeof conn.id === 'string') return conn.id;
    const key = JSON.stringify({
      fx: conn?.from?.x ?? 0,
      fy: conn?.from?.y ?? 0,
      tx: conn?.to?.x ?? 0,
      ty: conn?.to?.y ?? 0,
      t: conn?.type ?? 'direct'
    });
    return `conn-${hashString(key)}`;
  }, [hashString]);

  // Transform room data to the format expected by Scene3DManager
  const transformRoomData = useCallback((rooms: any[]): RoomData[] => {
    try {
      return rooms.map(room => ({
        id: stableRoomId(room),
        name: room.name || room.data?.label || room.room_number || `Room ${room.id?.slice(-4) || 'Unknown'}`,
        position: {
          x: Number(room.position?.x || 0),
          y: Number(room.position?.y || 0)
        },
        size: {
          width: Number(room.data?.size?.width || room.size?.width || 100),
          height: Number(room.data?.size?.height || room.size?.height || 100)
        },
        type: room.type || 'room',
        rotation: Number(room.rotation || 0)
      })).filter(room => 
        !isNaN(room.position.x) && 
        !isNaN(room.position.y) && 
        !isNaN(room.size.width) && 
        !isNaN(room.size.height) &&
        room.size.width > 0 &&
        room.size.height > 0
      );
    } catch (error) {
      console.error('FloorPlanRenderer: Error transforming room data:', error);
      return [];
    }
  }, [stableRoomId]);

  // Transform connection data to the format expected by Scene3DManager
  const transformConnectionData = useCallback((connections: any[]): ConnectionData[] => {
    try {
      return connections.map(conn => ({
        id: stableConnectionId(conn),
        from: {
          x: Number(conn.from?.x || 0),
          y: Number(conn.from?.y || 0)
        },
        to: {
          x: Number(conn.to?.x || 0),
          y: Number(conn.to?.y || 0)
        }
      })).filter(conn => 
        !isNaN(conn.from.x) && 
        !isNaN(conn.from.y) && 
        !isNaN(conn.to.x) && 
        !isNaN(conn.to.y)
      );
    } catch (error) {
      console.error('FloorPlanRenderer: Error transforming connection data:', error);
      return [];
    }
  }, [stableConnectionId]);

  // Initialize 3D scene
  const initialize3DScene = useCallback(async () => {
    if (!containerRef.current || !state.is3DMode) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, hasError: false }));

      // Create scene manager
      const sceneManager = new Scene3DManager(scene3DOptions);
      sceneManagerRef.current = sceneManager;

      // Mount to container
      sceneManager.mount(containerRef.current);

      // Setup interaction callbacks
      sceneManager.setRoomClickCallback((roomId: string, roomData: RoomData) => {
        console.log('Room clicked:', roomId, roomData);
        if (onRoomClick) {
          onRoomClick(roomId);
        }
      });

      sceneManager.setRoomHoverCallback((roomId: string | null, roomData?: RoomData) => {
        console.log('Room hovered:', roomId, roomData);
        if (onRoomHover) {
          onRoomHover(roomId);
        }
      });

      // Transform room data first
      const baseRooms = transformRoomData(rooms);
      
      // Create hallway layout if we have rooms
      let finalRooms: RoomData[] = baseRooms;
      let finalConnections: ConnectionData[] = transformConnectionData(connections);
      
      if (baseRooms.length > 0) {
        const hallwayLayout = createMultiHallwayLayout(baseRooms, Math.ceil(baseRooms.length / 6), {
          hallwayWidth: 80,
          roomSpacing: 180,
          hallwayLength: 800,
          startPosition: { x: 0, y: 0 }
        });
        
        // Combine rooms and hallways
        finalRooms = [...hallwayLayout.rooms, ...hallwayLayout.hallways];
        finalConnections = [...finalConnections, ...hallwayLayout.connections];
        
        console.log('FloorPlanRenderer: Created hallway layout with', hallwayLayout.hallways.length, 'hallways and', hallwayLayout.rooms.length, 'rooms');
      }

      sceneManager.updateRooms(finalRooms);
      sceneManager.updateConnections(finalConnections);

      setState(prev => ({ ...prev, isLoading: false }));
      console.log('FloorPlanRenderer: 3D scene initialized successfully');

    } catch (error) {
      console.error('FloorPlanRenderer: Error initializing 3D scene:', error);
      setState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [rooms, connections, state.is3DMode, scene3DOptions, transformRoomData, transformConnectionData]);

  // Cleanup 3D scene
  const cleanup3DScene = useCallback(() => {
    if (sceneManagerRef.current) {
      try {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
        console.log('FloorPlanRenderer: 3D scene cleaned up');
      } catch (error) {
        console.error('FloorPlanRenderer: Error cleaning up 3D scene:', error);
      }
    }
  }, []);

  // Switch to 2D fallback
  const switchTo2D = useCallback(() => {
    cleanup3DScene();
    setState(prev => ({
      ...prev,
      is3DMode: false,
      hasError: false,
      errorMessage: '',
      isLoading: false
    }));
  }, [cleanup3DScene]);

  // Retry 3D initialization
  const retry3D = useCallback(() => {
    cleanup3DScene();
    setState(prev => ({
      ...prev,
      is3DMode: true,
      hasError: false,
      errorMessage: '',
      isLoading: true
    }));
  }, [cleanup3DScene]);

  // Initialize scene on mount and when switching to 3D
  useEffect(() => {
    if (state.is3DMode && !state.hasError) {
      initialize3DScene();
    }
    
    return cleanup3DScene;
  }, [state.is3DMode, state.hasError, initialize3DScene, cleanup3DScene]);

  // Update rooms when data changes
  useEffect(() => {
    if (sceneManagerRef.current && state.is3DMode && !state.hasError) {
      try {
        const transformedRooms = transformRoomData(rooms);
        sceneManagerRef.current.updateRooms(transformedRooms);
      } catch (error) {
        console.error('FloorPlanRenderer: Error updating rooms:', error);
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Failed to update rooms'
        }));
      }
    }
  }, [rooms, state.is3DMode, state.hasError, transformRoomData]);

  // Update connections when data changes
  useEffect(() => {
    if (sceneManagerRef.current && state.is3DMode && !state.hasError) {
      try {
        const transformedConnections = transformConnectionData(connections);
        sceneManagerRef.current.updateConnections(transformedConnections);
      } catch (error) {
        console.error('FloorPlanRenderer: Error updating connections:', error);
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Failed to update connections'
        }));
      }
    }
  }, [connections, state.is3DMode, state.hasError, transformConnectionData]);

  // Update selection
  useEffect(() => {
    if (sceneManagerRef.current && state.is3DMode && !state.hasError) {
      try {
        sceneManagerRef.current.setRoomSelection(selectedRoomId);
      } catch (error) {
        console.error('FloorPlanRenderer: Error updating selection:', error);
      }
    }
  }, [selectedRoomId, state.is3DMode, state.hasError]);

  // Update hover
  useEffect(() => {
    if (sceneManagerRef.current && state.is3DMode && !state.hasError) {
      try {
        sceneManagerRef.current.setRoomHover(hoveredRoomId);
      } catch (error) {
        console.error('FloorPlanRenderer: Error updating hover:', error);
      }
    }
  }, [hoveredRoomId, state.is3DMode, state.hasError]);

  // Render 2D fallback
  const render2DFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">2D Floor Plan View</h3>
        <p className="text-gray-600 mb-4">
          {state.hasError ? 'Showing 2D view due to 3D rendering issues' : 'Displaying simplified floor plan'}
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Rooms: {rooms.length}</p>
          <p className="text-sm text-gray-500">Connections: {connections.length}</p>
        </div>
        {state.hasError && (
          <Button onClick={retry3D} variant="outline" size="sm" className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try 3D Again
          </Button>
        )}
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <Card className="w-full h-full">
      <CardContent className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3D Rendering Error</h3>
          <p className="text-gray-600 mb-4">{state.errorMessage}</p>
          <div className="space-x-2">
            <Button onClick={retry3D} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry 3D
            </Button>
            <Button onClick={switchTo2D} variant="default" size="sm">
              Switch to 2D
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D floor plan...</p>
      </div>
    </div>
  );

  return (
    <div className={`w-full h-full relative ${className}`}>
      {state.isLoading && state.is3DMode && renderLoading()}
      {state.hasError && state.is3DMode && renderError()}
      {!state.is3DMode && render2DFallback()}
      {state.is3DMode && !state.hasError && (
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
      )}
      
      {/* Mode toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={state.is3DMode ? switchTo2D : retry3D}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          {state.is3DMode ? '2D View' : '3D View'}
        </Button>
      </div>
    </div>
  );
};

export default FloorPlanRenderer;
