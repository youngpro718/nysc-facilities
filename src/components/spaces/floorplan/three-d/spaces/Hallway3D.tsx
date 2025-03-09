
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
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
  label: string;
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
  connectedSpaces = []
}: Hallway3DProps) {
  const hallwayHeight = 40; // Lower than rooms to differentiate
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color), 
    transparent: true,
    opacity: 0.75,
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.1, 1); // Slight scale up for selected hallways
        material.emissive = new THREE.Color(0x10b981);
        material.emissiveIntensity = 0.2;
      } else if (hovered) {
        meshRef.current.scale.set(1, 1.05, 1);
        material.emissive = new THREE.Color(0x10b981);
        material.emissiveIntensity = 0.1;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
        
        // Apply lighting status tint if available
        if (properties?.lighting_status === 'all_functional') {
          material.emissive = new THREE.Color(0x10b981); // Green tint for fully functional
          material.emissiveIntensity = 0.05;
        } else if (properties?.lighting_status === 'partial_issues') {
          material.emissive = new THREE.Color(0xf59e0b); // Amber tint for partial issues
          material.emissiveIntensity = 0.05;
        } else if (properties?.lighting_status === 'all_non_functional') {
          material.emissive = new THREE.Color(0xef4444); // Red tint for non-functional
          material.emissiveIntensity = 0.05;
        }
      }
    }
  }, [isSelected, hovered, properties?.lighting_status]);

  // Set hallway descriptive properties 
  const hallwayType = properties?.hallwayType || properties?.type || 'public_main';
  const isEmergencyRoute = properties?.emergency_route === 'designated' || properties?.emergencyRoute === 'designated';
  const section = properties?.section || 'main';
  
  // Get connected space count for indicator
  const connectionCount = properties?.connected_spaces?.length || 0;
  
  return (
    <group
      position={[position.x, hallwayHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh
        ref={meshRef}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'hallway', position, size, rotation, properties, label });
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[size.width, hallwayHeight, size.height]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* Connection indicators along the hallway */}
      {connectionCount > 0 && (
        <mesh 
          position={[size.width/2 - 10, hallwayHeight/2 - 10, 0]} 
          onClick={(e) => {
            e.stopPropagation();
            onClick({ id, type: 'hallway', position, size, rotation, properties, label });
          }}
        >
          <sphereGeometry args={[10, 16, 16]} />
          <meshStandardMaterial 
            color="#22c55e" 
            emissive="#22c55e" 
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
      
      {/* Floor marking for emergency routes */}
      {isEmergencyRoute && (
        <mesh
          position={[0, -hallwayHeight/2 + 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[size.width * 0.9, size.height * 0.5]} />
          <meshStandardMaterial 
            color="#dc2626" 
            emissive="#ef4444"
            emissiveIntensity={0.2}
            opacity={0.7}
            transparent={true}
          />
        </mesh>
      )}
      
      {/* Hallway label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, hallwayHeight + 10, 0]} 
          label={label || `Hallway ${section}`}
          type="Hallway"
          color="#065f46"
          backgroundColor="rgba(240, 253, 244, 0.85)"
          onHover={setHovered}
        />
      )}
      
      {/* Lighting fixtures visualization if data available */}
      {properties?.lighting_fixtures && Array.isArray(properties.lighting_fixtures) && 
        properties.lighting_fixtures.length > 0 && properties.lighting_fixtures.map((fixture: any, idx: number) => {
          // Calculate positions along hallway for fixtures
          const xOffset = (idx / (properties.lighting_fixtures.length + 1)) * size.width - size.width/2 + (size.width/(properties.lighting_fixtures.length + 1));
          
          return (
            <mesh 
              key={`light-${idx}`} 
              position={[xOffset, hallwayHeight - 2, 0]}
              scale={[1, 1, 1]}
            >
              <boxGeometry args={[8, 2, 8]} />
              <meshStandardMaterial 
                color={
                  fixture.status === 'functional' ? '#10b981' : 
                  fixture.status === 'maintenance_needed' ? '#f59e0b' : 
                  '#ef4444'
                }
                emissive={
                  fixture.status === 'functional' ? '#10b981' : 
                  fixture.status === 'maintenance_needed' ? '#f59e0b' : 
                  '#ef4444'
                }
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })
      }
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || `Hallway ${section}`,
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
