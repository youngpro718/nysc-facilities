import React, { useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';
import BlueprintRoom from './BlueprintRoom';
import BlueprintGrid from './BlueprintGrid';
import AnimatedConnection from './AnimatedConnection';

interface RoomData {
  id: string;
  position: { x: number; y: number; z?: number };
  size?: { width: number; height: number; depth?: number };
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

const BlueprintScene: React.FC<BlueprintSceneProps> = ({
  rooms,
  connections,
  selectedRoomId,
  hoveredRoomId,
  onRoomClick,
  onRoomHover,
  showIcons = true,
  showConnections = true,
  labelScale = 1,
  gridSize = 1000
}) => {
  // Normalize room positions to center the layout
  const normalizedRooms = useMemo(() => {
    if (!rooms.length) return [];

    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    rooms.forEach(room => {
      minX = Math.min(minX, room.position.x);
      maxX = Math.max(maxX, room.position.x);
      minY = Math.min(minY, room.position.y);
      maxY = Math.max(maxY, room.position.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return rooms.map(room => ({
      ...room,
      normalizedPosition: {
        x: (room.position.x - centerX) * 1.5,
        y: room.position.z ?? 0,
        z: (room.position.y - centerY) * 1.5
      }
    }));
  }, [rooms]);

  // Normalize connection positions
  const normalizedConnections = useMemo(() => {
    if (!connections.length || !rooms.length) return [];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    rooms.forEach(room => {
      minX = Math.min(minX, room.position.x);
      maxX = Math.max(maxX, room.position.x);
      minY = Math.min(minY, room.position.y);
      maxY = Math.max(maxY, room.position.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return connections.map(conn => ({
      ...conn,
      normalizedFrom: {
        x: (conn.from.x - centerX) * 1.5,
        y: 15,
        z: (conn.from.y - centerY) * 1.5
      },
      normalizedTo: {
        x: (conn.to.x - centerX) * 1.5,
        y: 15,
        z: (conn.to.y - centerY) * 1.5
      }
    }));
  }, [connections, rooms]);

  return (
    <>
      {/* Lighting - bright ambient for flat blueprint look */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[100, 200, 100]} intensity={0.3} />

      {/* Blueprint Grid */}
      <BlueprintGrid size={gridSize} divisions={50} majorDivisions={10} />

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
            room.size?.width ?? 60,
            room.size?.height ?? 30,
            room.size?.depth ?? 60
          ]}
          name={room.name || room.room_number || room.id}
          type={room.type}
          status={room.status}
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
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={100}
        maxDistance={1500}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  );
};

export default BlueprintScene;
