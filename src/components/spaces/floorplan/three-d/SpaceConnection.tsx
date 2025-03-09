
import React, { useRef, useState } from 'react';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceConnectionProps {
  from: any;
  to: any;
  color?: string;
  type?: string;
  isDashed?: boolean;
  showLabels?: boolean;
}

export function SpaceConnection({ 
  from, 
  to, 
  color = '#94a3b8',
  type = 'standard',
  isDashed = true,
  showLabels = false
}: SpaceConnectionProps) {
  const [hovered, setHovered] = useState(false);
  const lineRef = useRef<any>();
  
  if (!from || !to || !from.position || !to.position) {
    return null;
  }
  
  const startHeight = from.type === 'hallway' ? 30 : from.type === 'door' ? 40 : 60;
  const endHeight = to.type === 'hallway' ? 30 : to.type === 'door' ? 40 : 60;
  
  const points = [
    new THREE.Vector3(from.position.x, startHeight/2, from.position.y),
    new THREE.Vector3(to.position.x, endHeight/2, to.position.y)
  ];
  
  // Enhanced connection styles based on type
  const getConnectionStyle = () => {
    switch(type) {
      case 'direct':
        return {
          color: '#3b82f6', // Brighter blue
          lineWidth: 3.5, // Thicker line
          dashSize: 0, 
          gapSize: 0,
          emissive: '#3b82f6',
          emissiveIntensity: 0.5
        };
      case 'door':
        return {
          color: '#f59e0b', // Amber
          lineWidth: 3,
          dashSize: 5,
          gapSize: 3,
          emissive: '#f59e0b',
          emissiveIntensity: 0.4
        };
      case 'emergency':
        return {
          color: '#ef4444', // Red
          lineWidth: 4, // Extra thick for emergency routes
          dashSize: 4,
          gapSize: 2,
          emissive: '#ef4444',
          emissiveIntensity: 0.6
        };
      case 'hallway':
        return {
          color: '#10b981', // Green
          lineWidth: 3,
          dashSize: 0,
          gapSize: 0,
          emissive: '#10b981',
          emissiveIntensity: 0.4
        };
      default:
        return {
          color: color,
          lineWidth: 2,
          dashSize: 4,
          gapSize: 4,
          emissive: color,
          emissiveIntensity: 0.2
        };
    }
  };
  
  const style = getConnectionStyle();
  const connectionDistance = new THREE.Vector3().subVectors(
    new THREE.Vector3(to.position.x, 0, to.position.y),
    new THREE.Vector3(from.position.x, 0, from.position.y)
  ).length();
  
  // Calculate the midpoint for label placement
  const midPoint = new THREE.Vector3(
    (from.position.x + to.position.x) / 2,
    Math.max(startHeight, endHeight) / 2 + 10,
    (from.position.y + to.position.y) / 2
  );
  
  return (
    <group>
      {/* Main connection line */}
      <Line
        ref={lineRef}
        points={points}
        color={hovered ? '#ffffff' : style.color}
        lineWidth={hovered ? style.lineWidth * 1.5 : style.lineWidth}
        dashed={isDashed}
        dashSize={style.dashSize}
        dashOffset={1}
        gapSize={style.gapSize}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      
      {/* Enhanced connection end markers */}
      <mesh 
        position={[from.position.x, startHeight/2, from.position.y]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[4, 12, 12]} />
        <meshStandardMaterial 
          color={style.color} 
          emissive={style.emissive} 
          emissiveIntensity={hovered ? style.emissiveIntensity * 1.5 : style.emissiveIntensity} 
        />
      </mesh>
      
      <mesh 
        position={[to.position.x, endHeight/2, to.position.y]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[4, 12, 12]} />
        <meshStandardMaterial 
          color={style.color} 
          emissive={style.emissive} 
          emissiveIntensity={hovered ? style.emissiveIntensity * 1.5 : style.emissiveIntensity} 
        />
      </mesh>
      
      {/* Connection label */}
      {showLabels && (
        <Html position={[midPoint.x, midPoint.y, midPoint.z]} center>
          <div className="px-1.5 py-0.5 text-xs font-medium bg-white/90 rounded-full whitespace-nowrap shadow-sm border border-gray-200 text-gray-800">
            {type.charAt(0).toUpperCase() + type.slice(1)} • {Math.round(connectionDistance)} units
          </div>
        </Html>
      )}
      
      {/* Connection flow direction indicator */}
      {type !== 'standard' && (
        <mesh 
          position={[
            from.position.x + (to.position.x - from.position.x) * 0.6,
            (startHeight + endHeight) / 4,
            from.position.y + (to.position.y - from.position.y) * 0.6
          ]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          rotation={[
            0,
            Math.atan2(
              to.position.y - from.position.y,
              to.position.x - from.position.x
            ) + Math.PI / 2,
            0
          ]}
        >
          <coneGeometry args={[3, 6, 8]} />
          <meshStandardMaterial 
            color={style.color} 
            emissive={style.emissive} 
            emissiveIntensity={hovered ? style.emissiveIntensity * 1.5 : style.emissiveIntensity} 
          />
        </mesh>
      )}
    </group>
  );
}
