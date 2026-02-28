
import React, { useState, useCallback } from 'react';
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
  const { camera, raycaster, gl } = useThree();
  const [dragState, setDragState] = useState<DragState>({
    isConnecting: false,
    fromObject: null,
    toObject: null,
    previewLine: null
  });

  const getObjectAtPosition = useCallback((position: THREE.Vector3) => {
    // Find object at the given position using simple distance check
    return objects.find(obj => {
      // Use direct distance calculation to avoid inline Vector3 creation
      const dx = obj.position.x - position.x;
      const dy = obj.position.y - position.z; // position.z maps to obj.position.y
      const distance = Math.sqrt(dx * dx + dy * dy);
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

  return null; // This component doesn't render anything visual
}