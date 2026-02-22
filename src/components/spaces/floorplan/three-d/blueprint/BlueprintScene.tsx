// @ts-nocheck
import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import BlueprintRoom from './BlueprintRoom';
import BlueprintGrid from './BlueprintGrid';
import AnimatedConnection from './AnimatedConnection';

interface RoomData {
  id: string;
  position: { x: number; y: number; z?: number };
  size?: { width: number; height: number; depth?: number };
  rotation?: number;
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

export interface SceneHandle {
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToContent: () => void;
}

interface BlueprintSceneProps {
  rooms: RoomData[];
  connections: ConnectionData[];
  selectedRoomId?: string | null;
  hoveredRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  onRoomHover?: (roomId: string | null) => void;
  showIcons?: boolean;
  showConnections?: boolean;
  labelScale?: number;
  gridSize?: number;
}

const BlueprintSceneInner = forwardRef<SceneHandle, BlueprintSceneProps>(({
  rooms,
  connections,
  selectedRoomId,
  hoveredRoomId,
  onRoomClick,
  onRoomHover,
  showIcons = true,
  showConnections = true,
  labelScale = 1,
  gridSize = 800
}, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<unknown>(null);
  const initialCameraPos = useRef<THREE.Vector3 | null>(null);

  // Store initial camera position
  if (!initialCameraPos.current && camera) {
    initialCameraPos.current = camera.position.clone();
  }

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (initialCameraPos.current && camera) {
        camera.position.copy(initialCameraPos.current);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    },
    zoomIn: () => {
      if (camera) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, 50);
      }
    },
    zoomOut: () => {
      if (camera) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, -50);
      }
    },
    fitToContent: () => {
      if (!rooms.length || !camera) return;
      
      // Calculate bounds
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      rooms.forEach(room => {
        const w = room.size?.width || 100;
        const h = room.size?.height || 100;
        minX = Math.min(minX, room.position.x - w / 2);
        maxX = Math.max(maxX, room.position.x + w / 2);
        minZ = Math.min(minZ, room.position.y - h / 2);
        maxZ = Math.max(maxZ, room.position.y + h / 2);
      });
      
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const maxDim = Math.max(maxX - minX, maxZ - minZ);
      const distance = maxDim * 1.5;
      
      camera.position.set(centerX + distance * 0.5, distance, centerZ + distance * 0.5);
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerZ);
        controlsRef.current.update();
      }
    },
  }));

  // Calculate bounds and center content
  const { normalizedRooms, center } = useMemo(() => {
    if (!rooms.length) return { normalizedRooms: [], center: { x: 0, z: 0 } };

    // Find bounds including room sizes
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

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Normalize positions to center around origin, with less aggressive spacing
    const normalized = rooms.map(room => ({
      ...room,
      normalizedPosition: {
        x: room.position.x - centerX,
        y: room.position.z ?? 0,
        z: room.position.y - centerY
      }
    }));

    return { normalizedRooms: normalized, center: { x: centerX, z: centerY } };
  }, [rooms]);

  // Normalize connection positions
  const normalizedConnections = useMemo(() => {
    if (!connections.length || !rooms.length) return [];

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

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return connections.map(conn => ({
      ...conn,
      normalizedFrom: {
        x: conn.from.x - centerX,
        y: 20,
        z: conn.from.y - centerY
      },
      normalizedTo: {
        x: conn.to.x - centerX,
        y: 20,
        z: conn.to.y - centerY
      }
    }));
  }, [connections, rooms]);

  return (
    <>
      {/* Enhanced lighting for dramatic effect */}
      <ambientLight intensity={0.4} color="#e0f2fe" />
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={0.6} 
        color="#f0f9ff"
        castShadow
      />
      <directionalLight 
        position={[-100, 150, -100]} 
        intensity={0.3} 
        color="#22d3ee"
      />
      <pointLight position={[0, 100, 0]} intensity={0.3} color="#0ea5e9" />

      {/* Blueprint Grid */}
      <BlueprintGrid size={gridSize} divisions={40} majorDivisions={8} />

      {/* Rooms */}
      {normalizedRooms.map(room => (
        <BlueprintRoom
          key={room.id}
          id={room.id}
          position={[
            room.normalizedPosition.x,
            room.normalizedPosition.y,
            room.normalizedPosition.z
          ]}
          size={[
            room.size?.width ?? 100,
            room.size?.depth ?? 35,
            room.size?.height ?? 80
          ]}
          name={room.name || room.room_number || ''}
          roomNumber={room.room_number}
          type={room.type}
          status={room.status}
          rotation={room.rotation}
          isSelected={selectedRoomId === room.id}
          isHovered={hoveredRoomId === room.id}
          onClick={() => onRoomClick?.(room.id)}
          onHover={(hovering) => onRoomHover?.(hovering ? room.id : null)}
          showIcon={showIcons}
          labelScale={labelScale}
        />
      ))}

      {/* Animated Connections */}
      {showConnections && normalizedConnections.map(conn => (
        <AnimatedConnection
          key={conn.id}
          id={conn.id}
          from={[conn.normalizedFrom.x, conn.normalizedFrom.y, conn.normalizedFrom.z]}
          to={[conn.normalizedTo.x, conn.normalizedTo.y, conn.normalizedTo.z]}
          type={conn.type || 'standard'}
          isSelected={
            selectedRoomId !== null && 
            (conn.id.includes(selectedRoomId) || false)
          }
        />
      ))}

      {/* Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={50}
        maxDistance={2000}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.1}
        target={[0, 0, 0]}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  );
});

BlueprintSceneInner.displayName = 'BlueprintSceneInner';

// Wrapper component that doesn't use hooks outside Canvas
const BlueprintScene = forwardRef<SceneHandle, BlueprintSceneProps>((props, ref) => {
  return <BlueprintSceneInner {...props} ref={ref} />;
});

BlueprintScene.displayName = 'BlueprintScene';

export default BlueprintScene;
