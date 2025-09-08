import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Space3D } from './components/Space3D';
import { SimpleConnection } from './components/SimpleConnection';
import { GridSystem } from './systems/GridSystem';
import { SceneLighting } from './SceneLighting';
import { PositionUtils } from './utils/PositionUtils';
import * as THREE from 'three';
import { 
  FloorPlanObject, 
  Connection, 
  SceneProps, 
  SceneRef, 
  SceneState,
  SceneConfiguration,
  HallwayLayoutConfig
} from './types/SceneTypes';

// Default configurations to make parameters configurable
const DEFAULT_SCENE_CONFIG: SceneConfiguration = {
  gridSize: 50,
  lightIntensity: 0.8,
  cameraDistance: 1000,
  enableDamping: true,
  dampingFactor: 0.1,
  rotateSpeed: 0.5,
  maxPolarAngle: Math.PI / 2 - 0.1,
  minDistance: 100,
  maxDistance: 3000,
};

const DEFAULT_HALLWAY_CONFIG: HallwayLayoutConfig = {
  width: 120,
  segmentLength: 200,
  cornerRadius: 50,
  wallThickness: 10,
  floorOffset: -5,
};

interface ThreeDSceneProps {
  objects: FloorPlanObject[];
  connections: Connection[];
  onObjectSelect?: (objectId: string) => void;
  selectedObjectId?: string | null;
  previewData?: FloorPlanObject | null;
  showLabels?: boolean;
  showConnections?: boolean;
  lightIntensity?: number;
  viewMode?: 'default' | 'rooms' | 'hallways' | 'doors';
  configuration?: Partial<SceneConfiguration>;
  hallwayConfig?: Partial<HallwayLayoutConfig>;
  enableDebugLogs?: boolean;
}

// Generate stable IDs instead of using Math.random()
let idCounter = 0;
const generateStableId = (prefix: string = 'id') => `${prefix}_${++idCounter}_${Date.now()}`;

