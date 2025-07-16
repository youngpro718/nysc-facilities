import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface Space3DProps {
  id: string;
  type: 'room' | 'hallway' | 'door';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  label?: string;
  properties?: any;
  isSelected?: boolean;
  showLabels?: boolean;
  onClick: (data: any) => void;
  onStartConnection?: (id: string) => void;
  onFinishConnection?: (id: string) => void;
  isConnecting?: boolean;
}

// Material pools to prevent recreation
const materialPool = {
  room: new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  }),
  hallway: new THREE.MeshStandardMaterial({
    color: '#e5e7eb',
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  }),
  door: new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.5,
    metalness: 0.2,
    transparent: true,
    opacity: 0.95,
  }),
  floor: new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.8,
    metalness: 0.0,
  }),
};

export function Space3D({
  id,
  type,
  position,
  size,
  rotation = 0,
  label,
  properties,
  isSelected = false,
  showLabels = true,
  onClick,
  onStartConnection,
  onFinishConnection,
  isConnecting = false
}: Space3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Get dimensions based on type
  const getDimensions = () => {
    const width = size.width || 150;
    const depth = size.height || 100;
    
    switch (type) {
      case 'room':
        return { width, height: 60, depth };
      case 'hallway':
        return { width, height: 30, depth };
      case 'door':
        return { width: Math.min(width, 40), height: 15, depth: Math.min(depth, 15) };
      default:
        return { width, height: 30, depth };
    }
  };

  const { width, height, depth } = getDimensions();
  const material = materialPool[type];

  // Handle interaction feedback
  useEffect(() => {
    if (groupRef.current && material) {
      if (isSelected) {
        groupRef.current.scale.set(1.05, 1.05, 1.05);
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.2;
      } else if (hovered) {
        groupRef.current.scale.set(1.02, 1.02, 1.02);
        material.emissive = new THREE.Color(0x60a5fa);
        material.emissiveIntensity = 0.1;
      } else {
        groupRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isSelected, hovered, material]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    
    // Handle connection mode
    if (isConnecting && onFinishConnection) {
      onFinishConnection(id);
      return;
    }
    
    onClick({ id, type, position, size, rotation, properties, label });
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (onStartConnection) {
      onStartConnection(id);
    }
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, height / 2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Floor */}
      <mesh 
        position={[0, -height / 2, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <primitive object={materialPool.floor} attach="material" />
      </mesh>

      {/* Connection indicator */}
      {isConnecting && (
        <mesh position={[0, height + 15, 0]} castShadow>
          <sphereGeometry args={[8, 16, 16]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#3b82f6"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      )}

      {/* Type-specific features */}
      {type === 'room' && properties?.has_windows && (
        <mesh position={[width / 2 - 1, 0, 0]} castShadow>
          <boxGeometry args={[2, height / 2, depth / 3]} />
          <meshStandardMaterial
            color="#a5f3fc"
            transparent
            opacity={0.5}
            roughness={0.05}
            metalness={0.1}
          />
        </mesh>
      )}

      {type === 'hallway' && properties?.emergency_route === 'designated' && (
        <mesh position={[0, -height / 2 + 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - 10, depth - 10]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.3}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Label */}
      {showLabels && label && (
        <mesh position={[0, height + 10, 0]}>
          <planeGeometry args={[Math.max(60, label.length * 8), 20]} />
          <meshStandardMaterial
            color="white"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}