
import React from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceConnectionProps {
  from: any;
  to: any;
  color?: string;
  type?: string;
  isDashed?: boolean;
}

export function SpaceConnection({ 
  from, 
  to, 
  color = '#94a3b8',
  type = 'standard',
  isDashed = true
}: SpaceConnectionProps) {
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
          lineWidth: 2.5, // Thicker line
          dashSize: 0, 
          gapSize: 0
        };
      case 'door':
        return {
          color: '#f59e0b', // Amber
          lineWidth: 2,
          dashSize: 4,
          gapSize: 2
        };
      case 'emergency':
        return {
          color: '#ef4444', // Red
          lineWidth: 3, // Extra thick for emergency routes
          dashSize: 3,
          gapSize: 1
        };
      case 'hallway':
        return {
          color: '#10b981', // Green
          lineWidth: 2,
          dashSize: 0,
          gapSize: 0
        };
      default:
        return {
          color: color,
          lineWidth: 1.5,
          dashSize: 3,
          gapSize: 3
        };
    }
  };
  
  const style = getConnectionStyle();
  
  return (
    <>
      {/* Main connection line */}
      <Line
        points={points}
        color={style.color}
        lineWidth={style.lineWidth}
        dashed={isDashed}
        dashSize={style.dashSize}
        dashOffset={1}
        gapSize={style.gapSize}
      />
      
      {/* Add small spheres at connection ends for better visibility */}
      <mesh position={[from.position.x, startHeight/2, from.position.y]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color={style.color} emissive={style.color} emissiveIntensity={0.5} />
      </mesh>
      
      <mesh position={[to.position.x, endHeight/2, to.position.y]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color={style.color} emissive={style.color} emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}
