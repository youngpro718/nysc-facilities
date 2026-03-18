
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ConnectionManagerProps {
  objects: any[];
  connections: any[];
  onCreateConnection: (from: string, to: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  enabled?: boolean;
}

interface DragState {
  isConnecting: boolean;
  fromObject: any | null;
  toObject: any | null;
  previewLine: THREE.Vector3[] | null;
}

export function ConnectionManager({ 
  objects, 
  connections, 
  onCreateConnection, 
  onDeleteConnection,
  enabled = true 
}: ConnectionManagerProps) {
  const { camera, raycaster, pointer } = useThree();
  const [dragState, setDragState] = useState<DragState>({
    isConnecting: false,
    fromObject: null,
    toObject: null,
    previewLine: null
  });

  const getObjectAtPosition = useCallback((position: THREE.Vector3) => {
    // Find object at the given position
    return objects.find(obj => {
      // Calculate distance without creating new Vector3
      const dx = position.x - obj.position.x;
      const dz = position.z - obj.position.y;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const size = obj.data?.size || { width: 150, height: 100 };
      return distance < Math.max(size.width, size.height) / 2;
    });
  }, [objects]);

  const startConnection = useCallback((fromObject: any) => {
    if (!enabled || !fromObject) return;
    
    setDragState({
      isConnecting: true,
      fromObject,
      toObject: null,
      previewLine: null
    });
  }, [enabled]);

  const updateConnectionPreview = useCallback((mousePosition: THREE.Vector2) => {
    if (!dragState.isConnecting || !dragState.fromObject) return;

    // Cast ray to get 3D position
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects([], true);
    
    if (intersects.length > 0) {
      const intersectPoint = intersects[0].point;
      // Create fromPos as Vector3 without inline creation
      const fromPos = new THREE.Vector3();
      fromPos.set(
        dragState.fromObject.position.x,
        30,
        dragState.fromObject.position.y
      );
      
      setDragState(prev => ({
        ...prev,
        previewLine: [fromPos, intersectPoint]
      }));
    }
  }, [dragState.isConnecting, dragState.fromObject, camera, raycaster]);

  const finishConnection = useCallback((toObject: any) => {
    if (!dragState.isConnecting || !dragState.fromObject || !toObject) return;
    
    // Don't connect to self
    if (dragState.fromObject.id === toObject.id) {
      setDragState({
        isConnecting: false,
        fromObject: null,
        toObject: null,
        previewLine: null
      });
      return;
    }

    // Check if connection already exists
    const existingConnection = connections.find(conn => 
      (conn.source === dragState.fromObject.id && conn.target === toObject.id) ||
      (conn.source === toObject.id && conn.target === dragState.fromObject.id)
    );

    if (!existingConnection) {
      onCreateConnection(dragState.fromObject.id, toObject.id);
    }

    setDragState({
      isConnecting: false,
      fromObject: null,
      toObject: null,
      previewLine: null
    });
  }, [dragState.isConnecting, dragState.fromObject, connections, onCreateConnection]);

  const cancelConnection = useCallback(() => {
    setDragState({
      isConnecting: false,
      fromObject: null,
      toObject: null,
      previewLine: null
    });
  }, []);

  // Memoize the position array to avoid inline creation during render
  const positionArray = useMemo(() => {
    if (!dragState.previewLine) return null;
    
    // Create array without inline flatMap to avoid "lov" error
    const positions: number[] = [];
    for (const point of dragState.previewLine) {
      positions.push(point.x, point.y, point.z);
    }
    return new Float32Array(positions);
  }, [dragState.previewLine]);

  return (
    <group>
      {/* Connection preview line */}
      {dragState.previewLine && positionArray && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={positionArray}
              count={dragState.previewLine.length}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </line>
      )}
    </group>
  );
}