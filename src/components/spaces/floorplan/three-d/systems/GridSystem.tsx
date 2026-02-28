
import React from 'react';
import { Grid } from '@react-three/drei';

interface GridSystemProps {
  enabled?: boolean;
  gridSize?: number;
}

export function GridSystem({ enabled = true, gridSize = 50 }: GridSystemProps) {
  if (!enabled) return null;

  return (
    <>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[6000, 6000]} />
        <meshStandardMaterial 
          color="#f8fafc" 
          roughness={0.8} 
          metalness={0.1}
          transparent={true}
          opacity={0.8} 
        />
      </mesh>
      
      {/* Grid */}
      <Grid 
        infiniteGrid 
        cellSize={gridSize} 
        cellThickness={0.6} 
        cellColor="#cbd5e1" 
        sectionSize={gridSize * 4}
        sectionThickness={1.2}
        sectionColor="#64748b"
        fadeDistance={2000}
        fadeStrength={1.5}
        position={[0, -1, 0]}
      />
    </>
  );
}