export const ThreeDScene = forwardRef<SceneRef, ThreeDSceneProps>(function ThreeDScene({ 
  objects = [], 
  connections = [],
  onObjectSelect, 
  selectedObjectId = null,
  previewData = null,
  showLabels = true,
  showConnections = true,
  lightIntensity,
  viewMode = 'default',
  configuration = {},
  hallwayConfig = {},
  enableDebugLogs = false
}, ref) {
  // Merge configurations with defaults
  const config = useMemo(() => ({ ...DEFAULT_SCENE_CONFIG, ...configuration }), [configuration]);
  const hallwayLayoutConfig = useMemo(() => ({ ...DEFAULT_HALLWAY_CONFIG, ...hallwayConfig }), [hallwayConfig]);
  const effectiveLightIntensity = lightIntensity ?? config.lightIntensity;

  // Memoized object validation to prevent re-initialization on every data change
  const validatedObjects = useMemo(() => {
    if (!Array.isArray(objects)) {
      if (enableDebugLogs) console.warn('Objects is not an array:', typeof objects);
      return [];
    }

    return objects.filter(obj => {
      if (!obj || typeof obj !== 'object') {
        if (enableDebugLogs) console.warn('Invalid object:', obj);
        return false;
      }
      
      if (!obj.position || typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') {
        if (enableDebugLogs) console.warn('Invalid position:', obj.position);
        return false;
      }
      
      if (!obj.size || typeof obj.size.width !== 'number' || typeof obj.size.height !== 'number') {
        if (enableDebugLogs) console.warn('Invalid size:', obj.size);
        return false;
      }
      
      return true;
    });
  }, [objects, enableDebugLogs]); // Remove rooms and connections from dependency array

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Initialize loading state based on rendering mode
  const [sceneState, setSceneState] = useState<SceneState>({
    hasInitialized: false,
    selectedObjectId: selectedObjectId || null,
    hoveredObjectId: null,
    connectingFromId: null,
    isLoading: validatedObjects.length === 0,
    renderMode: viewMode
  });
  
  const positionUtils = useMemo(() => new PositionUtils(config.gridSize), [config.gridSize]);

  // Memoized bounds calculation
  const sceneBounds = useMemo(() => {
    if (!validatedObjects.length) {
      return {
        minX: -500,
        maxX: 500,
        minY: -500,
        maxY: 500,
        centerX: 0,
        centerY: 0
      };
    }
    
    const bounds = validatedObjects.reduce((acc, obj) => {
      const { x, y } = obj.position;
      const { width, height } = obj.size;
      return {
        minX: Math.min(acc.minX, x - width / 2),
        maxX: Math.max(acc.maxX, x + width / 2),
        minY: Math.min(acc.minY, y - height / 2),
        maxY: Math.max(acc.maxY, y + height / 2),
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    
    return {
      ...bounds,
      centerX: (bounds.minX + bounds.maxX) / 2,
      centerY: (bounds.minY + bounds.maxY) / 2
    };
  }, [validatedObjects]);

  // Use raw 2D coordinates/sizes to match 2D view exactly

  // Camera control methods
  const fitToFloor = useCallback(() => {
    if (!validatedObjects.length) return;
    
    const maxDim = Math.max(
      sceneBounds.maxX - sceneBounds.minX, 
      sceneBounds.maxY - sceneBounds.minY, 
      600
    );
    const distance = maxDim * 1.5;
    
    camera.position.set(
      sceneBounds.centerX, 
      distance * 0.7, 
      sceneBounds.centerY + distance * 0.7
    );
    camera.lookAt(sceneBounds.centerX, 0, sceneBounds.centerY);
    
    if (controlsRef.current) {
      controlsRef.current.target.set(sceneBounds.centerX, 0, sceneBounds.centerY);
      controlsRef.current.update();
    }
  }, [validatedObjects.length, sceneBounds, camera]);

  const focusObject = useCallback((objectId: string) => {
    const object = validatedObjects.find(obj => obj.id === objectId);
    if (object && controlsRef.current) {
      controlsRef.current.target.set(object.position.x - sceneBounds.centerX, 0, object.position.y - sceneBounds.centerY);
      controlsRef.current.update();
    }
  }, [validatedObjects]);

  const resetCamera = useCallback(() => {
    camera.position.set(0, config.cameraDistance, config.cameraDistance);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera, config.cameraDistance]);

  const getSceneState = useCallback(() => sceneState, [sceneState]);

  // Implement SceneRef interface
  useImperativeHandle(ref, () => ({
    fitToFloor,
    focusObject,
    resetCamera,
    getSceneState
  }), [fitToFloor, focusObject, resetCamera, getSceneState]);
  
  // Memoized filtered objects by view mode
  const visibleObjects = useMemo(() => {
    return validatedObjects.filter(obj => {
      switch (viewMode) {
        case 'rooms': return obj.type === 'room';
        case 'hallways': return obj.type === 'hallway';
        case 'doors': return obj.type === 'door';
        default: return true;
      }
    });
  }, [validatedObjects, viewMode]);
  
  // Filter valid connections
  const validConnections = showConnections ? (connections || []).filter(conn => {
    if (!conn?.source || !conn?.target) return false;
    
    const sourceObj = visibleObjects.find(obj => obj.id === conn.source);
    const targetObj = visibleObjects.find(obj => obj.id === conn.target);
    
    return sourceObj && targetObj;
  }) : [];

  // Simplified connection mapping
  const connectionMap = new Map<string, string[]>();
  validConnections.forEach(conn => {
    if (!connectionMap.has(conn.source)) connectionMap.set(conn.source, []);
    if (!connectionMap.has(conn.target)) connectionMap.set(conn.target, []);
    connectionMap.get(conn.source)?.push(conn.target);
    connectionMap.get(conn.target)?.push(conn.source);
  });
  
  // Fix cleanup function in initialization effect
  useEffect(() => {
    if (camera && visibleObjects.length > 0 && !sceneState.hasInitialized) {
      const maxDim = Math.max(600, Math.max(...visibleObjects.map(obj => {
        return Math.max(obj.size.width || 150, obj.size.height || 100);
      })));
      
      camera.position.set(sceneBounds.centerX, maxDim, sceneBounds.centerY + maxDim);
      camera.lookAt(sceneBounds.centerX, 0, sceneBounds.centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(sceneBounds.centerX, 0, sceneBounds.centerY);
        controlsRef.current.update();
      }
      
      setSceneState(prev => ({ ...prev, hasInitialized: true, isLoading: false }));
    }
    
    // Cleanup function
    return () => {
      if (enableDebugLogs) {
        console.log('ThreeDScene effect cleanup');
      }
    };
  }, [camera, sceneState.hasInitialized, enableDebugLogs]); // visibleObjects intentionally omitted

  // Simplified camera focus
  useEffect(() => {
    if (controlsRef.current && selectedObjectId) {
      const selected = visibleObjects.find(obj => obj.id === selectedObjectId);
      
      if (selected) {
        if (controlsRef.current) {
          controlsRef.current.target.set(selected.position.x, 0, selected.position.y);
          controlsRef.current.update();
        }
      }
    }
  }, [selectedObjectId, visibleObjects]);

  // Improved connection type detection
  const getConnectionType = useCallback((conn: any): 'hallway' | 'emergency' | 'direct' => {
    if (conn.data?.type === 'emergency' || conn.is_emergency_exit) return 'emergency';
    const sourceObj = visibleObjects.find(obj => obj.id === conn.source);
    const targetObj = visibleObjects.find(obj => obj.id === conn.target);
    
    if (sourceObj?.type === 'hallway' || targetObj?.type === 'hallway') return 'hallway';
    return 'direct';
  }, [visibleObjects]);

  // Improved object click handler with consistent error handling
  const handleObjectClick = useCallback((objectId: string) => {
    setSceneState(prev => {
      const newConnectingFromId = prev.connectingFromId === null ? objectId : null;
      
      if (prev.connectingFromId !== null && prev.connectingFromId !== objectId) {
        // Create connection
        const connection = { 
          id: generateStableId('conn'), 
          source: prev.connectingFromId, 
          target: objectId 
        };
        if (enableDebugLogs) {
          console.log('Creating connection:', connection);
        }
        // onConnectionCreate?.(connection);
      }
      
      return {
        ...prev,
        connectingFromId: newConnectingFromId,
        selectedObjectId: objectId
      };
    });
    
    onObjectSelect?.(objectId);
  }, [onObjectSelect, enableDebugLogs]);

  return (
    <>
      <SceneLighting intensity={effectiveLightIntensity} />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping={config.enableDamping}
        dampingFactor={config.dampingFactor}
        rotateSpeed={config.rotateSpeed}
        maxPolarAngle={config.maxPolarAngle}
        minDistance={config.minDistance}
        maxDistance={config.maxDistance}
      />
      
      <GridSystem enabled={config.gridSize > 0} gridSize={config.gridSize} />
      
      <group>
        {/* Render connections */}
        {validConnections.map((conn, idx) => {
          const sourceObj = visibleObjects.find(obj => obj.id === conn.source);
          const targetObj = visibleObjects.find(obj => obj.id === conn.target);
          
          if (!sourceObj || !targetObj) return null;
          
          const connectionType = getConnectionType(conn);
          const isHighlighted = selectedObjectId && 
            (conn.source === selectedObjectId || conn.target === selectedObjectId);
          
          return (
            <SimpleConnection 
              key={`conn-${idx}`}
              from={sourceObj.position}
              to={targetObj.position}
              type={connectionType}
              isHighlighted={isHighlighted}
            />
          );
        })}
        
        {/* Render all spaces using unified component */}
        {visibleObjects.map(obj => {
          let objectData = obj;
          if (previewData && previewData.id === obj.id) {
            objectData = {
              ...obj,
              position: previewData.position || obj.position,
              rotation: previewData.rotation ?? obj.rotation,
              size: previewData.size || obj.size,
              // Handle data properties safely
              ...(previewData.data && {
                data: {
                  ...obj.data,
                  ...previewData.data
                }
              })
            };
          }
          
          const isSelected = selectedObjectId === obj.id;
          const rotation = objectData.rotation || 0;
          const renderPos = objectData.position;
          const renderSize = objectData.size;
          
          return (
            <Space3D
              key={obj.id}
              id={obj.id}
              type={obj.type as 'room' | 'hallway' | 'door'}
              position={renderPos}
              size={renderSize}
              rotation={rotation}
              label={obj.label || obj.data?.name || (obj.data as any)?.room_number || `${obj.type}-${obj.id}`}
              properties={objectData.data?.properties}
              isSelected={isSelected}
              showLabels={showLabels}
              onClick={handleObjectClick}
              onStartConnection={() => handleObjectClick(obj.id)}
              onFinishConnection={() => handleObjectClick(obj.id)}
              isConnecting={sceneState.connectingFromId === obj.id}
            />
          );
        })}
      </group>
    </>
  );
});