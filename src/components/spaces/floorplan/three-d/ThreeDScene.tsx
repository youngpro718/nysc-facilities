import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { Space3D } from './components/Space3D';
import { SimpleConnection } from './components/SimpleConnection';
import { GridSystem } from './systems/GridSystem';
import { SceneLighting } from './SceneLighting';
import { PositionUtils } from './utils/PositionUtils';
import * as THREE from 'three';

interface ThreeDSceneProps {
  objects: FloorPlanNode[];
  connections: any[];
  onObjectSelect: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any | null;
  showLabels?: boolean;
  showConnections?: boolean;
  lightIntensity?: number;
  viewMode?: 'default' | 'rooms' | 'hallways' | 'doors';
}

import { forwardRef, useImperativeHandle } from 'react';

export const ThreeDScene = forwardRef<any, ThreeDSceneProps>(function ThreeDScene({ 
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
  // Simplified object validation
  const safeObjects = (objects || []).filter(obj => 
    obj && obj.position && obj.data && obj.data.size &&
    typeof obj.position.x === 'number' && typeof obj.position.y === 'number'
  );

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const positionUtils = new PositionUtils(50);

  // Simplified fit to floor method
  useImperativeHandle(ref, () => ({
    fitToFloor: () => {
      if (!safeObjects.length) return;
      
      const bounds = safeObjects.reduce((acc, obj) => {
        const { x, y } = obj.position;
        const { width, height } = obj.data.size;
        return {
          minX: Math.min(acc.minX, x - width / 2),
          maxX: Math.max(acc.maxX, x + width / 2),
          minY: Math.min(acc.minY, y - height / 2),
          maxY: Math.max(acc.maxY, y + height / 2),
        };
      }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const maxDim = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 600);
      const distance = maxDim * 1.5;
      
      camera.position.set(centerX, distance * 0.7, centerY + distance * 0.7);
      camera.lookAt(centerX, 0, centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
    }
  }), [safeObjects, camera]);
  
  // Filter objects by view mode
  const visibleObjects = safeObjects.filter(obj => {
    switch (viewMode) {
      case 'rooms': return obj.type === 'room';
      case 'hallways': return obj.type === 'hallway';
      case 'doors': return obj.type === 'door';
      default: return true;
    }
  });
  
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
  
  // Simplified camera initialization
  useEffect(() => {
    if (camera && visibleObjects.length > 0 && !hasInitialized) {
      const centerX = visibleObjects.reduce((sum, obj) => sum + obj.position.x, 0) / visibleObjects.length;
      const centerY = visibleObjects.reduce((sum, obj) => sum + obj.position.y, 0) / visibleObjects.length;
      const maxDim = Math.max(600, Math.max(...visibleObjects.map(obj => {
        const size = obj?.data?.size || { width: 150, height: 100 };
        return Math.max(size.width || 150, size.height || 100);
      })));
      
      camera.position.set(centerX, maxDim, centerY + maxDim);
      camera.lookAt(centerX, 0, centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
      
      setHasInitialized(true);
    }
  }, [camera, visibleObjects, hasInitialized]);

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

  // Simplified connection type detection
  const getConnectionType = (conn: any) => {
    if (conn.data?.type === 'emergency' || conn.is_emergency_exit) return 'emergency';
    const sourceObj = visibleObjects.find(obj => obj.id === conn.source);
    const targetObj = visibleObjects.find(obj => obj.id === conn.target);
    
    if (sourceObj?.type === 'hallway' || targetObj?.type === 'hallway') return 'hallway';
    return 'direct';
  };

  // Connection handlers
  const handleStartConnection = (fromId: string) => {
    setConnectingFromId(fromId);
  };

  const handleFinishConnection = (toId: string) => {
    if (connectingFromId && connectingFromId !== toId) {
      // Create connection logic would go here
      console.log('Creating connection from', connectingFromId, 'to', toId);
    }
    setConnectingFromId(null);
  };

  return (
    <>
      <SceneLighting intensity={lightIntensity} />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={100}
        maxDistance={3000}
      />
      
      <GridSystem enabled={true} gridSize={50} />
      
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
              data: {
                ...obj.data,
                size: previewData.data?.size || obj.data.size,
                properties: previewData.data?.properties || obj.data.properties,
              }
            };
          }
          
          const isSelected = selectedObjectId === obj.id;
          const rotation = objectData.rotation || 0;
          
          return (
            <Space3D
              key={obj.id}
              id={obj.id}
              type={obj.type as 'room' | 'hallway' | 'door'}
              position={objectData.position}
              size={objectData.data.size}
              rotation={rotation}
              label={obj.data?.label}
              properties={objectData.data?.properties}
              isSelected={isSelected}
              showLabels={showLabels}
              onClick={onObjectSelect}
              onStartConnection={handleStartConnection}
              onFinishConnection={handleFinishConnection}
              isConnecting={connectingFromId === obj.id}
            />
          );
        })}
      </group>
    </>
  );
});