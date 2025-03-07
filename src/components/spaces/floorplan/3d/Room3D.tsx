
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createMaterial, createTextSprite } from '../utils/threeDUtils';

interface Room3DProps {
  id: string;
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  properties?: any;
}

export function Room3D({ 
  id, 
  position, 
  size, 
  rotation = 0, 
  color,
  onClick, 
  isSelected = false,
  properties
}: Room3DProps) {
  const wallHeight = 120; // Standard wall height
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const material = createMaterial('room', isSelected, color);
  
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.02, 1); // Slight scale up for selected rooms
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }

    // Add room label if we have properties
    if (groupRef.current && properties?.room_number) {
      // Remove any existing labels first
      groupRef.current.children.forEach(child => {
        if (child instanceof THREE.Sprite) {
          groupRef.current?.remove(child);
        }
      });
      
      // Add new label
      const label = createTextSprite(
        properties.room_number, 
        24, 
        'Arial', 
        '#1f2937', 
        'rgba(255,255,255,0.7)'
      );
      label.position.set(0, wallHeight/2 + 15, 0);
      groupRef.current.add(label);
    }
  }, [isSelected, properties]);

  const roomName = properties?.room_number 
    ? `${properties.room_number}` 
    : '';
    
  const roomType = properties?.room_type || 'default';

  return (
    <group
      ref={groupRef}
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'room', position, size, rotation, properties });
        }}
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
    </group>
  );
}
