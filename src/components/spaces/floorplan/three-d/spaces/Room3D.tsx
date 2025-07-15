import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
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
  label?: string;
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
  const roomWidth = size.width || 150;
  const roomLength = size.height || 100;
  const roomHeight = 60; // Standard room height
  const roomRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Simplified, cleaner materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'), // Clean, consistent color
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f1f5f9'), // Slightly lighter for floor
    roughness: 0.8,
    metalness: 0.0,
  });
  
  // Simplified interaction feedback
  useEffect(() => {
    if (roomRef.current) {
      if (isSelected) {
        roomRef.current.scale.set(1.05, 1.05, 1.05);
        wallMaterial.emissive = new THREE.Color(0x3b82f6);
        wallMaterial.emissiveIntensity = 0.2;
      } else if (hovered) {
        roomRef.current.scale.set(1.02, 1.02, 1.02);
        wallMaterial.emissive = new THREE.Color(0x60a5fa);
        wallMaterial.emissiveIntensity = 0.1;
      } else {
        roomRef.current.scale.set(1, 1, 1);
        wallMaterial.emissive = new THREE.Color(0x000000);
        wallMaterial.emissiveIntensity = 0;
      }
    }
  }, [isSelected, hovered]);
  
  // Determine if room has windows based on properties
  const hasWindows = properties?.has_windows || properties?.windows_count > 0;
  
  // Add any specialization based on the room's properties
  const isSpecialRoom = properties?.is_secured || properties?.is_restricted;
  
  return (
    <group
      ref={roomRef}
      position={[position.x, roomHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'room', position, size, rotation, properties, label });
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main room structure */}
      <mesh 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roomWidth, roomHeight, roomLength]} />
        <meshStandardMaterial {...wallMaterial} attach="material" transparent opacity={0} />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, -roomHeight/2, 0]} receiveShadow rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[roomWidth, roomLength]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>
      
      {/* Walls - using thin boxes for better appearance */}
      <group>
        {/* Front wall */}
        <mesh position={[0, 0, roomLength/2]} castShadow receiveShadow>
          <boxGeometry args={[roomWidth, roomHeight, 2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        
        {/* Back wall */}
        <mesh position={[0, 0, -roomLength/2]} castShadow receiveShadow>
          <boxGeometry args={[roomWidth, roomHeight, 2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        
        {/* Left wall */}
        <mesh position={[-roomWidth/2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, roomHeight, roomLength]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        
        {/* Right wall */}
        <mesh position={[roomWidth/2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, roomHeight, roomLength]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
      </group>
      
      {/* Windows if applicable */}
      {hasWindows && (
        <group>
          {/* Window on right wall */}
          <mesh position={[roomWidth/2 - 0.1, 0, -roomLength/4]} castShadow>
            <boxGeometry args={[3, roomHeight/2, roomLength/4]} />
            <meshStandardMaterial
              color="#a5f3fc"
              transparent={true}
              opacity={0.5}
              roughness={0.05}
              metalness={0.1}
              emissive="#a5f3fc"
              emissiveIntensity={0.1}
            />
          </mesh>
          
          {/* Window frame */}
          <mesh position={[roomWidth/2 - 0.1, 0, -roomLength/4]} castShadow>
            <boxGeometry args={[3.5, roomHeight/2 + 4, roomLength/4 + 4]} />
            <meshStandardMaterial
              color="#475569"
              transparent={true}
              opacity={0.7}
            />
          </mesh>
        </group>
      )}
      
      {/* Show security indicator if this is a secured room */}
      {isSpecialRoom && (
        <mesh position={[0, roomHeight/2 + 5, 0]} castShadow>
          <sphereGeometry args={[7, 16, 16]} />
          <meshStandardMaterial 
            color="#ef4444" 
            emissive="#ef4444"
            emissiveIntensity={0.3}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      )}
      
      {/* Room label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, roomHeight + 15, 0]} 
          label={label || 'Unlabeled Room'}
          type="Room"
          color="#1e3a8a"
          backgroundColor="rgba(219, 234, 254, 0.85)"
          onHover={setHovered}
        />
      )}
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || 'Unlabeled Room',
          properties,
          size
        }}
        position={[0, roomHeight/2, 0]}
        visible={hovered || isSelected}
        type="room"
      />
    </group>
  );
}
