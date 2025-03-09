
import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { Room3D } from './spaces/Room3D';
import { Hallway3D } from './spaces/Hallway3D';
import { Door3D } from './spaces/Door3D';
import { SpaceConnection } from './SpaceConnection';
import { SceneLighting } from './SceneLighting';
import * as THREE from 'three';

interface ThreeDSceneProps {
  objects: FloorPlanNode[];
  connections: any[];
  onObjectSelect: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any | null;
  showLabels?: boolean;
}

export function ThreeDScene({ 
  objects, 
  connections,
  onObjectSelect, 
  selectedObjectId = null,
  previewData = null,
  showLabels = true
}: ThreeDSceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Group objects by type for better rendering
  const roomObjects = objects.filter(obj => obj.type === 'room');
  const hallwayObjects = objects.filter(obj => obj.type === 'hallway');
  const doorObjects = objects.filter(obj => obj.type === 'door');
  
  // Find visible connections between spaces
  const visibleConnections = connections.filter(conn => {
    const sourceObj = objects.find(obj => obj.id === conn.source);
    const targetObj = objects.find(obj => obj.id === conn.target);
    return sourceObj && targetObj;
  });

  // Prepare connection data for spaces
  const objectConnectionMap = new Map<string, string[]>();
  
  visibleConnections.forEach(conn => {
    if (conn.source && conn.target) {
      // Add target to source's connections
      if (!objectConnectionMap.has(conn.source)) {
        objectConnectionMap.set(conn.source, []);
      }
      objectConnectionMap.get(conn.source)?.push(conn.target);
      
      // Add source to target's connections
      if (!objectConnectionMap.has(conn.target)) {
        objectConnectionMap.set(conn.target, []);
      }
      objectConnectionMap.get(conn.target)?.push(conn.source);
    }
  });
  
  // Initialize camera position based on scene contents
  useEffect(() => {
    if (camera && objects.length > 0 && !hasInitialized) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      objects.forEach(obj => {
        const x = obj.position.x;
        const y = obj.position.y;
        const width = obj.data.size?.width || 100;
        const height = obj.data.size?.height || 100;
        
        minX = Math.min(minX, x - width/2);
        maxX = Math.max(maxX, x + width/2);
        minY = Math.min(minY, y - height/2);
        maxY = Math.max(maxY, y + height/2);
      });
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const sceneWidth = maxX - minX;
      const sceneDepth = maxY - minY;
      const maxDimension = Math.max(sceneWidth, sceneDepth, 500); // Minimum size for empty scenes
      const cameraDistance = maxDimension * 1.2;
      
      camera.position.set(centerX, cameraDistance * 0.8, centerY + cameraDistance);
      camera.lookAt(centerX, 0, centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
      
      setHasInitialized(true);
    }
  }, [camera, objects, hasInitialized]);

  // Focus camera on selected object
  useEffect(() => {
    if (controlsRef.current && selectedObjectId) {
      const selectedObject = objects.find(obj => obj.id === selectedObjectId);
      if (selectedObject) {
        const targetX = selectedObject.position.x;
        const targetY = selectedObject.position.y;
        const targetZ = 0;
        
        controlsRef.current.target.set(targetX, targetZ, targetY);
        controlsRef.current.update();
      }
    }
  }, [selectedObjectId, objects]);

  // Determine connection type
  const getConnectionType = (conn: any) => {
    if (!conn) return 'standard';
    
    const sourceObj = objects.find(obj => obj.id === conn.source);
    const targetObj = objects.find(obj => obj.id === conn.target);
    
    if (!sourceObj || !targetObj) return 'standard';
    
    if (conn.connection_type === 'door') return 'door';
    if (conn.is_emergency_exit) return 'emergency';
    
    if (sourceObj.type === 'hallway' && targetObj.type === 'hallway') {
      return 'hallway';
    }
    
    if (sourceObj.type === 'hallway' || targetObj.type === 'hallway') {
      return 'hallway';
    }
    
    return 'direct';
  };

  return (
    <>
      <SceneLighting />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={100}
        maxDistance={2000}
      />
      
      <group>
        {/* Floor plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[5000, 5000]} />
          <meshStandardMaterial color="#f3f4f6" roughness={0.8} metalness={0.1} />
        </mesh>
        
        {/* Grid for better spatial awareness */}
        <Grid 
          infiniteGrid 
          cellSize={20} 
          cellThickness={0.6} 
          cellColor="#94a3b8" 
          sectionSize={100}
          sectionThickness={1.5}
          sectionColor="#475569"
          fadeDistance={1500}
          fadeStrength={1.5}
          position={[0, -1, 0]}
        />
        
        {/* Render connections between spaces */}
        {visibleConnections.map((conn, idx) => {
          const sourceObj = objects.find(obj => obj.id === conn.source);
          const targetObj = objects.find(obj => obj.id === conn.target);
          
          if (!sourceObj || !targetObj) return null;
          
          const connectionType = getConnectionType(conn);
          
          return (
            <SpaceConnection 
              key={`conn-${idx}`}
              from={sourceObj}
              to={targetObj}
              type={connectionType}
              isDashed={connectionType !== 'hallway' && connectionType !== 'direct'}
            />
          );
        })}
        
        {/* Render hallways first (lower) */}
        {hallwayObjects.map(obj => {
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
                rotation: previewData.data?.rotation ?? obj.data.rotation
              }
            };
          }
          
          const isSelected = selectedObjectId === obj.id;
          const rotation = objectData.data?.rotation !== undefined 
            ? objectData.data.rotation 
            : (objectData.rotation || 0);
          
          // Add connection data to properties
          const enhancedProperties = {
            ...objectData.data?.properties,
            connected_spaces: objectConnectionMap.get(obj.id) || []
          };
          
          // Find spaces connected to this hallway
          const connectedSpaces = objects.filter(otherObj => {
            return objectConnectionMap.get(obj.id)?.includes(otherObj.id);
          });
          
          return (
            <Hallway3D
              key={obj.id}
              id={obj.id}
              position={objectData.position}
              size={objectData.data.size}
              rotation={rotation}
              color={obj.data?.style?.backgroundColor || '#e5e7eb'}
              onClick={onObjectSelect}
              isSelected={isSelected}
              properties={enhancedProperties}
              label={obj.data?.label || 'Hallway'}
              showLabels={showLabels}
              connectedSpaces={connectedSpaces}
            />
          );
        })}
        
        {/* Render doors */}
        {doorObjects.map(obj => {
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
                rotation: previewData.data?.rotation ?? obj.data.rotation
              }
            };
          }
          
          const isSelected = selectedObjectId === obj.id;
          const rotation = objectData.data?.rotation !== undefined 
            ? objectData.data.rotation 
            : (objectData.rotation || 0);
            
          // Add connection data to properties
          const enhancedProperties = {
            ...objectData.data?.properties,
            connected_spaces: objectConnectionMap.get(obj.id) || []
          };
          
          return (
            <Door3D
              key={obj.id}
              id={obj.id}
              position={objectData.position}
              size={objectData.data.size || {width: 40, height: 15}}
              rotation={rotation}
              color={obj.data?.style?.backgroundColor || '#94a3b8'}
              onClick={onObjectSelect}
              isSelected={isSelected}
              properties={enhancedProperties}
              label={obj.data?.label}
              showLabels={showLabels}
            />
          );
        })}
        
        {/* Render rooms */}
        {roomObjects.map(obj => {
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
                rotation: previewData.data?.rotation ?? obj.data.rotation
              }
            };
          }
          
          const isSelected = selectedObjectId === obj.id;
          const rotation = objectData.data?.rotation !== undefined 
            ? objectData.data.rotation 
            : (objectData.rotation || 0);
            
          // Add connection data to properties
          const enhancedProperties = {
            ...objectData.data?.properties,
            connected_spaces: objectConnectionMap.get(obj.id) || []
          };
          
          return (
            <Room3D 
              key={obj.id}
              id={obj.id}
              position={objectData.position}
              size={objectData.data.size}
              rotation={rotation}
              color={obj.data?.style?.backgroundColor || '#e2e8f0'}
              onClick={onObjectSelect}
              isSelected={isSelected}
              properties={enhancedProperties}
              label={obj.data?.label || ''}
              showLabels={showLabels}
            />
          );
        })}
      </group>
    </>
  );
}
