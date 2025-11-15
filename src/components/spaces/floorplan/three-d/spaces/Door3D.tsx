
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { ObjectLabel } from '../ObjectLabel';
import { SpaceInfoCard } from '../SpaceInfoCard';

interface Door3DProps {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  label?: string;
  properties?: any;
  showLabels: boolean;
}

export function Door3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#94a3b8', 
  onClick, 
  isSelected = false,
  id,
  label,
  properties,
  showLabels
}: Door3DProps) {
  const doorHeight = 80;
  const doorWidth = Math.max(size.width, 40); // Ensure minimum door width
  const doorThickness = Math.min(size.height, 15); // Door thickness (depth)
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Door material with outlines for better visibility
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color), 
    roughness: 0.6,
    metalness: 0.3,
    transparent: isSelected || hovered,
    opacity: isSelected || hovered ? 0.9 : 0.7,
  });
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1.1, 1.1, 1.1);
        material.emissive = new THREE.Color(0xf59e0b);
        material.emissiveIntensity = 0.3;
      } else if (hovered) {
        meshRef.current.scale.set(1.05, 1.05, 1.05);
        material.emissive = new THREE.Color(0xf59e0b);
        material.emissiveIntensity = 0.2;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isSelected, hovered]);

  // Check if this door connects spaces
  const isTransitionDoor = properties?.is_transition_door;
  const securityLevel = properties?.security_level || 'standard';
  
  return (
    <group
      position={[position.x, doorHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'door', position, size, rotation, properties, label });
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[doorWidth/2 - 5, 0, doorThickness/2 + 1]} castShadow>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial 
          color={securityLevel === 'high' ? '#ef4444' : 
                securityLevel === 'medium' ? '#f59e0b' : 
                '#64748b'} 
          metalness={0.8} 
          roughness={0.2}
          emissive={securityLevel === 'high' ? '#ef4444' : 
                   securityLevel === 'medium' ? '#f59e0b' : 
                   '#64748b'}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Transition indicator */}
      {isTransitionDoor && (
        <mesh position={[0, doorHeight + 5, 0]} castShadow>
          <sphereGeometry args={[5, 8, 8]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#3b82f6"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      
      {/* Door label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, doorHeight + 15, 0]} 
          label={label || (isTransitionDoor ? 'Transition Door' : 'Door')}
          type="Door"
          color="#854d0e"
          backgroundColor="rgba(254, 243, 199, 0.85)"
          onHover={setHovered}
        />
      )}
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || (isTransitionDoor ? 'Transition Door' : 'Door'),
          properties,
          size
        }}
        position={[0, doorHeight/2, 0]}
        visible={hovered || isSelected}
        type="door"
      />
    </group>
  );
}
