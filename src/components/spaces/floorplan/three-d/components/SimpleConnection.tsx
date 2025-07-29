import React, { useMemo } from 'react';
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
  // Defensive validation
  if (!from || !to || typeof from.x !== 'number' || typeof from.y !== 'number' || 
      typeof to.x !== 'number' || typeof to.y !== 'number') {
    console.warn('SimpleConnection: Invalid from/to coordinates', { from, to });
    return null;
  }

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

  // Memoize the line creation to prevent recreation on every render
  const line = useMemo(() => {
    try {
      // Create Vector3 objects separately to avoid inline creation
      const startPoint = new THREE.Vector3();
      startPoint.set(from.x, 25, from.y);
      const endPoint = new THREE.Vector3();
      endPoint.set(to.x, 25, to.y);
      const points = [startPoint, endPoint];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: getConnectionColor(),
        linewidth: isHighlighted ? 3 : 2,
        transparent: true,
        opacity: 0.8
      });
      
      return new THREE.Line(geometry, material);
    } catch (error) {
      console.error('SimpleConnection: Error creating line object', error, { from, to, type, isHighlighted });
      return null;
    }
  }, [from.x, from.y, to.x, to.y, type, isHighlighted]);

  if (!line) {
    return null;
  }

  return (
    <primitive object={line} />
  );
}