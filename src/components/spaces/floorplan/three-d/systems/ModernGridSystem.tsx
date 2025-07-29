import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ModernGridSystemProps {
  size?: number;
  divisions?: number;
  color?: string;
  showAxes?: boolean;
}

export function ModernGridSystem({ 
  size = 1000, 
  divisions = 20, 
  color = '#64748b', 
  showAxes = true 
}: ModernGridSystemProps) {
  // Memoize axis lines to prevent recreation on every render
  const xAxisLine = useMemo(() => {
    // Create points array without inline Vector3 creation
    const startPoint = new THREE.Vector3();
    startPoint.set(-size/2, 0, 0);
    const endPoint = new THREE.Vector3();
    endPoint.set(size/2, 0, 0);
    
    const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
    const material = new THREE.LineBasicMaterial({ color: '#ef4444', linewidth: 2 });
    return new THREE.Line(geometry, material);
  }, [size]);

  const zAxisLine = useMemo(() => {
    // Create points array without inline Vector3 creation
    const startPoint = new THREE.Vector3();
    startPoint.set(0, 0, -size/2);
    const endPoint = new THREE.Vector3();
    endPoint.set(0, 0, size/2);
    
    const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
    const material = new THREE.LineBasicMaterial({ color: '#3b82f6', linewidth: 2 });
    return new THREE.Line(geometry, material);
  }, [size]);

  return (
    <group>
      <gridHelper args={[size, divisions, color, color]} />
      
      {showAxes && (
        <group>
          {/* X-axis (red) */}
          <primitive object={xAxisLine} />
          
          {/* Z-axis (blue) */}
          <primitive object={zAxisLine} />
        </group>
      )}
    </group>
  );
}
