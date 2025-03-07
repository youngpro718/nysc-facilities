
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { createFloorMaterial } from '../utils/threeDUtils';

export function Floor3D() {
  return (
    <group>
      {/* Floor surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[5000, 5000]} />
        <primitive object={createFloorMaterial()} attach="material" />
      </mesh>
      
      {/* Grid */}
      <Grid 
        infiniteGrid 
        cellSize={20} 
        cellThickness={0.6} 
        cellColor="#94a3b8" 
        sectionSize={100}
        sectionThickness={1.5}
        sectionColor="#475569"
        fadeDistance={1500}
        fadeStrength={1.5}
        position={[0, -1, 0]}
      />
    </group>
  );
}
