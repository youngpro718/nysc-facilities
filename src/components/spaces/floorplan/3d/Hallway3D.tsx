
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createMaterial, createTextSprite } from '../utils/threeDUtils';

interface Hallway3DProps {
  id: string;
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  properties?: any;
}

export function Hallway3D({ 
  id, 
  position, 
  size, 
  rotation = 0, 
  color, 
  onClick, 
  isSelected = false,
  properties
}: Hallway3DProps) {
  const hallwayHeight = 30; // Lower than rooms to differentiate
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const material = createMaterial('hallway', isSelected, color);
  
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.1, 1); // Slight scale up for selected hallways
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
    
    // Add hallway label if we have a name
    if (groupRef.current && properties?.name) {
      // Clean up existing labels
      groupRef.current.children.forEach(child => {
        if (child instanceof THREE.Sprite) {
          groupRef.current?.remove(child);
        }
      });
      
      // Add new label
      const label = createTextSprite(
        properties.name, 
        20, 
        'Arial', 
        '#374151', 
        'rgba(255,255,255,0.6)'
      );
      label.position.set(0, hallwayHeight + 10, 0);
      groupRef.current.add(label);
    }
  }, [isSelected, properties]);
  
  // Extract properties
  const hallwaySection = properties?.section || 'connector';
  const hallwayType = properties?.hallwayType || properties?.type || 'public_main';
  
  return (
    <group
      ref={groupRef}
      position={[position.x, hallwayHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'hallway', position, size, rotation, properties });
        }}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[size.width, hallwayHeight, size.height]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}
