
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
        meshRef.current.scale.set(1, 1.02, 1); // Slight scale up for selected rooms
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.15;
      } else if (hovered) {
        meshRef.current.scale.set(1, 1.01, 1);
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.05;
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
        
        {/* Floor */}
        <mesh position={[0, -wallHeight/2 + 2, 0]} receiveShadow>
          <boxGeometry args={[size.width, 4, size.height]} />
          <meshStandardMaterial 
            color="#d1d5db" 
            roughness={0.8}
          />
        </mesh>
      </mesh>

      {/* Lighting visualization if available */}
      {lightingColor && (
        <mesh position={[0, wallHeight - 10, 0]} receiveShadow>
          <boxGeometry args={[size.width * 0.6, 2, size.height * 0.6]} />
          <meshStandardMaterial 
            color={lightingColor}
            emissive={lightingColor}
            emissiveIntensity={0.2}
            transparent={true}
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Connection indicator */}
      {connectionCount > 0 && (
        <mesh 
          position={[size.width/2 - 10, wallHeight/2 - 10, size.height/2 - 10]} 
          onClick={(e) => {
            e.stopPropagation();
            onClick({ id, type: 'room', position, size, rotation, properties, label });
          }}
        >
          <sphereGeometry args={[8, 16, 16]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#3b82f6" 
            emissiveIntensity={0.3}
            transparent={true}
            opacity={0.8}
          />
          
          {/* Connection count */}
          <Html position={[0, 0, 0]} center>
            <div className="text-white text-xs font-bold">
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
          onHover={setHovered}
        />
      )}
      
      {/* Show info card on hover */}
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
