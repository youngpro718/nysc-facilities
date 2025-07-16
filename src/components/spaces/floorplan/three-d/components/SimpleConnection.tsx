import React from 'react';
import * as THREE from 'three';

interface SimpleConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'direct' | 'hallway' | 'emergency';
  isHighlighted?: boolean;
}

export function SimpleConnection({ 
  from, 
  to, 
  type = 'direct', 
  isHighlighted = false 
}: SimpleConnectionProps) {
  const getConnectionColor = () => {
    switch (type) {
      case 'emergency':
        return '#ef4444';
      case 'hallway':
        return '#10b981';
      default:
        return isHighlighted ? '#3b82f6' : '#64748b';
    }
  };

  const points = [
    new THREE.Vector3(from.x, 25, from.y),
    new THREE.Vector3(to.x, 25, to.y)
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: getConnectionColor(),
      linewidth: isHighlighted ? 3 : 2,
      transparent: true,
      opacity: 0.8
    }))} />
  );
}