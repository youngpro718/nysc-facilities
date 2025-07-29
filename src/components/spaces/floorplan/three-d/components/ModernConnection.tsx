import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ModernConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'door' | 'hallway' | 'room';
  isSelected?: boolean;
  isHovered?: boolean;
}

export function ModernConnection({ 
  from, 
  to, 
  type = 'door', 
  isSelected = false, 
  isHovered = false 
}: ModernConnectionProps) {
  // Memoize the main connection line
  const mainLine = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: isSelected ? '#0ea5e9' : (isHovered ? '#fbbf24' : '#64748b'),
      linewidth: isSelected ? 3 : 2,
      transparent: true,
      opacity: isSelected ? 1 : (isHovered ? 0.8 : 0.6)
    });

    const startPoint = new THREE.Vector3();
    startPoint.set(from.x, 0, from.y);
    const endPoint = new THREE.Vector3();
    endPoint.set(to.x, 0, to.y);
    const points = [startPoint, endPoint];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }, [from.x, from.y, to.x, to.y, isSelected, isHovered]);

  // Memoize the selection highlight line
  const highlightLine = useMemo(() => {
    if (!isSelected) return null;
    
    const startPoint = new THREE.Vector3();
    startPoint.set(from.x, 0, from.y);
    const endPoint = new THREE.Vector3();
    endPoint.set(to.x, 0, to.y);
    const points = [startPoint, endPoint];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: '#0ea5e9', 
      linewidth: 4, 
      transparent: true, 
      opacity: 0.3 
    });
    
    return new THREE.Line(geometry, material);
  }, [from.x, from.y, to.x, to.y, isSelected]);

  return (
    <group>
      <primitive object={mainLine} />
      {highlightLine && (
        <primitive object={highlightLine} />
      )}
    </group>
  );
}
