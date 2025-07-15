
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
  
  // Enhanced defensive checks
  if (!from || !to) {
    console.warn('SpaceConnection missing from or to:', { from, to });
    return null;
  }
  
  if (!from.position || !to.position) {
    console.warn('SpaceConnection missing position data:', { 
      fromId: from.id, 
      toId: to.id, 
      fromPosition: from.position,
      toPosition: to.position
    });
    return null;
  }
  
  // Double-check that positions contain valid numeric coordinates
  if (typeof from.position.x !== 'number' || 
      typeof from.position.y !== 'number' || 
      typeof to.position.x !== 'number' || 
      typeof to.position.y !== 'number' || 
      isNaN(from.position.x) || 
      isNaN(from.position.y) || 
      isNaN(to.position.x) || 
      isNaN(to.position.y)) {
    console.warn('SpaceConnection has invalid position coordinates:', {
      fromPos: from.position,
      toPos: to.position
    });
    return null;
  }
  
  const startHeight = from.type === 'hallway' ? 30 : from.type === 'door' ? 40 : 60;
  const endHeight = to.type === 'hallway' ? 30 : to.type === 'door' ? 40 : 60;
  
  // Create points with safety checks
  let points;
  try {
    points = [
      new THREE.Vector3(from.position.x, startHeight/2, from.position.y),
      new THREE.Vector3(to.position.x, endHeight/2, to.position.y)
    ];
  } catch (err) {
    console.error('Error creating connection points:', err, { from, to });
    return null;
  }
  
  // Safety check for points array after creation
  if (!points || points.length !== 2) {
    console.error('Invalid points array created for connection');
    return null;
  }
  
  // Simplified, cleaner connection styles
  const getConnectionStyle = () => {
    switch(type) {
      case 'direct':
        return {
          color: '#3b82f6',
          lineWidth: 4,
          dashSize: 0, 
          gapSize: 0,
          emissive: '#3b82f6',
          emissiveIntensity: 0.3
        };
      case 'hallway':
        return {
          color: '#10b981',
          lineWidth: 3,
          dashSize: 0,
          gapSize: 0,
          emissive: '#10b981',
          emissiveIntensity: 0.3
        };
      case 'emergency':
        return {
          color: '#ef4444',
          lineWidth: 4,
          dashSize: 8,
          gapSize: 4,
          emissive: '#ef4444',
          emissiveIntensity: 0.4
        };
      default:
        return {
          color: '#64748b',
          lineWidth: 2,
          dashSize: 6,
          gapSize: 3,
          emissive: '#64748b',
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
