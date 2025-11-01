
import React, { useRef, useState, useMemo } from 'react';
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
  // Compute safe values and validity flags before using hooks conditionally
  const hasEndpoints = !!from && !!to;
  const fromPos = hasEndpoints && from.position ? from.position : { x: NaN, y: NaN };
  const toPos = hasEndpoints && to.position ? to.position : { x: NaN, y: NaN };
  const coordsValid =
    typeof fromPos.x === 'number' && typeof fromPos.y === 'number' &&
    typeof toPos.x === 'number' && typeof toPos.y === 'number' &&
    !Number.isNaN(fromPos.x) && !Number.isNaN(fromPos.y) &&
    !Number.isNaN(toPos.x) && !Number.isNaN(toPos.y);

  const safeFromType = (from as any)?.type ?? 'room';
  const safeToType = (to as any)?.type ?? 'room';
  const startHeight = safeFromType === 'hallway' ? 30 : safeFromType === 'door' ? 40 : 60;
  const endHeight = safeToType === 'hallway' ? 30 : safeToType === 'door' ? 40 : 60;
  
  // Memoize points creation to prevent inline Three.js object creation
  const points = useMemo(() => {
    try {
      const startPoint = new THREE.Vector3();
      startPoint.set(fromPos.x, startHeight/2, fromPos.y);
      const endPoint = new THREE.Vector3();
      endPoint.set(toPos.x, endHeight/2, toPos.y);
      return [startPoint, endPoint];
    } catch (err) {
      console.error('Error creating connection points:', err, { from, to });
      return null;
    }
  }, [fromPos.x, fromPos.y, toPos.x, toPos.y, startHeight, endHeight]);
  
  // Safety check for points array after creation
  const pointsValid = !!points && points.length === 2;
  
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
  
  // Memoize distance calculation to prevent inline Vector3 creation
  const connectionDistance = useMemo(() => {
    const toVec = new THREE.Vector3();
    toVec.set(toPos.x, 0, toPos.y);
    const fromVec = new THREE.Vector3();
    fromVec.set(fromPos.x, 0, fromPos.y);
    const result = new THREE.Vector3();
    result.subVectors(toVec, fromVec);
    return result.length();
  }, [fromPos.x, fromPos.y, toPos.x, toPos.y]);
  
  // Memoize midpoint calculation to prevent inline Vector3 creation
  const midPoint = useMemo(() => {
    const result = new THREE.Vector3();
    result.set(
      (fromPos.x + toPos.x) / 2,
      Math.max(startHeight, endHeight) / 2 + 10,
      (fromPos.y + toPos.y) / 2
    );
    return result;
  }, [fromPos.x, fromPos.y, toPos.x, toPos.y, startHeight, endHeight]);

  // After hooks, enforce validity
  if (!hasEndpoints) {
    console.warn('SpaceConnection missing from or to:', { from, to });
    return null;
  }
  if (!coordsValid) {
    console.warn('SpaceConnection has invalid position coordinates:', {
      fromPos: (from as any)?.position,
      toPos: (to as any)?.position
    });
    return null;
  }
  if (!pointsValid) {
    console.error('Invalid points array created for connection');
    return null;
  }
  
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
