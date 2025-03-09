
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { ObjectLabel } from '../ObjectLabel';
import { SpaceInfoCard } from '../SpaceInfoCard';

interface Room3DProps {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  label: string;
  properties?: any;
  showLabels: boolean;
}

export function Room3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e2e8f0', 
  onClick, 
  isSelected = false,
  id,
  label,
  properties,
  showLabels
}: Room3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Create materials with better visual appearance
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color),
    roughness: 0.6,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85
  });
  
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: "#d1d5db", 
    roughness: 0.8,
    metalness: 0.1
  });

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: "#93c5fd",
    roughness: 0.2,
    metalness: 0.6,
    transparent: true,
    opacity: 0.6
  });

  const wallHeight = 120; // Standard wall height 
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.05, 1); // More noticeable scale up
        wallMaterial.emissive = new THREE.Color(0x3b82f6);
        wallMaterial.emissiveIntensity = 0.3; // Increased intensity
        wallMaterial.opacity = 0.9;
      } else if (hovered) {
        meshRef.current.scale.set(1, 1.02, 1);
        wallMaterial.emissive = new THREE.Color(0x3b82f6);
        wallMaterial.emissiveIntensity = 0.15;
        wallMaterial.opacity = 0.88;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        wallMaterial.emissive = new THREE.Color(0x000000);
        wallMaterial.emissiveIntensity = 0;
        wallMaterial.opacity = 0.85;
      }
    }
  }, [isSelected, hovered]);

  // Get room type and properties
  const roomType = properties?.room_type || 'default';
  const roomNumber = properties?.room_number || '';
  const roomStatus = properties?.status || 'active';
  
  // Determine lighting color/status if available
  const hasTotalLights = properties?.total_lights && properties.total_lights > 0;
  const lightingColor = hasTotalLights 
    ? properties.lighting_status === 'all_functional' ? '#10b981'
      : properties.lighting_status === 'partial_issues' ? '#f59e0b'
      : properties.lighting_status === 'all_non_functional' ? '#ef4444'
      : '#94a3b8'
    : null;

  // Count connections for visual indicator
  const connectionCount = properties?.connected_spaces?.length || 0;

  // Define room color based on room type for better visual differentiation
  const getRoomTypeColor = () => {
    switch(roomType) {
      case 'office': return '#93c5fd'; // Lighter blue
      case 'conference': return '#c4b5fd'; // Lighter purple
      case 'storage': return '#e5e7eb'; // Light gray
      case 'bathroom': return '#99f6e4'; // Lighter teal
      case 'kitchen': return '#fcd34d'; // Yellow
      case 'lab': return '#fda4af'; // Lighter pink
      case 'courtroom': return '#a78bfa'; // Purple
      case 'security': return '#f87171'; // Red
      case 'reception': return '#fdba74'; // Orange
      default: return color;
    }
  };

  // Apply room type color
  useEffect(() => {
    if (wallMaterial) {
      wallMaterial.color = new THREE.Color(getRoomTypeColor());
    }
  }, [roomType]);

  // Create window positions based on room size
  const createWindows = () => {
    const windows = [];
    if (size.width > 100) {
      // Add windows on the longer sides
      const windowSpacing = Math.min(80, size.width / 3);
      const windowCount = Math.floor(size.width / windowSpacing) - 1;
      
      for (let i = 1; i <= windowCount; i++) {
        const xPos = -size.width/2 + (i * windowSpacing);
        
        // North wall window
        windows.push(
          <mesh key={`window-n-${i}`} position={[xPos, wallHeight/3, size.height/2 - 1]} receiveShadow>
            <boxGeometry args={[20, 30, 1]} />
            <primitive object={windowMaterial} attach="material" />
          </mesh>
        );
        
        // South wall window
        windows.push(
          <mesh key={`window-s-${i}`} position={[xPos, wallHeight/3, -size.height/2 + 1]} receiveShadow>
            <boxGeometry args={[20, 30, 1]} />
            <primitive object={windowMaterial} attach="material" />
          </mesh>
        );
      }
    }
    return windows;
  };
  
  return (
    <group
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      {/* Main room structure */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'room', position, size, rotation, properties, label });
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[size.width, wallHeight, size.height]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* Room floor with distinct material */}
      <mesh position={[0, -wallHeight/2 + 2, 0]} receiveShadow>
        <boxGeometry args={[size.width, 4, size.height]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Add windows to the room */}
      {createWindows()}

      {/* Room type indicator on the floor */}
      <mesh position={[0, -wallHeight/2 + 4.1, 0]} receiveShadow>
        <boxGeometry args={[size.width * 0.85, 0.2, size.height * 0.85]} />
        <meshStandardMaterial 
          color={getRoomTypeColor()} 
          roughness={0.7}
          transparent={true}
          opacity={0.6}
        />
      </mesh>
      
      {/* Status indicator for inactive rooms */}
      {roomStatus !== 'active' && (
        <mesh position={[0, wallHeight/2 + 5, 0]} receiveShadow>
          <boxGeometry args={[size.width * 0.9, 1, size.height * 0.9]} />
          <meshStandardMaterial 
            color="#ef4444" 
            emissive="#ef4444"
            emissiveIntensity={0.5}
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Lighting visualization if available */}
      {lightingColor && (
        <mesh position={[0, wallHeight - 10, 0]} receiveShadow>
          <boxGeometry args={[size.width * 0.7, 5, size.height * 0.7]} />
          <meshStandardMaterial 
            color={lightingColor}
            emissive={lightingColor}
            emissiveIntensity={0.4}
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Connection indicator */}
      {connectionCount > 0 && (
        <mesh 
          position={[size.width/2 - 15, wallHeight/2 - 15, size.height/2 - 15]} 
          onClick={(e) => {
            e.stopPropagation();
            onClick({ id, type: 'room', position, size, rotation, properties, label });
          }}
        >
          <sphereGeometry args={[14, 16, 16]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#3b82f6" 
            emissiveIntensity={0.5}
            transparent={true}
            opacity={0.9}
          />
          
          {/* Connection count */}
          <Html position={[0, 0, 0]} center>
            <div className="text-white text-xs font-bold select-none">
              {connectionCount}
            </div>
          </Html>
        </mesh>
      )}
      
      {/* Room label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, wallHeight + 20, 0]} 
          label={label || (roomNumber ? `Room ${roomNumber}` : `Room`)}
          type="Room"
          color="#1f2937"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onHover={setHovered}
        />
      )}
      
      {/* Enhanced room info card */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || (roomNumber ? `Room ${roomNumber}` : 'Room'),
          properties,
          size,
          type: roomType
        }}
        position={[0, wallHeight/2, 0]}
        visible={hovered || isSelected}
        type="room"
      />
    </group>
  );
}
