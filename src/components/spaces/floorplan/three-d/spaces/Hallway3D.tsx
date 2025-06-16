
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { ObjectLabel } from '../ObjectLabel';
import { SpaceInfoCard } from '../SpaceInfoCard';

interface Hallway3DProps {
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
  connectedSpaces?: any[];
}

export function Hallway3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e5e7eb', 
  onClick, 
  isSelected = false,
  id,
  label,
  properties,
  showLabels,
  connectedSpaces
}: Hallway3DProps) {
  const hallwayWidth = size.width || 300;
  const hallwayDepth = size.height || 50;
  const hallwayHeight = 30; // Lower height than rooms
  const hallwayRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isEmergencyRoute = properties?.emergency_route === 'designated' || properties?.emergencyRoute === 'designated';
  
  // Create materials with better visual quality
  const hallwayMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isEmergencyRoute ? '#dcfce7' : color),
    roughness: 0.7,
    metalness: 0.2,
    transparent: isSelected || hovered,
    opacity: isSelected || hovered ? 0.92 : 0.85,
  });
  
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isEmergencyRoute ? '#86efac' : color).multiplyScalar(0.85),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (hallwayRef.current) {
      if (isSelected) {
        hallwayRef.current.scale.set(1.02, 1.02, 1.02);
        hallwayMaterial.emissive = new THREE.Color(isEmergencyRoute ? '#10b981' : '#3b82f6');
        hallwayMaterial.emissiveIntensity = 0.15;
      } else if (hovered) {
        hallwayRef.current.scale.set(1.01, 1.01, 1.01);
        hallwayMaterial.emissive = new THREE.Color(isEmergencyRoute ? '#10b981' : '#60a5fa');
        hallwayMaterial.emissiveIntensity = 0.1;
      } else {
        hallwayRef.current.scale.set(1, 1, 1);
        hallwayMaterial.emissive = new THREE.Color(isEmergencyRoute ? '#10b981' : '#000000');
        hallwayMaterial.emissiveIntensity = isEmergencyRoute ? 0.05 : 0;
      }
    }
  }, [isSelected, hovered, isEmergencyRoute]);
  
  // Get hallway type info
  const hallwayType = properties?.hallway_type || properties?.hallwayType || 'public_main';
  const isPrivate = hallwayType.includes('private') || properties?.accessibility === 'restricted';
  
  return (
    <group
      ref={hallwayRef}
      position={[position.x, hallwayHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'hallway', position, size, rotation, properties, label });
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main hallway structure */}
      <mesh 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[hallwayWidth, hallwayHeight, hallwayDepth]} />
        <meshStandardMaterial {...hallwayMaterial} attach="material" transparent opacity={0} />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, -hallwayHeight/2, 0]} receiveShadow rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[hallwayWidth, hallwayDepth]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>
      
      {/* Walls - lower walls for hallways */}
      <group>
        {/* Front wall */}
        <mesh position={[0, 0, hallwayDepth/2]} castShadow receiveShadow>
          <boxGeometry args={[hallwayWidth, hallwayHeight, 1]} />
          <primitive object={hallwayMaterial} attach="material" />
        </mesh>
        
        {/* Back wall */}
        <mesh position={[0, 0, -hallwayDepth/2]} castShadow receiveShadow>
          <boxGeometry args={[hallwayWidth, hallwayHeight, 1]} />
          <primitive object={hallwayMaterial} attach="material" />
        </mesh>
      </group>
      
      {/* Emergency route indicators */}
      {isEmergencyRoute && (
        <group>
          {/* Emergency arrows */}
          <mesh position={[0, -hallwayHeight/2 + 1, 0]} rotation={[Math.PI/2, 0, 0]}>
            <planeGeometry args={[hallwayWidth - 20, hallwayDepth - 10]} />
            <meshStandardMaterial 
              color="#10b981" 
              emissive="#10b981"
              emissiveIntensity={0.3}
              roughness={0.7}
              metalness={0.0}
              side={THREE.DoubleSide}
              transparent
              opacity={0.4}
            />
          </mesh>
          
          {/* Direction arrows embedded in the floor */}
          <group>
            {/* Ensure width is valid to prevent creating array with negative or NaN length */}
            {hallwayWidth > 0 ? [...Array(Math.max(1, Math.floor(hallwayWidth / 60)))].map((_, i) => (
              <mesh 
                key={i} 
                position={[-hallwayWidth/2 + 40 + i * 60, -hallwayHeight/2 + 1.5, 0]}
                rotation={[Math.PI/2, 0, 0]}
              >
                <planeGeometry args={[30, 20]} />
                <meshStandardMaterial
                  color="#047857"
                  emissive="#047857"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )) : null}
          </group>
        </group>
      )}
      
      {/* Private hallway indicators */}
      {isPrivate && (
        <group>
          {/* Private hallway markings */}
          <mesh position={[0, -hallwayHeight/2 + 1, 0]} rotation={[Math.PI/2, 0, 0]}>
            <planeGeometry args={[hallwayWidth - 20, hallwayDepth - 10]} />
            <meshStandardMaterial 
              color="#f43f5e" 
              transparent
              opacity={0.2}
            />
          </mesh>
          
          {/* Private access indicator */}
          <mesh position={[0, hallwayHeight/2 + 5, 0]} castShadow>
            <sphereGeometry args={[5, 16, 16]} />
            <meshStandardMaterial 
              color="#f43f5e" 
              emissive="#f43f5e"
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
        </group>
      )}
      
      {/* Hallway label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, hallwayHeight + 15, 0]} 
          label={label || (isEmergencyRoute ? 'Emergency Hallway' : 'Hallway')}
          type={isEmergencyRoute ? "Emergency Hallway" : "Hallway"}
          color="#166534"
          backgroundColor="rgba(220, 252, 231, 0.85)"
          onHover={setHovered}
        />
      )}
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || 'Hallway',
          properties,
          size
        }}
        position={[0, hallwayHeight/2, 0]}
        visible={hovered || isSelected}
        type="hallway"
      />
    </group>
  );
}
