
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
  
  // Different connection styles based on type
  const getConnectionStyle = () => {
    switch(type) {
      case 'direct':
        return {
          color: '#3b82f6',
          lineWidth: 1.5,
          dashSize: 0, 
          gapSize: 0
        };
      case 'door':
        return {
          color: '#f59e0b',
          lineWidth: 1,
          dashSize: 3,
          gapSize: 2
        };
      case 'emergency':
        return {
          color: '#ef4444',
          lineWidth: 2,
          dashSize: 2,
          gapSize: 1
        };
      case 'hallway':
        return {
          color: '#10b981',
          lineWidth: 1.5,
          dashSize: 0,
          gapSize: 0
        };
      default:
        return {
          color: color,
          lineWidth: 1,
          dashSize: 3,
          gapSize: 3
        };
    }
  };
  
  const style = getConnectionStyle();
  
  return (
    <Line
      points={points}
      color={style.color}
      lineWidth={style.lineWidth}
      dashed={isDashed}
      dashSize={style.dashSize}
      dashOffset={1}
      gapSize={style.gapSize}
    />
  );
}
