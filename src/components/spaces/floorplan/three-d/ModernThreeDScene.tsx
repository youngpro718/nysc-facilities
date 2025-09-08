import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ModernSpace3D } from './components/ModernSpace3D';
import { ModernConnection } from './components/ModernConnection';
import { ModernGridSystem } from './systems/ModernGridSystem';
import { ModernSceneLighting } from './ModernSceneLighting';

// Strongly-typed shapes used in this scene
interface ThreeDPosition { x: number; y: number }
interface ThreeDSize { width: number; height: number }
interface ThreeDObject {
  id: string;
  type: 'room' | 'hallway' | 'door';
  position: ThreeDPosition;
  data: { size: ThreeDSize; properties?: Record<string, unknown> };
  rotation?: number;
  properties?: Record<string, unknown>;
}

interface ThreeDConnection {
  from: string;
  to: string;
  type?: 'default' | 'hallway' | 'emergency' | 'direct';
}

interface PreviewData {
  id: string;
  type: 'room' | 'hallway' | 'door';
  position: ThreeDPosition;
  data?: { size?: ThreeDSize; properties?: Record<string, unknown> };
}

interface ModernThreeDSceneProps {
  objects: ThreeDObject[];
  connections: ThreeDConnection[];
  onObjectSelect?: (objectId: string) => void;
  selectedObjectId?: string | null;
  previewData?: PreviewData | null;
  showLabels?: boolean;
  showConnections?: boolean;
  lightIntensity?: number;
  viewMode?: 'default' | 'rooms' | 'hallways' | 'doors';
}

