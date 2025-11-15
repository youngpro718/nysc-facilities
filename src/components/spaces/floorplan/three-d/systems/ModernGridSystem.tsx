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
    // Create points using direct Vector3 construction
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-size / 2, 0, 0),
      new THREE.Vector3(size / 2, 0, 0),
    ]);
    // linewidth is deprecated/not supported on most platforms; omit it
    const material = new THREE.LineBasicMaterial({ color: '#ef4444' });
    return new THREE.Line(geometry, material);
  }, [size]);

  const zAxisLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -size / 2),
      new THREE.Vector3(0, 0, size / 2),
    ]);
    const material = new THREE.LineBasicMaterial({ color: '#3b82f6' });
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
