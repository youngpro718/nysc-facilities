
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
  
  // Create a more distinct material for rooms
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });

  const wallHeight = 120; // Standard wall height 
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.05, 1); // More noticeable scale up
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.2; // Increased intensity
      } else if (hovered) {
        meshRef.current.scale.set(1, 1.02, 1);
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.1;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isSelected, hovered]);

  const roomType = properties?.room_type || 'default';
  const roomNumber = properties?.room_number || '';
  
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
      case 'office': return '#60a5fa'; // Blue
      case 'conference': return '#a78bfa'; // Purple
      case 'storage': return '#d1d5db'; // Gray
      case 'bathroom': return '#5eead4'; // Teal
      case 'kitchen': return '#fcd34d'; // Yellow
      case 'lab': return '#fb7185'; // Pink
      default: return color;
    }
  };

  // Apply room type color
  useEffect(() => {
    if (material) {
      material.color = new THREE.Color(getRoomTypeColor());
    }
  }, [roomType]);

  return (
    <group
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
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
        <primitive object={material} attach="material" />
        
        {/* Floor with distinct color */}
        <mesh position={[0, -wallHeight/2 + 2, 0]} receiveShadow>
          <boxGeometry args={[size.width, 4, size.height]} />
          <meshStandardMaterial 
            color="#d1d5db" 
            roughness={0.8}
          />
        </mesh>

        {/* Room type indicator on the floor */}
        <mesh position={[0, -wallHeight/2 + 4.1, 0]} receiveShadow>
          <boxGeometry args={[size.width * 0.8, 0.2, size.height * 0.8]} />
          <meshStandardMaterial 
            color={getRoomTypeColor()} 
            roughness={0.7}
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      </mesh>

      {/* Lighting visualization if available - made more visible */}
      {lightingColor && (
        <mesh position={[0, wallHeight - 10, 0]} receiveShadow>
          <boxGeometry args={[size.width * 0.6, 5, size.height * 0.6]} />
          <meshStandardMaterial 
            color={lightingColor}
            emissive={lightingColor}
            emissiveIntensity={0.3} // Increased brightness
            transparent={true}
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Connection indicator - made larger and more prominent */}
      {connectionCount > 0 && (
        <mesh 
          position={[size.width/2 - 15, wallHeight/2 - 15, size.height/2 - 15]} 
          onClick={(e) => {
            e.stopPropagation();
            onClick({ id, type: 'room', position, size, rotation, properties, label });
          }}
        >
          <sphereGeometry args={[12, 16, 16]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#3b82f6" 
            emissiveIntensity={0.4}
            transparent={true}
            opacity={0.9}
          />
          
          {/* Connection count */}
          <Html position={[0, 0, 0]} center>
            <div className="text-white text-xs font-bold">
              {connectionCount}
            </div>
          </Html>
        </mesh>
      )}
      
      {/* Room label - improved visibility */}
      {showLabels && (
        <ObjectLabel 
          position={[0, wallHeight + 20, 0]} 
          label={label || (roomNumber ? `Room ${roomNumber}` : `Room`)}
          type="Room"
          color="#1f2937"
          backgroundColor="rgba(255, 255, 255, 0.95)" // More opaque
          onHover={setHovered}
        />
      )}
      
      {/* Info card with improved visibility */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || (roomNumber ? `Room ${roomNumber}` : 'Room'),
          properties,
          size
        }}
        position={[0, wallHeight/2, 0]}
        visible={hovered || isSelected}
        type="room"
      />
    </group>
  );
}