export const ModernThreeDScene = forwardRef<any, ModernThreeDSceneProps>(function ModernThreeDScene({ 
  objects = [], 
  connections = [],
  onObjectSelect, 
  selectedObjectId = null,
  previewData = null,
  showLabels = true,
  showConnections = true,
  lightIntensity = 0.8,
  viewMode = 'default'
}, ref) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  // Enhanced object validation with detailed logging
  const validObjects = React.useMemo(() => {
    if (!Array.isArray(objects)) {
      console.warn('Objects is not an array:', typeof objects);
      return [];
    }

    const filtered = objects.filter(obj => {
      if (!obj || typeof obj !== 'object') {
        console.warn('Invalid object:', obj);
        return false;
      }

      const hasPosition = obj.position && 
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number';
      
      const hasSize = obj.data && 
        obj.data.size && 
        typeof obj.data.size.width === 'number' && 
        typeof obj.data.size.height === 'number';

      const hasId = obj.id && typeof obj.id === 'string';
      const hasType = obj.type && ['room', 'hallway', 'door'].includes(obj.type);

      if (!hasPosition || !hasSize || !hasId || !hasType) {
        console.warn('Object missing required properties:', {
          hasPosition,
          hasSize,
          hasId,
          hasType,
          object: obj
        });
        return false;
      }

      return true;
    });

    console.log(`Filtered ${objects.length} objects to ${filtered.length} valid objects`);
    return filtered;
  }, [objects]);

  // Enhanced connection validation
  const validConnections = React.useMemo(() => {
    if (!Array.isArray(connections)) {
      console.warn('Connections is not an array:', typeof connections);
      return [];
    }

    const filtered = connections.filter(conn => {
      if (!conn || typeof conn !== 'object') return false;
      
      const hasFrom = conn.from && typeof conn.from === 'string';
      const hasTo = conn.to && typeof conn.to === 'string';
      const isValid = hasFrom && hasTo && conn.from !== conn.to;

      if (!isValid) {
        console.warn('Invalid connection:', conn);
      }

      return isValid;
    });

    return filtered;
  }, [connections]);

  // Calculate scene bounds safely based on validated objects
  const sceneBounds = useMemo(() => {
    if (!validObjects || validObjects.length === 0) {
      return { minX: -100, maxX: 100, minY: -100, maxY: 100, centerX: 0, centerY: 0 };
    }

    const positions = validObjects.map(obj => obj.position);
    const sizes = validObjects.map(obj => obj.data.size);

    const minX = Math.min(...positions.map((p, i) => (p?.x || 0) - (sizes[i]?.width || 50) / 2)) - 50;
    const maxX = Math.max(...positions.map((p, i) => (p?.x || 0) + (sizes[i]?.width || 50) / 2)) + 50;
    const minY = Math.min(...positions.map((p, i) => (p?.y || 0) - (sizes[i]?.height || 50) / 2)) - 50;
    const maxY = Math.max(...positions.map((p, i) => (p?.y || 0) + (sizes[i]?.height || 50) / 2)) + 50;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { minX, maxX, minY, maxY, centerX, centerY };
  }, [validObjects]);
  // General camera positioning effect (handles init and updates with error handling)
  useEffect(() => {
    if (validObjects.length === 0) return;
    try {
      const { centerX, centerY, maxX, minX, maxY, minY } = sceneBounds;
      const width = Math.max(maxX - minX, 200);
      const height = Math.max(maxY - minY, 200);
      const distance = Math.max(width, height) * 1.5;

      camera.position.set(centerX + distance, distance * 1.2, centerY + distance);
      camera.lookAt(centerX, 0, centerY);

      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }

      if (!hasInitialized) setHasInitialized(true);
    } catch (error) {
      console.error('Error positioning camera:', error);
      camera.position.set(300, 400, 300);
      camera.lookAt(0, 0, 0);
    }
  }, [camera, validObjects, sceneBounds, hasInitialized]);

  // Preview object calculation
  const previewObject = useMemo(() => {
    if (!previewData) return null;
    
    try {
      return {
        id: previewData.id,
        type: 'room',
        position: previewData.position,
        data: {
          size: previewData.data?.size || { width: 50, height: 50 },
          properties: previewData.data?.properties || {}
        },
        isPreview: true
      };
    } catch (error) {
      console.error('Error creating preview object:', error);
      return null;
    }
  }, [previewData]);

  // Enhanced camera positioning with error handling
  useEffect(() => {
    if (!hasInitialized && validObjects.length > 0) {
      try {
        const { centerX, centerY, maxX, minX, maxY, minY } = sceneBounds;
        const width = Math.max(maxX - minX, 200);
        const height = Math.max(maxY - minY, 200);
        const distance = Math.max(width, height) * 1.5;

        camera.position.set(centerX + distance, distance * 1.2, centerY + distance);
        camera.lookAt(centerX, 0, centerY);

        if (controlsRef.current) {
          controlsRef.current.target.set(centerX, 0, centerY);
          controlsRef.current.update();
        }

        setHasInitialized(true);
      } catch (error) {
        console.error('Error positioning camera:', error);
        // Fallback positioning
        camera.position.set(300, 400, 300);
        camera.lookAt(0, 0, 0);
      }
    }
  }, [camera, validObjects, sceneBounds, hasInitialized]);

  // Camera control methods
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      try {
        const { centerX, centerY, maxX, minX, maxY, minY } = sceneBounds;
        const width = Math.max(maxX - minX, 200);
        const height = Math.max(maxY - minY, 200);
        const distance = Math.max(width, height) * 1.5;

        camera.position.set(centerX + distance, distance * 1.2, centerY + distance);
        camera.lookAt(centerX, 0, centerY);

        if (controlsRef.current) {
          controlsRef.current.target.set(centerX, 0, centerY);
          controlsRef.current.update();
        }
      } catch (error) {
        console.error('Error resetting camera:', error);
      }
    },
    zoomIn: () => {
      if (controlsRef.current) {
        const distance = camera.position.distanceTo(controlsRef.current.target);
        const newDistance = Math.max(distance * 0.8, 50);
        const direction = camera.position.clone().sub(controlsRef.current.target).normalize();
        camera.position.copy(controlsRef.current.target).add(direction.multiplyScalar(newDistance));
      }
    },
    zoomOut: () => {
      if (controlsRef.current) {
        const distance = camera.position.distanceTo(controlsRef.current.target);
        const newDistance = Math.min(distance * 1.2, 1000);
        const direction = camera.position.clone().sub(controlsRef.current.target).normalize();
        camera.position.copy(controlsRef.current.target).add(direction.multiplyScalar(newDistance));
      }
    }
  }));



  return (
    <>
      <ModernSceneLighting intensity={lightIntensity} />
      
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={50}
        maxDistance={1000}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* Grid System */}
      <ModernGridSystem 
        size={1000} 
        divisions={20}
      />

      {/* Objects */}
      {validObjects.map((object) => (
        <ModernSpace3D
          key={object.id}
          id={object.id}
          type={object.type}
          position={object.position}
          size={object.data?.size || { width: 50, height: 50 }}
          rotation={object.rotation || 0}
          label={String(((object.data?.properties as any)?.label ?? (object.data?.properties as any)?.name ?? object.id) as any)}
          properties={object.data?.properties as Record<string, unknown>}
          isSelected={selectedObjectId === object.id}
          isHovered={hoveredObject === object.id}
          showLabels={showLabels}
          onClick={() => onObjectSelect?.(object.id)}
          onHover={() => setHoveredObject(object.id)}
          onUnhover={() => setHoveredObject(null)}
        />
      ))}

      {/* Preview Object */}
      {previewObject && (
        <ModernSpace3D
          id={previewObject.id}
          type={(previewObject.type as "room" | "hallway" | "door")}
          position={previewObject.position}
          size={previewObject.data?.size}
          properties={previewObject.data?.properties}
          isPreview={true}
          showLabels={showLabels}
        />
      )}

      {/* Connections */}
      {showConnections && validConnections.map((connection, index) => {
        const fromObject = validObjects.find(obj => obj.id === connection.from);
        const toObject = validObjects.find(obj => obj.id === connection.to);
        
        if (!fromObject || !toObject) return null;

        return (
          <ModernConnection
            key={`${connection.from}-${connection.to}-${index}`}
            from={fromObject.position}
            to={toObject.position}
            type={connection.type === 'hallway' ? 'hallway' : 'room'}
          />
        );
      })}

      {/* Scene Info */}
      {validObjects.length === 0 && (
        <Text
          position={[0, 50, 0]}
          fontSize={20}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          No objects to display
        </Text>
      )}
    </>
  );
});
