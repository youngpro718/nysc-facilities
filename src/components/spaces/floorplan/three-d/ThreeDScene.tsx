import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { Room3D } from './spaces/Room3D';
import { Hallway3D } from './spaces/Hallway3D';
import { Door3D } from './spaces/Door3D';
import { SpaceConnection } from './SpaceConnection';
import { SceneLighting } from './SceneLighting';
import { SimpleControls } from './controls/SimpleControls';
import { GridSnapping } from './interactions/GridSnapping';
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
  // Defensive: filter out objects with missing required props
  const safeObjects = (objects || []).filter(obj => {
    if (!obj || !obj.position || !obj.data || !obj.data.size) return false;
    if (typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') return false;
    if (typeof obj.data.size.width !== 'number' || typeof obj.data.size.height !== 'number') return false;
    return true;
  });
  const { camera, gl, size } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [gridSnapping] = useState(new GridSnapping(50, true));
  const [gridEnabled, setGridEnabled] = useState(true);

  // Fit to floor method
  useImperativeHandle(ref, () => ({
    fitToFloor: () => {
      if (!safeObjects || safeObjects.length === 0) return;
      // Compute bounding box of all visible objects
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      safeObjects.forEach(obj => {
        const { x, y } = obj.position;
        const w = obj.data.size.width;
        const h = obj.data.size.height;
        minX = Math.min(minX, x - w / 2);
        maxX = Math.max(maxX, x + w / 2);
        minY = Math.min(minY, y - h / 2);
        maxY = Math.max(maxY, y + h / 2);
      });
      // Center
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      // Fit camera distance
      const sceneWidth = maxX - minX;
      const sceneHeight = maxY - minY;
      const maxDim = Math.max(sceneWidth, sceneHeight, 1);
      const fov = (camera as any).fov ? (camera as any).fov * (Math.PI / 180) : Math.PI / 4;
      const fitHeight = maxDim / (2 * Math.tan(fov / 2));
      const fitDist = fitHeight * 1.25 + 200; // Add margin
      camera.position.set(centerX, fitDist, centerY + 0.01); // avoid gimbal lock
      camera.lookAt(centerX, 0, centerY);
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
    }
  }), [safeObjects, camera, size]);
  
  // Group objects by type for better rendering
  const roomObjects = objects?.filter(obj => obj.type === 'room') || [];
  const hallwayObjects = objects?.filter(obj => obj.type === 'hallway') || [];
  const doorObjects = objects?.filter(obj => obj.type === 'door') || [];
  
  // Filter objects based on view mode
  const visibleObjects = {
    rooms: viewMode === 'default' || viewMode === 'rooms',
    hallways: viewMode === 'default' || viewMode === 'hallways',
    doors: viewMode === 'default' || viewMode === 'doors'
  };
  
  console.log('Rooms:', roomObjects.length, 'Hallways:', hallwayObjects.length, 'Doors:', doorObjects.length);
  
  // Find visible connections between spaces
  const visibleConnections = (connections || []).filter(conn => {
    // Skip if connections are hidden
    if (!showConnections) return false;
    if (!conn) return false;
    
    try {
      // Check if source and target exist
      if (!conn.source || !conn.target) {
        console.warn('Connection missing source or target:', conn);
        return false;
      }
      
      const sourceObj = objects?.find(obj => obj?.id === conn.source);
      const targetObj = objects?.find(obj => obj?.id === conn.target);
      
      // If either object is filtered out by view mode, don't show the connection
      if (!sourceObj || !targetObj) return false;
      
      // Add safety check for type property
      if (!sourceObj.type || !targetObj.type) {
        console.warn('Object missing type property:', sourceObj.id || targetObj.id);
        return false;
      }
      
      const sourceVisible = 
        (sourceObj.type === 'room' && visibleObjects.rooms) ||
        (sourceObj.type === 'hallway' && visibleObjects.hallways) ||
        (sourceObj.type === 'door' && visibleObjects.doors);
        
      const targetVisible = 
        (targetObj.type === 'room' && visibleObjects.rooms) ||
        (targetObj.type === 'hallway' && visibleObjects.hallways) ||
        (targetObj.type === 'door' && visibleObjects.doors);
      
      return sourceVisible && targetVisible;
    } catch (err) {
      console.error('Error processing connection:', err, conn);
      return false;
    }
  });

  // Prepare connection data for spaces
  const objectConnectionMap = new Map<string, string[]>();
  
  if (connections) {
    connections.forEach(conn => {
      if (!conn) return;
      
      try {
        if (conn.source && conn.target) {
          // Add target to source's connections
          if (!objectConnectionMap.has(conn.source)) {
            objectConnectionMap.set(conn.source, []);
          }
          // Using optional chaining and checking for undefined
          const sourceConns = objectConnectionMap.get(conn.source);
          if (sourceConns) {
            sourceConns.push(conn.target);
          }
          
          // Add source to target's connections
          if (!objectConnectionMap.has(conn.target)) {
            objectConnectionMap.set(conn.target, []);
          }
          // Using optional chaining and checking for undefined
          const targetConns = objectConnectionMap.get(conn.target);
          if (targetConns) {
            targetConns.push(conn.source);
          }
        }
      } catch (err) {
        console.error('Error building connection map:', err, conn);
      }
    });
  }
  
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
      const maxDimension = Math.max(sceneWidth, sceneDepth, 600);
      const cameraDistance = maxDimension * 1.2;
      
      camera.position.set(centerX, cameraDistance * 0.7, centerY + cameraDistance * 0.7);
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
        
        // Animate camera movement for better UX
        const currentPosition = new THREE.Vector3().copy(camera.position);
        const targetPosition = new THREE.Vector3(
          targetX + 200, 
          camera.position.y * 0.8, 
          targetY + 200
        );
        
        let startTime = Date.now();
        const duration = 1000; // 1 second animation
        
        const animateCamera = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
          
          camera.position.lerpVectors(currentPosition, targetPosition, easeProgress);
          
          if (controlsRef.current) {
            controlsRef.current.target.set(targetX, targetZ, targetY);
            controlsRef.current.update();
          }
          
          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
      }
    }
  }, [selectedObjectId, objects, camera]);

  // Determine connection type
  const getConnectionType = (conn: any) => {
    if (!conn) return 'standard';
    
    const sourceObj = objects.find(obj => obj.id === conn.source);
    const targetObj = objects.find(obj => obj.id === conn.target);
    
    if (!sourceObj || !targetObj) return 'standard';
    
    if (conn.connection_type === 'door' || conn.data?.type === 'door') return 'door';
    if (conn.is_emergency_exit || conn.data?.type === 'emergency') return 'emergency';
    
    if (sourceObj.type === 'hallway' && targetObj.type === 'hallway') {
      return 'hallway';
    }
    
    if (sourceObj.type === 'hallway' || targetObj.type === 'hallway') {
      return 'hallway';
    }
    
    return 'direct';
  };

  const handleZoomIn = () => {
    camera.position.multiplyScalar(0.8);
    camera.updateProjectionMatrix();
  };

  const handleZoomOut = () => {
    camera.position.multiplyScalar(1.2);
    camera.updateProjectionMatrix();
  };

  const handleFitToView = () => {
    if (objects.length > 0) {
      // Logic to fit all objects in view
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
      const maxDimension = Math.max(sceneWidth, sceneDepth, 600);
      const cameraDistance = maxDimension * 1.2;
      
      camera.position.set(centerX, cameraDistance * 0.7, centerY + cameraDistance * 0.7);
      camera.lookAt(centerX, 0, centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
    }
  };

  return (
    <>
      <SceneLighting intensity={lightIntensity} />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={100}
        maxDistance={3000}
      />
      
      <group>
        {/* Improved floor plane with gradient */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[6000, 6000]} />
          <meshStandardMaterial 
            color="#f8fafc" 
            roughness={0.8} 
            metalness={0.1}
            transparent={true}
            opacity={0.8} 
          />
        </mesh>
        
        {/* Enhanced grid for better spatial awareness */}
        <Grid 
          infiniteGrid 
          cellSize={50} 
          cellThickness={0.6} 
          cellColor="#cbd5e1" 
          sectionSize={200}
          sectionThickness={1.2}
          sectionColor="#64748b"
          fadeDistance={2000}
          fadeStrength={1.5}
          position={[0, -1, 0]}
        />
        
        {/* Render connections between spaces */}
        {visibleConnections.map((conn, idx) => {
          const sourceObj = objects.find(obj => obj.id === conn.source);
          const targetObj = objects.find(obj => obj.id === conn.target);
          
          if (!sourceObj || !targetObj) return null;
          
          const connectionType = getConnectionType(conn);
          const isHighlighted = selectedObjectId && 
            (conn.source === selectedObjectId || conn.target === selectedObjectId);
          
          return (
            <SpaceConnection 
              key={`conn-${idx}`}
              from={sourceObj}
              to={targetObj}
              type={connectionType}
              isDashed={connectionType !== 'hallway' && connectionType !== 'direct'}
              showLabels={isHighlighted && showLabels}
            />
          );
        })}
        
        {/* Render hallways first (lower) */}
        {visibleObjects.hallways && hallwayObjects.map(obj => {
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
        {visibleObjects.doors && doorObjects.map(obj => {
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
        {visibleObjects.rooms && roomObjects.map(obj => {
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
});
